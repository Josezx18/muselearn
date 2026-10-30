import { crearClienteAdmin } from "@/lib/supabase/servidor";

export type TipoAviso =
  | "tarea_nueva"
  | "entrega_devuelta"
  | "comentario"
  | "nota"
  | "tareas_importadas";

export interface CrearAvisoParams {
  usuarioIds: string[];
  tipo: TipoAviso;
  titulo: string;
  enlace: string;
}

/**
 * Crea avisos para uno o varios usuarios.
 * Nunca rompe la acción que lo llama: si falla, solo registra con console.warn.
 * Funciona aunque la tabla aún no exista (fallo silencioso con warn).
 */
export async function crearAviso(
  admin: ReturnType<typeof crearClienteAdmin>,
  { usuarioIds, tipo, titulo, enlace }: CrearAvisoParams
): Promise<void> {
  if (!usuarioIds.length) return;

  const filas = usuarioIds.map((usuario_id) => ({
    usuario_id,
    tipo,
    titulo,
    enlace,
    leido: false,
  }));

  try {
    const { error } = await admin.from("avisos").insert(filas);
    if (error) {
      console.warn("[avisos] Error insertando avisos:", error.message);
    }
  } catch (e) {
    console.warn("[avisos] Excepción creando avisos (¿tabla no existe?):", e instanceof Error ? e.message : e);
  }
}

/**
 * Obtiene los últimos 30 avisos del usuario y el conteo de no leídos.
 */
export async function obtenerAvisos(usuarioId: string): Promise<{
  avisos: Aviso[];
  noLeidos: number;
}> {
  try {
    const admin = crearClienteAdmin();
    const { data, error } = await admin
      .from("avisos")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("creado_en", { ascending: false })
      .limit(30);

    if (error) {
      console.warn("[avisos] Error obteniendo avisos:", error.message);
      return { avisos: [], noLeidos: 0 };
    }

    const avisos = data ?? [];
    const noLeidos = avisos.filter((a) => !a.leido).length;
    return { avisos, noLeidos };
  } catch (e) {
    console.warn("[avisos] Excepción obteniendo avisos:", e instanceof Error ? e.message : e);
    return { avisos: [], noLeidos: 0 };
  }
}

/**
 * Marca avisos como leídos. Si ids es undefined, marca todos como leídos.
 */
export async function marcarAvisosLeidos(
  usuarioId: string,
  ids?: string[]
): Promise<void> {
  try {
    const admin = crearClienteAdmin();
    let query = admin.from("avisos").update({ leido: true }).eq("usuario_id", usuarioId);

    if (ids?.length) {
      query = query.in("id", ids);
    }

    const { error } = await query;
    if (error) {
      console.warn("[avisos] Error marcando como leídos:", error.message);
    }
  } catch (e) {
    console.warn("[avisos] Excepción marcando leídos:", e instanceof Error ? e.message : e);
  }
}

export interface Aviso {
  id: string;
  usuario_id: string;
  tipo: TipoAviso;
  titulo: string;
  enlace: string;
  leido: boolean;
  creado_en: string;
}