import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Tarea, Adjunto, Entrega } from "@/types/contratos";
import { NuevaTarea, AdjuntoSubida } from "./validacion-tareas";

// "*": zod descarta lo que sobra y pone los valores por defecto de las columnas nuevas (modalidad, enlace…).
const COLUMNAS_TAREA = "*";
const COLUMNAS_ENTREGA = "*";

export async function crearTarea(db: SupabaseClient, docenteId: string, datos: NuevaTarea) {
  const { data, error } = await db
    .from("tareas")
    .insert({ ...datos, clase_id: datos.clase_id })
    .select(COLUMNAS_TAREA)
    .single();
  if (error) throw error;
  return Tarea.parse(data);
}

export async function listarTareas(db: SupabaseClient, claseId?: string) {
  let query = db.from("tareas").select(COLUMNAS_TAREA).order("creada_en", { ascending: false });
  if (claseId) query = query.eq("clase_id", claseId);
  const { data, error } = await query;
  if (error) throw error;
  return z.array(Tarea).parse(data);
}

export async function obtenerTarea(db: SupabaseClient, id: string) {
  const { data, error } = await db.from("tareas").select(COLUMNAS_TAREA).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? Tarea.parse(data) : null;
}

export async function obtenerTareaConClase(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from("tareas")
    .select(`*, clases!inner(materia, grado, docente_id)`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function agregarAdjuntoTarea(db: SupabaseClient, tareaId: string, adjunto: AdjuntoSubida) {
  const { data: tarea } = await db.from("tareas").select("adjuntos").eq("id", tareaId).maybeSingle();
  if (!tarea) throw new Error("tarea_no_encontrada");
  const adjuntos = (tarea.adjuntos as Adjunto[]) ?? [];
  adjuntos.push(adjunto);
  const { error } = await db.from("tareas").update({ adjuntos }).eq("id", tareaId);
  if (error) throw error;
  return adjunto;
}

export async function crearEntrega(
  db: SupabaseClient,
  estudianteId: string,
  datos: { tarea_id: string; contenido_texto: string; adjuntos: AdjuntoSubida[]; entregada_externamente?: boolean },
) {
  const ahora = new Date().toISOString();
  const { data, error } = await db
    .from("entregas")
    .upsert(
      {
        tarea_id: datos.tarea_id,
        estudiante_id: estudianteId,
        contenido_texto: datos.contenido_texto,
        adjuntos: datos.adjuntos,
        // Solo se escribe cuando es verdadero: así la entrega normal no depende de la columna nueva.
        ...(datos.entregada_externamente ? { entregada_externamente: true } : {}),
        estado: "entregada",
        entregada_en: ahora,
      },
      { onConflict: "tarea_id,estudiante_id" }
    )
    .select(COLUMNAS_ENTREGA)
    .single();
  if (error) {
    if (error.code === "23503") throw new Error("tarea_no_encontrada");
    throw error;
  }
  return Entrega.parse(data);
}

export async function listarEntregas(db: SupabaseClient, tareaId: string) {
  const { data, error } = await db
    .from("entregas")
    .select(COLUMNAS_ENTREGA)
    .eq("tarea_id", tareaId)
    .order("entregada_en", { ascending: false });
  if (error) throw error;
  return z.array(Entrega).parse(data);
}

export async function obtenerEntrega(db: SupabaseClient, tareaId: string, estudianteId: string) {
  const { data, error } = await db
    .from("entregas")
    .select(COLUMNAS_ENTREGA)
    .eq("tarea_id", tareaId)
    .eq("estudiante_id", estudianteId)
    .maybeSingle();
  if (error) throw error;
  return data ? Entrega.parse(data) : null;
}

export async function verificarInscripcion(db: SupabaseClient, estudianteId: string, claseId: string): Promise<boolean> {
  const { data } = await db
    .from("inscripciones")
    .select("clase_id")
    .eq("clase_id", claseId)
    .eq("estudiante_id", estudianteId)
    .maybeSingle();
  return Boolean(data);
}

export async function obtenerClaseDeTarea(db: SupabaseClient, tareaId: string): Promise<{ id: string; docente_id: string } | null> {
  const { data } = await db.from("tareas").select("clase_id, clases!inner(docente_id)").eq("id", tareaId).maybeSingle();
  if (!data) return null;
  const clase = Array.isArray(data.clases) ? data.clases[0] : data.clases;
  return { id: data.clase_id, docente_id: clase?.docente_id ?? "" };
}