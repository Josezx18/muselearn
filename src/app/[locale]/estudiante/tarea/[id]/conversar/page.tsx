import { ModoConversacion } from "@/components/tutor/ModoConversacion";

// Conversación por voz con el tutor (pantalla completa, con la mascota).
export default async function Pagina({ params }: PageProps<"/[locale]/estudiante/tarea/[id]/conversar">) {
  const { id } = await params;
  return <ModoConversacion tareaId={id} />;
}
