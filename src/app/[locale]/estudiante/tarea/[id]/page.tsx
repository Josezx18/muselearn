import { obtenerDatosTarea } from "@/lib/server/data";
import { DetalleTarea } from "@/components/estudiante/DetalleTarea";
import { notFound } from "next/navigation";
import { z } from "zod";
import { offsetPorDefecto } from "@/lib/ia/planificador";

export default async function Pagina({ params }: PageProps<"/[locale]/estudiante/tarea/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { tarea, analisis, materia, entrega } = await obtenerDatosTarea(id);
  if (!tarea) notFound();
  return <DetalleTarea tarea={tarea} analisis={analisis} materia={materia} entrega={entrega} offsetMin={offsetPorDefecto()} />;
}
