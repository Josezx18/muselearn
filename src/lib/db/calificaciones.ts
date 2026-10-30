import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Entrega, FechaHora, type Usuario } from "@/types/contratos";
import { tareaDelDocente } from "./gestion";

// Contratos provisionales T09: trasladar al contrato compartido al integrar.
export const Nota = z.number().min(0).max(100).multipleOf(0.01).nullable();
export const EntradaCalificacion = z.object({ nota: Nota }).strict();
export const EntradaDevolucion = z.object({ motivo: z.string().trim().min(1).max(1000) }).strict();
export const Calificacion = z.object({
  entrega_id: z.string().uuid(),
  docente_id: z.string().uuid(),
  nota: Nota,
  devuelta: z.boolean(),
  motivo_devolucion: z.string().max(1000).nullable(),
  actualizado_en: FechaHora,
});
export type Calificacion = z.infer<typeof Calificacion>;

/** Comprueba pertenencia explícita además de RLS, antes de cualquier uso de admin. */
export async function entregaPermitida(db: SupabaseClient, usuario: Usuario, id: string, escritura = false) {
  if (!z.string().uuid().safeParse(id).success) return null;
  if (escritura && usuario.rol !== "docente") return null;
  const { data, error } = await db.from("entregas").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const entrega = Entrega.parse(data);
  if (usuario.rol === "estudiante") return entrega.estudiante_id === usuario.id ? entrega : null;
  return await tareaDelDocente(db, usuario.id, entrega.tarea_id) ? entrega : null;
}

export async function obtenerCalificacion(db: SupabaseClient, id: string) {
  const { data, error } = await db.from("calificaciones").select("*").eq("entrega_id", id).maybeSingle();
  if (error) throw error;
  return Calificacion.nullable().parse(data);
}

export async function guardarCalificacion(db: SupabaseClient, docenteId: string, id: string, nota: unknown) {
  const { data, error } = await db.from("calificaciones").upsert({
    entrega_id: id, docente_id: docenteId, nota: Nota.parse(nota), actualizado_en: new Date().toISOString(),
  }, { onConflict: "entrega_id" }).select("*").single();
  if (error) throw error;
  return Calificacion.parse(data);
}

/** Solo se llama con admin DESPUÉS de entregaPermitida(..., true). La RPC actualiza ambas tablas atómicamente. */
export async function devolverEntrega(admin: SupabaseClient, docenteId: string, id: string, motivo: string) {
  const entrada = EntradaDevolucion.parse({ motivo });
  const { data, error } = await admin.rpc("devolver_entrega", {
    p_entrega_id: id, p_docente_id: docenteId, p_motivo: entrada.motivo,
  });
  if (error) throw error;
  return Calificacion.parse(data);
}

/** Integrador: invocar tras crearEntrega en POST /api/entregas, con el id autenticado. */
export async function limpiarDevolucionPropia(admin: SupabaseClient, entregaId: string, estudianteId: string) {
  const { data, error } = await admin.from("entregas").select("estudiante_id, estado").eq("id", entregaId).single();
  if (error) throw error;
  if (data.estudiante_id !== estudianteId || data.estado !== "entregada") throw new Error("entrega_no_permitida");
  const { error: fallo } = await admin.from("calificaciones").update({
    devuelta: false, motivo_devolucion: null, actualizado_en: new Date().toISOString(),
  }).eq("entrega_id", entregaId).eq("devuelta", true);
  if (fallo) throw fallo;
}
