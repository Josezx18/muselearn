import { z } from "zod";
import { transcribirAudio } from "@/lib/ia/cliente";
import { contextoTarea, estudianteActual } from "@/lib/ia/conversacion/servidor";
import { ErrorConversacion, errorConversacion } from "@/lib/ia/conversacion/validacion";
import { validarWav } from "@/lib/ia/conversacion/voz";

/** 2 minutos de WAV mono 16 bits a 24 kHz + cabecera. */
const MAX_BYTES = 5_760_044;

/**
 * POST multipart { audio: WAV, tarea_id? } → { texto }.
 * El audio se valida y se transcribe en memoria con Muse Voice Transcribe; nunca se guarda.
 * Con tarea_id, los conceptos de la tarea se envían como palabras clave para reconocer mejor términos técnicos.
 */
export async function POST(request: Request) {
  try {
    const datos = await request.formData().catch(() => null);
    const audio = datos?.get("audio");
    if (!(audio instanceof File) || audio.size > MAX_BYTES || audio.size <= 44) throw new ErrorConversacion(400, "audio_invalido");
    validarWav(await audio.arrayBuffer());

    const tareaId = z.string().uuid().safeParse(datos?.get("tarea_id"));
    let idioma: "es" | "en";
    let palabrasClave: string[] = [];
    if (tareaId.success) {
      const ctx = await contextoTarea(tareaId.data); // comprueba sesión, rol e inscripción
      idioma = ctx.usuario.idioma;
      const { data } = await ctx.db
        .from("analisis_tareas")
        .select("conceptos")
        .eq("tarea_id", ctx.tarea.id)
        .eq("estudiante_id", ctx.usuario.id)
        .maybeSingle();
      palabrasClave = [...((data?.conceptos as string[] | undefined) ?? []), ...ctx.tarea.competencias];
    } else {
      idioma = (await estudianteActual()).usuario.idioma;
    }

    const texto = await transcribirAudio({ wav: audio, idioma, palabrasClave });
    return Response.json({ texto });
  } catch (e) {
    return errorConversacion(e);
  }
}
