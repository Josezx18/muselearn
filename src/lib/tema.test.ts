import { describe, expect, it } from "vitest";
import { COLOR_BARRA, SCRIPT_TEMA, TEMAS, TEMA_POR_DEFECTO, esTema } from "./tema";

describe("temas", () => {
  it("reconoce solo los tres temas", () => {
    expect(TEMAS).toEqual(["cuaderno", "meta", "muse"]);
    expect(esTema("muse")).toBe(true);
    expect(esTema("rosa")).toBe(false);
    expect(esTema(undefined)).toBe(false);
    expect(TEMA_POR_DEFECTO).toBe("muse");
  });

  it("el script de <head> aplica el tema de la cookie y nunca inyecta otro valor", () => {
    const doc = { cookie: "otra=1; tema=muse", documentElement: { dataset: {} as Record<string, string> }, querySelector: () => null };
    new Function("document", SCRIPT_TEMA)(doc);
    expect(doc.documentElement.dataset.tema).toBe("muse");

    const cuaderno = { ...doc, cookie: "tema=cuaderno", documentElement: { dataset: { tema: "muse" } as Record<string, string> } };
    new Function("document", SCRIPT_TEMA)(cuaderno);
    expect(cuaderno.documentElement.dataset.tema).toBe("cuaderno");

    const malo = { ...doc, cookie: "tema=<script>", documentElement: { dataset: { tema: "muse" } as Record<string, string> } };
    new Function("document", SCRIPT_TEMA)(malo);
    expect(malo.documentElement.dataset.tema).toBe("muse");
    expect(Object.keys(COLOR_BARRA)).toEqual([...TEMAS]);
  });
});
