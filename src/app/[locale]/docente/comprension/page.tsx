import { obtenerDatosComprension } from "@/lib/server/data";
import { Comprension } from "@/components/docente/Comprension";

export default async function Pagina() {
  const { clases } = await obtenerDatosComprension();
  const claseId = clases[0]?.id ?? "";
  return <Comprension clases={clases} datosIniciales={null} claseIdInicial={claseId} />;
}