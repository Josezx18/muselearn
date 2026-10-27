// Utilidades de los Route Handlers de T03 (la carpeta con "_" no es una ruta).
import { timingSafeEqual } from "node:crypto";
import { ZodError } from "zod";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { ErrorIA } from "@/lib/ia/cliente";

export function responderError(estado: number, codigo: string, mensaje: string): Response {
  return Response.json({ error: { codigo, mensaje } }, { status: estado });
}

/** Convierte cualquier excepción en la respuesta de error estándar de api.md. */
export function manejarError(e: unknown): Response {
  if (e instanceof ZodError) return responderError(400, "entrada_invalida", e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  if (e instanceof ErrorIA) return responderError(502, "ia_no_disponible", e.message);
  console.error("[api/ia]", e);
  return responderError(500, "error_interno", "No se pudo completar la operación.");
}

export type Sesion =
  | { tipo: "usuario"; id: string }
  /** Llamada de servidor a servidor (p. ej. T02 al crear una tarea): Authorization: Bearer <service_role>. */
  | { tipo: "servicio" };

/** Identifica quién llama. Devuelve null si no hay sesión válida. */
export async function obtenerSesion(request: Request): Promise<Sesion | null> {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (clave && token) {
    const a = Buffer.from(token);
    const b = Buffer.from(clave);
    if (a.length === b.length && timingSafeEqual(a, b)) return { tipo: "servicio" };
  }
  try {
    const supabase = await crearClienteServidor();
    const { data } = await supabase.auth.getUser();
    return data.user ? { tipo: "usuario", id: data.user.id } : null;
  } catch {
    return null;
  }
}

/** Sesión de estudiante: devuelve su id, o la respuesta de error que hay que devolver. */
export async function exigirEstudiante(request: Request): Promise<{ id: string } | Response> {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.tipo !== "usuario") return responderError(401, "no_autenticado", "Inicia sesión para continuar.");
  return { id: sesion.id };
}
