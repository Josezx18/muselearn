import { notFound } from "next/navigation";
import { obtenerPerfilEstudiante } from "@/lib/server/data";
import { PerfilEstudiante } from "@/components/docente/perfil/PerfilEstudiante";

export default async function Page({ params }: PageProps<"/[locale]/docente/clases/[id]/estudiantes/[estudianteId]">) {
  const { locale, id, estudianteId } = await params;
  const datos = await obtenerPerfilEstudiante(id, estudianteId);
  if (!datos) notFound();
  return <PerfilEstudiante datos={datos} locale={locale} />;
}
