import { describe, expect, it, vi } from "vitest";
import type { DetalleEntrega, InformeComprension } from "@/types/contratos";
import { crearLlamador, type ClienteChat, type Proveedor } from "../cliente";
import {
  SinDatosRepaso,
  borradorComentario,
  proponerTarea,
  resumirComprension,
  sugerirRepaso,
} from ".";

const meta: Proveedor = {
  id: "meta",
  baseURL: "https://api.meta.ai/v1",
  apiKey: "k",
  modelo: "muse-spark-1.3",
  avanzado: true,
};
const clase = {
  nombre: "Matemática 4to A",
  materia: "Matemática",
  grado: "4to",
};
const E1 = "00000000-0000-4000-8000-000000000001";
const E2 = "00000000-0000-4000-8000-000000000002";
const E3 = "00000000-0000-4000-8000-000000000003";
const ENT = "00000000-0000-4000-8000-0000000000e1";

function simulado(respuestas: string[]) {
  const llamadas: Record<string, unknown>[] = [];
  const fabrica = (): ClienteChat => ({
    chat: {
      completions: {
        create: async (cuerpo) => {
          llamadas.push(cuerpo);
          return {
            choices: [{ message: { content: respuestas.shift() ?? "" } }],
            usage: {},
          };
        },
      },
    },
  });
  return { llamar: crearLlamador({ meta }, fabrica), llamadas };
}

const textoUsuario = (llamadas: Record<string, unknown>[]) =>
  ((llamadas[0].messages as { role: string; content: string }[]).find(
    (m) => m.role === "user",
  )?.content ?? "") as string;
const textoSistema = (llamadas: Record<string, unknown>[]) =>
  ((llamadas[0].messages as { role: string; content: string }[])[0].content ??
    "") as string;

function informe(
  nivel: 1 | 2 | 3 | 4,
  concepto: string,
  fecha: string,
  evidencia = "dijo algo",
): InformeComprension {
  return {
    entrega_id: ENT,
    nivel_global: nivel,
    por_concepto: [{ concepto, competencia: null, nivel, evidencia }],
    fortalezas: [],
    debilidades: [],
    resumen_estudiante: "",
    resumen_docente: "",
    generado_en: fecha,
  };
}

vi.spyOn(console, "info").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

describe("proponerTarea", () => {
  it("devuelve una propuesta válida y usa la función 'docente' con el tema del docente", async () => {
    const propuesta = {
      titulo: "Ecuaciones con fracciones",
      instrucciones:
        "1. Resuelve en tu cuaderno: 2x/3 + 1 = 5\n2. Explica el primer paso.",
      competencias: ["Resuelve ecuaciones de primer grado con fracciones"],
      nivel_ayuda: "pistas",
      minutos_estimados: 40,
      razon: "Practica lo visto en clase.",
    };
    const { llamar, llamadas } = simulado([JSON.stringify(propuesta)]);
    const r = await proponerTarea(
      clase,
      { tema: "ecuaciones con fracciones", detalles: "5 ejercicios" },
      { llamar },
    );
    expect(r).toEqual(propuesta);
    expect(textoUsuario(llamadas)).toContain("ecuaciones con fracciones");
    expect(textoUsuario(llamadas)).toContain("<clase>");
    expect(textoSistema(llamadas)).toContain("DOCENTE");
    expect((llamadas[0].response_format as { type: string }).type).toBe(
      "json_schema",
    );
  });

  it("si el modelo devuelve algo fuera del esquema, reintenta y luego falla", async () => {
    const { llamar } = simulado(['{"titulo": ""}', '{"titulo": ""}']);
    await expect(
      proponerTarea(clase, { tema: "fotosíntesis" }, { llamar }),
    ).rejects.toThrow();
  });
});

describe("resumirComprension", () => {
  it("cuenta el informe más reciente de cada estudiante y ordena por estudiantes en niveles bajos", () => {
    const r = resumirComprension([
      {
        estudiante_id: E1,
        informe: informe(
          1,
          "Despejar x",
          "2026-10-01T10:00:00Z",
          "no supo despejar",
        ),
      },
      {
        estudiante_id: E1,
        informe: informe(3, "Despejar x", "2026-10-05T10:00:00Z"),
      }, // más reciente: cuenta este
      {
        estudiante_id: E2,
        informe: informe(
          2,
          "Despejar x",
          "2026-10-02T10:00:00Z",
          "confundió signos",
        ),
      },
      {
        estudiante_id: E2,
        informe: informe(
          1,
          "Fracciones",
          "2026-10-02T10:00:00Z",
          "sumó denominadores",
        ),
      },
      {
        estudiante_id: E3,
        informe: informe(
          2,
          "Fracciones",
          "2026-10-02T10:00:00Z",
          "no simplificó",
        ),
      },
    ]);
    expect(r.map((c) => c.concepto)).toEqual(["Fracciones", "Despejar x"]);
    expect(r[0].niveles).toEqual([1, 1, 0, 0]);
    expect(r[1].niveles).toEqual([0, 1, 1, 0]);
    expect(r[1].dificultades).toEqual(["confundió signos"]);
  });
});

describe("sugerirRepaso", () => {
  it("envía solo datos agregados, sin ids ni nombres de estudiantes", async () => {
    const salida = {
      resumen: "Repasar fracciones.",
      actividades: [
        {
          concepto: "Fracciones",
          por_que: "2 de 3",
          actividad: "Ejercicio guiado",
          minutos: 15,
          agrupacion: "grupos",
        },
      ],
    };
    const { llamar, llamadas } = simulado([JSON.stringify(salida)]);
    const r = await sugerirRepaso(
      clase,
      [
        {
          estudiante_id: E1,
          informe: informe(1, "Fracciones", "2026-10-02T10:00:00Z"),
        },
      ],
      { llamar },
    );
    expect(r.actividades[0].agrupacion).toBe("grupos");
    expect(textoUsuario(llamadas)).not.toContain(E1);
    expect(textoUsuario(llamadas)).toContain('"estudiantes_con_informe":1');
  });

  it("sin informes no llama al modelo", async () => {
    const { llamar, llamadas } = simulado([]);
    await expect(sugerirRepaso(clase, [], { llamar })).rejects.toBeInstanceOf(
      SinDatosRepaso,
    );
    expect(llamadas).toHaveLength(0);
  });
});

describe("borradorComentario", () => {
  it("usa la entrega, la verificación y el informe, y devuelve el texto", async () => {
    const detalle: DetalleEntrega = {
      entrega: {
        id: ENT,
        tarea_id: "00000000-0000-4000-8000-0000000000a1",
        estudiante_id: E1,
        contenido_texto: "x = 4 porque resté 5",
        adjuntos: [],
        estado: "verificada",
        entregada_en: "2026-10-02T10:00:00Z",
      },
      estudiante: { id: E1, rol: "estudiante", nombre: "Camila", idioma: "es" },
      adjuntos: [],
      preguntas: [
        {
          id: "p1",
          texto: "¿Por qué restaste 5?",
          concepto: "Despejar x",
          respuesta: "para dejar la x sola",
          via: "voz",
        },
      ],
      informe: informe(3, "Despejar x", "2026-10-02T10:00:00Z"),
      comentario: null,
    };
    const { llamar, llamadas } = simulado([
      JSON.stringify({ texto: "Muy bien explicado el primer paso." }),
    ]);
    const r = await borradorComentario(
      { titulo: "Ecuaciones", instrucciones: "Resuelve", competencias: [] },
      detalle,
      { llamar },
    );
    expect(r.texto).toBe("Muy bien explicado el primer paso.");
    const usuario = textoUsuario(llamadas);
    expect(usuario).toContain("para dejar la x sola");
    expect(usuario).not.toContain("Camila");
  });
});
