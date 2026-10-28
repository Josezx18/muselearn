import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { crearLlamador, crearLlamadorStream, crearTranscriptor, extraerJson, proveedoresDesdeEntorno, type ClienteChat, type Proveedor } from "./cliente";

const meta: Proveedor = { id: "meta", baseURL: "https://api.meta.ai/v1", apiKey: "k", modelo: "muse-spark-1.3", avanzado: true };
const abierto: Proveedor = { id: "abierto", baseURL: "https://inference.baseten.co/v1", apiKey: "k", modelo: "meta-models/muse-spark-open-1026", avanzado: false };

/** Simula el SDK: cada llamada consume la siguiente respuesta (texto o Error). */
function simulado(respuestas: (string | Error)[]) {
  const llamadas: { proveedor: string; cuerpo: Record<string, unknown> }[] = [];
  const fabrica = (p: Proveedor): ClienteChat => ({
    chat: {
      completions: {
        create: async (cuerpo) => {
          llamadas.push({ proveedor: p.id, cuerpo });
          const r = respuestas.shift();
          if (r instanceof Error) throw r;
          return { choices: [{ message: { content: r ?? "" } }], usage: { prompt_tokens: 10, completion_tokens: 5 } };
        },
      },
    },
  });
  return { fabrica, llamadas };
}

const Esquema = z.object({ dificultad: z.number().int().min(1).max(5) });

describe("llamarMuse", () => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});

  it("usa el modelo abierto para analizar y valida el JSON", async () => {
    const { fabrica, llamadas } = simulado(['{"dificultad": 3}']);
    const llamar = crearLlamador({ meta, abierto }, fabrica);
    const r = await llamar({ funcion: "analizar", sistema: "s", mensajes: [{ role: "user", content: "x" }], esquema: Esquema });
    expect(r.datos).toEqual({ dificultad: 3 });
    expect(r.proveedor).toBe("abierto");
    expect(llamadas[0].cuerpo.response_format).toEqual({ type: "json_object" });
    expect(llamadas[0].cuerpo.reasoning_effort).toBeUndefined();
  });

  it("usa Meta para el tutor con reasoning_effort alto y antepone las reglas comunes", async () => {
    const { fabrica, llamadas } = simulado(["¿Qué intentaste?"]);
    const llamar = crearLlamador({ meta, abierto }, fabrica);
    const r = await llamar({ funcion: "tutor", sistema: "Eres tutor", mensajes: [{ role: "user", content: "ayuda" }], idioma: "en" });
    expect(r.proveedor).toBe("meta");
    expect(r.datos).toBe("¿Qué intentaste?");
    expect(llamadas[0].cuerpo.reasoning_effort).toBe("high");
    const sistema = (llamadas[0].cuerpo.messages as { content: string }[])[0].content;
    expect(sistema).toContain("Nunca resuelves la tarea");
    expect(sistema).toContain("IDIOMA: en");
  });

  it("pide json_schema a Meta", async () => {
    const { fabrica, llamadas } = simulado(['{"dificultad": 2}']);
    const llamar = crearLlamador({ meta }, fabrica);
    await llamar({ funcion: "evaluar", sistema: "s", mensajes: [], esquema: Esquema });
    expect((llamadas[0].cuerpo.response_format as { type: string }).type).toBe("json_schema");
  });

  it("reintenta una vez si el JSON no cumple el esquema", async () => {
    const { fabrica, llamadas } = simulado(['{"dificultad": 9}', '```json\n{"dificultad": 4}\n```']);
    const llamar = crearLlamador({ abierto }, fabrica);
    const r = await llamar({ funcion: "analizar", sistema: "s", mensajes: [], esquema: Esquema });
    expect(r.datos.dificultad).toBe(4);
    expect(llamadas).toHaveLength(2);
  });

  it("pasa al respaldo si el proveedor principal falla", async () => {
    const { fabrica, llamadas } = simulado([new Error("503"), '{"dificultad": 1}']);
    const llamar = crearLlamador({ meta, abierto }, fabrica);
    const r = await llamar({ funcion: "planificar", sistema: "s", mensajes: [], esquema: Esquema });
    expect(llamadas.map((l) => l.proveedor)).toEqual(["abierto", "meta"]);
    expect(r.proveedor).toBe("meta");
  });

  it("falla con un error claro si no hay proveedores", async () => {
    const llamar = crearLlamador({}, simulado([]).fabrica);
    await expect(llamar({ funcion: "tutor", sistema: "s", mensajes: [] })).rejects.toThrow(/No hay proveedor/);
  });

  it("leer_cuaderno solo usa Meta (visión)", async () => {
    const llamar = crearLlamador({ abierto }, simulado([]).fabrica);
    await expect(llamar({ funcion: "leer_cuaderno", sistema: "s", mensajes: [] })).rejects.toThrow(/No hay proveedor/);
  });
});

describe("utilidades", () => {
  it("extraerJson limpia bloques de código y texto alrededor", () => {
    expect(extraerJson('Aquí está:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(() => extraerJson("sin json")).toThrow();
  });

  it("proveedoresDesdeEntorno solo incluye los configurados", () => {
    const p = proveedoresDesdeEntorno({ MODEL_API_KEY: "x", NODE_ENV: "test" } as NodeJS.ProcessEnv);
    expect(Object.keys(p)).toEqual(["meta"]);
    expect(p.meta?.modelo).toBe("muse-spark-1.3");
  });
});

describe("llamarMuseStream", () => {
  const flujo = (trozos: string[], falla = false) =>
    (async function* () {
      if (falla) throw new Error("503");
      for (const t of trozos) yield { choices: [{ delta: { content: t } }] };
    })();

  it("emite los trozos en orden", async () => {
    const llamar = crearLlamadorStream({ meta }, () => ({ chat: { completions: { create: async () => flujo(["Hola", " mundo"]) } } }));
    const salida: string[] = [];
    for await (const t of llamar({ funcion: "tutor", sistema: "s", mensajes: [] })) salida.push(t);
    expect(salida.join("")).toBe("Hola mundo");
  });

  it("pasa al respaldo si el proveedor falla antes del primer trozo", async () => {
    const usados: string[] = [];
    const llamar = crearLlamadorStream({ meta, abierto }, (p) => ({
      chat: { completions: { create: async () => (usados.push(p.id), flujo(["ok"], p.id === "meta")) } },
    }));
    const salida: string[] = [];
    for await (const t of llamar({ funcion: "tutor", sistema: "s", mensajes: [] })) salida.push(t);
    expect(usados).toEqual(["meta", "abierto"]);
    expect(salida).toEqual(["ok"]);
  });
});

describe("transcribirAudio", () => {
  const wav = new Blob([new Uint8Array(100)], { type: "audio/wav" });
  const env = { MODEL_API_KEY: "k", NODE_ENV: "test" } as NodeJS.ProcessEnv;
  const respuesta = (status: number, cuerpo: unknown) =>
    new Response(typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo), { status });

  it("envía el WAV con el modelo, los idiomas y las palabras clave", async () => {
    const llamadas: { url: string; ajustes: Record<string, unknown>; auth: string | null }[] = [];
    const falso = (async (url: string, init: RequestInit) => {
      const cuerpo = init.body as FormData;
      llamadas.push({
        url,
        ajustes: JSON.parse(await (cuerpo.get("request") as Blob).text()),
        auth: new Headers(init.headers).get("Authorization"),
      });
      return respuesta(200, { transcript: " porque resto 5 en los dos lados ", audioDurationMs: 2000 });
    }) as unknown as typeof fetch;
    const texto = await crearTranscriptor(env, falso)({ wav, idioma: "es", palabrasClave: ["despeje", " ", "ecuación"] });
    expect(texto).toBe("porque resto 5 en los dos lados");
    expect(llamadas[0].url).toBe("https://api.meta.ai/v1/asr/transcribe");
    expect(llamadas[0].auth).toBe("Bearer k");
    expect(llamadas[0].ajustes).toMatchObject({ model: "muse-voice-transcribe-1.0", audioEncoding: "WAV", languageBias: ["Spanish", "English"], keywords: ["despeje", "ecuación"] });
  });

  it("reintenta una vez si el servicio está saturado (429)", async () => {
    let n = 0;
    const falso = (async () => (++n === 1 ? respuesta(429, "lento") : respuesta(200, { transcript: "ok" }))) as unknown as typeof fetch;
    expect(await crearTranscriptor(env, falso)({ wav })).toBe("ok");
    expect(n).toBe(2);
  });

  it("no reintenta un audio inválido (400) y falla con un error claro", async () => {
    let n = 0;
    const falso = (async () => (n++, respuesta(400, "wav"))) as unknown as typeof fetch;
    await expect(crearTranscriptor(env, falso)({ wav })).rejects.toThrow(/No se pudo transcribir/);
    expect(n).toBe(1);
  });

  it("sin clave no llama a nadie", async () => {
    await expect(crearTranscriptor({} as NodeJS.ProcessEnv)({ wav })).rejects.toThrow(/MODEL_API_KEY/);
  });
});
