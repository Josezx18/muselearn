import { notFound } from "next/navigation";
import { ListaTareas } from "@/components/tareas";
import { usarMocks } from "@/lib/api-cliente";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { clasesMock } from "@/lib/mocks/clases";

/** Página de una clase del docente: encabezado + lista de tareas con "Nueva tarea". */
export default async function PaginaClase({ params }: PageProps<"/[locale]/docente/clases/[id]">) {
  const { id } = await params;

  let clase: { nombre: string; materia: string; grado: string } | null = null;
  if (usarMocks()) {
    clase = clasesMock.find((c) => c.id === id) ?? clasesMock[0] ?? null;
  } else {
    const actual = await obtenerUsuarioActual();
    if (!actual || actual.usuario.rol !== "docente") notFound();
    const { data } = await actual.db
      .from("clases")
      .select("nombre, materia, grado")
      .eq("id", id)
      .eq("docente_id", actual.usuario.id)
      .maybeSingle();
    clase = data;
  }
  if (!clase) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{clase.nombre}</h1>
        <p className="text-tinta-suave">
          {clase.materia} · {clase.grado}
        </p>
      </div>
      <ListaTareas claseId={id} />
    </div>
  );
}
