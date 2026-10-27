// =====================================================================
// MuseLearn — ÚNICO punto de acceso a los modelos (ver AGENTS.md).
// Dueño: T03. Solo se usa en el servidor (Route Handlers / Server Actions).
// =====================================================================
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";
import { REGLAS_COMUNES } from "./prompts/reglas-comunes";

/** Para qué se llama al modelo. Decide proveedor, modelo y respaldo. */
export type FuncionIA =
  | "analizar" // analizar una tarea (lote, modelo abierto)
  | "planificar" // plan semanal (lote, modelo abierto)
  | "leer_cuaderno" // visión: leer fotos del cuaderno
  | "tutor" // tutor socrático
  | "verificar" // preguntas de verificación
  | "evaluar" // informe de comprensión
  | "ruta"; // ruta de práctica

export type Esfuerzo = "minimal" | "low" | "medium" | "high";
export type IdProveedor = "meta" | "abierto" | "nvidia";
export type MensajeIA = ChatCompletionMessageParam;

export interface Proveedor {
  id: IdProveedor;
  baseURL: string;
  apiKey: string;
  modelo: string;
  /** Acepta response_format json_schema y reasoning_effort (Meta Model API). */
  avanzado: boolean;
}

/** Orden de proveedores por función: el primero configurado se usa; los demás son respaldo. */
export const RUTAS: Record<FuncionIA, IdProveedor[]> = {
  analizar: ["abierto", "meta", "nvidia"],
  planificar: ["abierto", "meta", "nvidia"],
  leer_cuaderno: ["meta"],
  tutor: ["meta", "abierto"],
  verificar: ["meta", "abierto"],
  evaluar: ["meta", "abierto"],
  ruta: ["meta", "abierto"],
};

export const ESFUERZO_POR_DEFECTO: Record<FuncionIA, Esfuerzo> = {
  analizar: "low",
  planificar: "low",
  leer_cuaderno: "medium",
  tutor: "high",
  verificar: "high",
  evaluar: "high",
  ruta: "medium",
};

/** Lee los proveedores configurados en las variables de entorno. */
export function proveedoresDesdeEntorno(env: NodeJS.ProcessEnv = process.env): Partial<Record<IdProveedor, Proveedor>> {
  const lista: Partial<Record<IdProveedor, Proveedor>> = {};
  if (env.MODEL_API_KEY) {
    lista.meta = {
      id: "meta",
      baseURL: env.META_API_URL || "https://api.meta.ai/v1",
      apiKey: env.MODEL_API_KEY,
      modelo: env.MUSE_MODELO || "muse-spark-1.3",
      avanzado: true,
    };
  }
  if (env.MODELO_ABIERTO_KEY && env.MODELO_ABIERTO_URL && env.MODELO_ABIERTO_ID) {
    lista.abierto = {
      id: "abierto",
      baseURL: env.MODELO_ABIERTO_URL,
      apiKey: env.MODELO_ABIERTO_KEY,
      modelo: env.MODELO_ABIERTO_ID,
      avanzado: false,
    };
  }
  if (env.NVIDIA_API_KEY) {
    lista.nvidia = {
      id: "nvidia",
      baseURL: env.NVIDIA_API_URL || "https://integrate.api.nvidia.com/v1",
      apiKey: env.NVIDIA_API_KEY,
      modelo: env.NVIDIA_MODELO || "meta/muse-glimmer-30b",
      avanzado: false,
    };
  }
  return lista;
}

export interface OpcionesLlamada<T> {
  funcion: FuncionIA;
  /** Prompt de sistema de la función (las reglas comunes se anteponen solas). */
  sistema: string;
  mensajes: MensajeIA[];
  /** Si se pasa, la respuesta se pide en JSON y se valida; se reintenta 1 vez si no cumple. */
  esquema?: z.ZodType<T>;
  esfuerzo?: Esfuerzo;
  idioma?: "es" | "en";
  maxTokens?: number;
}

export interface ResultadoIA<T> {
  datos: T;
  texto: string;
  proveedor: IdProveedor;
  modelo: string;
  tokens: { entrada: number; salida: number };
}

export class ErrorIA extends Error {
  constructor(
    mensaje: string,
    public readonly intentos: { proveedor: IdProveedor; error: string }[] = [],
  ) {
    super(mensaje);
    this.name = "ErrorIA";
  }
}

/** Interfaz mínima del SDK que usamos (permite simularlo en pruebas). */
export interface ClienteChat {
  chat: { completions: { create: (cuerpo: Record<string, unknown>) => Promise<unknown> } };
}

type FabricaCliente = (p: Proveedor) => ClienteChat;

const fabricaReal: FabricaCliente = (p) =>
  new OpenAI({ apiKey: p.apiKey, baseURL: p.baseURL, maxRetries: 3, timeout: 30_000 }) as unknown as ClienteChat;

/** Quita ```json … ``` y texto alrededor para quedarse con el objeto JSON. */
export function extraerJson(texto: string): unknown {
  const limpio = texto.replace(/```(?:json)?/gi, "").trim();
  const inicio = limpio.search(/[[{]/);
  const fin = Math.max(limpio.lastIndexOf("}"), limpio.lastIndexOf("]"));
  if (inicio === -1 || fin === -1) throw new Error("La respuesta no contiene JSON");
  return JSON.parse(limpio.slice(inicio, fin + 1));
}

interface RespuestaChat {
  choices?: { message?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export function crearLlamador(
  proveedores: Partial<Record<IdProveedor, Proveedor>> = proveedoresDesdeEntorno(),
  fabrica: FabricaCliente = fabricaReal,
) {
  return async function llamarMuse<T = string>(op: OpcionesLlamada<T>): Promise<ResultadoIA<T>> {
    const candidatos = RUTAS[op.funcion]
      .map((id) => proveedores[id])
      .filter((p): p is Proveedor => Boolean(p));
    if (candidatos.length === 0) {
      throw new ErrorIA(`No hay proveedor configurado para "${op.funcion}". Revisa .env.local`);
    }

    const sistema = `${REGLAS_COMUNES}\n\nIDIOMA: ${op.idioma ?? "es"}\n\n${op.sistema}`;
    const esfuerzo = op.esfuerzo ?? ESFUERZO_POR_DEFECTO[op.funcion];
    const intentos: { proveedor: IdProveedor; error: string }[] = [];

    for (const p of candidatos) {
      const cliente = fabrica(p);
      let mensajes: MensajeIA[] = [{ role: "system", content: sistema }, ...op.mensajes];

      // Hasta 2 vueltas por proveedor: la segunda solo si el JSON no cumplió el esquema.
      for (let vuelta = 0; vuelta < 2; vuelta++) {
        try {
          const cuerpo: Record<string, unknown> = {
            model: p.modelo,
            messages: mensajes,
            max_tokens: op.maxTokens ?? 4096,
          };
          if (p.avanzado) cuerpo.reasoning_effort = esfuerzo;
          if (op.esquema) {
            cuerpo.response_format = p.avanzado
              ? {
                  type: "json_schema",
                  json_schema: { name: op.funcion, schema: z.toJSONSchema(op.esquema), strict: false },
                }
              : { type: "json_object" };
          }

          const r = (await cliente.chat.completions.create(cuerpo)) as RespuestaChat;
          const texto = r.choices?.[0]?.message?.content ?? "";
          const tokens = { entrada: r.usage?.prompt_tokens ?? 0, salida: r.usage?.completion_tokens ?? 0 };
          console.info(`[ia] ${op.funcion} ${p.id}/${p.modelo} entrada=${tokens.entrada} salida=${tokens.salida}`);

          if (!op.esquema) {
            return { datos: texto as T, texto, proveedor: p.id, modelo: p.modelo, tokens };
          }

          let crudo: unknown;
          try {
            crudo = extraerJson(texto);
          } catch (e) {
            crudo = undefined;
            if (vuelta === 0) {
              mensajes = [...mensajes, { role: "assistant", content: texto }, { role: "user", content: `Tu respuesta no era JSON válido (${(e as Error).message}). Devuelve SOLO el JSON.` }];
              continue;
            }
          }
          const validado = op.esquema.safeParse(crudo);
          if (validado.success) {
            return { datos: validado.data, texto, proveedor: p.id, modelo: p.modelo, tokens };
          }
          if (vuelta === 0) {
            mensajes = [
              ...mensajes,
              { role: "assistant", content: texto },
              { role: "user", content: `El JSON no cumple el esquema: ${validado.error.message}. Corrígelo y devuelve SOLO el JSON.` },
            ];
            continue;
          }
          throw new Error(`JSON inválido tras reintento: ${validado.error.message}`);
        } catch (e) {
          intentos.push({ proveedor: p.id, error: (e as Error).message });
          console.warn(`[ia] ${op.funcion} falló en ${p.id}: ${(e as Error).message}`);
          break; // pasar al siguiente proveedor (respaldo)
        }
      }
    }
    throw new ErrorIA(`Ningún proveedor respondió para "${op.funcion}"`, intentos);
  };
}

/** Llamada estándar con los proveedores del entorno. */
export const llamarMuse = crearLlamador();
