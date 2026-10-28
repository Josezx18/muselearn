import { estudianteActual } from "@/lib/ia/conversacion/servidor";
import { ErrorConversacion, errorConversacion } from "@/lib/ia/conversacion/validacion";
import { validarWav } from "@/lib/ia/conversacion/voz";

export async function POST(request: Request) {
  try {
    await estudianteActual();
    const datos = await request.formData();
    const audio = datos.get("audio");
    if (!(audio instanceof File) || audio.size > 5_760_044 || audio.size <= 44) throw new ErrorConversacion(400, "audio_invalido");
    validarWav(await audio.arrayBuffer());
    // T03 debe exponer transcripción en el punto único de IA antes de enviar audios.
    // No almacenamos audio si no podemos transcribirlo ni llamamos una URL alternativa.
    throw new ErrorConversacion(503, "transcripcion_pendiente_integracion");
  } catch (e) { return errorConversacion(e); }
}
