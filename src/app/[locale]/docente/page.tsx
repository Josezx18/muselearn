import { redirect } from "@/i18n/navigation";

export default async function InicioDocente({ params }: PageProps<"/[locale]/docente">) {
  const { locale } = await params;
  redirect({ href: "/docente/clases", locale });
}
