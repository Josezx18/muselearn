import { describe, expect, it } from "vitest";
import { ALFABETO_CODIGO, esCodigoValido, generarCodigo, normalizarCodigo } from "./codigos";

describe("generarCodigo", () => {
  it("genera 6 caracteres sin O, 0, I ni 1", () => {
    for (let i = 0; i < 500; i++) {
      const c = generarCodigo();
      expect(c).toHaveLength(6);
      expect(c).toMatch(/^[A-Z2-9]{6}$/);
      expect(c).not.toMatch(/[O0I1]/);
      expect(esCodigoValido(c)).toBe(true);
    }
  });
  it("el alfabeto tiene 32 símbolos únicos", () => {
    expect(new Set(ALFABETO_CODIGO).size).toBe(32);
  });
  it("es determinista con una fuente de bytes dada", () => {
    expect(generarCodigo(() => new Uint8Array([0, 1, 2, 3, 4, 5]))).toBe("ABCDEF");
  });
  it("no repite códigos en una muestra grande", () => {
    const vistos = new Set(Array.from({ length: 2000 }, () => generarCodigo()));
    expect(vistos.size).toBeGreaterThan(1990);
  });
});

describe("normalizarCodigo", () => {
  it("quita espacios y guiones y pasa a mayúsculas", () => {
    expect(normalizarCodigo(" mat-4 kq ")).toBe("MAT4KQ");
  });
});

describe("esCodigoValido", () => {
  it("rechaza longitud incorrecta y caracteres prohibidos", () => {
    expect(esCodigoValido("ABC")).toBe(false);
    expect(esCodigoValido("ABCDE0")).toBe(false);
    expect(esCodigoValido("ABCDEI")).toBe(false);
    expect(esCodigoValido("MAT4KQ")).toBe(true);
  });
});
