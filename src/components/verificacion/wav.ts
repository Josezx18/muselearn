import { ErrorApi, transcribirVoz } from "@/lib/api-cliente";

/** Reenvía el mismo audio una sola vez ante fallos transitorios. */
export async function transcribirConReintento(audio: Blob, tareaId?: string) {
  try { return await transcribirVoz(audio, tareaId); }
  catch (e) {
    if (!(e instanceof TypeError) && !(e instanceof ErrorApi && e.estado >= 500)) throw e;
    return transcribirVoz(audio, tareaId);
  }
}

/** PCM mono firmado de 16 bits, RIFF/WAVE a 24 kHz. */
export function codificarWav(muestras: Float32Array, frecuencia: number): Blob {
  if (!Number.isFinite(frecuencia) || frecuencia < 8000) throw new Error("frecuencia_invalida");
  const cantidad = Math.floor((muestras.length * 24000) / frecuencia);
  const buffer = new ArrayBuffer(44 + cantidad * 2);
  const view = new DataView(buffer);
  const texto = (offset: number, valor: string) => {
    [...valor].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  };
  texto(0, "RIFF");
  view.setUint32(4, 36 + cantidad * 2, true);
  texto(8, "WAVE");
  texto(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 24000, true);
  view.setUint32(28, 48000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  texto(36, "data");
  view.setUint32(40, cantidad * 2, true);
  // Promedia cada intervalo de origen para reducir alias al bajar de 48/44,1 kHz.
  for (let i = 0; i < cantidad; i++) {
    const inicio = Math.floor((i * frecuencia) / 24000);
    const fin = Math.max(inicio + 1, Math.floor(((i + 1) * frecuencia) / 24000));
    let suma = 0;
    for (let j = inicio; j < fin; j++) suma += muestras[j] ?? 0;
    const valor = Math.max(-1, Math.min(1, suma / (fin - inicio)));
    view.setInt16(44 + i * 2, Math.round(valor * (valor < 0 ? 32768 : 32767)), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Graba el micrófono y devuelve un WAV al detener. `alNivel` recibe el volumen (RMS 0-1) de cada bloque
 * (~85 ms): el modo conversación lo usa para saber cuándo el estudiante dejó de hablar.
 */
export async function grabarWav(opciones: { alNivel?: (rms: number) => void } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
  let context: AudioContext | undefined;
  try {
    context = new AudioContext();
    const fuente = context.createMediaStreamSource(stream);
    // Compatibilidad amplia; salida conectada con ganancia cero para evitar realimentación.
    const procesador = context.createScriptProcessor(4096, 1, 1);
    const silencio = context.createGain();
    silencio.gain.value = 0;
    const bloques: Float32Array[] = [];
    let total = 0;
    procesador.onaudioprocess = (e) => {
      if (total >= context!.sampleRate * 120) return;
      const bloque = e.inputBuffer.getChannelData(0).slice(0, Math.min(4096, context!.sampleRate * 120 - total));
      bloques.push(bloque);
      total += bloque.length;
      if (opciones.alNivel) {
        let suma = 0;
        for (let i = 0; i < bloque.length; i++) suma += bloque[i] * bloque[i];
        opciones.alNivel(Math.sqrt(suma / Math.max(1, bloque.length)));
      }
    };
    fuente.connect(procesador);
    procesador.connect(silencio);
    silencio.connect(context.destination);
    await context.resume();
    let detenido = false;
    return {
      async detener() {
        if (detenido) return null;
        detenido = true;
        procesador.onaudioprocess = null;
        fuente.disconnect();
        procesador.disconnect();
        silencio.disconnect();
        stream.getTracks().forEach((track) => track.stop());
        const muestras = new Float32Array(total);
        let offset = 0;
        for (const bloque of bloques) {
          muestras.set(bloque, offset);
          offset += bloque.length;
        }
        const frecuencia = context!.sampleRate;
        await context!.close();
        return codificarWav(muestras, frecuencia);
      },
    };
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    await context?.close();
    throw error;
  }
}
