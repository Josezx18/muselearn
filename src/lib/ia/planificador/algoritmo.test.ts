import { describe, expect, it } from "vitest";
import type { BloquePlan } from "@/types/contratos";
import { construirPlan, lunesDe, type EntradaPlan, type TareaPlan } from "./algoritmo";
import { preferenciasPorDefecto } from "./preferencias";

const EST = "00000000-0000-4000-8000-000000000011";
const OFFSET = -240; // America/Santo_Domingo
const SEMANA = "2026-10-26"; // lunes
/** Hora local de RD → instante. dia 0 = lunes. */
const local = (dia: number, hhmm: string) => new Date(Date.parse(`2026-10-26T${hhmm}:00-04:00`) + dia * 86_400_000);
const idT = (n: number) => `00000000-0000-4000-8000-0000000002${String(n).padStart(2, "0")}`;

function tarea(n: number, o: Partial<TareaPlan> = {}): TareaPlan {
  return {
    tarea_id: idT(n),
    titulo: `Tarea ${n}`,
    fecha_entrega: local(4, "23:59").toISOString(),
    dificultad: 2,
    minutos_estimados: 45,
    prioridad: 50,
    minutos_hechos: 0,
    ...o,
  };
}

function entrada(tareas: TareaPlan[], o: Partial<EntradaPlan> = {}): EntradaPlan {
  return {
    semana_inicio: SEMANA,
    tareas,
    preferencias: preferenciasPorDefecto(EST),
    bloquesAnteriores: [],
    ahora: local(0, "12:00"),
    offsetMin: OFFSET,
    ...o,
  };
}

const minutos = (b: BloquePlan) => (Date.parse(b.fin) - Date.parse(b.inicio)) / 60_000;
const total = (bs: BloquePlan[], tarea_id: string) =>
  bs.filter((b) => b.tarea_id === tarea_id && b.estado === "planificado").reduce((s, b) => s + minutos(b), 0);

describe("construirPlan", () => {
  it("semana vacía: sin tareas no hay bloques ni riesgos", () => {
    const r = construirPlan(entrada([]));
    expect(r.bloques).toEqual([]);
    expect(r.en_riesgo).toEqual([]);
  });

  it("reparte una tarea larga en bloques ≤ max_minutos dentro de las franjas libres", () => {
    const r = construirPlan(entrada([tarea(1, { minutos_estimados: 120 })]));
    expect(total(r.bloques, idT(1))).toBe(120);
    expect(r.bloques.length).toBeGreaterThanOrEqual(3);
    for (const b of r.bloques) {
      expect(minutos(b)).toBeLessThanOrEqual(45);
      const ini = new Date(Date.parse(b.inicio) + OFFSET * 60_000);
      const hora = ini.getUTCHours() + ini.getUTCMinutes() / 60;
      expect(hora).toBeGreaterThanOrEqual(15);
      expect(hora).toBeLessThan(18);
    }
    expect(r.en_riesgo).toEqual([]);
  });

  it("deja al menos 10 minutos de descanso entre bloques y no los superpone", () => {
    const r = construirPlan(entrada([tarea(1, { minutos_estimados: 90 }), tarea(2, { minutos_estimados: 90 })]));
    const ordenados = [...r.bloques].sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
    for (let i = 1; i < ordenados.length; i++) {
      const hueco = (Date.parse(ordenados[i].inicio) - Date.parse(ordenados[i - 1].fin)) / 60_000;
      // El hueco entre bloques de la misma franja es ≥ 10; entre franjas distintas es mayor.
      expect(hueco).toBeGreaterThanOrEqual(10);
    }
  });

  it("tarea para mañana: se ubica hoy y mañana, antes que las de menor prioridad", () => {
    const urgente = tarea(1, {
      fecha_entrega: local(1, "08:00").toISOString(),
      minutos_estimados: 60,
      prioridad: 95,
      dificultad: 3,
    });
    const calma = tarea(2, { minutos_estimados: 60, prioridad: 20 });
    const r = construirPlan(entrada([calma, urgente]));
    const bloquesUrgente = r.bloques.filter((b) => b.tarea_id === idT(1));
    expect(total(r.bloques, idT(1))).toBe(60);
    // Todo el trabajo ocurre hoy (lunes) antes de la entrega del martes a las 8:00.
    for (const b of bloquesUrgente) expect(Date.parse(b.fin)).toBeLessThanOrEqual(local(1, "08:00").getTime());
    const primeraUrgente = Math.min(...bloquesUrgente.map((b) => Date.parse(b.inicio)));
    const primeraCalma = Math.min(...r.bloques.filter((b) => b.tarea_id === idT(2)).map((b) => Date.parse(b.inicio)));
    expect(primeraUrgente).toBeLessThanOrEqual(primeraCalma);
  });

  it("no usa franjas que ya pasaron", () => {
    const r = construirPlan(entrada([tarea(1)], { ahora: local(0, "16:30") }));
    for (const b of r.bloques) expect(Date.parse(b.inicio)).toBeGreaterThanOrEqual(local(0, "16:30").getTime());
  });

  it("sobrecarga: prioriza lo urgente y avisa qué queda en riesgo", () => {
    const tareas = [
      tarea(1, { minutos_estimados: 300, prioridad: 90, fecha_entrega: local(1, "18:00").toISOString() }),
      tarea(2, { minutos_estimados: 120, prioridad: 40, fecha_entrega: local(1, "18:00").toISOString() }),
    ];
    const r = construirPlan(entrada(tareas));
    // Solo caben ~3h entre el lunes (desde 15:00) y el martes a las 18:00: 2 franjas de 3h.
    expect(total(r.bloques, idT(1))).toBeGreaterThan(total(r.bloques, idT(2)));
    expect(r.en_riesgo.map((x) => x.tarea_id)).toContain(idT(2));
    const riesgo = r.en_riesgo.find((x) => x.tarea_id === idT(2));
    expect(riesgo!.minutos_sin_ubicar).toBe(120 - total(r.bloques, idT(2)));
    // Ningún bloque pasa de la entrega.
    for (const b of r.bloques) expect(Date.parse(b.fin)).toBeLessThanOrEqual(local(1, "18:00").getTime());
  });

  it("termina un día antes de la entrega cuando es posible", () => {
    const r = construirPlan(entrada([tarea(1, { minutos_estimados: 90, fecha_entrega: local(4, "12:00").toISOString() })]));
    for (const b of r.bloques) expect(Date.parse(b.fin)).toBeLessThanOrEqual(local(3, "12:00").getTime());
  });

  it("no pone dos tareas difíciles seguidas si hay otra opción", () => {
    const r = construirPlan(
      entrada([
        tarea(1, { dificultad: 5, minutos_estimados: 45, prioridad: 90 }),
        tarea(2, { dificultad: 4, minutos_estimados: 45, prioridad: 80 }),
        tarea(3, { dificultad: 1, minutos_estimados: 45, prioridad: 10 }),
      ]),
    );
    const b = (id: string) => r.bloques.find((x) => x.tarea_id === id)!;
    const gap = Math.abs(Date.parse(b(idT(2)).inicio) - Date.parse(b(idT(1)).fin)) / 60_000;
    expect(gap).toBeGreaterThan(10);
  });

  it("bloque omitido: se registra, su hueco no se reutiliza y el tiempo se reubica", () => {
    const t = tarea(1, { minutos_estimados: 45, fecha_entrega: local(3, "23:00").toISOString() });
    const primero = construirPlan(entrada([t]));
    expect(primero.bloques).toHaveLength(1);
    const omitido: BloquePlan = { ...primero.bloques[0], estado: "omitido" };

    const r = construirPlan(entrada([t], { bloquesAnteriores: [omitido] }));
    expect(r.bloques.filter((b) => b.estado === "omitido")).toHaveLength(1);
    const nuevo = r.bloques.find((b) => b.estado === "planificado")!;
    expect(nuevo).toBeDefined();
    expect(nuevo.inicio).not.toBe(omitido.inicio);
    expect(total(r.bloques, idT(1))).toBe(45);
  });

  it("lo hecho no se mueve y descuenta del trabajo pendiente", () => {
    const t = tarea(1, { minutos_estimados: 90, minutos_hechos: 45 });
    const hecho: BloquePlan = {
      id: "h1",
      tarea_id: idT(1),
      titulo: "Tarea 1 (1/2)",
      inicio: local(0, "15:00").toISOString(),
      fin: local(0, "15:45").toISOString(),
      estado: "hecho",
    };
    const r = construirPlan(entrada([t], { bloquesAnteriores: [hecho], ahora: local(0, "15:50") }));
    expect(r.bloques.find((b) => b.id === "h1")).toEqual(hecho);
    expect(total(r.bloques, idT(1))).toBe(45);
  });

  it("un bloque planificado que ya venció sin hacerse pasa a omitido", () => {
    const viejo: BloquePlan = {
      id: "v1",
      tarea_id: idT(1),
      titulo: "Tarea 1",
      inicio: local(0, "09:00").toISOString(),
      fin: local(0, "09:45").toISOString(),
      estado: "planificado",
    };
    const r = construirPlan(entrada([tarea(1)], { bloquesAnteriores: [viejo] }));
    expect(r.bloques.find((b) => b.id === "v1")?.estado).toBe("omitido");
  });

  it("es determinista", () => {
    const e = entrada([tarea(1, { minutos_estimados: 100 }), tarea(2, { prioridad: 70 })]);
    expect(construirPlan(e)).toEqual(construirPlan(e));
  });

  it("respeta preferencias personalizadas (solo domingo, bloques de 30)", () => {
    const preferencias = {
      estudiante_id: EST,
      horas_disponibles: [{ dia: 0, desde: "10:00", hasta: "11:30" }],
      max_minutos_bloque: 30,
    };
    const r = construirPlan(entrada([tarea(1, { minutos_estimados: 60, fecha_entrega: local(7, "20:00").toISOString() })], { preferencias }));
    expect(r.bloques.length).toBe(2);
    for (const b of r.bloques) {
      expect(minutos(b)).toBeLessThanOrEqual(30);
      expect(b.inicio.startsWith("2026-11-01")).toBe(true); // domingo
    }
  });
});

describe("lunesDe", () => {
  it("devuelve el lunes de la semana local", () => {
    expect(lunesDe(local(1, "10:00"), OFFSET)).toBe("2026-10-26");
    expect(lunesDe(local(6, "23:30"), OFFSET)).toBe("2026-10-26");
    expect(lunesDe(local(7, "00:30"), OFFSET)).toBe("2026-11-02");
  });
});
