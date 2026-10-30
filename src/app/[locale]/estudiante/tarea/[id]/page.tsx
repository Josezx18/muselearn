import { obtenerDatosTarea } from "@/lib/server/data";
import { DetalleTarea } from "@/components/estudiante/DetalleTarea";

export default async function Pagina({ params }: PageProps<"/[locale]/estudiante/tarea/[id]">) {
  const { id } = await params;
  const { tarea, analisis, materia, entrega } = await obtenerDatosTarea(id);
  return <DetalleTarea tarea={tarea} analisis={analisis} materia={materia} entrega={entrega} />;
}
