import { z } from "zod";
import { Tarea, NivelAyuda, EstadoEntrega } from "@/types/contratos";

export const NuevaTarea = Tarea.omit({ id: true, creada_en: true });
export type NuevaTarea = z.infer<typeof NuevaTarea>;

export const AdjuntoSubida = z.object({
  nombre: z.string(),
  ruta: z.string(),
  tipo_mime: z.string(),
});
export type AdjuntoSubida = z.infer<typeof AdjuntoSubida>;

export const EntradaEntrega = z.object({
  tarea_id: z.string().uuid(),
  contenido_texto: z.string().default(""),
  adjuntos: z.array(AdjuntoSubida).default([]),
});
export type EntradaEntrega = z.infer<typeof EntradaEntrega>;

export const ParametrosTarea = z.object({
  id: z.string().uuid(),
});

export const QueryTareas = z.object({
  clase_id: z.string().uuid().optional(),
});

export const QueryEntregas = z.object({
  tarea_id: z.string().uuid(),
});

export function validarNivelAyuda(valor: string): valor is NivelAyuda {
  return ["pistas", "ejemplos", "explicacion"].includes(valor);
}

export function validarEstadoEntrega(valor: string): valor is EstadoEntrega {
  return ["pendiente", "entregada", "verificando", "verificada"].includes(valor);
}