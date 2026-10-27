import { redirect } from "@/i18n/navigation";

export default async function InicioEstudiante({ params }: PageProps<"/[locale]/estudiante">) {
  const { locale } = await params;
  redirect({ href: "/estudiante/hoy", locale });
}
