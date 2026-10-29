import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DetalleTareaDocente } from "@/components/tareas/DetalleTareaDocente";
import { usarMocks } from "@/lib/api-cliente";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { tareaDelDocente } from "@/lib/db/gestion";
import { tareasMock } from "@/lib/mocks/tareas";

export async function generateMetadata({ params }: PageProps<"/[locale]/docente/tareas/[id]">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tareas" });
  return { title: t("detalle.titulo") };
}

export default async function PaginaTareaDocente({ params }: PageProps<"/[locale]/docente/tareas/[id]">) {
  const { id } = await params;
  let tarea = null;
  if (usarMocks()) {
    tarea = tareasMock.find((t) => t.id === id) ?? tareasMock[0];
  } else {
    const actual = await obtenerUsuarioActual();
    if (!actual || actual.usuario.rol !== "docente") notFound();
    tarea = await tareaDelDocente(actual.db, actual.usuario.id, id);
  }
  if (!tarea) notFound();
  return <DetalleTareaDocente tarea={tarea} />;
}
