import { sesionEstudiante } from "@/components/estudiante/sesion";
import { obtenerPlan, listarTareas, listarAnalisis, listarClases } from "@/lib/api-cliente";
import { Dashboard } from "@/components/estudiante/Dashboard";

export default async function Pagina({ params }: PageProps<"/[locale]/estudiante/hoy">) {
  const { locale } = await params;
  const usuario = await sesionEstudiante(locale);
  const semana = new Date().toISOString().split("T")[0];
  const [plan, tareas, analisis, clases] = await Promise.all([
    obtenerPlan(semana),
    listarTareas(),
    listarAnalisis(usuario.id),
    listarClases(),
  ]);
  return <Dashboard vista="hoy" usuario={usuario} plan={plan} tareas={tareas} analisis={analisis} clases={clases} semana={semana} />;
}