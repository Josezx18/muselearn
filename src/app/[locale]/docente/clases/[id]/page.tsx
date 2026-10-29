import { notFound } from "next/navigation";
import { GestionClase } from "@/components/gestion/GestionClase";
import { usarMocks } from "@/lib/api-cliente";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { claseDelDocente } from "@/lib/db/gestion";
import { clasesMock } from "@/lib/mocks/clases";

/** Página de una clase del docente: datos y código, tareas y estudiantes; editar y borrar. */
export default async function PaginaClase({ params }: PageProps<"/[locale]/docente/clases/[id]">) {
  const { id } = await params;
  let clase = null;
  if (usarMocks()) {
    clase = clasesMock.find((c) => c.id === id) ?? clasesMock[0] ?? null;
  } else {
    const actual = await obtenerUsuarioActual();
    if (!actual || actual.usuario.rol !== "docente") notFound();
    clase = await claseDelDocente(actual.db, actual.usuario.id, id);
  }
  if (!clase) notFound();
  return <GestionClase claseInicial={clase} />;
}
