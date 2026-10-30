// Solo cuentas ficticias @muselearn.demo. Ejecutar únicamente en el proyecto de demo.
// node --env-file=.env.local --experimental-strip-types supabase/seed-auth.ts
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { z } from "zod";

const cuentas = z.array(z.object({
  id: z.string().uuid(), correo: z.email().endsWith("@muselearn.demo"),
  nombre: z.string().min(2), rol: z.enum(["docente", "estudiante"]), idioma: z.literal("es"),
})).parse(JSON.parse(readFileSync(new URL("./demo/cuentas.json", import.meta.url), "utf8")));
const contrasena = process.env.DEMO_CONTRASENA;
if (!contrasena || contrasena.length < 12) throw new Error("Define DEMO_CONTRASENA (mínimo 12 caracteres) solo en .env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
const admin = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });

// Preflight completo: un ID o correo ajeno detiene el seed antes de modificar cuentas.
const existentes = [];
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  existentes.push(...data.users);
  if (data.users.length < 1000) break;
}
for (const cuenta of cuentas) {
  const porId = existentes.find((u) => u.id === cuenta.id);
  const porCorreo = existentes.find((u) => u.email === cuenta.correo);
  if ((porId && porId.email !== cuenta.correo) || (porCorreo && porCorreo.id !== cuenta.id)) {
    throw new Error(`ID/correo ocupado: ${cuenta.correo}. No se modifica ni elimina esa cuenta.`);
  }
}
for (const cuenta of cuentas) {
  const atributos = { password: contrasena, email_confirm: true,
    app_metadata: { rol: cuenta.rol }, user_metadata: { nombre: cuenta.nombre } };
  const { error } = existentes.some((u) => u.id === cuenta.id)
    ? await admin.auth.admin.updateUserById(cuenta.id, atributos)
    : await admin.auth.admin.createUser({ ...atributos, id: cuenta.id, email: cuenta.correo });
  if (error) throw error;
  const { correo: _correo, ...perfil } = cuenta;
  void _correo;
  const { error: errorPerfil } = await admin.from("perfiles").upsert(perfil, { onConflict: "id" });
  if (errorPerfil) throw errorPerfil;
  console.log(`Lista: ${cuenta.correo} (${cuenta.rol})`);
}
console.log("13 cuentas listas. Ejecuta supabase/seed-demo.sql en este mismo proyecto de demo.");
