import type { SupabaseClient } from "@supabase/supabase-js";

// Topes diarios de uso de IA por usuario. La app es pública (cualquiera puede registrarse) y cada llamada
// a Muse consume créditos: estos límites evitan que una sola cuenta agote el presupuesto.
// Son generosos para un estudiante real. Se pueden ajustar con variables de entorno.
export const LIMITES = {
  /** Mensajes al tutor por estudiante y día (todas las tareas). */
  tutor: numero(process.env.LIMITE_TUTOR_DIA, 60),
  /** Verificaciones iniciadas por estudiante y día. */
  verificaciones: numero(process.env.LIMITE_VERIFICACIONES_DIA, 10),
  /** Tareas creadas por docente y día (cada una dispara un análisis por estudiante). */
  tareas: numero(process.env.LIMITE_TAREAS_DIA, 20),
} as const;

function numero(valor: string | undefined, porDefecto: number): number {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : porDefecto;
}

/** Inicio del día actual en la zona del centro (ZONA_OFFSET_MIN, por defecto República Dominicana, UTC-4), en ISO UTC. */
export function inicioDelDia(ahora = new Date(), offsetMin = numeroConSigno(process.env.ZONA_OFFSET_MIN, -240)): string {
  const local = new Date(ahora.getTime() + offsetMin * 60_000);
  const medianoche = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(medianoche - offsetMin * 60_000).toISOString();
}

function numeroConSigno(valor: string | undefined, porDefecto: number): number {
  const n = Number(valor);
  return valor !== undefined && valor !== "" && Number.isFinite(n) ? n : porDefecto;
}

/** Mensajes que el estudiante escribió hoy al tutor (cuenta dentro del historial guardado). */
export async function mensajesTutorHoy(db: SupabaseClient, estudianteId: string, desde = inicioDelDia()): Promise<number> {
  const { data, error } = await db
    .from("conversaciones_tutor")
    .select("mensajes")
    .eq("estudiante_id", estudianteId)
    .gte("actualizada_en", desde);
  if (error) throw error;
  return contarMensajesDesde((data ?? []).map((f) => f.mensajes as unknown), desde);
}

/** Cuenta los mensajes de rol "estudiante" con fecha >= desde en una lista de historiales. */
export function contarMensajesDesde(historiales: unknown[], desde: string): number {
  const limite = Date.parse(desde);
  let total = 0;
  for (const h of historiales) {
    if (!Array.isArray(h)) continue;
    for (const m of h as { rol?: string; creado_en?: string }[]) {
      if (m?.rol === "estudiante" && m.creado_en && Date.parse(m.creado_en) >= limite) total++;
    }
  }
  return total;
}

/** Verificaciones creadas hoy para entregas del estudiante. */
export async function verificacionesHoy(admin: SupabaseClient, estudianteId: string, desde = inicioDelDia()): Promise<number> {
  const { count, error } = await admin
    .from("sesiones_verificacion")
    .select("id, entregas!inner(estudiante_id)", { count: "exact", head: true })
    .eq("entregas.estudiante_id", estudianteId)
    .gte("creada_en", desde);
  if (error) throw error;
  return count ?? 0;
}

/** Tareas creadas hoy en las clases del docente. */
export async function tareasCreadasHoy(db: SupabaseClient, docenteId: string, desde = inicioDelDia()): Promise<number> {
  const { count, error } = await db
    .from("tareas")
    .select("id, clases!inner(docente_id)", { count: "exact", head: true })
    .eq("clases.docente_id", docenteId)
    .gte("creada_en", desde);
  if (error) throw error;
  return count ?? 0;
}
