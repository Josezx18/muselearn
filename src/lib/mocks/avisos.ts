// Mocks para avisos (T12) — datos 100% ficticios
import { id, enSemana, ESTUDIANTE_ACTUAL } from "./base";

export const avisosMock = [
  {
    id: id(501),
    usuario_id: ESTUDIANTE_ACTUAL,
    tipo: "tarea_nueva",
    titulo: "Nueva tarea: Ecuaciones lineales",
    enlace: `/estudiante/tarea/${id(201)}`,
    leido: false,
    creado_en: enSemana(0, 9, 30),
  },
  {
    id: id(502),
    usuario_id: ESTUDIANTE_ACTUAL,
    tipo: "comentario",
    titulo: "Comentario en tu entrega: Fracciones",
    enlace: `/estudiante/tarea/${id(202)}`,
    leido: false,
    creado_en: enSemana(1, 14, 15),
  },
  {
    id: id(503),
    usuario_id: ESTUDIANTE_ACTUAL,
    tipo: "nota",
    titulo: "Nota publicada: Proyecto Arduino",
    enlace: `/estudiante/tarea/${id(203)}`,
    leido: true,
    creado_en: enSemana(2, 10, 0),
  },
  {
    id: id(504),
    usuario_id: ESTUDIANTE_ACTUAL,
    tipo: "entrega_devuelta",
    titulo: "Tu docente te pidió corregir: Movimiento",
    enlace: `/estudiante/tarea/${id(205)}`,
    leido: false,
    creado_en: enSemana(3, 16, 45),
  },
  {
    id: id(505),
    usuario_id: ESTUDIANTE_ACTUAL,
    tipo: "tareas_importadas",
    titulo: "Se importaron 3 tareas nuevas de Classroom",
    enlace: "/estudiante/hoy",
    leido: true,
    creado_en: enSemana(4, 8, 0),
  },
] as const;

export const avisosMockRespuesta = {
  avisos: avisosMock,
  noLeidos: avisosMock.filter((a) => !a.leido).length,
};