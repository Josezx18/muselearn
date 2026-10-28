import { DetalleTarea } from "@/components/estudiante/DetalleTarea";
import { sesionEstudiante } from "@/components/estudiante/sesion";
export default async function Pagina({ params }: PageProps<"/[locale]/estudiante/tarea/[id]">) {
 const { locale, id } = await params;
 const usuario = await sesionEstudiante(locale);
 return <DetalleTarea id={id} estudianteId={usuario.id} />;
}
