import { NextResponse } from "next/server";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { puedeVerArchivo } from "@/lib/db/gestion";
import { BUCKET_ADJUNTOS } from "@/lib/db/almacenamiento";
import { crearClienteAdmin } from "@/lib/supabase/servidor";

// GET /api/archivos?ruta=… — abre un adjunto (de una tarea o de una entrega) si el usuario tiene acceso.
// Redirige a una URL firmada que vence en 5 minutos: el bucket es privado.
export async function GET(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  const ruta = new URL(peticion.url).searchParams.get("ruta") ?? "";
  if (!ruta || !(await puedeVerArchivo(actual.db, actual.usuario.id, ruta))) {
    return errorHttp(404, "no_encontrado", "Archivo no encontrado.");
  }
  const { data, error } = await crearClienteAdmin().storage.from(BUCKET_ADJUNTOS).createSignedUrl(ruta, 300);
  if (error || !data) return errorHttp(404, "no_encontrado", "Archivo no encontrado.");
  return NextResponse.redirect(data.signedUrl, 302);
}
