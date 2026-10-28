import { Metadata } from "next";
import { DetalleTareaDocente } from "@/components/tareas/DetalleTareaDocente";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Detalle de la tarea ${id}` };
}

export default async function PaginaTareaDocente({ params }: Props) {
  const { id } = await params;
  const actual = await obtenerUsuarioActual();
  if (!actual || actual.usuario.rol !== "docente") notFound();

  const { data: tarea } = await actual.db
    .from("tareas")
    .select("*, clases!inner(docente_id)")
    .eq("id", id)
    .eq("clases.docente_id", actual.usuario.id)
    .maybeSingle();
  if (!tarea) notFound();

  return <DetalleTareaDocente tarea={tarea} />;
}