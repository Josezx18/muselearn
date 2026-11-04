import { z } from "zod";
import { FechaHora } from "@/types/contratos";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import type { UsoIA } from "@/lib/ia/registro-uso";

const FilaUso = z.object({
  funcion: z.enum(["analizar", "planificar", "leer_cuaderno", "tutor", "verificar", "evaluar", "ruta", "docente", "voz"]),
  proveedor: z.enum(["meta", "abierto", "nvidia"]), modelo: z.string(),
  tokens_entrada: z.number().int().nonnegative().nullable(), tokens_salida: z.number().int().nonnegative().nullable(),
  audio_ms: z.number().int().nonnegative().nullable(), stream: z.boolean(), ok: z.boolean(),
  error: z.string().max(300).nullable(), usuario_id: z.uuid().nullable(), creado_en: FechaHora,
});
let avisado = false;
export async function insertarUso(uso: UsoIA): Promise<void> {
  const { error } = await crearClienteAdmin().from("uso_ia").insert(uso);
  if (!error) return;
  if (error.code === "42P01" || error.code === "PGRST205") {
    if (!avisado) console.warn("[uso-ia] falta aplicar la migración 0016_uso_ia.sql");
    avisado = true;
    return;
  }
  throw new Error("registro_uso_fallido");
}

export function esAdmin(correo: string | undefined, env = process.env): boolean {
  return Boolean(correo && env.ADMIN_CORREOS?.split(",").some((c) => c.trim().toLowerCase() === correo.toLowerCase()));
}

/** Se llama solo después de comprobar la sesión y ADMIN_CORREOS. Pagina para evitar el límite de 1000 filas. */
export async function leerUso(desde: string | null): Promise<(UsoIA & { creado_en: string })[]> {
  const admin = crearClienteAdmin();
  const filas: (UsoIA & { creado_en: string })[] = [];
  for (let inicio = 0; ; inicio += 1000) {
    let consulta = admin.from("uso_ia").select("*").order("creado_en").order("id").range(inicio, inicio + 999);
    if (desde) consulta = consulta.gte("creado_en", desde);
    const { data, error } = await consulta;
    if (error) throw new Error("lectura_uso_fallida");
    filas.push(...z.array(FilaUso).parse(data ?? []));
    if (!data || data.length < 1000) return filas;
  }
}
