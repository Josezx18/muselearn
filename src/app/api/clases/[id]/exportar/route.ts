import { z } from "zod";
import { Tarea } from "@/types/contratos";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { datosComprension, ErrorComprension } from "@/lib/db/comprension";
import { calcularMapa } from "@/lib/ia/informes/mapa";
import { ErrorConversacion, errorConversacion } from "@/lib/ia/conversacion/validacion";
import { csvComprension, csvEntregas, nombreCSV } from "@/lib/exportar/csv";

export async function GET(request: Request, ctx: RouteContext<"/api/clases/[id]/exportar">) {
  try {
    const actual = await obtenerUsuarioActual();
    if (!actual) throw new ErrorConversacion(401, "no_autenticado");
    if (actual.usuario.rol !== "docente") throw new ErrorConversacion(403, "solo_docentes");
    const id = z.string().uuid().parse((await ctx.params).id);
    const tipo = z.enum(["entregas", "comprension"]).parse(new URL(request.url).searchParams.get("tipo"));
    const datos = await datosComprension(actual.db, actual.usuario.id, id, null);
    const valorOffset = Number(process.env.ZONA_OFFSET_MIN);
    const offset = process.env.ZONA_OFFSET_MIN && Number.isFinite(valorOffset) ? valorOffset : -240;
    let csv: string;
    if (tipo === "comprension") {
      csv = csvComprension(datos.estudiantes, calcularMapa(id, null, datos.estudiantes, datos.informes));
    } else {
      const tareas = await actual.db.from("tareas").select("*").eq("clase_id", id);
      if (tareas.error) throw tareas.error;
      const notas = new Map<string, number | null>();
      if (datos.entregas.length) {
        const resultado = await actual.db.from("calificaciones").select("entrega_id,nota").in("entrega_id", datos.entregas.map((e) => e.id));
        // La tabla es opcional hasta integrar T09; otros errores no se ocultan.
        if (resultado.error && !["42P01", "PGRST205"].includes(resultado.error.code)) throw resultado.error;
        if (!resultado.error) {
          for (const fila of z.array(z.object({ entrega_id: z.string().uuid(), nota: z.number().nullable() })).parse(resultado.data)) notas.set(fila.entrega_id, fila.nota);
        }
      }
      csv = csvEntregas({ ...datos, tareas: z.array(Tarea).parse(tareas.data), notas }, offset);
    }
    return new Response(csv, { headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombreCSV(datos.clase.nombre, tipo, new Date(), offset)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (e) {
    return errorConversacion(e instanceof ErrorComprension ? new ErrorConversacion(e.estado, e.codigo) : e);
  }
}
