import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { errorHttp } from "@/lib/db/http";
import { obtenerUsuarioActual } from "@/lib/db/sesion";
import { configSupabase } from "@/lib/supabase/config";

const Entrada = z.object({ actual: z.string().min(1).max(200), nueva: z.string().min(8).max(200) });

// POST /api/perfil/contrasena — cambia la contraseña después de comprobar la actual.
export async function POST(peticion: Request) {
  const actual = await obtenerUsuarioActual();
  if (!actual) return errorHttp(401, "no_autenticado", "Inicia sesión para continuar.");
  const entrada = Entrada.safeParse(await peticion.json().catch(() => null));
  if (!entrada.success) return errorHttp(400, "contrasena_corta", "La nueva contraseña debe tener al menos 8 caracteres.");
  if (entrada.data.actual === entrada.data.nueva) return errorHttp(400, "contrasena_igual", "La nueva contraseña debe ser distinta.");

  const config = configSupabase();
  if (!config || !actual.correo) return errorHttp(500, "error_interno", "No se pudo cambiar la contraseña.");
  // Se comprueba la contraseña actual con un cliente aparte, sin tocar las cookies de la sesión.
  const comprobador = createClient(config.url, config.clave, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: errorActual } = await comprobador.auth.signInWithPassword({ email: actual.correo, password: entrada.data.actual });
  if (errorActual) return errorHttp(400, "contrasena_incorrecta", "La contraseña actual no es correcta.");

  const { error } = await actual.db.auth.updateUser({ password: entrada.data.nueva });
  if (error) return errorHttp(500, "error_interno", "No se pudo cambiar la contraseña.");
  return NextResponse.json({ ok: true });
}
