import { ErrorConversacion } from "./validacion";

export function validarWav(buffer: ArrayBuffer) {
  const v = new DataView(buffer);
  const texto = (inicio: number, n: number) => String.fromCharCode(...new Uint8Array(buffer, inicio, n));
  if (
    buffer.byteLength <= 44 ||
    texto(0, 4) !== "RIFF" ||
    texto(8, 4) !== "WAVE" ||
    texto(12, 4) !== "fmt " ||
    v.getUint32(16, true) !== 16 ||
    v.getUint16(20, true) !== 1 ||
    v.getUint16(22, true) !== 1 ||
    v.getUint32(24, true) !== 24000 ||
    v.getUint32(28, true) !== 48000 ||
    v.getUint16(32, true) !== 2 ||
    v.getUint16(34, true) !== 16 ||
    texto(36, 4) !== "data" ||
    v.getUint32(40, true) !== buffer.byteLength - 44 ||
    v.getUint32(4, true) !== buffer.byteLength - 8 ||
    (buffer.byteLength - 44) % 2 !== 0
  ) {
    throw new ErrorConversacion(400, "wav_invalido");
  }
}
