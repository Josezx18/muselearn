-- T28: preparar para el integrador; no ejecutar en producción desde esta ficha.
create table if not exists public.materiales_estudio (
  tarea_id uuid primary key references public.tareas(id) on delete cascade,
  contenido jsonb not null,
  publicado boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
alter table public.materiales_estudio enable row level security;
drop policy if exists material_leer on public.materiales_estudio;
create policy material_leer on public.materiales_estudio for select to authenticated
  using (es_docente_de_tarea(tarea_id) or (esta_inscrito_en_tarea(tarea_id) and publicado));
grant select on public.materiales_estudio to authenticated;
revoke insert, update, delete on public.materiales_estudio from authenticated;
revoke all on public.materiales_estudio from anon;
grant all on public.materiales_estudio to service_role;
-- Nombre generado por el CHECK de columna en 0007_ia_docente.sql.
alter table public.uso_ia_docente drop constraint if exists uso_ia_docente_funcion_check;
alter table public.uso_ia_docente add constraint uso_ia_docente_funcion_check
  check (funcion in ('proponer_tarea', 'sugerir_repaso', 'borrador_comentario', 'material_estudio'));
