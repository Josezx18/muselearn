import { obtenerDatosHoy, semanaActual } from "@/lib/server/data";
import { Dashboard } from "@/components/estudiante/Dashboard";

export default async function Pagina(): Promise<React.ReactElement> {
  const semana = semanaActual();
  const { usuario, plan, tareas, analisis, clases } = await obtenerDatosHoy(semana);
  return <Dashboard vista="hoy" usuario={usuario} plan={plan} tareas={tareas} analisis={analisis} clases={clases} semana={semana} />;
}