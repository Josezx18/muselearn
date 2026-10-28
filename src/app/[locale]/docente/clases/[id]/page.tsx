import { Metadata } from "next";
import { ListaTareas } from "@/components/tareas";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Tareas de la clase ${id}` };
}

export default async function PaginaClase({ params }: Props) {
  const { id } = await params;
  const actual = await obtenerUsuarioActual();
  if (!actual || actual.usuario.rol !== "docente") notFound();

  const { data: clase } = await actual.db.from("clases").select("id, nombre, materia, grado").eq("id", id).eq("docente_id", actual.usuario.id).maybeSingle();
  if (!clase) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{clase.nombre}</h1>
          <p className="text-tinta-suave">{clase.materia} · {clase.grado}</p>
        </div>
      </div>
      <ListaTareas claseId={id} />
    </div>
  );
}