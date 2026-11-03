import { obtenerMisClases } from "@/lib/server/data";
import { MisClases } from "@/components/estudiante/clases/MisClases";

export default async function Pagina(): Promise<React.ReactElement> {
  const clases = await obtenerMisClases();
  return <MisClases clases={clases} />;
}
