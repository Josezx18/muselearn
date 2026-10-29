import { cookies } from "next/headers";
import { COOKIE_TOKEN } from "@/lib/integraciones/classroom";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";

/** Docente con sesión y su token de Classroom (de la cookie), o la respuesta de error. */
export async function docenteConToken() {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo los docentes importan clases.");
  const token = (await cookies()).get(COOKIE_TOKEN)?.value;
  if (!token) return errorHttp(401, "sin_conexion", "Conecta tu cuenta de Google Classroom.");
  return { actual, token };
}
