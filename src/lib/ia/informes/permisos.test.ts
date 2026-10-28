import { beforeEach, expect, it, vi } from "vitest";
import { informeMock, rutaMock } from "@/lib/mocks/informes";
const sesion = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db/sesion", () => ({ obtenerUsuarioActual: sesion }));
import { leerInforme } from "./servidor";
import { GET } from "@/app/api/docente/comprension/route";

beforeEach(() => sesion.mockReset());
it("rechaza una lectura de informe sin sesión", async () => {
  sesion.mockResolvedValue(null);
  await expect(leerInforme(informeMock.entrega_id)).rejects.toMatchObject({ status: 401 });
});
it("no usa un cliente privilegiado para leer informes y respeta una fila oculta por RLS", async () => {
  const consulta = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  const from = vi.fn().mockReturnValue(consulta);
  sesion.mockResolvedValue({ usuario: { rol: "estudiante" }, db: { from } });
  await expect(leerInforme(informeMock.entrega_id)).rejects.toMatchObject({ status: 404 });
  expect(consulta.eq).toHaveBeenCalledWith("entrega_id", informeMock.entrega_id);
});
it("valida identidad del informe y de la ruta almacenados", async () => {
  const consulta = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi
      .fn()
      .mockResolvedValue({ data: { informe: informeMock, ruta: { ...rutaMock, entrega_id: crypto.randomUUID() } }, error: null }),
  };
  sesion.mockResolvedValue({ usuario: { rol: "estudiante" }, db: { from: vi.fn().mockReturnValue(consulta) } });
  await expect(leerInforme(informeMock.entrega_id)).rejects.toThrow("identidad_invalida");
});
it("no permite que un estudiante consulte el mapa docente", async () => {
  const from = vi.fn();
  sesion.mockResolvedValue({ usuario: { rol: "estudiante" }, db: { from } });
  const respuesta = await GET(new Request("http://localhost/api/docente/comprension"));
  expect(respuesta.status).toBe(403);
  expect(from).not.toHaveBeenCalled();
});
it("rechaza un mapa sin autenticación antes de consultar la base", async () => {
  sesion.mockResolvedValue(null);
  expect((await GET(new Request("http://localhost/api/docente/comprension"))).status).toBe(401);
});
it("no consulta entregas ni informes de una clase ajena", async () => {
  const consulta = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  const from = vi.fn().mockReturnValue(consulta);
  sesion.mockResolvedValue({ usuario: { id: crypto.randomUUID(), rol: "docente" }, db: { from } });
  const respuesta = await GET(new Request(`http://localhost/api/docente/comprension?clase_id=${crypto.randomUUID()}`));
  expect(respuesta.status).toBe(404);
  expect(from.mock.calls.map((c) => c[0])).toEqual(["clases"]);
});
