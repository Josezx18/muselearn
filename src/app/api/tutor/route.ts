import { z } from "zod";
import { llamarMuseStream } from "@/lib/ia/cliente";
import { sistemaTutor } from "@/lib/ia/conversacion/prompts";
import { comprobarEscritura, contextoTarea } from "@/lib/ia/conversacion/servidor";
import { EntradaTutor, ErrorConversacion, Historial, errorConversacion } from "@/lib/ia/conversacion/validacion";
import { LIMITES, mensajesTutorHoy } from "@/lib/db/limites";
import { MensajeChat } from "@/types/contratos";

async function cargar(tareaId: string) {
  const ctx = await contextoTarea(tareaId);
  const { data, error } = await ctx.db
    .from("conversaciones_tutor")
    .select("id, mensajes")
    .eq("tarea_id", tareaId)
    .eq("estudiante_id", ctx.usuario.id)
    .order("actualizada_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return { ...ctx, id: data?.id as string | undefined, mensajes: Historial.parse(data?.mensajes ?? []) };
}

export async function GET(request: Request) {
  try {
    const id = z.string().uuid().parse(new URL(request.url).searchParams.get("tarea_id"));
    return Response.json((await cargar(id)).mensajes);
  } catch (e) {
    return errorConversacion(e);
  }
}

export async function POST(request: Request) {
  try {
    const entrada = EntradaTutor.parse(await request.json().catch(() => null));
    const ctx = await cargar(entrada.tarea_id);
    if ((await mensajesTutorHoy(ctx.db, ctx.usuario.id)) >= LIMITES.tutor) throw new ErrorConversacion(429, "limite_diario_tutor");
    const mensajes = [
      ...ctx.mensajes,
      MensajeChat.parse({ rol: "estudiante", contenido: entrada.mensaje, creado_en: new Date().toISOString() }),
    ];
    const flujo = llamarMuseStream({
      funcion: "tutor",
      idioma: ctx.usuario.idioma,
      sistema: sistemaTutor(ctx.tarea),
      mensajes: mensajes.slice(-20).map((m) => ({ role: m.rol === "agente" ? "assistant" : "user", content: m.contenido })),
    });
    // Obtener el primer trozo antes de responder permite devolver un error HTTP si falla el proveedor.
    const primero = await flujo.next();
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let contenido = "";
        try {
          if (!primero.done) {
            contenido += primero.value;
            controller.enqueue(encoder.encode(primero.value));
          }
          for await (const texto of flujo) {
            contenido += texto;
            controller.enqueue(encoder.encode(texto));
          }
          mensajes.push(MensajeChat.parse({ rol: "agente", contenido, creado_en: new Date().toISOString() }));
          const fila = {
            tarea_id: ctx.tarea.id,
            estudiante_id: ctx.usuario.id,
            mensajes: Historial.parse(mensajes),
            actualizada_en: new Date().toISOString(),
          };
          comprobarEscritura(
            await (ctx.id
              ? ctx.db.from("conversaciones_tutor").update(fila).eq("id", ctx.id)
              : ctx.db.from("conversaciones_tutor").insert(fila)),
          );
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (e) {
    return errorConversacion(e);
  }
}
