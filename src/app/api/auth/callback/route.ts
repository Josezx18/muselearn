import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { idiomaValido, nombreDesdeProveedor, rolParaCuentaNueva } from "@/lib/auth/externo";
import { inicioPorRol } from "@/lib/db/validacion";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/servidor";
import { Rol } from "@/types/contratos";

// GET /api/auth/callback — vuelta de Google o del correo de recuperación de contraseña.
// - ?code=…              (PKCE: Google, o el correo con la plantilla de Supabase por defecto)
// - ?token_hash=…&type=recovery (correo con la plantilla recomendada: funciona aunque se abra en otro navegador)
// Después: si la cuenta es nueva (Google), crea el perfil con el rol elegido (estudiante por defecto).
// Está bajo /api para que el proxy de idiomas no la reescriba.
export async function GET(peticion: NextRequest) {
  const url = new URL(peticion.url);
  const q = url.searchParams;
  const locale = idiomaValido(q.get("locale"));
  const ir = (ruta: string) => NextResponse.redirect(new URL(`/${locale}${ruta}`, url.origin));
  const recuperacion = q.get("siguiente") === "nueva-contrasena" || q.get("type") === "recovery";

  const db = await crearClienteServidor();
  let usuario: User | null = null;
  const code = q.get("code");
  const tokenHash = q.get("token_hash");
  if (code) {
    const { data, error } = await db.auth.exchangeCodeForSession(code);
    if (error) console.warn(`[auth/callback] código: ${error.message}`);
    usuario = data.user ?? null;
  } else if (tokenHash && q.get("type") === "recovery") {
    const { data, error } = await db.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    if (error) console.warn(`[auth/callback] token: ${error.message}`);
    usuario = data.user ?? null;
  }
  if (!usuario) return ir(recuperacion ? "/recuperar?error=enlace" : "/login?error=google");
  if (recuperacion) return ir("/nueva-contrasena");

  // ¿Ya tiene perfil? (cuenta creada antes con correo y contraseña, o una entrada anterior con Google)
  const admin = crearClienteAdmin();
  const { data: perfil } = await admin.from("perfiles").select("rol").eq("id", usuario.id).maybeSingle();
  let rol = Rol.safeParse(perfil?.rol).data;

  if (!rol) {
    rol = rolParaCuentaNueva(q.get("rol"));
    const { error: errorPerfil } = await admin
      .from("perfiles")
      .insert({ id: usuario.id, rol, nombre: nombreDesdeProveedor(usuario), idioma: locale });
    if (errorPerfil) {
      console.error(`[auth/callback] no se pudo crear el perfil: ${errorPerfil.message}`);
      await db.auth.signOut();
      return ir("/login?error=google");
    }
  }
  // El rol va en app_metadata (el usuario no lo puede cambiar); el proxy lo lee del token.
  if (usuario.app_metadata?.rol !== rol) {
    await admin.auth.admin.updateUserById(usuario.id, { app_metadata: { rol } });
    await db.auth.refreshSession(); // token nuevo con el rol
  }
  return ir(inicioPorRol(rol));
}
