// Utilidades de las ayudas de IA del docente (la carpeta con "_" no es una ruta).
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import {
  LIMITES,
  registrarUsoIADocente,
  usosIADocenteHoy,
  type FuncionIADocente,
} from "@/lib/db/limites";
import { ErrorIA } from "@/lib/ia/cliente";
import { crearClienteAdmin } from "@/lib/supabase/servidor";

/** Docente con sesión y cupo de IA para hoy, o la respuesta de error. */
export async function docenteConCupo() {
  const actual = await obtenerUsuarioActual();
  if (!actual)
    return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente")
    return errorHttp(403, "solo_docente", "Solo los docentes usan esta ayuda.");
  const admin = crearClienteAdmin();
  if ((await usosIADocenteHoy(admin, actual.usuario.id)) >= LIMITES.docenteIA) {
    return errorHttp(
      429,
      "limite_diario_ia_docente",
      `Llegaste al máximo de ${LIMITES.docenteIA} ayudas de IA por día.`,
    );
  }
  const registrar = (funcion: FuncionIADocente) =>
    registrarUsoIADocente(admin, actual.usuario.id, funcion);
  return { actual, registrar };
}

/** Error de la IA o inesperado → respuesta estándar (sin datos del estudiante en el registro). */
export function errorIADocente(e: unknown, contexto: string) {
  if (e instanceof ErrorIA) {
    console.warn(`[docente/ia] ${contexto}: ${e.message}`);
    return errorHttp(
      502,
      "ia_no_disponible",
      "La IA no respondió. Inténtalo de nuevo en un momento.",
    );
  }
  console.error(
    `[docente/ia] ${contexto}:`,
    e instanceof Error ? e.message : e,
  );
  return errorHttp(500, "error_interno", "No se pudo completar la operación.");
}
