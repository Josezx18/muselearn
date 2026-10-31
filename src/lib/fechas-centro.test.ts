import { describe, expect, it } from "vitest";
import { diaCentro, formatearCentro } from "./fechas-centro";

describe("fechas del centro al renderizar en servidor y navegador", () => {
  it("una entrega de madrugada UTC pertenece al día anterior en RD", () => {
    expect(diaCentro("2026-10-31T02:30:00Z", -240)).toBe("2026-10-30");
    expect(formatearCentro("2026-10-31T02:30:00Z", "en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }, -240)).toBe("22:30");
  });
  it("respeta un centro con offset positivo y cambio de mes", () => {
    expect(diaCentro("2026-10-31T23:00:00Z", 330)).toBe("2026-11-01");
  });
});
