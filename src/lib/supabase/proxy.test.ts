import { describe, expect, it } from "vitest";
import { rutaDeRedireccion } from "./proxy";

const docente = { app_metadata: { rol: "docente" } };
const estudiante = { app_metadata: { rol: "estudiante" } };

describe("rutaDeRedireccion", () => {
  it("sin sesión, las áreas privadas llevan a /login", () => {
    expect(rutaDeRedireccion("/docente/clases", null)).toBe("/login");
    expect(rutaDeRedireccion("/estudiante/hoy", null)).toBe("/login");
  });
  it("un rol no entra al área del otro", () => {
    expect(rutaDeRedireccion("/docente", estudiante)).toBe("/estudiante/hoy");
    expect(rutaDeRedireccion("/estudiante/semana", docente)).toBe("/docente");
  });
  it("cada rol entra a lo suyo", () => {
    expect(rutaDeRedireccion("/docente/tareas", docente)).toBeNull();
    expect(rutaDeRedireccion("/estudiante/hoy", estudiante)).toBeNull();
  });
  it("con sesión, login y registro llevan al inicio del rol", () => {
    expect(rutaDeRedireccion("/login", docente)).toBe("/docente");
    expect(rutaDeRedireccion("/registro", estudiante)).toBe("/estudiante/hoy");
  });
  it("unirse exige sesión", () => {
    expect(rutaDeRedireccion("/unirse", null)).toBe("/login");
    expect(rutaDeRedireccion("/unirse", estudiante)).toBeNull();
  });
  it("las rutas públicas pasan", () => {
    expect(rutaDeRedireccion("/", null)).toBeNull();
    expect(rutaDeRedireccion("/registro", null)).toBeNull();
    expect(rutaDeRedireccion("/docentes-info", null)).toBeNull();
  });
});
