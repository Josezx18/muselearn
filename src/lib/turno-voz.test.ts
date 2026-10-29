import { describe, expect, it } from "vitest";
import { nuevoTurno, procesarNivel } from "./turno-voz";

/** Simula bloques de 85 ms con el volumen dado por la función. */
function simular(nivel: (ms: number) => number, hastaMs = 60000) {
  const e = nuevoTurno(0);
  for (let ms = 0; ms <= hastaMs; ms += 85) {
    const d = procesarNivel(e, nivel(ms), ms);
    if (d !== "seguir") return { d, ms };
  }
  return { d: "seguir" as const, ms: hastaMs };
}

describe("turno de habla", () => {
  it("termina después de una pausa de ~1.3 s tras hablar", () => {
    const r = simular((ms) => (ms > 600 && ms < 3000 ? 0.08 : 0.004));
    expect(r.d).toBe("termino");
    expect(r.ms).toBeGreaterThan(4200);
    expect(r.ms).toBeLessThan(4500);
  });

  it("no corta en pausas cortas entre palabras", () => {
    const r = simular((ms) => ((ms > 600 && ms < 2000) || (ms > 2800 && ms < 4000) ? 0.08 : 0.004));
    expect(r.d).toBe("termino");
    expect(r.ms).toBeGreaterThan(5200);
  });

  it("si nunca habla, se pausa a los 12 s", () => {
    expect(simular(() => 0.004).d).toBe("silencio");
  });

  it("en un salón ruidoso, el ruido de fondo no cuenta como voz", () => {
    const r = simular((ms) => (ms > 1000 && ms < 2500 ? 0.2 : 0.03));
    expect(r.d).toBe("termino");
  });

  it("corta los turnos muy largos", () => {
    expect(simular((ms) => (ms < 400 ? 0.004 : 0.1)).d).toBe("maximo");
  });
});
