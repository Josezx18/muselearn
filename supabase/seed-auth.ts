// Usuarios de demo (datos 100% ficticios). Idempotente: se puede ejecutar varias veces.
// Uso:  node --env-file=.env.local --experimental-strip-types supabase/seed-auth.ts
// Necesita NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.
import { createClient } from "@supabase/supabase-js";

const CONTRASENA_DEMO = process.env.DEMO_CONTRASENA ?? "Demo-Muse-2026";

const docente = { correo: "docente@demo.muselearn", nombre: "Prof. Ana Rodríguez", rol: "docente" } as const;
const estudiantes = [
  { correo: "camila@demo.muselearn", nombre: "Camila Pérez", rol: "estudiante" },
  { correo: "luis@demo.muselearn", nombre: "Luis Martínez", rol: "estudiante" },
  { correo: "sofia@demo.muselearn", nombre: "Sofía Gómez", rol: "estudiante" },
  { correo: "diego@demo.muselearn", nombre: "Diego Fernández", rol: "estudiante" },
  { correo: "valeria@demo.muselearn", nombre: "Valeria Santos", rol: "estudiante" },
] as const;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !claveServicio) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");

const admin = createClient(url, claveServicio, { auth: { persistSession: false } });

async function asegurarUsuario(u: { correo: string; nombre: string; rol: "docente" | "estudiante" }): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.correo,
    password: CONTRASENA_DEMO,
    email_confirm: true,
    app_metadata: { rol: u.rol },
    user_metadata: { nombre: u.nombre },
  });
  let id = data.user?.id;
  if (error) {
    // Ya existe: lo buscamos y dejamos la contraseña y el rol como en el seed.
    const { data: lista, error: errorLista } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (errorLista) throw errorLista;
    const existente = lista.users.find((x) => x.email === u.correo);
    if (!existente) throw error;
    id = existente.id;
    await admin.auth.admin.updateUserById(id, { password: CONTRASENA_DEMO, app_metadata: { rol: u.rol } });
  }
  if (!id) throw new Error(`No se obtuvo el id de ${u.correo}`);
  const { error: errorPerfil } = await admin.from("perfiles").upsert({ id, rol: u.rol, nombre: u.nombre, idioma: "es" });
  if (errorPerfil) throw errorPerfil;
  return id;
}

const docenteId = await asegurarUsuario(docente);
const estudianteIds = await Promise.all(estudiantes.map(asegurarUsuario));

// Clase de demo con un código fijo y fácil de recordar para la presentación.
const { data: clase, error: errorClase } = await admin
  .from("clases")
  .upsert(
    { docente_id: docenteId, nombre: "Matemática 4to A", materia: "Matemática", grado: "4to", codigo_inscripcion: "MAT4KQ" },
    { onConflict: "codigo_inscripcion" },
  )
  .select("id")
  .single();
if (errorClase) throw errorClase;

const { error: errorInscripciones } = await admin
  .from("inscripciones")
  .upsert(estudianteIds.map((id) => ({ clase_id: clase.id, estudiante_id: id })));
if (errorInscripciones) throw errorInscripciones;

console.log(`Listo. Docente: ${docente.correo}`);
for (const e of estudiantes) console.log(`       Estudiante: ${e.correo}`);
console.log(`Contraseña de todos: ${CONTRASENA_DEMO}`);
console.log("Clase de demo: Matemática 4to A (código MAT4KQ)");
