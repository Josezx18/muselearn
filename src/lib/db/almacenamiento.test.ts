import { describe, expect, it } from "vitest";
import { MAX_BYTES_ADJUNTO, nombreSeguro, prefijoEntrega, rutasDeEntregaValidas, validarArchivo } from "./almacenamiento";
import { EntradaEntrega, NuevaTarea } from "./validacion-tareas";

const TAREA = "11111111-1111-4111-8111-111111111111";
const YO = "22222222-2222-4222-8222-222222222222";
const OTRO = "33333333-3333-4333-8333-333333333333";

describe("nombreSeguro", () => {
  it("quita acentos, espacios y rutas", () => {
    expect(nombreSeguro("Foto cuaderño (1).JPG")).toBe("Foto-cuaderno-1-.JPG");
    expect(nombreSeguro("../../secreto.pdf")).toBe("secreto.pdf");
    expect(nombreSeguro("")).toBe("archivo");
  });
});

describe("rutasDeEntregaValidas", () => {
  it("acepta solo archivos de la carpeta del propio estudiante en esa tarea", () => {
    const mia = { ruta: `${prefijoEntrega(TAREA, YO)}abc-foto.jpg` };
    expect(rutasDeEntregaValidas([mia], TAREA, YO)).toBe(true);
    expect(rutasDeEntregaValidas([], TAREA, YO)).toBe(true);
  });

  it("rechaza rutas inventadas, de otro estudiante o con ..", () => {
    expect(rutasDeEntregaValidas([{ ruta: "local/foto.jpg" }], TAREA, YO)).toBe(false);
    expect(rutasDeEntregaValidas([{ ruta: `${prefijoEntrega(TAREA, OTRO)}x.jpg` }], TAREA, YO)).toBe(false);
    expect(rutasDeEntregaValidas([{ ruta: `${prefijoEntrega(TAREA, YO)}../${OTRO}/x.jpg` }], TAREA, YO)).toBe(false);
  });
});

describe("validarArchivo", () => {
  const archivo = (bytes: number, tipo: string) => new File([new Uint8Array(bytes)], "a", { type: tipo });

  it("valida presencia, tamaño y tipo", () => {
    expect(validarArchivo(null)).toBe("archivo_faltante");
    expect(validarArchivo("texto")).toBe("archivo_faltante");
    expect(validarArchivo(archivo(0, "image/jpeg"))).toBe("archivo_faltante");
    expect(validarArchivo(archivo(MAX_BYTES_ADJUNTO + 1, "image/jpeg"))).toBe("archivo_grande");
    expect(validarArchivo(archivo(10, "application/zip"))).toBe("tipo_invalido");
    expect(validarArchivo(archivo(10, "image/jpeg"))).toBeNull();
    expect(validarArchivo(archivo(10, "application/pdf"))).toBeNull();
  });
});

describe("esquemas de T02", () => {
  it("EntradaEntrega exige un uuid y limita adjuntos", () => {
    expect(EntradaEntrega.safeParse({ tarea_id: "x" }).success).toBe(false);
    const ok = EntradaEntrega.parse({ tarea_id: TAREA });
    expect(ok).toEqual({ tarea_id: TAREA, contenido_texto: "", adjuntos: [], entregada_externamente: false });
    const muchos = Array.from({ length: 9 }, () => ({ nombre: "a", ruta: "r", tipo_mime: "image/jpeg" }));
    expect(EntradaEntrega.safeParse({ tarea_id: TAREA, adjuntos: muchos }).success).toBe(false);
  });

  it("NuevaTarea rechaza fechas que no son ISO", () => {
    const base = { clase_id: TAREA, titulo: "T", instrucciones: "", fecha_entrega: "2026-11-03T22:00:00.000Z" };
    expect(NuevaTarea.safeParse(base).success).toBe(true);
    expect(NuevaTarea.safeParse({ ...base, fecha_entrega: "mañana" }).success).toBe(false);
  });
});

describe("dónde se entrega la tarea", () => {
  const TAREA_ID = "00000000-0000-4000-8000-000000000201";
  const base = { clase_id: TAREA_ID, titulo: "T", instrucciones: "", fecha_entrega: "2026-11-03T22:00:00.000Z" };
  it("por defecto en MuseLearn y sin enlace", () => {
    const t = NuevaTarea.parse(base);
    expect(t.modalidad).toBe("muselearn");
    expect(t.enlace_externo).toBeNull();
  });
  it("acepta Classroom con enlace https y rechaza enlaces raros", () => {
    expect(NuevaTarea.safeParse({ ...base, modalidad: "classroom", enlace_externo: "https://classroom.google.com/c/123" }).success).toBe(true);
    expect(NuevaTarea.safeParse({ ...base, modalidad: "otra", enlace_externo: "javascript:alert(1)" }).success).toBe(false);
    expect(NuevaTarea.safeParse({ ...base, modalidad: "moodle" }).success).toBe(false);
  });
});
