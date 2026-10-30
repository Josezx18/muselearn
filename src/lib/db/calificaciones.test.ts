import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Calificacion, EntradaCalificacion, EntradaDevolucion, entregaPermitida, guardarCalificacion, limpiarDevolucionPropia, devolverEntrega } from "./calificaciones";
import { tareaDelDocente } from "./gestion";
import { obtenerUsuarioActual } from "./sesion";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { GET, PUT } from "@/app/api/entregas/[id]/calificacion/route";
import { POST } from "@/app/api/entregas/[id]/devolver/route";

vi.mock("./gestion", () => ({ tareaDelDocente: vi.fn() }));
vi.mock("./sesion", () => ({ obtenerUsuarioActual: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteAdmin: vi.fn() }));
const id = "00000000-0000-4000-8000-000000000301";
const estudiante = { id: "00000000-0000-4000-8000-000000000011", rol: "estudiante" as const, nombre: "Ficticio", idioma: "es" as const };
const docente = { ...estudiante, id: "00000000-0000-4000-8000-000000000001", rol: "docente" as const };
const entrega = { id, tarea_id: "00000000-0000-4000-8000-000000000201", estudiante_id: estudiante.id, estado: "entregada", contenido_texto: "Original", adjuntos: [], entregada_en: null };
const registro = { entrega_id: id, docente_id: docente.id, nota: 82.25, devuelta: false, motivo_devolucion: null, actualizado_en: new Date().toISOString() };
function base(data: unknown = entrega, error: unknown = null) {
  const q = {
    select: vi.fn(() => q), eq: vi.fn(() => q), upsert: vi.fn((datos: unknown, opciones: unknown) => { void datos; void opciones; return q; }), update: vi.fn(() => q),
    maybeSingle: vi.fn(async () => ({ data, error })), single: vi.fn(async () => ({ data, error })),
    then: (resolve: (r: { error: unknown }) => unknown) => Promise.resolve({ error }).then(resolve),
  };
  const db = { from: vi.fn(() => q), rpc: vi.fn(async () => ({ data, error })) };
  return { db: db as unknown as SupabaseClient, q, rpc: db.rpc };
}
beforeEach(() => vi.clearAllMocks());
describe("calificaciones y pertenencia", () => {
  it("acepta extremos, centésimas y borrar la nota; rechaza entradas ambiguas", () => {
    for (const nota of [null, 0, 100, 82.25, 0.01]) expect(EntradaCalificacion.safeParse({ nota }).success).toBe(true);
    for (const nota of [-1, 100.01, 5.555, "80", NaN, Infinity, undefined]) expect(EntradaCalificacion.safeParse({ nota }).success).toBe(false);
    expect(EntradaCalificacion.safeParse({ nota: 50, devuelta: false }).success).toBe(false);
    expect(EntradaDevolucion.parse({ motivo: "  Revisa los pasos  " }).motivo).toBe("Revisa los pasos");
    for (const motivo of [" ", "x".repeat(1001), null]) expect(EntradaDevolucion.safeParse({ motivo }).success).toBe(false);
    expect(Calificacion.parse(registro).nota).toBe(82.25);
  });
  it("el estudiante solo lee su propia entrega y nunca escribe", async () => {
    const { db } = base();
    expect(await entregaPermitida(db, estudiante, id)).toMatchObject({ id });
    expect(await entregaPermitida(db, { ...estudiante, id: docente.id }, id)).toBeNull();
    expect(await entregaPermitida(db, estudiante, id, true)).toBeNull();
    expect(tareaDelDocente).not.toHaveBeenCalled();
  });
  it("el docente debe ser dueño de la tarea; entrega inexistente o id inválido se ocultan", async () => {
    vi.mocked(tareaDelDocente).mockResolvedValue(null);
    expect(await entregaPermitida(base().db, docente, id, true)).toBeNull();
    vi.mocked(tareaDelDocente).mockResolvedValue({} as Awaited<ReturnType<typeof tareaDelDocente>>);
    expect(await entregaPermitida(base().db, docente, id, true)).toMatchObject({ id });
    expect(await entregaPermitida(base(null).db, docente, id)).toBeNull();
    const { db } = base();
    expect(await entregaPermitida(db, docente, "inválido")).toBeNull();
    expect(db.from).not.toHaveBeenCalled();
  });
  it("guardar una nota conserva los campos de devolución", async () => {
    const { db, q } = base(registro);
    await guardarCalificacion(db, docente.id, id, 82.25);
    expect(q.upsert).toHaveBeenCalledWith(expect.objectContaining({ nota: 82.25 }), { onConflict: "entrega_id" });
    expect(q.upsert.mock.calls[0][0]).not.toHaveProperty("devuelta");
  });
  it("devuelve mediante una única RPC y propaga sus errores", async () => {
    const { db, rpc } = base({ ...registro, devuelta: true, motivo_devolucion: "Revisa" });
    expect(await devolverEntrega(db, docente.id, id, " Revisa ")).toMatchObject({ devuelta: true });
    expect(rpc).toHaveBeenCalledWith("devolver_entrega", { p_entrega_id: id, p_docente_id: docente.id, p_motivo: "Revisa" });
    await expect(devolverEntrega(base(null, new Error("fallo")).db, docente.id, id, "Revisa")).rejects.toThrow("fallo");
  });
  it("solo limpia una devolución después de una nueva entrega del mismo estudiante", async () => {
    const { db, q } = base(entrega);
    await limpiarDevolucionPropia(db, id, estudiante.id);
    expect(q.update).toHaveBeenCalledWith(expect.objectContaining({ devuelta: false, motivo_devolucion: null }));
    for (const data of [{ ...entrega, estado: "pendiente" }, { ...entrega, estudiante_id: docente.id }]) {
      const fake = base(data);
      await expect(limpiarDevolucionPropia(fake.db, id, estudiante.id)).rejects.toThrow("entrega_no_permitida");
      expect(fake.q.update).not.toHaveBeenCalled();
    }
  });
});

describe("endpoints T09", () => {
  const contexto = { params: Promise.resolve({ id }) };
  const request = (body: unknown) => new Request("http://localhost/api/entregas/" + id, { method: "POST", body: JSON.stringify(body) });
  function sesion(usuario = docente, db = base().db) {
    vi.mocked(obtenerUsuarioActual).mockResolvedValue({ usuario, db } as NonNullable<Awaited<ReturnType<typeof obtenerUsuarioActual>>>);
  }
  it("requiere sesión y nunca crea admin para solicitudes sin permiso", async () => {
    vi.mocked(obtenerUsuarioActual).mockResolvedValue(null);
    expect((await GET(request(null), contexto)).status).toBe(401);
    expect((await PUT(request({ nota: 50 }), contexto)).status).toBe(401);
    expect((await POST(request({ motivo: "Revisa" }), contexto)).status).toBe(401);
    sesion();
    vi.mocked(tareaDelDocente).mockResolvedValue(null);
    expect((await POST(request({ motivo: "Revisa" }), contexto)).status).toBe(404);
    expect(crearClienteAdmin).not.toHaveBeenCalled();
  });
  it("rechaza JSON inválido y motivos vacíos antes de usar admin", async () => {
    sesion();
    vi.mocked(tareaDelDocente).mockResolvedValue({} as Awaited<ReturnType<typeof tareaDelDocente>>);
    expect((await PUT(request({ nota: 101 }), contexto)).status).toBe(400);
    expect((await POST(request({ motivo: " " }), contexto)).status).toBe(400);
    expect(crearClienteAdmin).not.toHaveBeenCalled();
  });
  it("devuelve tras autorizar al docente y responde con el contrato validado", async () => {
    sesion();
    vi.mocked(tareaDelDocente).mockResolvedValue({} as Awaited<ReturnType<typeof tareaDelDocente>>);
    const admin = base({ ...registro, devuelta: true, motivo_devolucion: "Revisa" });
    vi.mocked(crearClienteAdmin).mockReturnValue(admin.db);
    const respuesta = await POST(request({ motivo: "Revisa" }), contexto);
    expect(respuesta.status).toBe(200);
    expect(Calificacion.parse(await respuesta.json())).toMatchObject({ devuelta: true, nota: 82.25 });
    expect(admin.rpc).toHaveBeenCalledOnce();
  });
  it("los errores de persistencia se traducen a 500", async () => {
    sesion(docente, base(null, new Error("BD")).db);
    expect((await GET(request(null), contexto)).status).toBe(500);
  });
});
