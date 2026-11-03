-- Revisión con IA guardada por entrega (T21 + "Revisar todas"): el docente la lee al recorrer las entregas sin
-- volver a gastar cupo. Solo la escribe el servidor (service_role) después de comprobar que la tarea es del docente.
-- `entregada_en` guarda la versión revisada: si el estudiante vuelve a entregar, la revisión queda desactualizada.
create table if not exists revisiones_ia (
  entrega_id uuid primary key references entregas(id) on delete cascade,
  revision jsonb not null,
  entregada_en timestamptz,
  creada_en timestamptz not null default now()
);

alter table revisiones_ia enable row level security;

drop policy if exists revisiones_ia_docente_lee on revisiones_ia;
create policy revisiones_ia_docente_lee on revisiones_ia for select to authenticated
  using (exists (select 1 from entregas e where e.id = entrega_id and public.es_docente_de_tarea(e.tarea_id)));

revoke all on revisiones_ia from anon;
revoke all on revisiones_ia from authenticated;
grant select on revisiones_ia to authenticated;
grant all on revisiones_ia to service_role;
