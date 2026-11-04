import { after } from "next/server";
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

/**
 * Nunca propaga errores ni hace esperar al usuario. No guarda mensajes ni errores del SDK.
 * Dentro de una petición se agenda con `after()`: Vercel mantiene viva la función hasta guardarlo (una promesa
 * suelta se cortaba al terminar la respuesta y el registro se perdía). Fuera de una petición (pruebas, scripts),
 * se lanza sin esperar.
 */
export function registrarSinEsperar(registrar: RegistradorUso, uso: UsoIA): void {
  const guardar = () =>
    Promise.resolve()
      .then(() => registrar(uso))
      .catch(() => {
        console.warn("[uso-ia] no se pudo guardar el registro");
      });
  try {
    after(guardar);
  } catch {
    void guardar();
  }
}

/** Los mensajes del SDK pueden contener prompts, respuestas o credenciales: solo códigos seguros. */
export function codigoError(error: unknown): string {
  const estado = error && typeof error === "object" && "status" in error ? error.status : null;
  return typeof estado === "number" ? `proveedor_http_${estado}` : "intento_fallido";
}
