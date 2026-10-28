import { ChatTutor } from "@/components/tutor/ChatTutor";

// Dueño: T04. Reemplaza este marcador por la pantalla real.
export default async function Pagina({ params }: PageProps<"/[locale]/estudiante/tarea/[id]/tutor">) {
  const { id } = await params;
  return <ChatTutor tareaId={id} />;
}
