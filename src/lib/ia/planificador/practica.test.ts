import { describe, expect, it, vi } from "vitest";
import type { AnalisisTarea, PlanSemanal, PreferenciasEstudio } from "@/types/contratos";
import { PracticaAgregada } from "@/types/contratos";
import { entregaDePractica, enlaceDeBloque, esPractica, idPractica } from "@/lib/practica";
import { construirPlan, ubicarPractica, type EntradaPlan, type TareaPlan } from "./algoritmo";
import { preferenciasPorDefecto } from "./preferencias";
import { agregarPracticaASemana, type Almacen } from ".";

const EST = "00000000-0000-4000-8000-000000000011";
const ENT = "00000000-0000-4000-8000-000000000301";
const T1 = "00000000-0000-4000-8000-000000000201";
const T2 = "00000000-0000-4000-8000-000000000202";
const OFFSET = -240;
const local = (dia: number, hhmm: string) => new Date(Date.parse(`2026-10-26T${hhmm}:00-04:00`) + dia * 86_400_000);
const diaLocal = (iso: string) => new Date(Date.parse(iso) + OFFSET * 60_000).toISOString().slice(0, 10);

function entrada(o: Partial<EntradaPlan> = {}): EntradaPlan {
  return {
    semana_inicio: "2026-10-26",
    tareas: [],
    preferencias: preferenciasPorDefecto(EST),
    bloquesAnteriores: [],
    ahora: local(0, "12:00"),
    offsetMin: OFFSET,
    ...o,
  };
}
const pasos = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: idPractica(ENT, i), tarea_id: T1, titulo: `Paso ${i + 1}`, minutos: 20 }));

describe("ids de práctica", () => {
  it("reconoce el bloque y enlaza al informe de su entrega", () => {
    const id = idPractica(ENT, 2);
    expect(esPractica(id)).toBe(true);
    expect(entregaDePractica(id)).toBe(ENT);
    expect(enlaceDeBloque({ id, tarea_id: T1 })).toBe(`/estudiante/informe/${ENT}`);
    expect(enlaceDeBloque({ id: "00000000-123", tarea_id: T1 })).toBe(`/estudiante/tarea/${T1}`);
    expect(entregaDePractica("practica-no-es-uuid")).toBeNull();
  });
});

describe("ubicarPractica", () => {
  it("pone un paso por día, en orden, sin chocar con lo planificado", () => {
    const tareas: TareaPlan[] = [
      {
        tarea_id: T2,
        titulo: "Física",
        fecha_entrega: local(4, "23:59").toISOString(),
        dificultad: 3,
        minutos_estimados: 90,
        prioridad: 80,
        minutos_hechos: 0,
      },
    ];
    const plan = construirPlan(entrada({ tareas }));
    const r = ubicarPractica(entrada({ bloquesAnteriores: plan.bloques }), pasos(3));
    expect(r.sin_ubicar).toEqual([]);
    expect(r.bloques).toHaveLength(3);
    const dias = r.bloques.map((b) => diaLocal(b.inicio));
    expect(new Set(dias).size).toBe(3);
    expect([...dias].sort()).toEqual(dias);
    for (const p of r.bloques) {
      for (const b of plan.bloques)
        expect(Date.parse(p.fin) <= Date.parse(b.inicio) || Date.parse(p.inicio) >= Date.parse(b.fin)).toBe(true);
    }
  });

  it("lo que no cabe en lo que queda de semana se devuelve como sin ubicar", () => {
    const r = ubicarPractica(entrada({ ahora: local(6, "12:00") }), pasos(4));
    expect(r.bloques.length).toBeLessThanOrEqual(1);
    expect(r.bloques.length + r.sin_ubicar.length).toBe(4);
  });
});

describe("construirPlan con práctica", () => {
  it("Reorganizar no borra ni mueve la práctica futura, y no le pone tareas encima", () => {
    const practica = ubicarPractica(entrada(), pasos(2)).bloques;
    const tareas: TareaPlan[] = [
      {
        tarea_id: T2,
        titulo: "Física",
        fecha_entrega: local(4, "23:59").toISOString(),
        dificultad: 2,
        minutos_estimados: 120,
        prioridad: 60,
        minutos_hechos: 0,
      },
    ];
    const r = construirPlan(entrada({ tareas, bloquesAnteriores: practica }));
    for (const p of practica) expect(r.bloques).toContainEqual(p);
    const otros = r.bloques.filter((b) => !esPractica(b.id));
    for (const p of practica)
      for (const b of otros) expect(Date.parse(p.fin) <= Date.parse(b.inicio) || Date.parse(p.inicio) >= Date.parse(b.fin)).toBe(true);
  });

  it("la práctica vencida sin hacer queda como omitida", () => {
    const practica = ubicarPractica(entrada(), pasos(1)).bloques;
    const r = construirPlan(entrada({ bloquesAnteriores: practica, ahora: local(6, "23:00") }));
    expect(r.bloques.find((b) => b.id === practica[0].id)?.estado).toBe("omitido");
  });
});

describe("agregarPracticaASemana", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  function almacen() {
    const planes = new Map<string, PlanSemanal>();
    const a: Almacen = {
      cargarTareasPlanificables: async () => [],
      cargarPreferencias: async (): Promise<PreferenciasEstudio | null> => null,
      guardarPreferencias: async () => {},
      cargarPlan: async (_e, s) => planes.get(s) ?? null,
      guardarPlan: async (p) => void planes.set(p.semana_inicio, p),
      buscarPlanDeBloque: async () => null,
      cargarAnalisis: async (): Promise<AnalisisTarea[]> => [],
      guardarAnalisis: async () => {},
      cargarIdioma: async () => "es",
      cargarHistorial: async () => [],
    };
    return { a, planes };
  }
  const ruta = {
    entrega_id: ENT,
    tarea_id: T1,
    pasos: [
      { titulo: "Repasa la operación inversa", minutos: 15 },
      { titulo: "Dos ejercicios nuevos", minutos: 25 },
    ],
  };
  const llamar = vi.fn();

  it("guarda los bloques en el plan con un aviso, sin llamar a la IA, y no duplica", async () => {
    const { a, planes } = almacen();
    const r = await agregarPracticaASemana(EST, ruta, { almacen: a, ahora: local(0, "12:00"), offsetMin: OFFSET, llamar });
    expect(PracticaAgregada.parse(r)).toEqual(r);
    expect(r).toMatchObject({ sin_ubicar: 0, ya_estaba: false });
    expect(r.bloques.map((b) => b.titulo)).toEqual(["Práctica: Repasa la operación inversa", "Práctica: Dos ejercicios nuevos"]);
    const plan = planes.get("2026-10-26")!;
    expect(plan.bloques.filter((b) => esPractica(b.id))).toHaveLength(2);
    expect(plan.avisos[0]).toBe("Agregué 2 pasos de tu ruta de práctica a esta semana.");
    expect(llamar).not.toHaveBeenCalled();

    const otra = await agregarPracticaASemana(EST, ruta, { almacen: a, ahora: local(0, "12:30"), offsetMin: OFFSET, llamar });
    expect(otra.ya_estaba).toBe(true);
    expect(planes.get("2026-10-26")!.bloques.filter((b) => esPractica(b.id))).toHaveLength(2);
  });

  it("el domingo por la noche lo pasa a la semana siguiente", async () => {
    const { a, planes } = almacen();
    const r = await agregarPracticaASemana(EST, ruta, { almacen: a, ahora: local(6, "21:00"), offsetMin: OFFSET, llamar });
    expect(r.bloques).toHaveLength(2);
    expect(planes.get("2026-11-02")?.bloques.filter((b) => esPractica(b.id))).toHaveLength(2);
    expect(planes.get("2026-11-02")?.avisos[0]).toContain("la próxima semana");
  });
});
