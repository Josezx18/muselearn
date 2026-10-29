import { leerInforme, InformeConRuta } from "@/lib/ia/informes/servidor";
import { errorConversacion } from "@/lib/ia/conversacion/validacion";
export async function GET(_request: Request, { params }: RouteContext<"/api/informes/[id]">) {
  try {
    const { id } = await params;
    const leido = await leerInforme(id);
    // tarea_id: para que la mascota del informe abra la conversación con el tutor de esa tarea.
    const { data } = await leido.db.from("entregas").select("tarea_id").eq("id", id).maybeSingle();
    return Response.json({ ...InformeConRuta.parse(leido), tarea_id: (data?.tarea_id as string | undefined) ?? undefined });
  } catch (e) {
    return errorConversacion(e);
  }
}
