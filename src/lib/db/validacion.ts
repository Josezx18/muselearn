import { z } from "zod";
import { Rol } from "@/types/contratos";
import { esCodigoValido, normalizarCodigo } from "./codigos";

export const NuevaClase = z.object({
  nombre: z.string().trim().min(2).max(80),
  materia: z.string().trim().min(2).max(60),
  grado: z.string().trim().min(1).max(30),
});
export type NuevaClase = z.infer<typeof NuevaClase>;

export const EntradaUnirse = z.object({
  codigo: z
    .string()
    .transform(normalizarCodigo)
    .refine(esCodigoValido, "codigo_invalido"),
});

export const EntradaRegistro = z.object({
  nombre: z.string().trim().min(2).max(80),
  correo: z.string().trim().toLowerCase().email().max(120),
  contrasena: z.string().min(8).max(72),
  rol: Rol,
});

export const EntradaLogin = z.object({
  correo: z.string().trim().toLowerCase().email(),
  contrasena: z.string().min(1),
});

export type ErrorUnion = "no_existe" | "ya_inscrito" | "es_docente";

/** Decide si un estudiante puede unirse. Pura para poder probarla sin base de datos. */
export function validarUnion(datos: {
  rolUsuario: "docente" | "estudiante";
  clase: { id: string } | null;
  yaInscrito: boolean;
}): ErrorUnion | null {
  if (datos.rolUsuario !== "estudiante") return "es_docente";
  if (!datos.clase) return "no_existe";
  if (datos.yaInscrito) return "ya_inscrito";
  return null;
}

/** Ruta de inicio según el rol. */
export const inicioPorRol = (rol: "docente" | "estudiante") => (rol === "docente" ? "/docente" : "/estudiante/hoy");
