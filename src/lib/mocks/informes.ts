// Mocks de T06 (informe, ruta y panel docente). Datos ficticios.
import { InformeComprension, MapaComprension, RutaPractica } from "@/types/contratos";
import { usuariosMock } from "./clases";
import { tareasMock, entregasClaseMock, entregasMock } from "./tareas";
import { IDS, enSemana } from "./base";

export const informeMock: InformeComprension = {
  entrega_id: IDS.entregas.ecuaciones,
  nivel_global: 3,
  por_concepto: [
    {
      concepto: "Operaciones inversas",
      competencia: "Resuelve problemas con ecuaciones lineales",
      nivel: 4,
      evidencia: "“para quitarlo hago lo contrario, que es restar en los dos lados”",
    },
    {
      concepto: "Despejar x",
      competencia: "Resuelve problemas con ecuaciones lineales",
      nivel: 3,
      evidencia: "Resolvió bien el caso nuevo: “21 entre 3 es 7”",
    },
    {
      concepto: "Comprobar la solución",
      competencia: "Resuelve problemas con ecuaciones lineales",
      nivel: 1,
      evidencia: "“No sé, creo que lo hice bien”",
    },
  ],
  fortalezas: ["Entiendes por qué se usa la operación inversa", "Aplicas el despeje a casos nuevos"],
  debilidades: ["Todavía no sabes comprobar si tu resultado es correcto"],
  resumen_estudiante:
    "Explicaste muy bien por qué restas para despejar, y resolviste un caso nuevo sin ayuda. Te falta aprender a comprobar tu respuesta sustituyendo x en la ecuación. Con 15 minutos de práctica lo vas a dominar.",
  resumen_docente: "Domina el despeje y la operación inversa (niveles 3-4). No sabe verificar soluciones por sustitución (nivel 1).",
  generado_en: enSemana(-4, 19, 45),
};

export const rutaMock: RutaPractica = {
  entrega_id: IDS.entregas.ecuaciones,
  pasos: [
    {
      titulo: "Idea clave: sustituir para comprobar",
      tipo: "repaso",
      descripcion: "Para comprobar, cambia la x por tu resultado. Si los dos lados dan lo mismo, está bien.",
      concepto: "Comprobar la solución",
      minutos: 5,
    },
    {
      titulo: "Comprueba estas tres",
      tipo: "ejercicio",
      descripcion: "¿x = 4 es solución de 5x − 3 = 17? ¿x = 2 de 3x + 4 = 11? ¿x = 6 de 2x + 1 = 13?",
      concepto: "Comprobar la solución",
      minutos: 10,
    },
    {
      titulo: "Reto",
      tipo: "pregunta",
      descripcion: "Inventa una ecuación cuya solución sea x = 9 y compruébala.",
      concepto: "Despejar x",
      minutos: 5,
    },
  ],
};

const conceptos = ["Operaciones inversas", "Despejar x", "Comprobar la solución"];
const niveles: (1 | 2 | 3 | 4 | null)[][] = [
  [4, 3, 1], [3, 3, 3], [1, 1, 1], [4, 4, 4], [2, 2, 1], [3, 4, 3],
  [2, 1, 2], [4, 3, 4], [null, null, null], [null, null, null],
  [null, null, null], [null, null, null],
];

export const informesClaseMock: InformeComprension[] = entregasClaseMock
  .filter((e) => e.estado === "verificada")
  .map((e, i) => InformeComprension.parse({
    ...informeMock, entrega_id: e.id,
    nivel_global: [3, 3, 1, 4, 2, 3, 2, 4][i],
    por_concepto: informeMock.por_concepto.map((c, j) => ({
      ...c, nivel: niveles[i][j],
      evidencia: i === 0 ? c.evidencia : respuestasDemo(i)[j],
    })),
    resumen_docente: [2, 4, 6].includes(i)
      ? "Necesita acompañamiento para justificar operaciones y comprobar resultados."
      : "Explica el equilibrio de la ecuación y valida sus resultados.",
    resumen_estudiante: [2, 4, 6].includes(i)
      ? "Ya diste el primer paso. Practica las operaciones inversas y comprueba cada solución."
      : i === 0 ? informeMock.resumen_estudiante : "Explicaste las operaciones y comprobaste tu resultado. Sigue practicando con un problema nuevo.",
    fortalezas: i === 2 ? ["Reconoce que necesita explicar el procedimiento"] : ["Identifica la incógnita"],
    debilidades: [2, 4, 6].includes(i) ? ["Justificar las operaciones inversas", "Comprobar la solución"] : [],
  }));

export function respuestasDemo(i: number): string[] {
  if ([2, 4, 6].includes(i)) return [
    "Sumé 5, pero no sé si debía restarlo.", "Dividí entre 3 porque lo vi en el ejemplo.", "No comprobé: no sé dónde poner el resultado.",
  ];
  return ["Resto 5 en ambos lados para conservar la igualdad.", "Divido ambos lados entre 3: x vale 5.", "Sustituyo: 3 por 5 más 5 da 20; ambos lados coinciden."];
}

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
  const tareas = tareasMock.filter((t) => t.clase_id === claseId);
  const estudiantes = usuariosMock.filter((u) => u.rol === "estudiante");
  const seleccion = tareas.filter((t) => !tareaId || t.id === tareaId);
  const tieneDatos = seleccion.some((t) => t.id === IDS.tareas.ecuaciones);
  const entregas = entregasMock.filter((e) => seleccion.some((t) => t.id === e.tarea_id));
  const informes = tieneDatos ? informesClaseMock.map((informe) => ({
    estudiante: entregas.find((e) => e.id === informe.entrega_id)!.estudiante_id,
    titulo: tareas.find((t) => t.id === IDS.tareas.ecuaciones)!.titulo,
    informe,
  })) : [];
  const mapa = MapaComprension.parse({
    ...mapaComprensionMock,
    clase_id: claseId,
    tarea_id: tareaId ?? null,
    conceptos: tieneDatos ? conceptos : [],
    celdas: tieneDatos
      ? estudiantes.flatMap((u) =>
          conceptos.map((concepto) => ({
            estudiante_id: u.id,
            estudiante_nombre: u.nombre,
            concepto,
            nivel: informes.find((f) => f.estudiante === u.id)?.informe.por_concepto.find((c) => c.concepto === concepto)?.nivel ?? null,
          })),
        )
      : [],
    conceptos_a_reforzar: tieneDatos ? ["Comprobar la solución"] : [],
  });
  return { tareas, estudiantes, entregas, informes, mapa };
}
