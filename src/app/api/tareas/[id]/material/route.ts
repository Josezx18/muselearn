import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { errorHttp } from "@/lib/db/http";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { EdicionMaterial, MaterialGuardado } from "@/types/contratos";

type Contexto = { params: Promise<{ id: string }> };
async function atender(req: Request, ctx: Contexto, metodo: "GET" | "PUT" | "DELETE") {
  try {
    const actual = await obtenerUsuarioActual();
    if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
    const id = z.string().uuid().safeParse((await ctx.params).id);
    if (!id.success) return errorHttp(400, "datos_invalidos", "Identificador inválido.");
    if (metodo === "GET") {
      // RLS permite al dueño y al estudiante inscrito únicamente si está publicado.
      const { data, error } = await actual.db.from("materiales_estudio").select("*").eq("tarea_id", id.data).maybeSingle();
      if (error) throw error;
      return data ? NextResponse.json(MaterialGuardado.parse(data)) : errorHttp(404, "no_encontrado", "Material no encontrado.");
    }
    if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo el docente puede editar.");
    const { data: tarea, error: errorTarea } = await actual.db.from("tareas")
      .select("id, clases!inner(docente_id)").eq("id", id.data).eq("clases.docente_id", actual.usuario.id).maybeSingle();
    if (errorTarea) throw errorTarea;
    if (!tarea) return errorHttp(404, "no_encontrado", "Tarea no encontrada.");
    const admin = crearClienteAdmin();
    if (metodo === "DELETE") {
      const { error } = await admin.from("materiales_estudio").delete().eq("tarea_id", id.data);
      if (error) throw error;
      return new Response(null, { status: 204 });
    }
    const edicion = EdicionMaterial.safeParse(await req.json().catch(() => null));
    if (!edicion.success) return errorHttp(400, "datos_invalidos", "Material inválido.");
    const { data, error } = await admin.from("materiales_estudio")
      .update({ ...edicion.data, actualizado_en: new Date().toISOString() }).eq("tarea_id", id.data).select("*").maybeSingle();
    if (error) throw error;
    return data ? NextResponse.json(MaterialGuardado.parse(data)) : errorHttp(404, "no_encontrado", "Material no encontrado.");
  } catch {
    return errorHttp(500, "error_interno", "No se pudo cargar o guardar el material.");
  }
}
export const GET = (req: Request, ctx: Contexto) => atender(req, ctx, "GET");
export const PUT = (req: Request, ctx: Contexto) => atender(req, ctx, "PUT");
export const DELETE = (req: Request, ctx: Contexto) => atender(req, ctx, "DELETE");
