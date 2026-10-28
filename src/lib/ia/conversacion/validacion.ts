import { z } from "zod";
import { MensajeChat, PreguntaVerificacion } from "@/types/contratos";

export const EntradaTutor = z.object({ tarea_id: z.string().uuid(), mensaje: z.string().trim().min(1).max(6000) });
export const EntradaInicio = z.object({ entrega_id: z.string().uuid() });
export const EntradaRespuesta = z.object({
  sesion_id: z.string().uuid(), pregunta_id: z.string().min(1).max(100),
  respuesta: z.string().trim().min(1).max(10000), via: z.enum(["voz", "texto"]),
});
export const Historial = z.array(MensajeChat);
export const Preguntas = z.array(PreguntaVerificacion).max(5);

export class ErrorConversacion extends Error {
  constructor(public status: number, public codigo: string) { super(codigo); }
}

export function errorConversacion(error: unknown) {
  const status = error instanceof ErrorConversacion ? error.status : error instanceof z.ZodError ? 400 : 503;
  const codigo = error instanceof ErrorConversacion ? error.codigo : status === 400 ? "datos_invalidos" : "servicio_no_disponible";
  return Response.json({ error: { codigo, mensaje: codigo } }, { status });
}
