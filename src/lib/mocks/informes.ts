// Mocks de T06 (informe, ruta y panel docente). Datos ficticios.
import { Entrega, InformeComprension, MapaComprension, RutaPractica } from "@/types/contratos";
import { usuariosMock } from "./clases";
import { tareasMock } from "./tareas";
import { IDS, enSemana } from "./base";

export const informeMock: InformeComprension = {
  entrega_id: IDS.entregas.ecuaciones,
  nivel_global: 3,
  por_concepto: [
    { concepto: "Operaciones inversas", competencia: "Resuelve problemas con ecuaciones lineales", nivel: 4, evidencia: "“para quitarlo hago lo contrario, que es restar en los dos lados”" },
    { concepto: "Despejar x", competencia: "Resuelve problemas con ecuaciones lineales", nivel: 3, evidencia: "Resolvió bien el caso nuevo: “21 entre 3 es 7”" },
    { concepto: "Comprobar la solución", competencia: "Resuelve problemas con ecuaciones lineales", nivel: 1, evidencia: "“No sé, creo que lo hice bien”" },
  ],
  fortalezas: ["Entiendes por qué se usa la operación inversa", "Aplicas el despeje a casos nuevos"],
  debilidades: ["Todavía no sabes comprobar si tu resultado es correcto"],
  resumen_estudiante: "Explicaste muy bien por qué restas para despejar, y resolviste un caso nuevo sin ayuda. Te falta aprender a comprobar tu respuesta sustituyendo x en la ecuación. Con 15 minutos de práctica lo vas a dominar.",
  resumen_docente: "Domina el despeje y la operación inversa (niveles 3-4). No sabe verificar soluciones por sustitución (nivel 1).",
  generado_en: enSemana(1, 19, 45),
};

export const rutaMock: RutaPractica = {
  entrega_id: IDS.entregas.ecuaciones,
  pasos: [
    { titulo: "Idea clave: sustituir para comprobar", tipo: "repaso", descripcion: "Para comprobar, cambia la x por tu resultado. Si los dos lados dan lo mismo, está bien.", concepto: "Comprobar la solución", minutos: 5 },
    { titulo: "Comprueba estas tres", tipo: "ejercicio", descripcion: "¿x = 4 es solución de 5x − 3 = 17? ¿x = 2 de 3x + 4 = 11? ¿x = 6 de 2x + 1 = 13?", concepto: "Comprobar la solución", minutos: 10 },
    { titulo: "Reto", tipo: "pregunta", descripcion: "Inventa una ecuación cuya solución sea x = 9 y compruébala.", concepto: "Despejar x", minutos: 5 },
  ],
};

const conceptos = ["Operaciones inversas", "Despejar x", "Comprobar la solución"];
const niveles: (1 | 2 | 3 | 4 | null)[][] = [
  [4, 3, 1],
  [3, 3, 2],
  [2, 1, 1],
  [4, 4, 3],
  [null, null, null],
];

export const mapaComprensionMock: MapaComprension = {
  clase_id: IDS.clases.matematica,
  tarea_id: IDS.tareas.ecuaciones,
  conceptos,
  celdas: usuariosMock
    .filter((u) => u.rol === "estudiante")
    .flatMap((u, i) =>
      conceptos.map((concepto, j) => ({
        estudiante_id: u.id,
        estudiante_nombre: u.nombre,
        concepto,
        nivel: niveles[i]?.[j] ?? null,
      })),
    ),
  conceptos_a_reforzar: ["Comprobar la solución"],
};

/** Un solo conjunto ficticio coherente para mapa, indicadores y detalle. */
export function panelComprensionMock(claseId: string, tareaId?: string) {
  const tareas = tareasMock.filter(t => t.clase_id === claseId);
  const estudiantes = usuariosMock.filter(u => u.rol === "estudiante");
  const seleccion = tareas.filter(t => !tareaId || t.id === tareaId);
  const tieneDatos = seleccion.some(t => t.id === IDS.tareas.ecuaciones);
  const entregas = tieneDatos ? estudiantes.slice(0, 4).map((u, i) => Entrega.parse({
    id: `00000000-0000-4000-8000-${String(301 + i).padStart(12, "0")}`,
    tarea_id: IDS.tareas.ecuaciones, estudiante_id: u.id, contenido_texto: "",
    estado: i < 3 ? "verificada" : "entregada", adjuntos: [], entregada_en: enSemana(1, 18),
  })) : [];
  const informes = entregas.filter(e => e.estado === "verificada").map((e, i) => ({
    estudiante: e.estudiante_id, titulo: tareas.find(t => t.id === e.tarea_id)!.titulo,
    informe: InformeComprension.parse({ ...informeMock, entrega_id: e.id,
      nivel_global: i === 2 ? 1 : 3,
      por_concepto: informeMock.por_concepto.map((c,j) => ({ ...c, nivel: niveles[i][j] })),
      resumen_docente: i === 2 ? "Requiere acompañamiento para explicar las operaciones y comprobar el resultado." : informeMock.resumen_docente,
    }),
  }));
  const mapa = MapaComprension.parse({ ...mapaComprensionMock, clase_id: claseId, tarea_id: tareaId ?? null,
    conceptos: tieneDatos ? conceptos : [],
    celdas: tieneDatos ? estudiantes.flatMap(u => conceptos.map(concepto => ({ estudiante_id: u.id, estudiante_nombre: u.nombre, concepto,
      nivel: informes.find(f => f.estudiante === u.id)?.informe.por_concepto.find(c => c.concepto === concepto)?.nivel ?? null,
    }))) : [],
    conceptos_a_reforzar: tieneDatos ? ["Comprobar la solución"] : [],
  });
  return { tareas, estudiantes, entregas, informes, mapa };
}
