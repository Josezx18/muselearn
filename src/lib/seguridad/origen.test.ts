import { describe, expect, it } from "vitest";
import { origenPermitido } from "./origen";

const h = (o: Record<string, string>) => new Headers(o);

describe("protección CSRF de la API", () => {
  it("deja pasar lecturas de cualquier origen", () => {
    expect(origenPermitido("GET", h({ host: "muselearn.app", origin: "https://malo.com" }))).toBe(true);
  });
  it("acepta cambios desde la propia app", () => {
    expect(origenPermitido("POST", h({ host: "muselearn-five.vercel.app", origin: "https://muselearn-five.vercel.app" }))).toBe(true);
    expect(origenPermitido("PATCH", h({ host: "interno", "x-forwarded-host": "muselearn-five.vercel.app", origin: "https://muselearn-five.vercel.app" }))).toBe(true);
    expect(origenPermitido("POST", h({ host: "localhost:3000", origin: "http://localhost:3000" }))).toBe(true);
  });
  it("rechaza cambios desde otro sitio", () => {
    expect(origenPermitido("POST", h({ host: "muselearn-five.vercel.app", origin: "https://malo.com" }))).toBe(false);
    expect(origenPermitido("DELETE", h({ host: "muselearn-five.vercel.app", origin: "null" }))).toBe(false);
    expect(origenPermitido("POST", h({ host: "muselearn-five.vercel.app", "sec-fetch-site": "cross-site" }))).toBe(false);
  });
  it("acepta clientes sin navegador (sin Origin ni Sec-Fetch-Site)", () => {
    expect(origenPermitido("POST", h({ host: "muselearn-five.vercel.app" }))).toBe(true);
  });
});
