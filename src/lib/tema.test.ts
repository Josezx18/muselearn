import { describe, expect, it } from "vitest";
import { COLOR_BARRA, SCRIPT_TEMA, TEMAS, esTema } from "./tema";

describe("temas", () => {
  it("reconoce solo los tres temas", () => {
    expect(TEMAS).toEqual(["cuaderno", "meta", "muse"]);
    expect(esTema("muse")).toBe(true);
    expect(esTema("rosa")).toBe(false);
    expect(esTema(undefined)).toBe(false);
  });

  it("el script de <head> aplica el tema de la cookie y nunca inyecta otro valor", () => {
    const doc = { cookie: "otra=1; tema=muse", documentElement: { dataset: {} as Record<string, string> }, querySelector: () => null };
    new Function("document", SCRIPT_TEMA)(doc);
    expect(doc.documentElement.dataset.tema).toBe("muse");

    const malo = { ...doc, cookie: "tema=<script>", documentElement: { dataset: {} as Record<string, string> } };
    new Function("document", SCRIPT_TEMA)(malo);
    expect(malo.documentElement.dataset.tema).toBeUndefined();
    expect(Object.keys(COLOR_BARRA)).toEqual([...TEMAS]);
  });
});
