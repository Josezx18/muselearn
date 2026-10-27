import { describe, expect, it, vi } from "vitest";
import type { AnalisisTarea, BloquePlan, PlanSemanal, PreferenciasEstudio } from "@/types/contratos";
import { crearLlamador, type ClienteChat, type Proveedor } from "../cliente";
import type { TareaPlan } from "./algoritmo";
import { actualizarEstadoBloque, avisosDeRespaldo, planificarSemana, type Almacen } from ".";

const EST = "00000000-0000-4000-8000-000000000011";
const T1 = "00000000-0000-4000-8000-000000000201";
const T2 = "00000000-0000-4000-8000-000000000202";
const ahora = new Date("2026-10-26T16:00:00Z"); // lunes 12:00 en RD

const abierto: Proveedor = { id: "abierto", baseURL: "https://inference.baseten.co/v1", apiKey: "k", modelo: "meta-models/muse-spark-open-1026", avanzado: false };

function almacenEnMemoria(tareas: TareaPlan[]) {
  const planes = new Map<string, PlanSemanal>();
  const almacen: Almacen = {
    cargarTareasPlanificables: async () => tareas,
    cargarPreferencias: async (): Promise<PreferenciasEstudio | null> => null,
    guardarPreferencias: async () => {},
    cargarPlan: async (_e, s) => planes.get(s) ?? null,
    guardarPlan: async (p) => void planes.set(p.semana_inicio, p),
    buscarPlanDeBloque: async (_e, id) => [...planes.values()].find((p) => p.bloques.some((b) => b.id === id)) ?? null,
    cargarAnalisis: async (): Promise<AnalisisTarea[]> => [],
    guardarAnalisis: async () => {},
    cargarIdioma: async () => "es",
    cargarHistorial: async () => [],
  };
  return { almacen, planes };
}

function tarea(id: string, o: Partial<TareaPlan> = {}): TareaPlan {
  return { tarea_id: id, titulo: "Tarea " + id.slice(-3), fecha_entrega: "2026-10-30T20:00:00.000Z", dificultad: 2, minutos_estimados: 60, prioridad: 50, minutos_hechos: 0, ...o };
}

function modeloQueResponde(texto: string | Error) {
  const fabrica = (): ClienteChat => ({
    chat: {
      completions: {
        create: async () => {
          if (texto instanceof Error) throw texto;
          return { choices: [{ message: { content: texto } }], usage: { prompt_tokens: 400, completion_tokens: 80 } };
        },
      },
    },
  });
  return crearLlamador({ abierto }, fabrica);
}

describe("planificarSemana", () => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});

  it("usa los avisos que redacta Muse y guarda un PlanSemanal válido", async () => {
    const { almacen, planes } = almacenEnMemoria([tarea(T1)]);
    const llamar = modeloQueResponde('{"avisos":["Llegó una tarea nueva; la puse el lunes."]}');
    const plan = await planificarSemana(EST, undefined, { almacen, llamar, ahora, causa: "tarea_nueva", offsetMin: -240 });
    expect(plan.semana_inicio).toBe("2026-10-26");
    expect(plan.avisos).toEqual(["Llegó una tarea nueva; la puse el lunes."]);
    expect(plan.bloques.length).toBeGreaterThan(0);
    expect(planes.get("2026-10-26")).toEqual(plan);
  });

  it("si Muse falla, el plan sale igual con avisos de respaldo", async () => {
    const { almacen } = almacenEnMemoria([tarea(T1)]);
    const llamar = modeloQueResponde(new Error("503"));
    const plan = await planificarSemana(EST, "2026-10-26", { almacen, llamar, ahora, causa: "tarea_nueva", offsetMin: -240 });
    expect(plan.bloques.length).toBeGreaterThan(0);
    expect(plan.avisos[0]).toMatch(/Agregué/);
  });

  it("aplica las preferencias por defecto (lun-vie 15-18) cuando el estudiante no configuró", async () => {
    const { almacen } = almacenEnMemoria([tarea(T1)]);
    const plan = await planificarSemana(EST, "2026-10-26", { almacen, llamar: modeloQueResponde('{"avisos":["ok"]}'), ahora, offsetMin: -240 });
    for (const b of plan.bloques) {
      const h = new Date(Date.parse(b.inicio) - 240 * 60_000).getUTCHours();
      expect(h).toBeGreaterThanOrEqual(15);
      expect(h).toBeLessThan(18);
    }
  });

  it("omitir un bloque recalcula el plan y reubica el tiempo", async () => {
    const { almacen } = almacenEnMemoria([tarea(T1, { minutos_estimados: 45 })]);
    const llamar = modeloQueResponde('{"avisos":["Moví tu bloque a otro día."]}');
    const opciones = { almacen, llamar, ahora, offsetMin: -240 };
    const plan = await planificarSemana(EST, "2026-10-26", opciones);
    const primero = plan.bloques[0];

    const resultado = await actualizarEstadoBloque(EST, primero.id, "omitido", opciones);
    expect(resultado?.estado).toBe("omitido");
    const nuevo = await almacen.cargarPlan(EST, "2026-10-26");
    expect(nuevo!.bloques.filter((b: BloquePlan) => b.estado === "omitido")).toHaveLength(1);
    const activos = nuevo!.bloques.filter((b: BloquePlan) => b.estado === "planificado");
    expect(activos).toHaveLength(1);
    expect(activos[0].inicio).not.toBe(primero.inicio);
    expect(nuevo!.avisos).toEqual(["Moví tu bloque a otro día."]);
  });

  it("marcar hecho no recalcula y devuelve null si el bloque no existe", async () => {
    const { almacen } = almacenEnMemoria([tarea(T1)]);
    const opciones = { almacen, llamar: modeloQueResponde('{"avisos":["ok"]}'), ahora, offsetMin: -240 };
    const plan = await planificarSemana(EST, "2026-10-26", opciones);
    const r = await actualizarEstadoBloque(EST, plan.bloques[0].id, "hecho", opciones);
    expect(r?.estado).toBe("hecho");
    expect(await actualizarEstadoBloque(EST, "no-existe", "hecho", opciones)).toBeNull();
  });

  it("sobrecarga: el plan trae un aviso de riesgo si Muse no está disponible", async () => {
    const { almacen } = almacenEnMemoria([
      tarea(T1, { minutos_estimados: 400, fecha_entrega: "2026-10-27T20:00:00.000Z", prioridad: 90 }),
      tarea(T2, { minutos_estimados: 200, fecha_entrega: "2026-10-27T20:00:00.000Z", prioridad: 60 }),
    ]);
    const plan = await planificarSemana(EST, "2026-10-26", { almacen, llamar: modeloQueResponde(new Error("x")), ahora, offsetMin: -240 });
    expect(plan.avisos.join(" ")).toMatch(/No alcanza el tiempo/);
  });
});

describe("avisosDeRespaldo", () => {
  it("responde en el idioma pedido", () => {
    const d = { tareas_nuevas: ["Física"], tareas_movidas: [], tareas_retiradas: [] };
    expect(avisosDeRespaldo(d, [], "en")[0]).toMatch(/I added/);
    expect(avisosDeRespaldo({ tareas_nuevas: [], tareas_movidas: [], tareas_retiradas: [] }, [], "es")).toEqual(["Tu plan está al día."]);
  });
});
