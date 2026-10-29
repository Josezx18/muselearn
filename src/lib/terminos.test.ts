import { describe, expect, it } from "vitest";
import { TERMINOS_VERSION, debeAceptarTerminos } from "./terminos";

describe("términos", () => {
  it("pide aceptar si nunca aceptó o si aceptó una versión anterior", () => {
    expect(debeAceptarTerminos(null)).toBe(true);
    expect(debeAceptarTerminos("2020-01-01")).toBe(true);
    expect(debeAceptarTerminos(TERMINOS_VERSION)).toBe(false);
  });
});
