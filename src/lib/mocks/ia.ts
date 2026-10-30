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
  analisis(t.arduino, 3, 60, 95, ["Salidas digitales", "Función delay()", "Estructura setup/loop"], ["Arma el circuito con los 3 LED", "Escribe el código del rojo primero", "Agrega comentarios al final"], "La fecha ya pasó: sube tu evidencia y explica el código que entregaste en Classroom."),
  analisis(t.ecuaciones, 3, 40, 80, ["Despejar x", "Operaciones inversas", "Comprobar la solución"], ["Resuelve 1 a 4", "Descansa 5 minutos", "Resuelve 5 a 8 y comprueba"], "Ya verificaste esta tarea: practica la comprobación de tus resultados."),
  analisis(t.circuitos, 4, 55, 70, ["Ley de Ohm", "Resistencia equivalente en serie", "Unidades eléctricas"], ["Calcula la resistencia total de cada circuito", "Aplica V = I · R", "Revisa las unidades"], "Es de las más difíciles de la semana; conviene empezar temprano."),
  analisis(t.movimiento, 3, 45, 65, ["Razón y proporción", "Regla de tres directa", "Interpretar el resultado"], ["Anota los datos de cada problema", "Justifica la relación directa", "Comprueba las unidades"], "Practica recetas y mapas justificando la relación entre las cantidades."),
  analisis(t.fracciones, 2, 30, 45, ["Mínimo común múltiplo", "Fracciones equivalentes"], ["Calcula el MCM de cada par", "Resuelve 5 por sesión"], "Es un repaso; tienes hasta el viernes."),
  analisis(t.csharp, 3, 50, 40, ["Variables numéricas", "Ciclo for", "Condicional if"], ["Pide las 5 notas con un ciclo", "Calcula el promedio", "Muestra el resultado con if"], "Entrega el sábado; programa en dos sesiones cortas."),
  analisis(t.ensayo3d, 2, 45, 20, ["Primitivas 3D", "Agrupar y restar formas", "Exportar STL"], ["Haz el contorno del llavero", "Agrega tu inicial en relieve", "Exporta y revisa el archivo"], "Entrega la próxima semana; puedes dejarla para el fin de semana."),
  analisis(t.vectores, 4, 60, 15, ["Tabla de valores", "Pendiente", "Punto de corte"], ["Completa las tablas de valores", "Grafica las rectas y comprueba su corte"], "Es para la próxima semana; divide las tablas y las gráficas en dos sesiones."),
];

export const planSemanalMock: PlanSemanal = {
  estudiante_id: ESTUDIANTE_ACTUAL,
  semana_inicio: format(lunesActual(), "yyyy-MM-dd"),
  bloques: Array.from({ length: 14 }, (_, i) => {
    const dia = Math.floor(i / 2);
    const tarea = analisisMock[(i + 2) % analisisMock.length];
    const hora = dia === 5 ? 9 : 15;
    return {
      id: `demo-b${i + 1}`, tarea_id: tarea.tarea_id,
      titulo: `${i % 2 ? "Practicar" : "Repasar"}: ${tarea.conceptos[0]}`,
      inicio: enSemana(dia, hora + i % 2), fin: enSemana(dia, hora + i % 2, 30),
      estado: "planificado" as const,
    };
  }),
  avisos: ["Llegó una tarea de Tecnología; reservé tiempo para practicar y comprobar las ecuaciones."],
  generado_en: enSemana(0, 11, 5),
};
