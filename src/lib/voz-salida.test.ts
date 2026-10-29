import { describe, expect, it } from "vitest";
import { puntuarVoz, textoParaVoz } from "./voz-salida";

describe("voz del tutor", () => {
  it("prefiere voces naturales y el español de América", () => {
    const voces = [
      { name: "Microsoft Helena - Spanish (Spain)", lang: "es-ES" },
      { name: "Google español de Estados Unidos", lang: "es-US" },
      { name: "Microsoft Dalia Online (Natural) - Spanish (Mexico)", lang: "es-MX" },
      { name: "Google US English", lang: "en-US" },
    ];
    const mejor = [...voces].sort((a, b) => puntuarVoz(b, "es") - puntuarVoz(a, "es"))[0];
    expect(mejor.lang).toBe("es-MX");
    expect(puntuarVoz(voces[3], "es")).toBe(-1);
    expect(puntuarVoz(voces[3], "en")).toBeGreaterThan(0);
  });

  it("no lee markdown, emojis ni enlaces", () => {
    expect(textoParaVoz("**¡Bien!** 🎉 Mira https://x.do el *paso 2*")).toBe("¡Bien! Mira el paso 2");
  });
});
