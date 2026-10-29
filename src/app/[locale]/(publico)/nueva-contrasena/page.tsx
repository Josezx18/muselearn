import { FormularioNuevaContrasena } from "@/components/auth/FormularioNuevaContrasena";
import { configSupabase } from "@/lib/supabase/config";
import { crearClienteServidor } from "@/lib/supabase/servidor";

// Solo sirve con la sesión que abre el enlace del correo de recuperación.
export default async function PaginaNuevaContrasena() {
  let conSesion = false;
  if (configSupabase() && process.env.NEXT_PUBLIC_USAR_MOCKS !== "true") {
    const { data } = await (await crearClienteServidor()).auth.getUser();
    conSesion = Boolean(data.user);
  } else {
    conSesion = true; // modo demo: se muestra el formulario
  }
  return <FormularioNuevaContrasena conSesion={conSesion} />;
}
