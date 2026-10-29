import { describe, expect, it } from "vitest";
import type {
  Entrega,
  InformeComprension,
  MapaComprension,
  Tarea,
  Usuario,
} from "@/types/contratos";
import {
  fichaEstudiante,
  necesitanApoyo,
  resumenPorConcepto,
  resumenPorTarea,
} from "./comprension-resumen";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const A = id(1);
const B = id(2);
const C = id(3);
const estudiantes: Usuario[] = [A, B, C].map((x, i) => ({
  id: x,
  rol: "estudiante",
  nombre: `E${i + 1}`,
  idioma: "es",
}));
const ahora = new Date("2026-10-29T12:00:00Z");
const tarea = (n: number, fecha: string): Tarea => ({
  id: id(100 + n),
  clase_id: id(50),
  titulo: `T${n}`,
  instrucciones: "",
  adjuntos: [],
  fecha_entrega: fecha,
  competencias: [],
  nivel_ayuda: "pistas",
  modalidad: "muselearn",
  enlace_externo: null,
  creada_en: "2026-10-01T00:00:00Z",
});
const T1 = tarea(1, "2026-10-20T00:00:00Z"); // vencida
const T2 = tarea(2, "2026-11-05T00:00:00Z");
const entrega = (
  n: number,
  t: Tarea,
  e: string,
  estado: Entrega["estado"],
): Entrega => ({
  id: id(200 + n),
  tarea_id: t.id,
  estudiante_id: e,
  contenido_texto: "",
  adjuntos: [],
  estado,
  entregada_en: estado === "pendiente" ? null : "2026-10-19T00:00:00Z",
  entregada_externamente: false,
});
const entregas = [
  entrega(1, T1, A, "verificada"),
  entrega(2, T1, B, "verificada"),
];
const informe = (
  entregaId: string,
  nivel: 1 | 2 | 3 | 4,
): InformeComprension => ({
  entrega_id: entregaId,
  nivel_global: nivel,
  por_concepto: [{ concepto: "x", competencia: null, nivel, evidencia: "" }],
  fortalezas: [],
  debilidades: [],
  resumen_estudiante: "",
  resumen_docente: "resumen",
  generado_en: "2026-10-21T00:00:00Z",
});
const informes = [
  { estudiante: A, titulo: "T1", informe: informe(id(201), 4) },
  { estudiante: B, titulo: "T1", informe: informe(id(202), 2) },
];
const mapa: MapaComprension = {
  clase_id: id(50),
  tarea_id: null,
  conceptos: ["Despejar", "Comprobar"],
  celdas: [
    {
      estudiante_id: A,
      estudiante_nombre: "E1",
      concepto: "Despejar",
      nivel: 4,
    },
    {
      estudiante_id: A,
      estudiante_nombre: "E1",
      concepto: "Comprobar",
      nivel: 3,
    },
    {
      estudiante_id: B,
      estudiante_nombre: "E2",
      concepto: "Despejar",
      nivel: 2,
    },
    {
      estudiante_id: B,
      estudiante_nombre: "E2",
      concepto: "Comprobar",
      nivel: 1,
    },
    {
      estudiante_id: C,
      estudiante_nombre: "E3",
      concepto: "Despejar",
      nivel: null,
    },
    {
      estudiante_id: C,
      estudiante_nombre: "E3",
      concepto: "Comprobar",
      nivel: null,
    },
  ],
  conceptos_a_reforzar: ["Comprobar"],
};

describe("panel de comprensión", () => {
  it("resume cada concepto por niveles, con el más débil primero", () => {
    const r = resumenPorConcepto(mapa);
    expect(r[0].concepto).toBe("Comprobar");
    expect(r[0].niveles).toEqual({ 1: 1, 2: 0, 3: 1, 4: 0 });
    expect(r[0].sinDato).toBe(1);
    expect(r[0].promedio).toBe(2);
  });

  it("resume cada tarea: entregaron, verificaron y cuántos comprendieron", () => {
    const [t2, t1] = resumenPorTarea(
      [T1, T2],
      estudiantes,
      entregas,
      informes,
      ahora,
    );
    expect(t2.tarea.id).toBe(T2.id);
    expect(t1).toMatchObject({
      total: 3,
      entregaron: 2,
      verificaron: 2,
      comprendieron: 50,
      promedio: 3,
      vencida: true,
    });
    expect(t2.comprendieron).toBeNull();
  });

  it("marca a quién necesita apoyo: conceptos bajos o tareas vencidas sin entregar", () => {
    const r = necesitanApoyo(estudiantes, mapa, [T1, T2], entregas, ahora);
    expect(r.map((n) => n.estudiante.nombre)).toEqual(["E2", "E3"]);
    expect(r[0].conceptosBajos).toEqual(["Despejar", "Comprobar"]);
    expect(r[1].sinEntregar).toBe(1);
  });

  it("arma la ficha de un estudiante con sus tareas e informes", () => {
    const f = fichaEstudiante(B, mapa, [T1, T2], entregas, informes);
    expect(f.promedio).toBe(1.5);
    expect(f.entregadas).toBe(1);
    expect(
      f.tareas.find((x) => x.tarea.id === T1.id)?.informe?.nivel_global,
    ).toBe(2);
    expect(f.tareas.find((x) => x.tarea.id === T2.id)?.entrega).toBeNull();
  });
});
