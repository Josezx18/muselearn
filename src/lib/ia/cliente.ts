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
  | "ruta" // ruta de práctica
  | "docente"; // ayudas para el docente: proponer tareas, sugerir repasos, borradores de comentario

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
  docente: ["meta", "abierto"],
};

export const ESFUERZO_POR_DEFECTO: Record<FuncionIA, Esfuerzo> = {
  analizar: "low",
  planificar: "low",
  leer_cuaderno: "medium",
  tutor: "high",
  verificar: "high",
  evaluar: "high",
  ruta: "medium",
  docente: "medium",
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

/** Versión con streaming (texto plano, sin esquema). Respaldo solo si el proveedor falla antes del primer trozo. */
export function crearLlamadorStream(
  proveedores: Partial<Record<IdProveedor, Proveedor>> = proveedoresDesdeEntorno(),
  fabrica: FabricaCliente = fabricaReal,
) {
  return async function* llamarMuseStream(op: Omit<OpcionesLlamada<string>, "esquema">): AsyncGenerator<string> {
    const candidatos = RUTAS[op.funcion].map((id) => proveedores[id]).filter((p): p is Proveedor => Boolean(p));
    if (candidatos.length === 0) throw new ErrorIA(`No hay proveedor configurado para "${op.funcion}". Revisa .env.local`);
    const sistema = `${REGLAS_COMUNES}

IDIOMA: ${op.idioma ?? "es"}

${op.sistema}`;
    const intentos: { proveedor: IdProveedor; error: string }[] = [];

    for (const p of candidatos) {
      let emitido = false;
      try {
        const cuerpo: Record<string, unknown> = {
          model: p.modelo,
          messages: [{ role: "system", content: sistema }, ...op.mensajes],
          max_tokens: op.maxTokens ?? 4096,
          stream: true,
        };
        if (p.avanzado) cuerpo.reasoning_effort = op.esfuerzo ?? ESFUERZO_POR_DEFECTO[op.funcion];
        const flujo = (await fabrica(p).chat.completions.create(cuerpo)) as AsyncIterable<{
          choices?: { delta?: { content?: string | null } }[];
        }>;
        for await (const trozo of flujo) {
          const texto = trozo.choices?.[0]?.delta?.content;
          if (texto) {
            emitido = true;
            yield texto;
          }
        }
        console.info(`[ia] ${op.funcion} ${p.id}/${p.modelo} (stream)`);
        return;
      } catch (e) {
        if (emitido) throw e; // ya se envió texto: no se puede cambiar de proveedor a mitad
        intentos.push({ proveedor: p.id, error: (e as Error).message });
        console.warn(`[ia] ${op.funcion} (stream) falló en ${p.id}: ${(e as Error).message}`);
      }
    }
    throw new ErrorIA(`Ningún proveedor respondió para "${op.funcion}"`, intentos);
  };
}

export const llamarMuseStream = crearLlamadorStream();

/** Llamada estándar con los proveedores del entorno. */
export const llamarMuse = crearLlamador();

// ---------------- Voz → texto (Muse Voice Transcribe) ----------------
// Ver .orquesta/referencias/muse-voice-transcribe.md. Misma MODEL_API_KEY que Muse Spark.
// El audio se envía en memoria y no se guarda en ningún lado.

export interface OpcionesTranscripcion {
  /** WAV RIFF mono, PCM 16 bits, 16 o 24 kHz. */
  wav: Blob;
  idioma?: "es" | "en";
  /** Términos de la tarea que el modelo podría oír mal (conceptos, nombres). Máx. 30. */
  palabrasClave?: string[];
}

const IDIOMAS_VOZ: Record<"es" | "en", string[]> = { es: ["Spanish", "English"], en: ["English", "Spanish"] };

/**
 * Palabras clave para Muse Voice Transcribe: máximo 30, de hasta 30 caracteres cada una.
 * Las competencias son frases largas: se usan sus palabras importantes (≥ 5 letras) en vez de la frase entera.
 */
export function palabrasClaveVoz(fuentes: string[]): string[] {
  const salida: string[] = [];
  const agregar = (p: string) => {
    const limpia = p.trim().replace(/[.,;:()"«»]+/g, "");
    if (limpia && limpia.length <= 30 && !salida.some((x) => x.toLowerCase() === limpia.toLowerCase())) salida.push(limpia);
  };
  for (const f of fuentes) {
    if (f.trim().length <= 30) agregar(f);
    else for (const palabra of f.split(/\s+/)) if (palabra.replace(/[^\p{L}]/gu, "").length >= 5) agregar(palabra);
  }
  return salida.slice(0, 30);
}

export function crearTranscriptor(env: NodeJS.ProcessEnv = process.env, hacerFetch: typeof fetch = fetch) {
  return async function transcribirAudio(op: OpcionesTranscripcion): Promise<string> {
    if (!env.MODEL_API_KEY) throw new ErrorIA("No hay MODEL_API_KEY para transcribir voz. Revisa .env.local");
    const base = (env.META_API_URL || "https://api.meta.ai/v1").replace(/\/$/, "");
    const modelo = env.MUSE_VOZ_MODELO || "muse-voice-transcribe-1.0";
    const ajustes: Record<string, unknown> = {
      mode: "PUSH_TO_TALK",
      model: modelo,
      audioEncoding: "WAV",
      languageBias: IDIOMAS_VOZ[op.idioma ?? "es"],
    };
    const claves = palabrasClaveVoz(op.palabrasClave ?? []);
    if (claves.length) ajustes.keywords = claves;

    let ultimoError = "";
    // 2 intentos: el segundo si el servicio respondió 429 o 5xx (según la documentación de Meta),
    // o si rechazó la petición por las palabras clave: se reintenta sin ellas (la voz es más importante).
    for (let intento = 0; intento < 2; intento++) {
      const cuerpo = new FormData();
      cuerpo.append("request", new Blob([JSON.stringify(ajustes)], { type: "application/json" }));
      cuerpo.append("audio", op.wav, "respuesta.wav");
      const r = await hacerFetch(`${base}/asr/transcribe`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.MODEL_API_KEY}` },
        body: cuerpo,
      });
      if (r.ok) {
        const datos = (await r.json()) as { transcript?: unknown; audioDurationMs?: unknown };
        console.info(`[ia] voz ${modelo} audio=${String(datos.audioDurationMs ?? "?")}ms`);
        return typeof datos.transcript === "string" ? datos.transcript.trim() : "";
      }
      ultimoError = `${r.status} ${(await r.text().catch(() => "")).slice(0, 200)}`;
      if (r.status === 400 && ajustes.keywords) {
        delete ajustes.keywords;
        continue;
      }
      if (r.status !== 429 && r.status < 500) break;
      await new Promise((listo) => setTimeout(listo, 800 * (intento + 1)));
    }
    throw new ErrorIA(`No se pudo transcribir el audio: ${ultimoError}`, [{ proveedor: "meta", error: ultimoError }]);
  };
}

export const transcribirAudio = crearTranscriptor();
