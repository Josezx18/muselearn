import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { crearLlamador, extraerJson, proveedoresDesdeEntorno, type ClienteChat, type Proveedor } from "./cliente";

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
