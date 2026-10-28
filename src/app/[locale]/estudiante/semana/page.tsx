import { Dashboard } from "@/components/estudiante/Dashboard";
import { sesionEstudiante } from "@/components/estudiante/sesion";
export default async function Pagina({ params }: PageProps<"/[locale]/estudiante/semana">) {
 const { locale } = await params;
 const usuario = await sesionEstudiante(locale);
 return <Dashboard vista="semana" usuario={usuario} />;
}
