-- 1) Dónde se hace y se entrega cada tarea: en MuseLearn, en el cuaderno, en Google Classroom o en otra
--    plataforma (Moodle, Teams…), con su enlace. Si se entrega fuera, el estudiante igual sube una evidencia
--    en MuseLearn y marca que ya la entregó allá, para poder hacer la verificación.
alter table tareas
  add column if not exists modalidad text not null default 'muselearn'
    check (modalidad in ('muselearn', 'cuaderno', 'classroom', 'otra')),
  add column if not exists enlace_externo text
    check (enlace_externo is null or (char_length(enlace_externo) <= 500 and enlace_externo ~* '^https?://'));

alter table entregas
  add column if not exists entregada_externamente boolean not null default false;

-- 2) Tareas importadas de otra plataforma (por ahora Classroom): evita importar dos veces la misma.
create table if not exists tareas_vinculadas (
  tarea_id uuid primary key references tareas(id) on delete cascade,
  clase_id uuid not null references clases(id) on delete cascade,
  proveedor text not null check (proveedor in ('classroom')),
  externo_id text not null,
  sincronizada_en timestamptz not null default now(),
  unique (clase_id, proveedor, externo_id)
);

alter table tareas_vinculadas enable row level security;

drop policy if exists tareas_vinculadas_docente on tareas_vinculadas;
create policy tareas_vinculadas_docente on tareas_vinculadas for all
  using (es_docente_de_clase(clase_id))
  with check (es_docente_de_clase(clase_id));

grant select, insert, update, delete on tareas_vinculadas to authenticated;
revoke all on tareas_vinculadas from anon;

-- 3) Aceptación de los Términos de uso y la Política de privacidad. La escribe el servidor (service_role)
--    cuando el usuario acepta: el usuario no puede cambiarla directamente (perfiles solo permite
--    actualizar nombre, idioma, tema y mascota).
alter table perfiles
  add column if not exists terminos_version text,
  add column if not exists terminos_aceptados_en timestamptz;
