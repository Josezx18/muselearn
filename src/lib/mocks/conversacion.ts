// Mocks de T04 (tutor y verificación). Datos ficticios.
import type { MensajeChat, SesionVerificacion } from "@/types/contratos";
import { IDS, enSemana, id } from "./base";

export const mensajesTutorMock: MensajeChat[] = [
  { rol: "estudiante", contenido: "No entiendo el ejercicio 3: 4x + 6 = 2x + 14", creado_en: enSemana(1, 18, 0) },
  { rol: "agente", contenido: "Vamos paso a paso. Tienes x en los dos lados. ¿Qué podrías hacer para dejar todas las x de un solo lado?", creado_en: enSemana(1, 18, 0) },
  { rol: "estudiante", contenido: "¿Restar 2x a los dos lados?", creado_en: enSemana(1, 18, 1) },
  { rol: "agente", contenido: "¡Exacto! Hazlo y dime qué ecuación te queda.", creado_en: enSemana(1, 18, 1) },
];

export const sesionVerificacionMock: SesionVerificacion = {
  id: IDS.verificacion,
  entrega_id: IDS.entregas.ecuaciones,
  estado: "completada",
  preguntas: [
    {
      id: "p1",
      texto: "Buen trabajo entregando. En el ejercicio 1 pasaste el 5 al otro lado restando. ¿Por qué restando y no sumando?",
      concepto: "Operaciones inversas",
      respuesta: "Porque está sumando, entonces para quitarlo hago lo contrario, que es restar en los dos lados.",
      via: "voz",
    },
    {
      id: "p2",
      texto: "Si en el ejercicio 1 el 20 fuera 26, ¿cuánto valdría x?",
      concepto: "Despejar x",
      respuesta: "26 menos 5 es 21, y 21 entre 3 es 7.",
      via: "voz",
    },
    {
      id: "p3",
      texto: "¿Cómo podrías comprobar que x = 8 es correcto en el ejercicio 2?",
      concepto: "Comprobar la solución",
      respuesta: "No sé, creo que lo hice bien.",
      via: "texto",
    },
  ],
};

export const sesionesDemoMock: SesionVerificacion[] = informesClaseMock.map((informe, i) => ({
  id: i === 0 ? IDS.verificacion : id(410 + i), entrega_id: informe.entrega_id, estado: "completada",
  preguntas: sesionVerificacionMock.preguntas.map((p, j) => ({ ...p, respuesta: i === 0 ? p.respuesta : respuestasDemo(i)[j] })),
}));

import { informesClaseMock, respuestasDemo } from "./informes";
