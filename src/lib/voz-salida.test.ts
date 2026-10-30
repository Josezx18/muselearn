import { afterEach, describe, expect, it, vi } from "vitest";
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

it("limpia enlaces markdown, código, listas, banderas y emojis compuestos", () => {
  expect(textoParaVoz("## Hola\n1. Lee [la guía](https://x.do) 👩🏽‍🏫 🇩🇴\n```js\nalert(1)\n```\n![foto](https://x.do/a) www.x.do")).toBe("Hola Lee la guía");
  expect(textoParaVoz("Calcula x + 2 = 5 y -3. `Piensa`" )).toBe("Calcula x + 2 = 5 y -3. Piensa");
});

import { leerPreferenciasVoz, guardarPreferenciasVoz } from "./voz-salida";
import { transcribirConReintento } from "@/components/verificacion/wav";
import { ErrorApi, transcribirVoz } from "./api-cliente";
vi.mock("./api-cliente", async importar => {
  const real = await importar<typeof import("./api-cliente")>();
  return {...real, transcribirVoz: vi.fn()};
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it("tolera almacenamiento bloqueado y valores fuera de rango", () => {
  vi.stubGlobal("localStorage", {getItem: () => '{"velocidad":99,"pausaMs":0}', setItem: () => {throw new Error("bloqueado");}});
  expect(leerPreferenciasVoz().velocidad).toBe(1);
  expect(leerPreferenciasVoz().pausaMs).toBe(1300);
  expect(guardarPreferenciasVoz({voces:{}, velocidad:1, pausaMs:1300})).toBe(false);
});
it.each([new TypeError("red"), new ErrorApi(503,"servicio","fallo")])("reintenta el mismo audio una vez: %s", async error => {
  const audio = new Blob(["audio"]);
  const transcribir = vi.mocked(transcribirVoz);
  transcribir.mockRejectedValueOnce(error).mockResolvedValueOnce({texto:"explicación"});
  expect(await transcribirConReintento(audio)).toEqual({texto:"explicación"});
  expect(transcribir).toHaveBeenCalledTimes(2);
  expect(transcribir.mock.calls.every(c => c[0] === audio)).toBe(true);
});
it("avisa tras el segundo fallo y no reintenta errores de permisos", async () => {
  const transcribir = vi.mocked(transcribirVoz);
  transcribir.mockRejectedValue(new ErrorApi(503,"servicio","fallo"));
  await expect(transcribirConReintento(new Blob())).rejects.toThrow("fallo");
  expect(transcribir).toHaveBeenCalledTimes(2);
  transcribir.mockClear().mockRejectedValue(new ErrorApi(403,"permiso","permiso"));
  await expect(transcribirConReintento(new Blob())).rejects.toThrow("permiso");
  expect(transcribir).toHaveBeenCalledTimes(1);
});
