import { describe, expect, it } from "vitest";
import { cortarFrases } from "./voz-frases";

describe("frases incrementales", () => {
  it("emite antes del fin y conserva el resto", () => {
    expect(cortarFrases("Hola. ¿Qué piensas")).toEqual({ frases: ["Hola."], resto: " ¿Qué piensas" });
  });
  it("protege decimales repartidos y abreviaturas", () => {
    expect(cortarFrases("El Dr. usa 2.").frases).toEqual([]);
    expect(cortarFrases("El Dr. usa 2.5. Sigue").frases).toEqual(["El Dr. usa 2.5."]);
  });
  it("corta signos, saltos y restos al cerrar", () => {
    expect(cortarFrases("¿Sí? ¡Bien! Espera…\nAhora", true).frases).toEqual(["¿Sí?", "¡Bien!", "Espera…", "Ahora"]);
  });
  it("limita párrafos y palabras largas", () => {
    for (const texto of ["palabra ".repeat(100), "a".repeat(500)]) {
      const frases = cortarFrases(texto, true).frases;
      expect(frases.every(f => f.length <= 140)).toBe(true);
      expect(frases.join("").replace(/\s/g, "")).toBe(texto.replace(/\s/g, ""));
    }
  });
  it("lee variables al final de frase y conserva abreviaturas comunes", () => {
    expect(cortarFrases("Mira la x. Sigue").frases).toEqual(["Mira la x."]);
    expect(cortarFrases("Mira la pág. 2. Sigue").frases).toEqual(["Mira la pág. 2."]);
  });
  it("conserva frases cuando cada carácter llega por separado", () => {
    let resto = "";
    const frases: string[] = [];
    for (const letra of "El Dr. usa 2.5. ¿Lo ves? Sí…\nÚltimo") {
      const corte = cortarFrases(resto + letra);
      frases.push(...corte.frases);
      resto = corte.resto;
    }
    frases.push(...cortarFrases(resto, true).frases);
    expect(frases).toEqual(["El Dr. usa 2.5.", "¿Lo ves?", "Sí…", "Último"]);
  });
});
