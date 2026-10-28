import type { SupabaseClient } from "@supabase/supabase-js";
import type { Adjunto } from "@/types/contratos";

// Subida de archivos a Supabase Storage (bucket privado "adjuntos").
// Se sube con la sesión del usuario: la política RLS exige owner = auth.uid().
// Rutas:  tareas/<tarea_id>/<uuid>-<nombre>                 (docente)
//         entregas/<tarea_id>/<estudiante_id>/<uuid>-<nombre> (estudiante)

export const BUCKET_ADJUNTOS = "adjuntos";
export const MAX_BYTES_ADJUNTO = 10 * 1024 * 1024;
export const TIPOS_ADJUNTO = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

/** Quita acentos, espacios y caracteres raros; conserva la extensión. Máx. 80 caracteres. */
export function nombreSeguro(nombre: string): string {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "");
  return (limpio || "archivo").slice(-80);
}

export function prefijoEntrega(tareaId: string, estudianteId: string): string {
  return `entregas/${tareaId}/${estudianteId}/`;
}

/** ¿Todas las rutas de la entrega están dentro de la carpeta del propio estudiante para esa tarea? */
export function rutasDeEntregaValidas(adjuntos: Pick<Adjunto, "ruta">[], tareaId: string, estudianteId: string): boolean {
  const prefijo = prefijoEntrega(tareaId, estudianteId);
  return adjuntos.every((a) => a.ruta.startsWith(prefijo) && !a.ruta.includes(".."));
}

export type ErrorArchivo = "archivo_faltante" | "archivo_grande" | "tipo_invalido";

/** Valida tamaño y tipo. Devuelve el código de error o null si es válido. */
export function validarArchivo(archivo: unknown): ErrorArchivo | null {
  if (!(archivo instanceof File) || archivo.size === 0) return "archivo_faltante";
  if (archivo.size > MAX_BYTES_ADJUNTO) return "archivo_grande";
  if (!(TIPOS_ADJUNTO as readonly string[]).includes(archivo.type)) return "tipo_invalido";
  return null;
}

/** Sube el archivo a <carpeta><uuid>-<nombre> y devuelve el Adjunto para guardar en la BD. */
export async function subirAdjunto(db: SupabaseClient, carpeta: string, archivo: File): Promise<Adjunto> {
  const ruta = `${carpeta}${crypto.randomUUID().slice(0, 8)}-${nombreSeguro(archivo.name)}`;
  const { error } = await db.storage
    .from(BUCKET_ADJUNTOS)
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false });
  if (error) throw error;
  return { nombre: archivo.name, ruta, tipo_mime: archivo.type };
}
