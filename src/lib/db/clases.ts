import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Clase, Usuario } from "@/types/contratos";
import { generarCodigo } from "./codigos";
import { validarUnion, type ErrorUnion, type NuevaClase } from "./validacion";

const COLUMNAS_CLASE = "id, docente_id, nombre, materia, grado, codigo_inscripcion, creada_en";
const CODIGO_DUPLICADO = "23505";

/** Crea una clase con un código único (reintenta si dos docentes generan el mismo). */
export async function crearClase(db: SupabaseClient, docenteId: string, datos: NuevaClase) {
  for (let intento = 0; intento < 8; intento++) {
    const { data, error } = await db
      .from("clases")
      .insert({ ...datos, docente_id: docenteId, codigo_inscripcion: generarCodigo() })
      .select(COLUMNAS_CLASE)
      .single();
    if (!error) return Clase.parse(data);
    if (error.code !== CODIGO_DUPLICADO) throw error;
  }
  throw new Error("No se pudo generar un código único");
}

/** Clases del docente, o las clases en que el estudiante está inscrito (RLS filtra por usuario). */
export async function listarClases(db: SupabaseClient) {
  const { data, error } = await db.from("clases").select(COLUMNAS_CLASE).order("creada_en", { ascending: false });
  if (error) throw error;
  return z.array(Clase).parse(data);
}

/** Une al estudiante a la clase del código. Usa el cliente admin: el estudiante aún no puede ver la clase por RLS. */
export async function unirseAClase(
  admin: SupabaseClient,
  usuario: { id: string; rol: "docente" | "estudiante" },
  codigo: string,
): Promise<{ clase: Clase } | { error: ErrorUnion }> {
  const { data: fila, error } = await admin.from("clases").select(COLUMNAS_CLASE).eq("codigo_inscripcion", codigo).maybeSingle();
  if (error) throw error;
  const clase = fila ? Clase.parse(fila) : null;

  let yaInscrito = false;
  if (clase) {
    const { data: previa } = await admin
      .from("inscripciones")
      .select("clase_id")
      .eq("clase_id", clase.id)
      .eq("estudiante_id", usuario.id)
      .maybeSingle();
    yaInscrito = !!previa;
  }

  const fallo = validarUnion({ rolUsuario: usuario.rol, clase, yaInscrito });
  if (fallo || !clase) return { error: fallo ?? "no_existe" };

  const { error: errorInsertar } = await admin.from("inscripciones").insert({ clase_id: clase.id, estudiante_id: usuario.id });
  if (errorInsertar) throw errorInsertar;
  return { clase };
}

/** Estudiantes inscritos. Devuelve null si la clase no es del docente. */
export async function listarEstudiantes(db: SupabaseClient, docenteId: string, claseId: string) {
  const { data: clase } = await db.from("clases").select("id").eq("id", claseId).eq("docente_id", docenteId).maybeSingle();
  if (!clase) return null;
  const { data, error } = await db
    .from("inscripciones")
    .select("perfiles(id, rol, nombre, idioma)")
    .eq("clase_id", claseId)
    .order("inscrito_en");
  if (error) throw error;
  const perfiles = (data ?? []).flatMap((f) => (Array.isArray(f.perfiles) ? f.perfiles : [f.perfiles]));
  return z.array(Usuario).parse(perfiles);
}
