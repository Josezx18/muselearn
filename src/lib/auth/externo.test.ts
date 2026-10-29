import { describe, expect, it } from "vitest";
import { idiomaValido, nombreDesdeProveedor, origenDesdeCabeceras, rolParaCuentaNueva, urlCallback } from "./externo";

const cabeceras = (h: Record<string, string>) => ({ get: (n: string) => h[n] ?? null });

describe("entrar con Google", () => {
  it("una cuenta nueva es de estudiante salvo que haya elegido docente", () => {
    expect(rolParaCuentaNueva(null)).toBe("estudiante");
    expect(rolParaCuentaNueva("docente")).toBe("docente");
    expect(rolParaCuentaNueva("admin")).toBe("estudiante");
  });

  it("toma el nombre de Google, o lo arma con el correo", () => {
    expect(nombreDesdeProveedor({ email: "x@y.com", user_metadata: { full_name: "Camila Pérez" } })).toBe("Camila Pérez");
    expect(nombreDesdeProveedor({ email: "luis.martinez@liceo.do", user_metadata: {} })).toBe("luis martinez");
    expect(nombreDesdeProveedor({ email: null })).toBe("Estudiante");
  });

  it("arma la dirección de vuelta con el idioma, el rol y el siguiente paso", () => {
    const url = new URL(urlCallback("https://muselearn-five.vercel.app", { locale: "en", rol: "docente" }));
    expect(url.pathname).toBe("/api/auth/callback");
    expect(url.searchParams.get("locale")).toBe("en");
    expect(url.searchParams.get("rol")).toBe("docente");
    expect(new URL(urlCallback("http://localhost:3000", { locale: "es", siguiente: "nueva-contrasena" })).searchParams.get("siguiente")).toBe(
      "nueva-contrasena",
    );
  });

  it("solo acepta idiomas de la app", () => {
    expect(idiomaValido("en")).toBe("en");
    expect(idiomaValido("fr")).toBe("es");
    expect(idiomaValido(null)).toBe("es");
  });

  it("calcula el origen desde las cabeceras", () => {
    expect(origenDesdeCabeceras(cabeceras({ origin: "https://muselearn-five.vercel.app" }))).toBe("https://muselearn-five.vercel.app");
    expect(origenDesdeCabeceras(cabeceras({ "x-forwarded-host": "muselearn-five.vercel.app" }))).toBe("https://muselearn-five.vercel.app");
    expect(origenDesdeCabeceras(cabeceras({ host: "localhost:3000" }))).toBe("http://localhost:3000");
    expect(origenDesdeCabeceras(cabeceras({ origin: "null", host: "localhost:3000" }))).toBe("http://localhost:3000");
  });
});
