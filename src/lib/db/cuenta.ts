// Derechos sobre los datos (Ley 172-13): descargar todo lo propio y eliminar la cuenta.
import type { SupabaseClient } from "@supabase/supabase-js";
import { BUCKET_ADJUNTOS } from "./almacenamiento";
import { borrarArchivosDeTareas } from "./gestion";

type Fila = Record<string, unknown>;

async function filas(
  consulta: PromiseLike<{
    data: Fila[] | null;
    error: { message: string } | null;
  }>,
): Promise<Fila[]> {
  const { data, error } = await consulta;
  if (error) {
    console.warn(`[cuenta] exportar: ${error.message}`);
    return [];
  }
  return data ?? [];
}

/**
 * Todos los datos del usuario, con su propia sesión (el RLS decide qué puede ver). Para un docente:
 * sus clases y tareas, y los comentarios que escribió; el trabajo de sus estudiantes es de ellos.
 */
export async function exportarDatos(
  db: SupabaseClient,
  usuario: { id: string; rol: "docente" | "estudiante" },
  correo: string,
) {
  const perfil =
    (await filas(db.from("perfiles").select("*").eq("id", usuario.id)))[0] ??
    null;
  const base = {
    generado_en: new Date().toISOString(),
    cuenta: { correo, rol: usuario.rol },
    perfil,
  };

  if (usuario.rol === "docente") {
    const clases = await filas(
      db.from("clases").select("*").eq("docente_id", usuario.id),
    );
    const ids = clases.map((c) => c.id as string);
    const tareas = ids.length
      ? await filas(db.from("tareas").select("*").in("clase_id", ids))
      : [];
    const comentarios = await filas(
      db.from("comentarios_entrega").select("*").eq("docente_id", usuario.id),
    );
    return { ...base, clases, tareas, comentarios_escritos: comentarios };
  }

  const entregas = await filas(
    db.from("entregas").select("*").eq("estudiante_id", usuario.id),
  );
  const idsEntregas = entregas.map((e) => e.id as string);
  const [
    inscripciones,
    analisis,
    planes,
    preferencias,
    conversaciones,
    verificaciones,
    informes,
    comentarios,
  ] = await Promise.all([
    filas(
      db
        .from("inscripciones")
        .select("*, clases(nombre, materia, grado)")
        .eq("estudiante_id", usuario.id),
    ),
    filas(
      db.from("analisis_tareas").select("*").eq("estudiante_id", usuario.id),
    ),
    filas(db.from("planes").select("*").eq("estudiante_id", usuario.id)),
    filas(
      db
        .from("preferencias_estudio")
        .select("*")
        .eq("estudiante_id", usuario.id),
    ),
    filas(
      db
        .from("conversaciones_tutor")
        .select("*")
        .eq("estudiante_id", usuario.id),
    ),
    idsEntregas.length
      ? filas(
          db
            .from("sesiones_verificacion")
            .select("*")
            .in("entrega_id", idsEntregas),
        )
      : Promise.resolve([]),
    idsEntregas.length
      ? filas(db.from("informes").select("*").in("entrega_id", idsEntregas))
      : Promise.resolve([]),
    idsEntregas.length
      ? filas(
          db
            .from("comentarios_entrega")
            .select("*")
            .in("entrega_id", idsEntregas),
        )
      : Promise.resolve([]),
  ]);
  return {
    ...base,
    clases: inscripciones,
    entregas,
    analisis_de_tareas: analisis,
    planes_semanales: planes,
    horas_de_estudio: preferencias,
    conversaciones_con_el_tutor: conversaciones,
    verificaciones,
    informes,
    comentarios_del_docente: comentarios,
  };
}

/**
 * Elimina la cuenta: primero los archivos en Storage (la base no los borra sola) y luego el usuario de Auth,
 * que borra en cascada su perfil y todo lo que depende de él. En un docente, eso incluye sus clases, sus
 * tareas y las entregas de sus estudiantes en esas clases.
 */
export async function eliminarCuenta(
  admin: SupabaseClient,
  usuario: { id: string; rol: "docente" | "estudiante" },
) {
  if (usuario.rol === "docente") {
    const { data: clases } = await admin
      .from("clases")
      .select("id")
      .eq("docente_id", usuario.id);
    const ids = (clases ?? []).map((c) => c.id as string);
    if (ids.length) {
      const { data: tareas } = await admin
        .from("tareas")
        .select("id")
        .in("clase_id", ids);
      await borrarArchivosDeTareas(
        admin,
        (tareas ?? []).map((t) => t.id as string),
      );
    }
  } else {
    const { data: entregas } = await admin
      .from("entregas")
      .select("adjuntos")
      .eq("estudiante_id", usuario.id);
    const rutas = (entregas ?? []).flatMap((e) =>
      ((e.adjuntos as { ruta?: string }[] | null) ?? [])
        .map((a) => a.ruta)
        .filter((r): r is string => !!r),
    );
    if (rutas.length) {
      const { error } = await admin.storage.from(BUCKET_ADJUNTOS).remove(rutas);
      if (error)
        console.warn(
          `[cuenta] no se pudieron borrar archivos: ${error.message}`,
        );
    }
  }
  const { error } = await admin.auth.admin.deleteUser(usuario.id);
  if (error) throw error;
}
