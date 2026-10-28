import { describe, expect, it } from "vitest";
import { contarMensajesDesde, inicioDelDia } from "./limites";

describe("inicioDelDia", () => {
  it("usa la medianoche de República Dominicana (UTC-4)", () => {
    // 28 oct 2026, 02:30 UTC = 27 oct, 22:30 en RD → el día empezó el 27 a las 04:00 UTC.
    expect(inicioDelDia(new Date("2026-10-28T02:30:00Z"), -240)).toBe("2026-10-27T04:00:00.000Z");
    // 28 oct 2026, 15:00 UTC = 11:00 en RD → el día empezó el 28 a las 04:00 UTC.
    expect(inicioDelDia(new Date("2026-10-28T15:00:00Z"), -240)).toBe("2026-10-28T04:00:00.000Z");
  });
});

describe("contarMensajesDesde", () => {
  const desde = "2026-10-28T04:00:00.000Z";
  it("cuenta solo los mensajes del estudiante de hoy, en todas las conversaciones", () => {
    const historiales = [
      [
        { rol: "estudiante", contenido: "ayer", creado_en: "2026-10-27T20:00:00Z" },
        { rol: "estudiante", contenido: "hoy 1", creado_en: "2026-10-28T12:00:00Z" },
        { rol: "agente", contenido: "respuesta", creado_en: "2026-10-28T12:00:05Z" },
      ],
      [{ rol: "estudiante", contenido: "hoy 2", creado_en: "2026-10-28T13:00:00+00:00" }],
      "no es una lista",
      null,
    ];
    expect(contarMensajesDesde(historiales, desde)).toBe(2);
  });
});
