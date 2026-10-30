import { sesionVigente } from "@/lib/ia/conversacion/intentos";
import { SesionVerificacion } from "@/types/contratos";
import { LIMITES, verificacionesHoy } from "@/lib/db/limites";
import { comprobarEscritura, contextoEntrega } from "@/lib/ia/conversacion/servidor";
import { contenidoEntrega, siguientePregunta } from "@/lib/ia/conversacion/verificador";
import { EntradaInicio, ErrorConversacion, errorConversacion } from "@/lib/ia/conversacion/validacion";

/** Lectura del cuaderno y evaluación pueden tardar: margen en Vercel (segundos). */
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const entrada = EntradaInicio.parse(await request.json().catch(() => null));
    const ctx = await contextoEntrega(entrada.entrega_id);
    if (ctx.entrega.estado === "verificada") throw new ErrorConversacion(409, "entrega_verificada");
    const { data: previa, error } = await ctx.db
      .from("sesiones_verificacion")
      .select("*")
      .eq("entrega_id", ctx.entrega.id)
      .eq("estado", "en_curso")
      .order("creada_en", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (previa && sesionVigente(previa, ctx.entrega)) return Response.json(SesionVerificacion.parse(previa));
    if ((await verificacionesHoy(ctx.admin, ctx.usuario.id)) >= LIMITES.verificaciones) {
      throw new ErrorConversacion(429, "limite_diario_verificaciones");
    }
    const pregunta = await siguientePregunta(await contenidoEntrega(ctx), [], ctx.usuario.idioma);
    const sesion = SesionVerificacion.parse({
      id: crypto.randomUUID(),
      entrega_id: ctx.entrega.id,
      preguntas: [pregunta],
      estado: "en_curso",
    });
    comprobarEscritura(await ctx.admin.from("sesiones_verificacion").insert(sesion));
    comprobarEscritura(await ctx.admin.from("entregas").update({ estado: "verificando" }).eq("id", ctx.entrega.id));
    return Response.json(sesion);
  } catch (e) {
    return errorConversacion(e);
  }
}
