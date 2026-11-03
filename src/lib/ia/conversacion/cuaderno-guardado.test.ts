import { expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ llamar: vi.fn() }));
vi.mock("@/lib/ia/cliente", () => ({ llamarMuse: m.llamar }));
vi.mock("./servidor", () => ({ contextoEntrega: vi.fn() }));
import { contenidoEntrega } from "./verificador";

const foto = { nombre: "c.jpg", ruta: "entregas/t/e/c.jpg", tipo_mime: "image/jpeg" };
const ctx = { tarea: { id: "t" }, entrega: { id: "e", adjuntos: [foto] }, db: { storage: { from: vi.fn() } } } as never;

it("usa la lectura del cuaderno guardada en la sesión sin volver a llamar al modelo de visión", async () => {
  const r = await contenidoEntrega(ctx, "1: 2x+3=11");
  expect(r.cuaderno).toBe("1: 2x+3=11");
  expect(m.llamar).not.toHaveBeenCalled();
});

it("una lectura guardada vacía (entrega sin fotos legibles) también se reutiliza", async () => {
  const r = await contenidoEntrega(ctx, "");
  expect(r.cuaderno).toBe("");
  expect(m.llamar).not.toHaveBeenCalled();
});
