import { beforeEach, expect, it, vi } from "vitest";
import { entregasMock } from "@/lib/mocks/tareas";
import { sesionVerificacionMock } from "@/lib/mocks/conversacion";
const m = vi.hoisted(() => ({ contexto: vi.fn(), siguiente: vi.fn() }));
vi.mock("./servidor", () => ({ contextoEntrega: m.contexto, comprobarEscritura: (r: { error: unknown }) => { if (r.error) throw r.error; } }));
vi.mock("./verificador", () => ({ contenidoEntrega: vi.fn(), siguientePregunta: m.siguiente }));
vi.mock("@/lib/db/limites", () => ({ LIMITES: { verificaciones: 10 }, verificacionesHoy: vi.fn(async () => 0) }));
import { POST } from "@/app/api/verificacion/iniciar/route";
const entrega = { ...entregasMock[0], estado: "entregada", entregada_en: "2026-10-29T12:00:00Z" };
const previa = { ...sesionVerificacionMock, estado: "en_curso", creada_en: "2026-10-29T12:01:00Z" };
function preparar(fecha: string) {
  const cadena = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn(async () => ({ data: { ...previa, creada_en: fecha }, error: null })) };
  for (const f of [cadena.select, cadena.eq, cadena.order, cadena.limit]) f.mockReturnValue(cadena);
  const insert = vi.fn(async () => ({ error: null }));
  const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
  m.contexto.mockResolvedValue({ entrega, db: { from: () => cadena }, admin: { from: () => ({ insert, update }) }, usuario: { id: entrega.estudiante_id, idioma: "es" } });
  return { insert, update };
}
const request = () => new Request("http://localhost/api/verificacion/iniciar", { method: "POST", body: JSON.stringify({ entrega_id: entrega.id }) });
beforeEach(() => { vi.clearAllMocks(); m.siguiente.mockResolvedValue(sesionVerificacionMock.preguntas[0]); });
it("reutiliza la sesión en curso del intento actual", async () => {
  const { insert } = preparar(previa.creada_en);
  const r = await POST(request());
  expect(r.status).toBe(200);
  expect((await r.json()).id).toBe(previa.id);
  expect(insert).not.toHaveBeenCalled();
});
it("crea otra sesión cuando se volvió a entregar después de la sesión anterior", async () => {
  const { insert, update } = preparar("2026-10-28T12:00:00Z");
  const r = await POST(request());
  expect(r.status).toBe(200);
  const nueva = await r.json();
  expect(nueva.id).not.toBe(previa.id);
  expect(nueva.entrega_id).toBe(entrega.id);
  expect(insert).toHaveBeenCalledWith(nueva);
  expect(update).toHaveBeenCalledWith({ estado: "verificando" });
});
