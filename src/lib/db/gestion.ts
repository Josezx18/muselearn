// Gestión del docente: editar y borrar clases y tareas, cambiar el código, quitar estudiantes,
// y ver una entrega completa. Todo pasa por el cliente con sesión (RLS) salvo lo que el RLS no cubre
// (archivos de otros usuarios), que usa el cliente admin DESPUÉS de comprobar el acceso.
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  Clase,
  ComentarioDocente,
  DetalleEntrega,
  Entrega,
  InformeComprension,
  PreguntaVerificacion,
  Tarea,
  Usuario,
  type EdicionTarea,
} from "@/types/contratos";
import { generarCodigo } from "./codigos";
import { BUCKET_ADJUNTOS } from "./almacenamiento";
import type { NuevaClase } from "./validacion";
import { enlaceArchivo } from "@/lib/archivos";

const COLUMNAS_CLASE = "id, docente_id, nombre, materia, grado, codigo_inscripcion, creada_en";
const COLUMNAS_TAREA = "*"; // zod descarta lo que sobra y completa las columnas nuevas
const CODIGO_DUPLICADO = "23505";

/** Clase del docente, o null si no existe o es de otro docente. */
export async function claseDelDocente(db: SupabaseClient, docenteId: string, claseId: string) {
  const { data } = await db.from("clases").select(COLUMNAS_CLASE).eq("id", claseId).eq("docente_id", docenteId).maybeSingle();
  return data ? Clase.parse(data) : null;
}

export async function editarClase(db: SupabaseClient, claseId: string, datos: NuevaClase) {
  const { data, error } = await db.from("clases").update(datos).eq("id", claseId).select(COLUMNAS_CLASE).single();
  if (error) throw error;
  return Clase.parse(data);
}

/** Código nuevo (el anterior deja de servir). Reintenta si choca con otro. */
export async function cambiarCodigo(db: SupabaseClient, claseId: string) {
  for (let intento = 0; intento < 8; intento++) {
    const { data, error } = await db
      .from("clases")
      .update({ codigo_inscripcion: generarCodigo() })
      .eq("id", claseId)
      .select(COLUMNAS_CLASE)
      .single();
    if (!error) return Clase.parse(data);
    if (error.code !== CODIGO_DUPLICADO) throw error;
  }
  throw new Error("No se pudo generar un código único");
}

/**
 * Borra la clase. La base borra en cascada tareas, inscripciones, entregas, análisis, conversaciones,
 * verificaciones e informes. Los archivos de Storage se borran aparte (best effort).
 */
export async function borrarClase(db: SupabaseClient, admin: SupabaseClient, claseId: string) {
  const { data: tareas } = await db.from("tareas").select("id").eq("clase_id", claseId);
  const { error } = await db.from("clases").delete().eq("id", claseId);
  if (error) throw error;
  await borrarArchivosDeTareas(
    admin,
    (tareas ?? []).map((t) => t.id as string),
  );
}

/** Quita a un estudiante de la clase (sus entregas se conservan por si vuelve a inscribirse). */
export async function quitarEstudiante(db: SupabaseClient, claseId: string, estudianteId: string) {
  const { error, count } = await db
    .from("inscripciones")
    .delete({ count: "exact" })
    .eq("clase_id", claseId)
    .eq("estudiante_id", estudianteId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Tarea con su clase si el docente es el dueño; null si no. */
export async function tareaDelDocente(db: SupabaseClient, docenteId: string, tareaId: string) {
  const { data } = await db
    .from("tareas")
    .select(`${COLUMNAS_TAREA}, clases!inner(docente_id)`)
    .eq("id", tareaId)
    .eq("clases.docente_id", docenteId)
    .maybeSingle();
  if (!data) return null;
  return Tarea.parse(data); // zod descarta la columna extra "clases"
}

export async function editarTarea(db: SupabaseClient, tareaId: string, cambio: EdicionTarea) {
  const { data, error } = await db.from("tareas").update(cambio).eq("id", tareaId).select(COLUMNAS_TAREA).single();
  if (error) throw error;
  return Tarea.parse(data);
}

export async function borrarTarea(db: SupabaseClient, admin: SupabaseClient, tareaId: string) {
  const { error } = await db.from("tareas").delete().eq("id", tareaId);
  if (error) throw error;
  await borrarArchivosDeTareas(admin, [tareaId]);
}

/** Borra los adjuntos de las tareas y de sus entregas en Storage. Nunca falla: solo registra. */
export async function borrarArchivosDeTareas(admin: SupabaseClient, tareaIds: string[]) {
  const almacen = admin.storage.from(BUCKET_ADJUNTOS);
  for (const id of tareaIds) {
    try {
      const rutas: string[] = [];
      const { data: deTarea } = await almacen.list(`tareas/${id}`, { limit: 1000 });
      rutas.push(...(deTarea ?? []).map((f) => `tareas/${id}/${f.name}`));
      const { data: carpetas } = await almacen.list(`entregas/${id}`, { limit: 1000 });
      for (const c of carpetas ?? []) {
        const { data: archivos } = await almacen.list(`entregas/${id}/${c.name}`, { limit: 1000 });
        rutas.push(...(archivos ?? []).map((f) => `entregas/${id}/${c.name}/${f.name}`));
      }
      if (rutas.length) await almacen.remove(rutas);
    } catch (e) {
      console.warn(`[gestion] no se pudieron borrar archivos de la tarea ${id}: ${(e as Error).message}`);
    }
  }
}

/**
 * Detalle de una entrega para su docente (o para el propio estudiante). El RLS decide: si el usuario
 * no puede leer la entrega, devuelve null.
 */
export async function detalleEntrega(db: SupabaseClient, entregaId: string) {
  const { data: fila } = await db.from("entregas").select("*").eq("id", entregaId).maybeSingle();
  if (!fila) return null;
  const entrega = Entrega.parse(fila);
  const [{ data: perfil }, { data: sesiones }, { data: informe }, comentario] = await Promise.all([
    db.from("perfiles").select("id, rol, nombre, idioma").eq("id", entrega.estudiante_id).maybeSingle(),
    db
      .from("sesiones_verificacion")
      .select("preguntas, creada_en")
      .eq("entrega_id", entregaId)
      .order("creada_en", { ascending: false })
      .limit(1),
    db.from("informes").select("informe").eq("entrega_id", entregaId).maybeSingle(),
    comentarioDeEntrega(db, entregaId),
  ]);
  const estudiante = Usuario.safeParse(perfil);
  return DetalleEntrega.parse({
    entrega,
    estudiante: estudiante.success ? estudiante.data : { id: entrega.estudiante_id, rol: "estudiante", nombre: "—", idioma: "es" },
    adjuntos: entrega.adjuntos.map((a) => ({ ...a, url: enlaceArchivo(a.ruta) })),
    preguntas: z
      .array(PreguntaVerificacion)
      .catch([])
      .parse(sesiones?.[0]?.preguntas ?? []),
    informe: informe ? (InformeComprension.safeParse(informe.informe).data ?? null) : null,
    comentario,
  });
}

/** Comentario del docente sobre la entrega (lo decide el RLS: el estudiante dueño y el docente de la tarea). */
export async function comentarioDeEntrega(db: SupabaseClient, entregaId: string): Promise<ComentarioDocente | null> {
  const { data, error } = await db
    .from("comentarios_entrega")
    .select("entrega_id, texto, actualizado_en")
    .eq("entrega_id", entregaId)
    .maybeSingle();
  if (error) {
    // Sin la migración 0007 la tabla no existe: la entrega se muestra igual, sin comentario.
    console.warn(`[gestion] no se pudo leer el comentario: ${error.message}`);
    return null;
  }
  return data ? (ComentarioDocente.safeParse(data).data ?? null) : null;
}

/** Guarda (o reemplaza) el comentario del docente. El RLS exige que sea el docente de la tarea. */
export async function guardarComentario(db: SupabaseClient, docenteId: string, entregaId: string, texto: string) {
  const { data, error } = await db
    .from("comentarios_entrega")
    .upsert(
      { entrega_id: entregaId, docente_id: docenteId, texto, actualizado_en: new Date().toISOString() },
      { onConflict: "entrega_id" },
    )
    .select("entrega_id, texto, actualizado_en")
    .single();
  if (error) throw error;
  return ComentarioDocente.parse(data);
}

export async function borrarComentario(db: SupabaseClient, entregaId: string) {
  const { error } = await db.from("comentarios_entrega").delete().eq("entrega_id", entregaId);
  if (error) throw error;
}

/**
 * ¿Puede el usuario ver este archivo? Usa el RLS: las tareas las ven su docente y sus estudiantes;
 * los archivos de una entrega, su estudiante y el docente de la tarea.
 */
export async function puedeVerArchivo(db: SupabaseClient, usuarioId: string, ruta: string): Promise<boolean> {
  if (ruta.includes("..")) return false;
  const partes = ruta.split("/");
  const uuid = z.string().uuid();
  if (partes[0] === "tareas" && partes.length >= 3 && uuid.safeParse(partes[1]).success) {
    const { data } = await db.from("tareas").select("id").eq("id", partes[1]).maybeSingle();
    return !!data;
  }
  if (partes[0] === "entregas" && partes.length >= 4 && uuid.safeParse(partes[1]).success && uuid.safeParse(partes[2]).success) {
    if (partes[2] === usuarioId) return true;
    const { data } = await db.from("entregas").select("id").eq("tarea_id", partes[1]).eq("estudiante_id", partes[2]).maybeSingle();
    return !!data;
  }
  return false;
}
