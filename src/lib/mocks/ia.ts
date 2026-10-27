// Mocks de T03 (análisis de tareas y plan semanal). Datos ficticios.
import { format } from "date-fns";
import type { AnalisisTarea, PlanSemanal } from "@/types/contratos";
import { ESTUDIANTE_ACTUAL, IDS, enSemana, lunesActual } from "./base";

const t = IDS.tareas;

function analisis(
  tarea_id: string,
  dificultad: number,
  minutos_estimados: number,
  prioridad: number,
  conceptos: string[],
  pasos_sugeridos: string[],
  razon: string,
): AnalisisTarea {
  return { tarea_id, estudiante_id: ESTUDIANTE_ACTUAL, dificultad, minutos_estimados, prioridad, conceptos, pasos_sugeridos, razon };
}

export const analisisMock: AnalisisTarea[] = [
  analisis(t.arduino, 3, 60, 95, ["Salidas digitales", "Función delay()", "Estructura setup/loop"], ["Arma el circuito con los 3 LED", "Escribe el código del rojo primero", "Agrega comentarios al final"], "Se entrega mañana y combina circuito y programación."),
  analisis(t.ecuaciones, 3, 40, 80, ["Despejar x", "Operaciones inversas", "Comprobar la solución"], ["Resuelve 1 a 4", "Descansa 5 minutos", "Resuelve 5 a 8 y comprueba"], "Entrega en dos días; ya practicaste algo parecido."),
  analisis(t.circuitos, 4, 55, 70, ["Ley de Ohm", "Resistencia equivalente en serie", "Unidades eléctricas"], ["Calcula la resistencia total de cada circuito", "Aplica V = I · R", "Revisa las unidades"], "Es de las más difíciles de la semana; conviene empezar temprano."),
  analisis(t.movimiento, 3, 45, 65, ["Velocidad constante", "Fórmula d = v · t", "Conversión de unidades"], ["Anota datos de cada problema", "Elige la fórmula", "Convierte unidades antes de calcular"], "Seis problemas cortos con el mismo procedimiento."),
  analisis(t.fracciones, 2, 30, 45, ["Mínimo común múltiplo", "Fracciones equivalentes"], ["Calcula el MCM de cada par", "Resuelve 5 por sesión"], "Es un repaso; tienes hasta el viernes."),
  analisis(t.csharp, 3, 50, 40, ["Variables numéricas", "Ciclo for", "Condicional if"], ["Pide las 5 notas con un ciclo", "Calcula el promedio", "Muestra el resultado con if"], "Entrega el sábado; programa en dos sesiones cortas."),
  analisis(t.ensayo3d, 2, 45, 20, ["Primitivas 3D", "Agrupar y restar formas", "Exportar STL"], ["Haz el contorno del llavero", "Agrega tu inicial en relieve", "Exporta y revisa el archivo"], "Entrega la próxima semana; puedes dejarla para el fin de semana."),
  analisis(t.vectores, 4, 60, 15, ["Componentes de un vector", "Método del paralelogramo"], ["Dibuja cada vector a escala", "Suma por componentes"], "Es para dentro de 9 días."),
];

export const planSemanalMock: PlanSemanal = {
  estudiante_id: ESTUDIANTE_ACTUAL,
  semana_inicio: format(lunesActual(), "yyyy-MM-dd"),
  bloques: [
    { id: "b1", tarea_id: t.arduino, titulo: "Arduino: armar el circuito", inicio: enSemana(0, 15), fin: enSemana(0, 15, 45), estado: "hecho" },
    { id: "b2", tarea_id: t.ecuaciones, titulo: "Ecuaciones: ejercicios 1-4", inicio: enSemana(0, 16), fin: enSemana(0, 16, 30), estado: "hecho" },
    { id: "b3", tarea_id: t.arduino, titulo: "Arduino: código y comentarios", inicio: enSemana(1, 15), fin: enSemana(1, 15, 45), estado: "planificado" },
    { id: "b4", tarea_id: t.ecuaciones, titulo: "Ecuaciones: ejercicios 5-8", inicio: enSemana(1, 16), fin: enSemana(1, 16, 30), estado: "planificado" },
    { id: "b5", tarea_id: t.circuitos, titulo: "Ley de Ohm: circuitos 1-2", inicio: enSemana(2, 15), fin: enSemana(2, 15, 45), estado: "planificado" },
    { id: "b6", tarea_id: t.movimiento, titulo: "MRU: problemas 1-3", inicio: enSemana(2, 16), fin: enSemana(2, 16, 30), estado: "planificado" },
    { id: "b7", tarea_id: t.circuitos, titulo: "Ley de Ohm: circuitos 3-4", inicio: enSemana(3, 15), fin: enSemana(3, 15, 40), estado: "planificado" },
    { id: "b8", tarea_id: t.movimiento, titulo: "MRU: problemas 4-6", inicio: enSemana(3, 16), fin: enSemana(3, 16, 30), estado: "planificado" },
    { id: "b9", tarea_id: t.fracciones, titulo: "Fracciones: guía completa", inicio: enSemana(4, 15), fin: enSemana(4, 15, 30), estado: "planificado" },
    { id: "b10", tarea_id: t.csharp, titulo: "C#: promedio de notas", inicio: enSemana(5, 9), fin: enSemana(5, 9, 50), estado: "planificado" },
  ],
  avisos: ["Llegó la práctica de Física para el jueves; moví el repaso de Fracciones al viernes."],
  generado_en: enSemana(0, 11, 5),
};
