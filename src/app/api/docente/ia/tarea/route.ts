import { NextResponse } from "next/server";
import { errorHttp } from "@/lib/db/http";
import { proponerTarea } from "@/lib/ia/docente";
import { PedidoPropuestaTarea } from "@/types/contratos";
import { docenteConCupo, errorIADocente } from "../_comun";

export const maxDuration = 60;

// POST /api/docente/ia/tarea — la IA propone una tarea para la clase a partir del tema que da el docente.
// No guarda nada: el docente revisa la propuesta en el formulario y decide.
export async function POST(peticion: Request) {
  const sesion = await docenteConCupo();
  if (sesion instanceof Response) return sesion;
  const { actual, registrar } = sesion;

  const entrada = PedidoPropuestaTarea.safeParse(
    await peticion.json().catch(() => null),
  );
  if (!entrada.success)
    return errorHttp(
      400,
      "datos_invalidos",
      "Escribe el tema de la tarea (mínimo 3 caracteres).",
    );

  const { data: clase } = await actual.db
    .from("clases")
    .select("nombre, materia, grado")
    .eq("id", entrada.data.clase_id)
    .eq("docente_id", actual.usuario.id)
    .maybeSingle();
  if (!clase)
    return errorHttp(404, "clase_no_encontrada", "Clase no encontrada.");

  try {
    await registrar("proponer_tarea");
    const propuesta = await proponerTarea(
      clase,
      { tema: entrada.data.tema, detalles: entrada.data.detalles },
      { idioma: actual.usuario.idioma },
    );
    return NextResponse.json(propuesta);
  } catch (e) {
    return errorIADocente(e, "proponer tarea");
  }
}
