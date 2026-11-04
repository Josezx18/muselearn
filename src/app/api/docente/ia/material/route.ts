import { NextResponse } from "next/server";
import { z } from "zod";
import { docenteConCupo, errorIADocente } from "../_comun";
import { errorHttp } from "@/lib/db/http";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { generarMaterial, generarFormato } from "@/lib/ia/docente/material";
import { MaterialEstudio, MaterialGuardado, PedidoMaterial, Tarea } from "@/types/contratos";

export const maxDuration = 60;
export async function POST(peticion: Request) {
  try {
    const sesion = await docenteConCupo();
    if (sesion instanceof Response) return sesion;
    const entrada = PedidoMaterial.safeParse(await peticion.json().catch(() => null));
    if (!entrada.success) return errorHttp(400, "datos_invalidos", "Identificador inválido.");
    const { actual, registrar } = sesion;
    const { data, error } = await actual.db.from("tareas")
      .select("*, clases!inner(docente_id, grado)").eq("id", entrada.data.tarea_id)
      .eq("clases.docente_id", actual.usuario.id).maybeSingle();
    if (error) throw error;
    if (!data) return errorHttp(404, "no_encontrado", "Tarea no encontrada.");
    const clase = z.object({ docente_id: z.string().uuid(), grado: z.string() }).parse(data.clases);
    await registrar("material_estudio");
    const formato = entrada.data.formato ?? "guia";
    const previo = await actual.db.from("materiales_estudio").select("contenido").eq("tarea_id", entrada.data.tarea_id).maybeSingle();
    if (previo.error) throw previo.error;
    const op = { idioma: actual.usuario.idioma, grado: clase.grado };
    const contenido = formato === "guia" ? await generarMaterial(Tarea.parse(data), op)
      : await generarFormato(Tarea.parse(data), formato, previo.data ? MaterialEstudio.parse(previo.data.contenido) : null, op);
    const guardado = await crearClienteAdmin().from("materiales_estudio").upsert({
      tarea_id: entrada.data.tarea_id, contenido, publicado: false, actualizado_en: new Date().toISOString(),
    }, { onConflict: "tarea_id" }).select("*").single();
    if (guardado.error) throw guardado.error;
    return NextResponse.json(MaterialGuardado.parse(guardado.data));
  } catch (e) { return errorIADocente(e, "material de estudio"); }
}
