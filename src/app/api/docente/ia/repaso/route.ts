import { NextResponse } from "next/server";
import { z } from "zod";
import { errorHttp } from "@/lib/db/http";
import { ErrorComprension, datosComprension } from "@/lib/db/comprension";
import { SinDatosRepaso, sugerirRepaso } from "@/lib/ia/docente";
import { docenteConCupo, errorIADocente } from "../_comun";

export const maxDuration = 60;

const Entrada = z.object({
  clase_id: z.string().uuid(),
  tarea_id: z.string().uuid().nullable().optional(),
});

// POST /api/docente/ia/repaso — plan de repaso para la clase a partir de los informes de comprensión.
// Al modelo solo le llegan datos agregados por concepto (sin nombres de estudiantes).
export async function POST(peticion: Request) {
  const sesion = await docenteConCupo();
  if (sesion instanceof Response) return sesion;
  const { actual, registrar } = sesion;

  const entrada = Entrada.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success)
    return errorHttp(400, "datos_invalidos", "Elige una clase.");

  try {
    const datos = await datosComprension(
      actual.db,
      actual.usuario.id,
      entrada.data.clase_id,
      entrada.data.tarea_id ?? null,
    );
    if (!datos.informes.length)
      return errorHttp(
        409,
        "sin_informes",
        "Todavía no hay informes de comprensión en esta clase.",
      );
    await registrar("sugerir_repaso");
    const sugerencia = await sugerirRepaso(datos.clase, datos.informes, {
      idioma: actual.usuario.idioma,
      tarea: datos.tituloTarea,
    });
    return NextResponse.json(sugerencia);
  } catch (e) {
    if (e instanceof ErrorComprension)
      return errorHttp(e.estado, e.codigo, "Clase o tarea no encontrada.");
    if (e instanceof SinDatosRepaso)
      return errorHttp(
        409,
        "sin_informes",
        "Todavía no hay informes de comprensión en esta clase.",
      );
    return errorIADocente(e, "sugerir repaso");
  }
}
