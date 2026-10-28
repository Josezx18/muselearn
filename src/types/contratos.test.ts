import { describe, expect, it } from "vitest";
import { Clase, Entrega, FechaHora, Tarea } from "./contratos";

// Regresión (28 oct): Supabase devuelve "2026-10-25T23:59:00+00:00"; los mocks usaban "…Z".
// Con z.string().datetime() todas las respuestas reales fallaban la validación.
describe("fechas de Postgres", () => {
  it("FechaHora acepta Z y desfases, y rechaza texto suelto", () => {
    expect(FechaHora.safeParse("2026-10-25T23:59:00.000Z").success).toBe(true);
    expect(FechaHora.safeParse("2026-10-25T23:59:00+00:00").success).toBe(true);
    expect(FechaHora.safeParse("2026-10-25T19:59:00.123456-04:00").success).toBe(true);
    expect(FechaHora.safeParse("mañana").success).toBe(false);
  });

  it("una fila real de tareas, entregas y clases pasa los contratos", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const pg = "2026-10-28T14:34:18.327296+00:00";
    expect(Tarea.safeParse({ id, clase_id: id, titulo: "T", instrucciones: "", adjuntos: [], fecha_entrega: pg, competencias: [], nivel_ayuda: "pistas", creada_en: pg }).success).toBe(true);
    expect(Entrega.safeParse({ id, tarea_id: id, estudiante_id: id, contenido_texto: "", adjuntos: [], estado: "entregada", entregada_en: pg }).success).toBe(true);
    expect(Clase.safeParse({ id, docente_id: id, nombre: "Matemática 4to A", materia: "Matemática", grado: "4to", codigo_inscripcion: "MAT4KQ", creada_en: pg }).success).toBe(true);
  });
});
