// Utilidades compartidas por los mocks (T00). Datos 100% ficticios.
import { addDays, setHours, setMinutes, startOfWeek, startOfDay } from "date-fns";

/** UUID determinista y válido para datos de ejemplo: id(1) → 00000000-0000-4000-8000-000000000001 */
export function id(n: number): string {
  return `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
}

/** Lunes de la semana actual (las fechas de los mocks se mueven con el calendario real). */
export function lunesActual(hoy: Date = new Date()): Date {
  return startOfWeek(startOfDay(hoy), { weekStartsOn: 1 });
}

/** Fecha ISO en el día `dia` de la semana actual (0 = lunes) a la hora indicada. */
export function enSemana(dia: number, hora: number, minuto = 0, hoy: Date = new Date()): string {
  return setMinutes(setHours(addDays(lunesActual(hoy), dia), hora), minuto).toISOString();
}

export const IDS = {
  docente: id(1),
  estudiantes: [id(11), id(12), id(13), id(14), id(15), id(16), id(17), id(18), id(19), id(20), id(21), id(22)],
  clases: { matematica: id(101), tecnologia: id(102), fisica: id(103) },
  tareas: {
    ecuaciones: id(201),
    fracciones: id(202),
    arduino: id(203),
    circuitos: id(204),
    movimiento: id(205),
    ensayo3d: id(206),
    csharp: id(207),
    vectores: id(208),
  },
  entregas: { ecuaciones: id(301), arduino: id(302) },
  verificacion: id(401),
} as const;

/** Estudiante con sesión iniciada en el modo mocks. */
export const ESTUDIANTE_ACTUAL = IDS.estudiantes[0];
