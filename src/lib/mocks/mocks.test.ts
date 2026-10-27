import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  AnalisisTarea,
  Clase,
  Entrega,
  InformeComprension,
  MapaComprension,
  MensajeChat,
  PlanSemanal,
  PreferenciasEstudio,
  RutaPractica,
  SesionVerificacion,
  Tarea,
  Usuario,
} from "@/types/contratos";
import { clasesMock, usuariosMock } from "./clases";
import { entregasMock, tareasMock } from "./tareas";
import { analisisMock, planSemanalMock } from "./ia";
import { mensajesTutorMock, sesionVerificacionMock } from "./conversacion";
import { informeMock, mapaComprensionMock, rutaMock } from "./informes";
import { preferenciasMock } from "./estudiante";
import { enSemana, id, lunesActual } from "./base";

// Si un contrato cambia, esta prueba avisa qué mock quedó desactualizado.
const casos: [string, z.ZodType, unknown][] = [
  ["usuarios", z.array(Usuario), usuariosMock],
  ["clases", z.array(Clase), clasesMock],
  ["tareas", z.array(Tarea), tareasMock],
  ["entregas", z.array(Entrega), entregasMock],
  ["análisis", z.array(AnalisisTarea), analisisMock],
  ["plan semanal", PlanSemanal, planSemanalMock],
  ["preferencias", PreferenciasEstudio, preferenciasMock],
  ["mensajes del tutor", z.array(MensajeChat), mensajesTutorMock],
  ["sesión de verificación", SesionVerificacion, sesionVerificacionMock],
  ["informe", InformeComprension, informeMock],
  ["ruta", RutaPractica, rutaMock],
  ["mapa de comprensión", MapaComprension, mapaComprensionMock],
];

describe("mocks cumplen los contratos", () => {
  it.each(casos)("%s", (_nombre, esquema, valor) => {
    const r = esquema.safeParse(valor);
    expect(r.success, r.success ? "" : r.error.message).toBe(true);
  });

  it("hay 8 tareas de 3 clases y un análisis por tarea", () => {
    expect(tareasMock).toHaveLength(8);
    expect(new Set(tareasMock.map((t) => t.clase_id)).size).toBe(3);
    expect(new Set(analisisMock.map((a) => a.tarea_id))).toEqual(new Set(tareasMock.map((t) => t.id)));
  });

  it("cada bloque del plan apunta a una tarea existente", () => {
    const ids = new Set(tareasMock.map((t) => t.id));
    for (const b of planSemanalMock.bloques) expect(ids.has(b.tarea_id)).toBe(true);
  });
});

describe("utilidades de fechas e ids", () => {
  it("id() genera UUID válidos", () => {
    expect(z.string().uuid().safeParse(id(42)).success).toBe(true);
  });

  it("lunesActual() devuelve un lunes y enSemana() cae en esa semana", () => {
    const hoy = new Date("2026-10-29T12:00:00Z"); // jueves
    expect(lunesActual(hoy).getDay()).toBe(1);
    expect(new Date(enSemana(3, 10, 0, hoy)).getDay()).toBe(4);
  });
});
