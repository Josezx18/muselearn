// Prueba aislada: requiere PostgreSQL local en 127.0.0.1:55415, usuario demo.
// No lee .env.local ni acepta URL remota. Crea una base nueva y la conserva para inspección.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const psql = process.argv[2] ?? "psql";
const base = `muselearn_t15_${Date.now()}`;
function ejecutar(sql, db = base, falla = false) {
  const r = spawnSync(psql, ["-X", "-h", "127.0.0.1", "-p", "55415", "-U", "demo", "-d", db, "-v", "ON_ERROR_STOP=1", "-At"], { input: sql, encoding: "utf8" });
  if (r.error) throw r.error;
  if (falla) assert.notEqual(r.status, 0, "Debe rechazar el conjunto ajeno");
  else assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}
ejecutar(`create database ${base};`, "postgres");
const datos = JSON.parse(readFileSync("supabase/demo/objetos.json", "utf8"));
const q = (v) => `'${v.replaceAll("'", "''")}'`;
const tablaComentarios = readFileSync("supabase/migrations/0007_ia_docente.sql", "utf8").split("alter table comentarios_entrega")[0];
const tablaNotas = readFileSync("supabase/migrations/0009_calificaciones.sql", "utf8").split("alter table public.calificaciones")[0];
ejecutar(`create schema auth; create table auth.users (id uuid primary key, email text unique);
${readFileSync("supabase/migrations/0001_inicial.sql", "utf8")}
alter table tareas add column modalidad text not null default 'muselearn', add column enlace_externo text;
alter table entregas add column entregada_externamente boolean not null default false;
${tablaComentarios}
${tablaNotas}
insert into auth.users values ${datos.cuentas.map((u) => `(${q(u.id)}, ${q(u.correo)})`).join(",")};
insert into perfiles (id, nombre, rol) values ${datos.cuentas.map((u) => `(${q(u.id)}, ${q(u.nombre)}, ${q(u.rol)})`).join(",")};
insert into auth.users values ('99999999-0000-4000-8000-000000000001', 'centinela@centro.example');
insert into perfiles (id, nombre, rol) values ('99999999-0000-4000-8000-000000000001', 'Centinela ficticio ajeno', 'docente');
insert into clases (id, docente_id, nombre, materia, grado, codigo_inscripcion) values
('99999999-0000-4000-8000-000000000002', '99999999-0000-4000-8000-000000000001', 'No modificar', 'Prueba', '4to', 'ZZZZZZ');`);
const seed = readFileSync("supabase/seed-demo.sql", "utf8");
const tablas = ["auth.users", "perfiles", "clases", "inscripciones", "tareas", "entregas", "analisis_tareas", "sesiones_verificacion", "informes", "comentarios_entrega", "calificaciones", "planes", "preferencias_estudio"];
const foto = () => ejecutar(tablas.map((t) => `select coalesce(jsonb_agg(f order by f::text), '[]') from (select to_jsonb(t) - 'creado_en' - 'creada_en' - 'actualizado_en' - 'inscrito_en' as f from ${t} t) x;`).join("\n"));
ejecutar(seed);
const primera = foto();
ejecutar(seed);
assert.equal(foto(), primera, "Dos ejecuciones deben dejar los mismos datos, IDs y cantidades");
assert.equal(ejecutar("select count(*) from tareas;"), "8");
assert.equal(ejecutar("select count(*) from inscripciones;"), "24");
assert.equal(ejecutar("select count(*) from informes where (informe->>'nivel_global')::int < 3;"), "3");
assert.equal(ejecutar("select count(*) from calificaciones c join entregas e on e.id = c.entrega_id where c.devuelta and e.estado = 'pendiente';"), "1");
assert.equal(ejecutar("select nombre from clases where codigo_inscripcion = 'ZZZZZZ';"), "No modificar");
ejecutar(`update auth.users set email = 'ocupado@centro.example' where id = ${q(datos.cuentas[0].id)};`);
const ajena = foto();
ejecutar(seed, base, true);
assert.equal(foto(), ajena, "El fallo debe revertir todos los cambios");
ejecutar(`update auth.users set email = ${q(datos.cuentas[0].correo)} where id = ${q(datos.cuentas[0].id)};
update clases set docente_id = '99999999-0000-4000-8000-000000000001' where id = ${q(datos.clases[0].id)};`);
const claseAjena = foto();
ejecutar(seed, base, true);
assert.equal(foto(), claseAjena);
console.log(`OK: doble ejecución, 24 inscripciones, 3 necesitan apoyo, devolución y preservación de filas ajenas. Base local: ${base}`);
