import type { FuncionIA, IdProveedor } from "./cliente";

export interface UsoIA {
  funcion: FuncionIA | "voz";
  proveedor: IdProveedor;
  modelo: string;
  tokens_entrada: number | null;
  tokens_salida: number | null;
  audio_ms: number | null;
  stream: boolean;
  ok: boolean;
  error: string | null;
  usuario_id: string | null;
}
export type RegistradorUso = (uso: UsoIA) => Promise<void>;

export const registrarUso: RegistradorUso = async (uso) => {
  const { insertarUso } = await import("@/lib/db/uso-ia");
  await insertarUso(uso);
};

/** Nunca propaga errores ni espera a la base de datos. No guarda mensajes ni errores del SDK. */
export function registrarSinEsperar(registrar: RegistradorUso, uso: UsoIA): void {
  void Promise.resolve().then(() => registrar(uso)).catch(() => {
    console.warn("[uso-ia] no se pudo guardar el registro");
  });
}

/** Los mensajes del SDK pueden contener prompts, respuestas o credenciales: solo códigos seguros. */
export function codigoError(error: unknown): string {
  const estado = error && typeof error === "object" && "status" in error ? error.status : null;
  return typeof estado === "number" ? `proveedor_http_${estado}` : "intento_fallido";
}
