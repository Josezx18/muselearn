import { Verificacion } from "@/components/verificacion/Verificacion";
import { z } from "zod";

// Dueño: T04. Reemplaza este marcador por la pantalla real.
export default async function Pagina({ params, searchParams }: PageProps<"/[locale]/estudiante/tarea/[id]/verificar">) {
  const { id } = await params;
  const busqueda = await searchParams;
  const entrega = z.string().uuid().safeParse(busqueda.entrega_id);
  return <Verificacion tareaId={id} entregaId={entrega.success ? entrega.data : undefined} />;
}
