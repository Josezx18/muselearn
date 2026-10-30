// Mocks de T02 (tareas y entregas). Datos ficticios.
import type { Entrega, Tarea } from "@/types/contratos";
import { ESTUDIANTE_ACTUAL, IDS, enSemana, id } from "./base";

const t = IDS.tareas;
const c = IDS.clases;

export const tareasMock: Tarea[] = [
  {
    id: t.ecuaciones,
    clase_id: c.matematica,
    titulo: "Práctica: ecuaciones de primer grado",
    instrucciones: "Resuelve los ejercicios 1 al 8 de la página 54. Muestra cada paso del despeje.",
    adjuntos: [],
    fecha_entrega: enSemana(-3, 23, 59),
    competencias: ["Resuelve problemas con ecuaciones lineales"],
    nivel_ayuda: "pistas",
    modalidad: "muselearn",
    enlace_externo: null,
    creada_en: enSemana(-10, 8),
  },
  {
    id: t.fracciones,
    clase_id: c.matematica,
    titulo: "Repaso de fracciones",
    instrucciones: "Completa la guía de 10 ejercicios de suma y resta de fracciones heterogéneas.",
    adjuntos: [],
    fecha_entrega: enSemana(4, 23, 59),
    competencias: ["Opera con números racionales"],
    nivel_ayuda: "ejemplos",
    modalidad: "cuaderno",
    enlace_externo: null,
    creada_en: enSemana(0, 8, 30),
  },
  {
    id: t.arduino,
    clase_id: c.tecnologia,
    titulo: "Semáforo con Arduino",
    instrucciones: "Programa un semáforo con 3 LED y explica en comentarios qué hace cada bloque del código.",
    adjuntos: [],
    fecha_entrega: enSemana(-1, 23, 59),
    competencias: ["Programa microcontroladores para resolver problemas"],
    nivel_ayuda: "explicacion",
    modalidad: "classroom",
    enlace_externo: "https://classroom.google.com/",
    creada_en: enSemana(-10, 9),
  },
  {
    id: t.circuitos,
    clase_id: c.tecnologia,
    titulo: "Ley de Ohm en circuitos en serie",
    instrucciones: "Calcula la corriente y el voltaje en cada resistencia de los 4 circuitos de la guía.",
    adjuntos: [],
    fecha_entrega: enSemana(3, 23, 59),
    competencias: ["Analiza circuitos eléctricos básicos"],
    nivel_ayuda: "pistas",
    modalidad: "muselearn",
    enlace_externo: null,
    creada_en: enSemana(0, 10),
  },
  {
    id: t.movimiento,
    clase_id: c.matematica,
    titulo: "Proporciones y regla de tres",
    instrucciones: "Resuelve seis problemas de recetas y mapas a escala. Justifica si la relación es directa y comprueba las unidades.",
    adjuntos: [],
    fecha_entrega: enSemana(3, 23, 59),
    competencias: ["Aplica razones y proporciones"],
    nivel_ayuda: "pistas",
    modalidad: "muselearn",
    enlace_externo: null,
    creada_en: enSemana(0, 11),
  },
  {
    id: t.ensayo3d,
    clase_id: c.tecnologia,
    titulo: "Diseño 3D de un llavero",
    instrucciones: "Diseña un llavero en Tinkercad con tu inicial y exporta el archivo STL.",
    adjuntos: [],
    fecha_entrega: enSemana(7, 23, 59),
    competencias: ["Diseña objetos en 3D"],
    nivel_ayuda: "explicacion",
    modalidad: "otra",
    enlace_externo: "https://www.tinkercad.com/",
    creada_en: enSemana(1, 9),
  },
  {
    id: t.csharp,
    clase_id: c.tecnologia,
    titulo: "C#: calculadora de promedios",
    instrucciones: "Escribe un programa en C# que pida 5 notas y muestre el promedio y si aprobó.",
    adjuntos: [],
    fecha_entrega: enSemana(5, 23, 59),
    competencias: ["Programa algoritmos con estructuras de control"],
    nivel_ayuda: "ejemplos",
    modalidad: "muselearn",
    enlace_externo: null,
    creada_en: enSemana(1, 10),
  },
  {
    id: t.vectores,
    clase_id: c.matematica,
    titulo: "Funciones lineales: tabla y gráfica",
    instrucciones: "Completa tablas para y = 2x + 1 y y = -x + 4. Grafica las rectas y comprueba el punto de corte.",
    adjuntos: [],
    fecha_entrega: enSemana(9, 23, 59),
    competencias: ["Representa relaciones lineales"],
    nivel_ayuda: "pistas",
    modalidad: "muselearn",
    enlace_externo: null,
    creada_en: enSemana(2, 8),
  },
];

export const entregasMock: Entrega[] = [
  {
    id: IDS.entregas.ecuaciones,
    tarea_id: t.ecuaciones,
    estudiante_id: ESTUDIANTE_ACTUAL,
    contenido_texto: "1) 3x + 5 = 20 → 3x = 15 → x = 5\n2) 2x − 7 = 9 → 2x = 16 → x = 8",
    adjuntos: [],
    estado: "verificada",
    entregada_en: enSemana(1, 19, 30),
    entregada_externamente: false,
  },
  {
    id: IDS.entregas.arduino,
    tarea_id: t.arduino,
    estudiante_id: ESTUDIANTE_ACTUAL,
    contenido_texto: "",
    adjuntos: [],
    estado: "pendiente",
    entregada_en: null,
    entregada_externamente: false,
  },
];

/** Ocho verificadas y cuatro por revisar; los conceptos bajos muestran cuatro casos de apoyo. */
export const entregasClaseMock: Entrega[] = IDS.estudiantes.map((estudiante_id, i) => ({
  ...entregasMock[0],
  id: i === 0 ? IDS.entregas.ecuaciones : id(310 + i),
  estudiante_id,
  estado: i < 8 ? "verificada" : "entregada",
  entregada_en: enSemana(-4, 19, 30),
  contenido_texto: i === 2
    ? "3x + 5 = 20; x = 5. Seguí el ejemplo, pero todavía no sé justificarlo."
    : i === 9 ? "3x + 5 = 20; 3x = 25; x = 8,33. Necesito revisar el signo."
    : entregasMock[0].contenido_texto,
}));
// La misma colección alimenta listados y el seed; Camila conserva su tarea pendiente de Classroom.
entregasMock.splice(0, 1, ...entregasClaseMock);

// Trabajo ya presentado en las tareas de esta semana; las próximas siguen pendientes.
for (const tarea of tareasMock.filter((tarea) => [t.fracciones, t.movimiento, t.circuitos, t.csharp].includes(tarea.id))) {
  for (const [i, estudiante_id] of IDS.estudiantes.entries()) {
    entregasMock.push({
      id: id(500 + tareasMock.indexOf(tarea) * 20 + i), tarea_id: tarea.id, estudiante_id,
      contenido_texto: tarea.id === t.fracciones ? "1/2 + 1/3 = 3/6 + 2/6 = 5/6. Usé el mínimo común múltiplo de 2 y 3."
        : tarea.id === t.movimiento ? "Si 4 personas usan 300 g de harina, para 10 necesito 750 g. Mantengo la razón 75 g por persona."
        : tarea.id === t.circuitos ? "R total = 100 + 200 = 300 ohmios. Con 9 V, I = 9/300 = 0,03 A."
        : "Sumé las cinco notas con un ciclo y dividí el total entre cinco; comparé el promedio con 70.",
      adjuntos: [], estado: "entregada", entregada_en: enSemana(0, 19), entregada_externamente: false,
    });
  }
}
entregasMock.push({
  id: id(330), tarea_id: t.vectores, estudiante_id: IDS.estudiantes[9],
  contenido_texto: "Para x = 2 escribí y = 2 + 1 = 3. Debo revisar la multiplicación en y = 2x + 1.",
  adjuntos: [], estado: "pendiente", entregada_en: enSemana(2, 19), entregada_externamente: false,
});
