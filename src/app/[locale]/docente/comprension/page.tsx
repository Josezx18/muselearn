import { listarClases, cargarComprension } from "@/lib/api-cliente";
import { Comprension } from "@/components/docente/Comprension";

export default async function Pagina() {
  const clases = await listarClases();
  const claseId = clases[0]?.id ?? "";
  let datos = null;
  if (claseId) {
    datos = await cargarComprension(claseId);
  }
  return <Comprension clases={clases} datosIniciales={datos} claseIdInicial={claseId} />;
}