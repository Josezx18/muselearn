// Mocks de T06 (informe, ruta y panel docente). Datos ficticios.
import type { InformeComprension, MapaComprension, RutaPractica } from "@/types/contratos";
import { usuariosMock } from "./clases";
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
