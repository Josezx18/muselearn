import { NextResponse, after } from "next/server";
import { unirseAClase } from "@/lib/db/clases";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { EntradaUnirse } from "@/lib/db/validacion";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { analizarPendientes } from "@/lib/ia/analizador/pendientes";

/** Margen para analizar las tareas pendientes de la clase después de responder (segundos). */
export const maxDuration = 300;

const MENSAJES = {
  no_existe: [404, "No encontramos una clase con ese código."],
  ya_inscrito: [409, "Ya estás inscrito en esa clase."],
  es_docente: [403, "Solo los estudiantes se unen a una clase."],
} as const;

export async function POST(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");

  const entrada = EntradaUnirse.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success) return errorHttp(400, "codigo_invalido", "El código tiene 6 caracteres.");

  try {
    const resultado = await unirseAClase(crearClienteAdmin(), actual.usuario, entrada.data.codigo);
    if ("error" in resultado) {
      const [estado, mensaje] = MENSAJES[resultado.error];
      return errorHttp(estado, resultado.error, mensaje);
    }
    // Las tareas que la clase ya tenía también entran en el plan del estudiante nuevo.
    const claseId = resultado.clase.id;
    const estudianteId = actual.usuario.id;
    after(() => analizarPendientes(claseId, [estudianteId]).catch((e) => console.warn(`[unirse] análisis: ${(e as Error).message}`)));
    return NextResponse.json(resultado.clase);
  } catch {
    return errorHttp(500, "error_interno", "No se pudo completar la inscripción.");
  }
}
