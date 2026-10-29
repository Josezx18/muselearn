import { NextResponse } from "next/server";
import { z } from "zod";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { eliminarCuenta } from "@/lib/db/cuenta";
import { crearClienteAdmin } from "@/lib/supabase/servidor";

// La palabra que se escribe para confirmar, en cualquier idioma de la app.
const Entrada = z.object({
  confirmacion: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.enum(["ELIMINAR", "DELETE"])),
});

// POST /api/perfil/eliminar { confirmacion: "ELIMINAR" } — elimina la cuenta y todos sus datos. No se puede deshacer.
export async function POST(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual)
    return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  if (!Entrada.safeParse(await peticion.json().catch(() => null)).success) {
    return errorHttp(400, "sin_confirmar", "Escribe ELIMINAR para confirmar.");
  }
  try {
    await eliminarCuenta(crearClienteAdmin(), actual.usuario);
    await actual.db.auth.signOut().catch(() => {}); // la sesión ya no vale: se limpian las cookies
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(`[cuenta] eliminar: ${(e as Error).message}`);
    return errorHttp(500, "error_interno", "No se pudo eliminar la cuenta.");
  }
}
