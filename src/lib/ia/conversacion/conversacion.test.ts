import { describe, expect, it, vi, beforeEach } from "vitest";
import { codificarWav } from "@/components/verificacion/wav";
import { validarWav } from "./voz";
import { EntradaRespuesta, EntradaTutor } from "./validacion";
import { tareasMock } from "@/lib/mocks/tareas";

const llamada = vi.hoisted(() => vi.fn());
vi.mock("@/lib/ia/cliente", () => ({ llamarMuse: llamada }));
vi.mock("./servidor", () => ({}));
import { evaluar, generarRuta, siguientePregunta, validarEvidencias } from "./verificador";

describe("voz WAV", () => {
  it.each([24000, 44100, 48000])("codifica un segundo mono a 24kHz desde %i", async (frecuencia) => {
    const wav = await codificarWav(new Float32Array(frecuencia).fill(0.5), frecuencia).arrayBuffer();
    expect(wav.byteLength).toBe(48044);
    expect(() => validarWav(wav)).not.toThrow();
    expect(new DataView(wav).getInt16(44, true)).toBe(16384);
  });
  it("rechaza webm y estéreo y recorta muestras fuera de rango", async () => {
    expect(() => validarWav(new ArrayBuffer(100))).toThrow();
    const wav = await codificarWav(new Float32Array([-3, 3]), 24000).arrayBuffer();
    expect(new DataView(wav).getInt16(44, true)).toBe(-32768);
    new DataView(wav).setUint16(22, 2, true);
    expect(() => validarWav(wav)).toThrow();
  });
});

describe("contratos de conversación", () => {
  it("rechaza mensajes vacíos, IDs inválidos y vías desconocidas", () => {
    expect(EntradaTutor.safeParse({ tarea_id: tareasMock[0].id, mensaje: "  " }).success).toBe(false);
    expect(EntradaRespuesta.safeParse({ sesion_id: "otra", pregunta_id: "p1", respuesta: "a", via: "audio" }).success).toBe(false);
  });
});

describe("verificador", () => {
  beforeEach(() => llamada.mockReset());
  it("asigna IDs y borra respuestas que el modelo haya inventado", async () => {
    llamada.mockResolvedValue({
      datos: { id: "inventado", texto: "¿Por qué restaste 5?", concepto: "Inversas", respuesta: "inventada", via: "texto" },
    });
    const pregunta = await siguientePregunta({}, [], "es");
    expect(pregunta).toMatchObject({ id: "p1", respuesta: null, via: null });
    expect(llamada.mock.calls[0][0].funcion).toBe("verificar");
  });
  it.each([1, 4] as const)("conserva el nivel %i y fija identidad del informe en el servidor", async (nivel) => {
    llamada.mockResolvedValue({
      datos: {
        entrega_id: crypto.randomUUID(),
        nivel_global: nivel,
        por_concepto: [{ concepto: "Inversas", competencia: null, nivel, evidencia: nivel === 4 ? "Resto 5 en ambos lados" : "No sé" }],
        fortalezas: [],
        debilidades: [],
        resumen_estudiante: "Sigue practicando.",
        resumen_docente: "Evaluación de respuestas.",
        generado_en: new Date().toISOString(),
      },
    });
    const id = crypto.randomUUID();
    const informe = await evaluar(
      {},
      [{ id: "p1", texto: "¿Por qué?", concepto: "Inversas", respuesta: nivel === 4 ? "Resto 5 en ambos lados" : "No sé", via: "texto" }],
      id,
      "es",
    );
    expect(informe.entrega_id).toBe(id);
    expect(informe.nivel_global).toBe(nivel);
    const ruta = await generarRuta(informe, tareasMock[0], "es");
    expect(ruta.entrega_id).toBe(id);
    expect(ruta.pasos.length).toBeGreaterThan(0);
    expect(() => validarEvidencias(informe, [])).toThrow("evidencia_no_verificable");
  });
});
