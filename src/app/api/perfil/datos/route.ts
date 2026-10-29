import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { exportarDatos } from "@/lib/db/cuenta";

// GET /api/perfil/datos — descarga en JSON de todos los datos del usuario (derecho de acceso).
export async function GET() {
  const actual = await obtenerUsuarioActual();
  if (!actual)
    return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  const datos = await exportarDatos(actual.db, actual.usuario, actual.correo);
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(datos, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="muselearn-mis-datos-${fecha}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
