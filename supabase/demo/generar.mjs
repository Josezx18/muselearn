// Genera el SQL desde los mismos módulos de datos que usa la demo sin claves.
// Solo escribe archivos locales. Nunca se conecta a Supabase.
import ts from "typescript";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const cache = new Map();
function cargar(archivo) {
  const ruta = resolve(raiz, archivo);
  if (cache.has(ruta)) return cache.get(ruta).exports;
  const modulo = { exports: {} };
  cache.set(ruta, modulo);
  const codigo = ts.transpileModule(readFileSync(ruta, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const importar = (nombre) => nombre.startsWith("@/")
    ? cargar(`src/${nombre.slice(2)}.ts`)
    : nombre.startsWith(".") ? cargar(resolve(dirname(ruta), `${nombre}.ts`)) : require(nombre);
  // Ejecuta exclusivamente módulos locales versionados, con resolución de alias TypeScript.
  new Function("require", "module", "exports", codigo)(importar, modulo, modulo.exports);
  return modulo.exports;
}

const { usuariosMock, clasesMock } = cargar("src/lib/mocks/clases.ts");
const { tareasMock, entregasMock } = cargar("src/lib/mocks/tareas.ts");
const { analisisMock, planSemanalMock } = cargar("src/lib/mocks/ia.ts");
const { preferenciasMock } = cargar("src/lib/mocks/estudiante.ts");
const { informesClaseMock, rutaMock, respuestasDemo } = cargar("src/lib/mocks/informes.ts");
const { sesionVerificacionMock } = cargar("src/lib/mocks/conversacion.ts");
const { id, IDS } = cargar("src/lib/mocks/base.ts");
const contratos = cargar("src/types/contratos.ts");
const cuentas = usuariosMock.map((u, i) => ({ ...u, correo: `${["docente", "camila", "luis", "sofia", "diego", "valeria", "yandel", "alondra", "dariel", "nayeli", "elian", "kiara", "jadiel"][i]}@muselearn.demo` }));
const rutas = informesClaseMock.map((informe) => ({ ...rutaMock, entrega_id: informe.entrega_id }));
const sesiones = informesClaseMock.map((informe, i) => ({
  id: i === 0 ? IDS.verificacion : id(410 + i), entrega_id: informe.entrega_id, estado: "completada",
  preguntas: sesionVerificacionMock.preguntas.map((p, j) => ({ ...p, respuesta: i === 0 ? p.respuesta : respuestasDemo(i)[j] })),
}));
const comentarios = entregasMock.filter((e) => e.entregada_en).map((e) => ({
  entrega_id: e.id, docente_id: IDS.docente,
  texto: e.id === id(330)
    ? "En y = 2x + 1 primero multiplica 2 por x. Revisa la tabla, comprueba los puntos y vuelve a entregar."
    : "Gracias por mostrar tu procedimiento. Explica cada operación y comprueba sustituyendo tu resultado.",
  actualizado_en: planSemanalMock.generado_en,
}));
const calificaciones = comentarios.map((c, i) => ({
  entrega_id: c.entrega_id, docente_id: IDS.docente, nota: i < 12 ? [88, 85, 45, 100, 58, 90, 55, 96, null, 78, 82, 91][i] : c.entrega_id === id(330) ? 40 : null,
  devuelta: c.entrega_id === id(330), motivo_devolucion: c.entrega_id === id(330) ? c.texto : null, actualizado_en: c.actualizado_en,
}));
const planes = [planSemanalMock, {
  ...planSemanalMock,
  semana_inicio: new Date(new Date(`${planSemanalMock.semana_inicio}T12:00:00`).getTime() + 7 * 86400000).toISOString().slice(0, 10),
  bloques: planSemanalMock.bloques.map((b) => ({ ...b, id: `${b.id}-proxima`,
    inicio: new Date(new Date(b.inicio).getTime() + 7 * 86400000).toISOString(),
    fin: new Date(new Date(b.fin).getTime() + 7 * 86400000).toISOString(),
  })),
}];
const analisis = cuentas.filter((u) => u.rol === "estudiante").flatMap((u) => analisisMock.map((a) => ({ ...a, estudiante_id: u.id })));
const datos = { cuentas, clases: clasesMock, tareas: tareasMock, entregas: entregasMock, analisis,
  informes: informesClaseMock, rutas, sesiones, comentarios, calificaciones, planes, preferencias: [preferenciasMock] };
for (const [campo, esquema] of Object.entries({ cuentas: contratos.Usuario, clases: contratos.Clase, tareas: contratos.Tarea,
  entregas: contratos.Entrega, analisis: contratos.AnalisisTarea, informes: contratos.InformeComprension,
  rutas: contratos.RutaPractica, sesiones: contratos.SesionVerificacion, planes: contratos.PlanSemanal, preferencias: contratos.PreferenciasEstudio,
  comentarios: contratos.ComentarioDocente })) esquema.array().parse(datos[campo]);
writeFileSync(resolve(raiz, "supabase/demo/cuentas.json"), JSON.stringify(cuentas, null, 2) + "\n");
writeFileSync(resolve(raiz, "supabase/demo/objetos.json"), JSON.stringify(datos, null, 2) + "\n");

// Fechas relativas al lunes en Santo Domingo (UTC-4), independientes de cuándo se genere el archivo.
const lunes = new Date(`${planSemanalMock.semana_inicio}T00:00:00`);
const plantilla = JSON.stringify(datos, (_clave, valor) => {
  if (typeof valor !== "string" || !/^\d{4}-\d\d-\d\d(?:T|$)/.test(valor)) return valor;
  const fecha = new Date(valor.length === 10 ? `${valor}T00:00:00` : valor);
  const dia = Math.round((new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) - lunes) / 86400000);
  return valor.length === 10 ? `@dia:${dia}@` : `@fecha:${dia}:${fecha.getHours()}:${fecha.getMinutes()}@`;
});
const sql = `-- Generado por node supabase/demo/generar.mjs. Datos 100 % ficticios.
-- Ejecutar únicamente en un proyecto de demo, tras seed:auth y migraciones 0001-0009.
begin;
set local timezone = 'America/Santo_Domingo';
do $demo$
declare
  datos jsonb;
  texto text := '${plantilla.replaceAll("'", "''")}';
  coincidencia text[];
  lunes date := date_trunc('week', current_date)::date;
  fila jsonb;
begin
  -- Aborta antes de escribir si una cuenta falta o un ID pertenece a otra persona.
  for fila in select value from jsonb_array_elements('${JSON.stringify(cuentas).replaceAll("'", "''")}'::jsonb) loop
    if not exists (select 1 from auth.users where id = (fila->>'id')::uuid and email = fila->>'correo' and email like '%@muselearn.demo') then
      raise exception 'Falta cuenta demo o ID ocupado: %; ejecutar seed:auth', fila->>'correo';
    end if;
  end loop;
  for coincidencia in select regexp_matches(texto, '@fecha:(-?[0-9]+):([0-9]+):([0-9]+)@', 'g') loop
    texto := replace(texto, '@fecha:' || array_to_string(coincidencia, ':') || '@',
      to_char((lunes + coincidencia[1]::int + make_time(coincidencia[2]::int, coincidencia[3]::int, 0)) at time zone 'America/Santo_Domingo' at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
  end loop;
  for coincidencia in select regexp_matches(texto, '@dia:(-?[0-9]+)@', 'g') loop
    texto := replace(texto, '@dia:' || coincidencia[1] || '@', (lunes + coincidencia[1]::int)::text);
  end loop;
  datos := texto::jsonb;
  -- Las clases/tareas ya existentes deben pertenecer exclusivamente a cuentas demo.
  if exists (select 1 from clases c join jsonb_array_elements(datos->'clases') j on c.id = (j->>'id')::uuid
    where c.docente_id <> (j->>'docente_id')::uuid)
    or exists (select 1 from tareas t join jsonb_array_elements(datos->'tareas') j on t.id = (j->>'id')::uuid
      where t.clase_id <> (j->>'clase_id')::uuid) then
    raise exception 'ID de clase/tarea ocupado fuera del conjunto demo';
  end if;
  if exists (select 1 from inscripciones i join jsonb_array_elements(datos->'clases') j on i.clase_id = (j->>'id')::uuid
    where not exists (select 1 from jsonb_array_elements(datos->'cuentas') u where (u->>'id')::uuid = i.estudiante_id)) then
    raise exception 'Clase demo con estudiantes ajenos; no se modifica';
  end if;
  insert into clases select * from jsonb_populate_recordset(null::clases, datos->'clases')
    on conflict (id) do update set nombre = excluded.nombre, materia = excluded.materia, grado = excluded.grado;
  insert into inscripciones (clase_id, estudiante_id)
    select (c->>'id')::uuid, (u->>'id')::uuid from jsonb_array_elements(datos->'clases') c cross join jsonb_array_elements(datos->'cuentas') u
    where u->>'rol' = 'estudiante' on conflict do nothing;
  insert into tareas select * from jsonb_populate_recordset(null::tareas, datos->'tareas')
    on conflict (id) do update set titulo = excluded.titulo, instrucciones = excluded.instrucciones,
      fecha_entrega = excluded.fecha_entrega, competencias = excluded.competencias, nivel_ayuda = excluded.nivel_ayuda,
      modalidad = excluded.modalidad, enlace_externo = excluded.enlace_externo;
  -- Solo reinicia evidencia de estos IDs fijos y estas cuentas ficticias. Nunca borra tareas ni perfiles.
  if exists (select 1 from entregas e join jsonb_array_elements(datos->'entregas') j on e.id = (j->>'id')::uuid
    where e.estudiante_id <> (j->>'estudiante_id')::uuid or e.tarea_id <> (j->>'tarea_id')::uuid) then
    raise exception 'ID de entrega ocupado fuera del conjunto demo';
  end if;
  delete from entregas e using jsonb_array_elements(datos->'entregas') j
    where e.id = (j->>'id')::uuid and e.estudiante_id = (j->>'estudiante_id')::uuid;
  insert into entregas select * from jsonb_populate_recordset(null::entregas, datos->'entregas');
  insert into analisis_tareas (tarea_id, estudiante_id, datos)
    select (j->>'tarea_id')::uuid, (j->>'estudiante_id')::uuid, j from jsonb_array_elements(datos->'analisis') j
    on conflict (tarea_id, estudiante_id) do update set datos = excluded.datos;
  insert into sesiones_verificacion (id, entrega_id, preguntas, estado)
    select (j->>'id')::uuid, (j->>'entrega_id')::uuid, j->'preguntas', j->>'estado' from jsonb_array_elements(datos->'sesiones') j;
  insert into informes (entrega_id, informe, ruta)
    select (j->>'entrega_id')::uuid, j, (select r from jsonb_array_elements(datos->'rutas') r where r->>'entrega_id' = j->>'entrega_id')
    from jsonb_array_elements(datos->'informes') j on conflict (entrega_id) do update set informe = excluded.informe, ruta = excluded.ruta;
  insert into comentarios_entrega select * from jsonb_populate_recordset(null::comentarios_entrega, datos->'comentarios')
    on conflict (entrega_id) do update set texto = excluded.texto, actualizado_en = excluded.actualizado_en;
  insert into calificaciones select * from jsonb_populate_recordset(null::calificaciones, datos->'calificaciones')
    on conflict (entrega_id) do update set nota = excluded.nota, devuelta = excluded.devuelta, motivo_devolucion = excluded.motivo_devolucion;
  insert into preferencias_estudio (estudiante_id, datos)
    select (j->>'estudiante_id')::uuid, j from jsonb_array_elements(datos->'preferencias') j
    on conflict (estudiante_id) do update set datos = excluded.datos;
  insert into planes (estudiante_id, semana_inicio, datos)
    select (j->>'estudiante_id')::uuid, (j->>'semana_inicio')::date, j from jsonb_array_elements(datos->'planes') j
    on conflict (estudiante_id, semana_inicio) do update set datos = excluded.datos;
end $demo$;
commit;
`;
writeFileSync(resolve(raiz, "supabase/seed-demo.sql"), sql);
console.log("Generados seed-demo.sql, objetos.json y cuentas.json; sin conexión a base de datos.");
