import { NextResponse } from "next/server";
import { PedidoRevisionEntrega, RevisionEntrega, RevisionGuardada } from "@/types/contratos";
import { z } from "zod";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { detalleEntrega, tareaDelDocente } from "@/lib/db/gestion";
import { errorHttp } from "@/lib/db/http";
import { revisarEntrega } from "@/lib/ia/docente/revision";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import { BUCKET_ADJUNTOS, rutasDeEntregaValidas } from "@/lib/db/almacenamiento";
import { docenteConCupo, errorIADocente } from "../_comun";

export const maxDuration = 60;
export async function POST(peticion: Request) {
  try {
    const sesion = await docenteConCupo();
    if (sesion instanceof Response) return sesion;
    const { actual, registrar } = sesion;
    const entrada = PedidoRevisionEntrega.safeParse(await peticion.json().catch(() => null));
    if (!entrada.success) return errorHttp(400, "datos_invalidos", "Identificador inválido.");
    const detalle = await detalleEntrega(actual.db, entrada.data.entrega_id);
    if (!detalle) return errorHttp(404, "no_encontrada", "Entrega no encontrada.");
    const tarea = await tareaDelDocente(actual.db, actual.usuario.id, detalle.entrega.tarea_id);
    if (!tarea) return errorHttp(403, "no_tu_tarea", "Esta entrega no es de tus tareas.");
    if (detalle.entrega.estado === "pendiente") return errorHttp(409, "sin_entregar", "Todavía no se ha entregado.");
    const imagenes = detalle.entrega.adjuntos.filter((a) => a.tipo_mime.startsWith("image/"));
    if (imagenes.length > 6) return errorHttp(400, "demasiadas_imagenes", "Máximo seis imágenes.");
    // Los archivos del estudiante solo los lee su dueño (RLS de Storage). Ya se comprobó que la tarea es de este
    // docente, así que se descargan con el cliente admin, solo las rutas guardadas en esta entrega.
    if (!rutasDeEntregaValidas(imagenes, detalle.entrega.tarea_id, detalle.entrega.estudiante_id))
      return errorHttp(400, "imagen_no_disponible", "No se pudo leer la imagen.");
    const almacen = imagenes.length ? crearClienteAdmin().storage.from(BUCKET_ADJUNTOS) : null;
    const fotos: { tipo: string; base64: string }[] = [];
    for (const imagen of imagenes) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(imagen.tipo_mime))
        return errorHttp(400, "imagen_no_admitida", "Formato de imagen no admitido.");
      const { data, error } = await almacen!.download(imagen.ruta);
      if (error || !data || data.size > 10 * 1024 * 1024)
        return errorHttp(400, "imagen_no_disponible", "No se pudo leer la imagen.");
      fotos.push({ tipo: imagen.tipo_mime, base64: Buffer.from(await data.arrayBuffer()).toString("base64") });
    }
    // Categoría compatible con el registro y CHECK actuales; comparte el cupo docente.
    await registrar("borrador_comentario");
    const revision = RevisionEntrega.parse(await revisarEntrega(tarea, detalle, fotos));
    // Se guarda para leerla al recorrer las entregas (0015). Si falla el guardado, igual se devuelve la revisión.
    const { error: errorGuardar } = await crearClienteAdmin().from("revisiones_ia").upsert(
      { entrega_id: detalle.entrega.id, revision, entregada_en: detalle.entrega.entregada_en, creada_en: new Date().toISOString() },
      { onConflict: "entrega_id" },
    );
    if (errorGuardar) console.warn("[docente/ia] no se pudo guardar la revisión:", errorGuardar.message);
    return NextResponse.json(revision);
  } catch (e) { return errorIADocente(e, "revisión de entrega"); }
}

/** GET ?tarea_id= → revisiones guardadas de las entregas de esa tarea (RLS: solo el docente de la tarea). */
export async function GET(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (actual.usuario.rol !== "docente") return errorHttp(403, "solo_docente", "Solo los docentes usan esta ayuda.");
  const tareaId = z.string().uuid().safeParse(new URL(peticion.url).searchParams.get("tarea_id"));
  if (!tareaId.success) return errorHttp(400, "datos_invalidos", "Identificador inválido.");
  const { data, error } = await actual.db
    .from("revisiones_ia")
    .select("entrega_id, revision, entregada_en, creada_en, entregas!inner(tarea_id)")
    .eq("entregas.tarea_id", tareaId.data);
  if (error) {
    // Migración 0015 aún no aplicada: sin revisiones guardadas.
    if (error.code === "42P01" || error.code === "PGRST205") return NextResponse.json([]);
    return errorHttp(500, "error_interno", "No se pudieron cargar las revisiones.");
  }
  const validas = (data ?? []).flatMap((fila) => {
    const r = RevisionGuardada.safeParse(fila);
    return r.success ? [r.data] : [];
  });
  return NextResponse.json(validas);
}
