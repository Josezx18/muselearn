import { notFound } from "next/navigation";
import { z } from "zod";
import { obtenerTareasDeClase } from "@/lib/server/data";
import { DetalleClase } from "@/components/estudiante/clases/DetalleClase";

export default async function Pagina({ params }: PageProps<"/[locale]/estudiante/clases/[id]">): Promise<React.ReactElement> {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const clase = await obtenerTareasDeClase(id);
  if (!clase) notFound();
  return <DetalleClase clase={clase.clase} docente={clase.docente} pendientes={clase.pendientes} entregadas={clase.entregadas} vencidas={clase.vencidas} />;
}
