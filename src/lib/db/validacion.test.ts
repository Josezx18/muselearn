import { describe, expect, it } from "vitest";
import { EntradaRegistro, EntradaUnirse, NuevaClase, validarUnion } from "./validacion";

describe("EntradaUnirse", () => {
  it("normaliza el código", () => {
    expect(EntradaUnirse.parse({ codigo: " mat4kq" }).codigo).toBe("MAT4KQ");
  });
  it("rechaza códigos mal formados", () => {
    expect(EntradaUnirse.safeParse({ codigo: "12" }).success).toBe(false);
    expect(EntradaUnirse.safeParse({ codigo: "ABCDE1" }).success).toBe(false);
  });
});

describe("validarUnion", () => {
  const clase = { id: "x" };
  it("permite unirse a un estudiante con clase existente", () => {
    expect(validarUnion({ rolUsuario: "estudiante", clase, yaInscrito: false })).toBeNull();
  });
  it("error claro si la clase no existe", () => {
    expect(validarUnion({ rolUsuario: "estudiante", clase: null, yaInscrito: false })).toBe("no_existe");
  });
  it("detecta inscripción repetida", () => {
    expect(validarUnion({ rolUsuario: "estudiante", clase, yaInscrito: true })).toBe("ya_inscrito");
  });
  it("un docente no se une", () => {
    expect(validarUnion({ rolUsuario: "docente", clase, yaInscrito: false })).toBe("es_docente");
  });
});

describe("NuevaClase y EntradaRegistro", () => {
  it("recorta espacios", () => {
    expect(NuevaClase.parse({ nombre: " Mate 4to ", materia: "Matemática", grado: "4to" }).nombre).toBe("Mate 4to");
  });
  it("exige contraseña de 8+ y rol válido", () => {
    const base = { nombre: "Ana Ruiz", correo: "A@B.com", rol: "estudiante" };
    expect(EntradaRegistro.safeParse({ ...base, contrasena: "corta" }).success).toBe(false);
    expect(EntradaRegistro.safeParse({ ...base, contrasena: "larga-123", rol: "admin" }).success).toBe(false);
    expect(EntradaRegistro.parse({ ...base, contrasena: "larga-123" }).correo).toBe("a@b.com");
  });
});
