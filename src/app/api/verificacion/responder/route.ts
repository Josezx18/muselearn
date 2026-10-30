import { sesionVigente, informeDeSesion } from "@/lib/ia/conversacion/intentos";
import { InformeComprension, SesionVerificacion } from "@/types/contratos";
import { comprobarEscritura, contextoEntrega, estudianteActual } from "@/lib/ia/conversacion/servidor";
import { contenidoEntrega, evaluar, generarRuta, siguientePregunta } from "@/lib/ia/conversacion/verificador";
import { rutaBasica } from "@/lib/ia/informes";
import { EntradaRespuesta, ErrorConversacion, errorConversacion } from "@/lib/ia/conversacion/validacion";

/** Lectura del cuaderno y evaluación pueden tardar: margen en Vercel (segundos). */
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const entrada = EntradaRespuesta.parse(await request.json().catch(() => null));
    const actual = await estudianteActual();
    // RLS + comprobación de propiedad de la entrega antes de crear un cliente admin.
    const { data, error } = await actual.db.from("sesiones_verificacion").select("*").eq("id", entrada.sesion_id).maybeSingle();
    if (error) throw error;
    if (!data) throw new ErrorConversacion(404, "sesion_no_encontrada");
    const sesion = SesionVerificacion.parse(data);
    const ctx = await contextoEntrega(sesion.entrega_id);
    if (!sesionVigente(data, ctx.entrega)) throw new ErrorConversacion(409, "sesion_obsoleta");
    const guardado = await ctx.db.from("informes").select("informe").eq("entrega_id", ctx.entrega.id).maybeSingle();
    if (guardado.error) throw guardado.error;
    if (guardado.data && informeDeSesion(InformeComprension.parse(guardado.data.informe), data)) {
      // Recupera un cierre interrumpido después de guardar el informe.
      comprobarEscritura(await ctx.admin.from("entregas").update({ estado: "verificada" }).eq("id", ctx.entrega.id));
      comprobarEscritura(await ctx.admin.from("sesiones_verificacion").update({ estado: "completada" }).eq("id", sesion.id));
      return Response.json({ informe: InformeComprension.parse(guardado.data.informe) });
    }
    if (sesion.estado === "completada") {
      throw new ErrorConversacion(409, "informe_no_disponible");
    }
    const ultima = sesion.preguntas.at(-1);
    if (
      !ultima ||
      ultima.id !== entrada.pregunta_id ||
      (ultima.respuesta !== null && (sesion.preguntas.length !== 3 || ultima.respuesta !== entrada.respuesta || ultima.via !== entrada.via))
    ) {
      throw new ErrorConversacion(409, "pregunta_fuera_de_turno");
    }
    const preguntas = sesion.preguntas.map((p) =>
      p.id === entrada.pregunta_id ? { ...p, respuesta: entrada.respuesta, via: entrada.via } : p,
    );
    const contenido = await contenidoEntrega(ctx);
    let salida;
    if (preguntas.length < 3) {
      const siguiente = await siguientePregunta(contenido, preguntas, ctx.usuario.idioma);
      preguntas.push(siguiente);
      salida = { siguiente };
    } else {
      // Guarda la respuesta antes de evaluar; si la IA falla, se puede reintentar sin perder evidencia.
      const { data: reclamada, error: fallo } = await ctx.admin
        .from("sesiones_verificacion")
        .update({ preguntas })
        .eq("id", sesion.id)
        .eq("estado", "en_curso")
        .eq("preguntas", JSON.stringify(sesion.preguntas))
        .select("id")
        .maybeSingle();
      if (fallo) throw fallo;
      if (!reclamada) throw new ErrorConversacion(409, "sesion_actualizada");
      const informe = await evaluar(contenido, preguntas, ctx.entrega.id, ctx.usuario.idioma);
      // Si la IA falla al crear la ruta, se guarda una básica: el informe nunca se pierde por la ruta (T07).
      const ruta = await generarRuta(informe, ctx.tarea, ctx.usuario.idioma).catch((e: unknown) => {
        console.warn("[verificacion] generarRuta falló; se usa la ruta básica:", e instanceof Error ? e.message : e);
        return rutaBasica(informe, ctx.tarea, ctx.usuario.idioma);
      });
      comprobarEscritura(
        await ctx.admin.from("informes").upsert({ entrega_id: ctx.entrega.id, informe, ruta }, { onConflict: "entrega_id" }),
      );
      comprobarEscritura(await ctx.admin.from("entregas").update({ estado: "verificada" }).eq("id", ctx.entrega.id));
      comprobarEscritura(await ctx.admin.from("sesiones_verificacion").update({ estado: "completada" }).eq("id", sesion.id));
      return Response.json({ informe });
    }
    const { data: actualizado, error: fallo } = await ctx.admin
      .from("sesiones_verificacion")
      .update({ preguntas, estado: "en_curso" })
      .eq("id", sesion.id)
      .eq("estado", "en_curso")
      .eq("preguntas", JSON.stringify(sesion.preguntas))
      .select("id")
      .maybeSingle();
    if (fallo) throw fallo;
    if (!actualizado) throw new ErrorConversacion(409, "sesion_actualizada");
    return Response.json(salida);
  } catch (e) {
    return errorConversacion(e);
  }
}
