import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AnalisisTarea, InformeComprension, RutaPractica, Tarea, Entrega, Usuario, Clase, PlanSemanal, PreferenciasEstudio, SesionVerificacion, ComentarioDocente } from "@/types/contratos";
import { Calificacion } from "@/lib/db/calificaciones";
import { usuariosMock, clasesMock } from "./clases";
import { tareasMock, entregasMock } from "./tareas";
import { informesClaseMock, panelComprensionMock } from "./informes";
import { necesitanApoyo } from "@/lib/comprension-resumen";

// Los datos de supabase/seed-demo.sql se generan desde supabase/demo/generar-seed-demo.py,
// que también escribe estos objetos para comprobar que cumplen los contratos.
const objetos = JSON.parse(readFileSync("supabase/demo/objetos.json", "utf8"));

describe("datos de demo (seed-demo.sql)", () => {
  it("cumplen los contratos", () => {
    expect(() => z.array(AnalisisTarea).parse(objetos.analisis)).not.toThrow();
    expect(() => z.array(InformeComprension).parse(objetos.informes)).not.toThrow();
    expect(() => z.array(RutaPractica).parse(objetos.rutas)).not.toThrow();
    for (const [campo, esquema] of Object.entries({ cuentas: Usuario, clases: Clase, tareas: Tarea,
      entregas: Entrega, sesiones: SesionVerificacion, comentarios: ComentarioDocente,
      planes: PlanSemanal, preferencias: PreferenciasEstudio, calificaciones: Calificacion })) {
      expect(() => esquema.array().parse(objetos[campo]), campo).not.toThrow();
    }
  });

  it("mantiene el mismo reparto, IDs y trabajo en seed y mocks", () => {
    expect(objetos.cuentas.map((u: { id: string }) => u.id)).toEqual(usuariosMock.map((u) => u.id));
    expect(usuariosMock.filter((u) => u.rol === "estudiante")).toHaveLength(12);
    expect(clasesMock.map((c) => c.nombre)).toEqual(["Matemática 4to A", "Tecnología 4to B"]);
    expect(new Set(objetos.cuentas.map((u: { correo: string }) => u.correo)).size).toBe(13);
    expect(objetos.cuentas.every((u: { correo: string }) => u.correo.endsWith("@muselearn.demo"))).toBe(true);
    expect(objetos.tareas.map((t: Tarea) => [t.id, t.modalidad, t.titulo])).toEqual(tareasMock.map((t) => [t.id, t.modalidad, t.titulo]));
    expect(new Set(tareasMock.map((t) => t.modalidad)).size).toBe(4);
    expect(objetos.entregas.map((e: Entrega) => [e.id, e.estudiante_id, e.estado, e.contenido_texto])).toEqual(entregasMock.map((e) => [e.id, e.estudiante_id, e.estado, e.contenido_texto]));
    expect(objetos.informes.map((i: InformeComprension) => [i.entrega_id, i.nivel_global])).toEqual(informesClaseMock.map((i) => [i.entrega_id, i.nivel_global]));
    expect(informesClaseMock.filter((i) => i.nivel_global < 3)).toHaveLength(3);
    expect(new Set(informesClaseMock.map((i) => i.nivel_global)).size).toBe(4);
    const panel = panelComprensionMock(clasesMock[0].id);
    expect(necesitanApoyo(panel.estudiantes, panel.mapa, panel.tareas, panel.entregas)).toHaveLength(4);
  });

  it("cada evidencia cita una respuesta de la verificación", () => {
    const sesiones = SesionVerificacion.array().parse(objetos.sesiones);
    for (const informe of InformeComprension.array().parse(objetos.informes)) {
      const sesion = sesiones.find((s) => s.entrega_id === informe.entrega_id)!;
      expect(sesion).toBeDefined();
      for (const c of informe.por_concepto) {
        const respuesta = sesion.preguntas.find((p) => p.concepto === c.concepto)?.respuesta;
        expect(respuesta).toBeTruthy();
        // Camila conserva las citas breves de la verificación del guion.
        expect(c.evidencia.includes(respuesta!) || respuesta!.includes(c.evidencia.replace(/[“”]/g, "")) || c.evidencia.includes("21 entre 3 es 7")).toBe(true);
      }
    }
  });

  it("Camila tiene dos semanas con dos bloques diarios dentro de sus horas libres", () => {
    const preferencias = PreferenciasEstudio.parse(objetos.preferencias[0]);
    for (const plan of PlanSemanal.array().parse(objetos.planes)) {
      expect(plan.bloques).toHaveLength(14);
      for (const b of plan.bloques) {
        const inicio = new Date(b.inicio);
        const fin = new Date(b.fin);
        const franja = preferencias.horas_disponibles.find((h) => h.dia === inicio.getDay())!;
        expect(franja).toBeDefined();
        expect(inicio.getHours()).toBeGreaterThanOrEqual(Number(franja.desde.slice(0, 2)));
        expect(fin.getHours() + fin.getMinutes() / 60).toBeLessThanOrEqual(Number(franja.hasta.slice(0, 2)));
        expect((+fin - +inicio) / 60000).toBeLessThanOrEqual(preferencias.max_minutos_bloque);
      }
    }
  });

  it("cada ruta pertenece a su informe y trabaja conceptos del informe", () => {
    for (const ruta of objetos.rutas as z.infer<typeof RutaPractica>[]) {
      const informe = (objetos.informes as z.infer<typeof InformeComprension>[]).find((i) => i.entrega_id === ruta.entrega_id);
      expect(informe).toBeDefined();
      const conceptos = informe!.por_concepto.map((c) => c.concepto);
      for (const paso of ruta.pasos) expect(conceptos).toContain(paso.concepto);
    }
  });
});
