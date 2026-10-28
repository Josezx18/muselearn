import { leerInforme, InformeConRuta } from "@/lib/ia/informes/servidor";
import { errorConversacion } from "@/lib/ia/conversacion/validacion";
export async function GET(_request: Request, { params }: RouteContext<"/api/informes/[id]">) {
  try {
    const { id } = await params;
    return Response.json(InformeConRuta.parse(await leerInforme(id)));
  } catch (e) {
    return errorConversacion(e);
  }
}
