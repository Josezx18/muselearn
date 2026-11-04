import { describe, expect, it } from "vitest";
import { calcularCosto, precio } from "./precios";

describe("precios de la IA", () => {
  it("acepta coma decimal, signo de dólar y la palabra USD", () => {
    expect(precio("1.25")).toBe(1.25);
    expect(precio("1,25")).toBe(1.25);
    expect(precio("$4.25")).toBe(4.25);
    expect(precio(" 4,25 USD ")).toBe(4.25);
    expect(precio("")).toBeNull();
    expect(precio("gratis")).toBeNull();
  });
  it("calcula el costo por millón de tokens", () => {
    const env = { PRECIO_ABIERTO_ENTRADA: "1,25", PRECIO_ABIERTO_SALIDA: "4.25" } as unknown as NodeJS.ProcessEnv;
    expect(calcularCosto("abierto", 1_000_000, 1_000_000, env)).toBeCloseTo(5.5);
    expect(calcularCosto("abierto", 0, 0, env)).toBe(0);
    expect(calcularCosto("meta", 10, 10, env)).toBeNull();
  });
});
