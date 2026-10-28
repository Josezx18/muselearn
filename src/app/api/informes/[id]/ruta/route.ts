import { leerInforme } from "@/lib/ia/informes/servidor";
import { generarRuta } from "@/lib/ia/informes";
import { contextoEntrega } from "@/lib/ia/conversacion/servidor";
import { errorConversacion } from "@/lib/ia/conversacion/validacion";
export const maxDuration = 120;
export async function POST(_request: Request, { params }: RouteContext<"/api/informes/[id]/ruta">) {
  try {
    const { id } = await params;
    const ctx = await contextoEntrega(id);
    const { informe, ruta: guardada } = await leerInforme(id);
    if (guardada) return Response.json(guardada);
    const ruta = await generarRuta(informe, ctx.tarea, ctx.usuario.idioma);
    const { error } = await ctx.admin.from("informes").update({ ruta }).eq("entrega_id", id);
    if (error) throw error;
    return Response.json(ruta);
  } catch (e) { return errorConversacion(e); }
}
