import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerDetalleEntrega, obtenerInforme, obtenerComentario, obtenerCalificacion, obtenerPlan } from "../api-cliente";
import { informesClaseMock, respuestasDemo } from "./informes";
import { planSemanalMock } from "./ia";
import { id } from "./base";

afterEach(() => vi.unstubAllEnvs());
describe("datos mock por entrega y semana", () => {
  it("mantiene informe, preguntas, comentario y nota de cada estudiante", async () => {
    vi.stubEnv("NEXT_PUBLIC_USAR_MOCKS", "true");
    for (const [i, informe] of informesClaseMock.entries()) {
      const detalle = await obtenerDetalleEntrega(informe.entrega_id);
      expect(detalle.informe).toEqual(informe);
      expect((await obtenerInforme(informe.entrega_id)).informe).toEqual(informe);
      expect(detalle.comentario).toEqual(await obtenerComentario(informe.entrega_id));
      expect(detalle.comentario?.entrega_id).toBe(informe.entrega_id);
      expect((await obtenerCalificacion(informe.entrega_id))?.entrega_id).toBe(informe.entrega_id);
      if (i) expect(detalle.preguntas.map((p) => p.respuesta)).toEqual(respuestasDemo(i));
    }
  }, 20000);
  it("no inventa informes o preguntas para entregas sin verificación", async () => {
    vi.stubEnv("NEXT_PUBLIC_USAR_MOCKS", "true");
    const detalle = await obtenerDetalleEntrega(id(330));
    expect(detalle.informe).toBeNull();
    expect(detalle.preguntas).toEqual([]);
    expect((await obtenerCalificacion(id(330)))?.devuelta).toBe(true);
    await expect(obtenerInforme(id(330))).rejects.toMatchObject({ estado: 404 });
  });
  it("elige la semana solicitada sin reutilizar las fechas e ids actuales", async () => {
    vi.stubEnv("NEXT_PUBLIC_USAR_MOCKS", "true");
    const plan = await obtenerPlan("2026-11-02");
    expect(plan.semana_inicio).toBe("2026-11-02");
    expect(new Date(plan.bloques[0].inicio).getDay()).toBe(1);
    expect(plan.bloques[0].inicio.slice(0,10)).toBe("2026-11-02");
    expect((await obtenerPlan()).semana_inicio).toBe(planSemanalMock.semana_inicio);
  });
});
