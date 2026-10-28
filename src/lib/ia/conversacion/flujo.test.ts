import { beforeEach, describe, expect, it, vi } from "vitest";
import { informeMock } from "@/lib/mocks/informes";
import { tareasMock, entregasMock } from "@/lib/mocks/tareas";
import { sesionVerificacionMock } from "@/lib/mocks/conversacion";
const m = vi.hoisted(() => ({
  estudiante: vi.fn(),
  contexto: vi.fn(),
  contenido: vi.fn(),
  evaluar: vi.fn(),
  ruta: vi.fn(),
  siguiente: vi.fn(),
}));
vi.mock("./servidor", () => ({
  estudianteActual: m.estudiante,
  contextoEntrega: m.contexto,
  comprobarEscritura: (r: { error: unknown }) => {
    if (r.error) throw r.error;
  },
}));
vi.mock("./verificador", () => ({
  contenidoEntrega: m.contenido,
  evaluar: m.evaluar,
  generarRuta: m.ruta,
  siguientePregunta: m.siguiente,
}));
import { POST } from "@/app/api/verificacion/responder/route";

function dbSimulada(resultados: { data: unknown; error: unknown }[]) {
  const operaciones: { tabla: string; metodo: string; valor: unknown }[] = [];
  const siguiente = () => Promise.resolve(resultados.shift() ?? { data: null, error: null });
  return {
    operaciones,
    from(tabla: string) {
      const cadena = {
        select(valor: unknown) {
          operaciones.push({ tabla, metodo: "select", valor });
          return cadena;
        },
        eq(campo: string, valor: unknown) {
          operaciones.push({ tabla, metodo: `eq:${campo}`, valor });
          return cadena;
        },
        update(valor: unknown) {
          operaciones.push({ tabla, metodo: "update", valor });
          return cadena;
        },
        upsert(valor: unknown) {
          operaciones.push({ tabla, metodo: "upsert", valor });
          return cadena;
        },
        maybeSingle: siguiente,
        then(resolve: (valor: { data: unknown; error: unknown }) => unknown, reject: (error: unknown) => unknown) {
          return siguiente().then(resolve, reject);
        },
      };
      return cadena;
    },
  };
}
const ok = (data: unknown = null) => ({ data, error: null });
const sesion = {
  ...sesionVerificacionMock,
  estado: "en_curso",
  preguntas: sesionVerificacionMock.preguntas.map((p, i) => (i === 2 ? { ...p, respuesta: null, via: null } : p)),
};
const entrada = { sesion_id: sesion.id, pregunta_id: "p3", respuesta: "Sustituyo en la ecuación.", via: "texto" };
const request = (datos = entrada) =>
  new Request("http://localhost/api/verificacion/responder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

describe("cierre y recuperación de verificación", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.evaluar.mockResolvedValue(informeMock);
    m.ruta.mockResolvedValue({ pasos: [] });
  });
  function preparar(lecturas: { data: unknown; error: unknown }[], escrituras: { data: unknown; error: unknown }[] = []) {
    const db = dbSimulada(lecturas);
    const admin = dbSimulada(escrituras);
    m.estudiante.mockResolvedValue({ db });
    m.contexto.mockResolvedValue({ db, admin, entrega: entregasMock[0], tarea: tareasMock[0], usuario: { idioma: "es" } });
    return { db, admin };
  }
  it("rechaza respuestas fuera de turno sin llamar al modelo ni escribir", async () => {
    const { admin } = preparar([ok(sesion), ok()]);
    expect((await POST(request({ ...entrada, pregunta_id: "p1" }))).status).toBe(409);
    expect(m.evaluar).not.toHaveBeenCalled();
    expect(admin.operaciones).toEqual([]);
  });
  it("guarda la tercera respuesta, el informe y la ruta antes de completar", async () => {
    const { admin } = preparar([ok(sesion), ok()], [ok({ id: sesion.id }), ok(), ok(), ok()]);
    const respuesta = await POST(request());
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ informe: informeMock });
    expect(m.evaluar.mock.calls[0][1][2].respuesta).toBe(entrada.respuesta);
    expect(admin.operaciones).toContainEqual({
      tabla: "informes",
      metodo: "upsert",
      valor: { entrega_id: entregasMock[0].id, informe: informeMock, ruta: { pasos: [] } },
    });
    expect(admin.operaciones).toContainEqual({ tabla: "entregas", metodo: "update", valor: { estado: "verificada" } });
    expect(admin.operaciones.at(-2)).toEqual({ tabla: "sesiones_verificacion", metodo: "update", valor: { estado: "completada" } });
  });
  it("no guarda informe si otra petición ya cambió la sesión", async () => {
    const { admin } = preparar([ok(sesion), ok()], [ok()]);
    expect((await POST(request())).status).toBe(409);
    expect(m.evaluar).not.toHaveBeenCalled();
    expect(admin.operaciones.some((o) => o.tabla === "informes")).toBe(false);
  });
  it("recupera un informe guardado tras un cierre interrumpido sin evaluar otra vez", async () => {
    preparar([ok(sesion), ok({ informe: informeMock })], [ok(), ok()]);
    const respuesta = await POST(request());
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ informe: informeMock });
    expect(m.evaluar).not.toHaveBeenCalled();
  });
  it("admite reintentar la tercera respuesta guardada cuando falla la evaluación", async () => {
    const reintento = {
      ...sesion,
      preguntas: sesion.preguntas.map((p, i) => (i === 2 ? { ...p, respuesta: entrada.respuesta, via: "texto" } : p)),
    };
    preparar([ok(reintento), ok()], [ok({ id: sesion.id }), ok(), ok(), ok()]);
    expect((await POST(request())).status).toBe(200);
    expect(m.evaluar).toHaveBeenCalledOnce();
  });
});
