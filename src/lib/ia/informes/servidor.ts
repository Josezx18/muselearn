import { z } from "zod";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { InformeComprension, RutaPractica } from "@/types/contratos";
import { ErrorConversacion } from "@/lib/ia/conversacion/validacion";
export const InformeConRuta = z.object({ informe: InformeComprension, ruta: RutaPractica.nullable() });
export async function leerInforme(id: string) {
  z.string().uuid().parse(id);
  const actual = await obtenerUsuarioActual();
  if (!actual) throw new ErrorConversacion(401, "no_autenticado");
  const { data, error } = await actual.db.from("informes").select("informe,ruta").eq("entrega_id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ErrorConversacion(404, "informe_no_encontrado");
  const resultado = InformeConRuta.parse(data);
  if (resultado.informe.entrega_id !== id || (resultado.ruta && resultado.ruta.entrega_id !== id)) throw new Error("identidad_invalida");
  return { ...actual, ...resultado };
}
