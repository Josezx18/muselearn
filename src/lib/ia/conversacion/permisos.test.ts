import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ usuario: vi.fn(), admin: vi.fn() }));
vi.mock("@/lib/db/sesion", () => ({ obtenerUsuarioActual: mocks.usuario }));
vi.mock("@/lib/supabase/servidor", () => ({ crearClienteAdmin: mocks.admin }));
import { contextoEntrega, contextoTarea, estudianteActual } from "./servidor";
import { entregasMock, tareasMock } from "@/lib/mocks/tareas";

function baseDatos(filas: unknown[]) {
  const cadena = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
  cadena.select.mockReturnValue(cadena);
  cadena.eq.mockReturnValue(cadena);
  for (const data of filas) cadena.maybeSingle.mockResolvedValueOnce({ data, error: null });
  return { from: vi.fn(() => cadena), cadena };
}
describe("permisos del servidor T04", () => {
  beforeEach(() => vi.resetAllMocks());
  it("requiere sesión y rol estudiante", async () => {
    mocks.usuario.mockResolvedValueOnce(null).mockResolvedValueOnce({ usuario: { rol: "docente" } });
    await expect(estudianteActual()).rejects.toMatchObject({ status: 401 });
    await expect(estudianteActual()).rejects.toMatchObject({ status: 403 });
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("no crea cliente admin si la entrega no pertenece al estudiante", async () => {
    const db = baseDatos([null]);
    mocks.usuario.mockResolvedValue({ db, usuario: { id: "estudiante", rol: "estudiante" } });
    await expect(contextoEntrega(crypto.randomUUID())).rejects.toMatchObject({ status: 404 });
    expect(db.cadena.eq).toHaveBeenCalledWith("estudiante_id", "estudiante");
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("rechaza una tarea sin inscripción", async () => {
    const db = baseDatos([tareasMock[0], null]);
    mocks.usuario.mockResolvedValue({ db, usuario: { id: "estudiante", rol: "estudiante" } });
    await expect(contextoTarea(tareasMock[0].id)).rejects.toMatchObject({ status: 403 });
  });
  it("valida entrega, tarea e inscripción antes de dar permisos admin", async () => {
    const db = baseDatos([{ ...entregasMock[0], estado: "entregada" }, tareasMock[0], { clase_id: tareasMock[0].clase_id }]);
    mocks.usuario.mockResolvedValue({ db, usuario: { id: entregasMock[0].estudiante_id, rol: "estudiante" } });
    const ctx = await contextoEntrega(entregasMock[0].id);
    expect(ctx.entrega.id).toBe(entregasMock[0].id);
    expect(mocks.admin).toHaveBeenCalledOnce();
    expect(db.cadena.maybeSingle).toHaveBeenCalledTimes(3);
  });
});
