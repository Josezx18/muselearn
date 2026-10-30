import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { marcarAvisosLeidos } from "@/lib/db/avisos";
import { errorHttp } from "@/lib/db/http";
import { z } from "zod";

const Entrada = z.object({
  ids: z.array(z.string().uuid()).optional(),
});

export async function POST(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");

  const entrada = Entrada.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success) return errorHttp(400, "datos_invalidos", "IDs de avisos inválidos.");

  try {
    await marcarAvisosLeidos(actual.usuario.id, entrada.data.ids);
    return NextResponse.json({ ok: true });
  } catch {
    return errorHttp(500, "error_interno", "No se pudieron marcar los avisos como leídos.");
  }
}