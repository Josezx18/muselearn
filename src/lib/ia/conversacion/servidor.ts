import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { Entrega, Tarea } from "@/types/contratos";
import { ErrorConversacion } from "./validacion";

export async function estudianteActual() {
  const actual = await obtenerUsuarioActual();
  if (!actual) throw new ErrorConversacion(401, "no_autenticado");
  if (actual.usuario.rol !== "estudiante") throw new ErrorConversacion(403, "solo_estudiantes");
  return actual;
}

export async function contextoTarea(id: string) {
  const actual = await estudianteActual();
  const { data, error } = await actual.db.from("tareas").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ErrorConversacion(404, "tarea_no_encontrada");
  const tarea = Tarea.parse(data);
  const { data: inscrito, error: fallo } = await actual.db.from("inscripciones").select("clase_id")
    .eq("clase_id", tarea.clase_id).eq("estudiante_id", actual.usuario.id).maybeSingle();
  if (fallo) throw fallo;
  if (!inscrito) throw new ErrorConversacion(403, "sin_permiso");
  return { ...actual, tarea };
}

export async function contextoEntrega(id: string) {
  const actual = await estudianteActual();
  const { data, error } = await actual.db.from("entregas").select("*").eq("id", id)
    .eq("estudiante_id", actual.usuario.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ErrorConversacion(404, "entrega_no_encontrada");
  const entrega = Entrega.parse(data);
  if (entrega.estado === "pendiente") throw new ErrorConversacion(409, "entrega_pendiente");
  const contexto = await contextoTarea(entrega.tarea_id);
  return { ...contexto, entrega, admin: crearClienteAdmin() };
}

export function comprobarEscritura(resultado: { error: unknown }) {
  if (resultado.error) throw resultado.error;
}
