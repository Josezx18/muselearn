// Datos de comprensión de una clase (o de una tarea) para su docente: estudiantes, entregas e informes.
// Lo usan el mapa de calor y la sugerencia de repaso. Todo con el cliente con sesión (RLS).
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Clase, Entrega, InformeComprension, Usuario } from "@/types/contratos";

export class ErrorComprension extends Error {
  constructor(
    public readonly estado: 404,
    public readonly codigo: "clase_no_encontrada" | "tarea_no_encontrada",
  ) {
    super(codigo);
    this.name = "ErrorComprension";
  }
}

export async function datosComprension(
  db: SupabaseClient,
  docenteId: string,
  claseId: string,
  tareaId: string | null,
) {
  const propia = await db
    .from("clases")
    .select(
      "id, docente_id, nombre, materia, grado, codigo_inscripcion, creada_en",
    )
    .eq("id", claseId)
    .eq("docente_id", docenteId)
    .maybeSingle();
  if (propia.error) throw propia.error;
  if (!propia.data) throw new ErrorComprension(404, "clase_no_encontrada");
  const clase = Clase.parse(propia.data);

  const [tareas, inscritos] = await Promise.all([
    db.from("tareas").select("id, titulo").eq("clase_id", claseId),
    db.from("inscripciones").select("estudiante_id").eq("clase_id", claseId),
  ]);
  if (tareas.error || inscritos.error) throw tareas.error ?? inscritos.error;
  const ids = (tareas.data ?? []).map((t) => t.id as string);
  if (tareaId && !ids.includes(tareaId))
    throw new ErrorComprension(404, "tarea_no_encontrada");

  const idsEstudiantes = (inscritos.data ?? []).map(
    (e) => e.estudiante_id as string,
  );
  const usuarios = idsEstudiantes.length
    ? await db.from("perfiles").select("*").in("id", idsEstudiantes)
    : { data: [], error: null };
  if (usuarios.error) throw usuarios.error;
  const estudiantes = z.array(Usuario).parse(usuarios.data);

  const entregas = ids.length
    ? await db
        .from("entregas")
        .select("*")
        .in("tarea_id", tareaId ? [tareaId] : ids)
    : { data: [], error: null };
  if (entregas.error) throw entregas.error;
  const filas = z.array(Entrega).parse(entregas.data);

  const informes = filas.length
    ? await db
        .from("informes")
        .select("entrega_id,informe")
        .in(
          "entrega_id",
          filas.map((e) => e.id),
        )
    : { data: [], error: null };
  if (informes.error) throw informes.error;
  const porEstudiante = (informes.data ?? []).flatMap((f) => {
    const entrega = filas.find((e) => e.id === f.entrega_id);
    const informe = InformeComprension.safeParse(f.informe);
    return entrega && informe.success
      ? [{ estudiante_id: entrega.estudiante_id, informe: informe.data }]
      : [];
  });

  const tituloTarea = tareaId
    ? ((tareas.data ?? []).find((t) => t.id === tareaId)?.titulo as
        string | undefined)
    : undefined;
  return {
    clase,
    estudiantes,
    entregas: filas,
    informes: porEstudiante,
    tituloTarea,
  };
}
