-- Hallazgo H01 de T18: un estudiante podía cambiar el tarea_id (o el estudiante_id) de su propia entrega
-- y "trasladarla" a una tarea de otra clase. Ahora:
-- 1) La identidad de una entrega (tarea_id, estudiante_id) no cambia nunca para los usuarios con sesión.
--    Se hace con un trigger (y no con permisos por columna) porque el servidor guarda las entregas con
--    upsert, que reescribe esas columnas con el mismo valor.
-- 2) Al editar, el estudiante debe seguir inscrito en la clase de la tarea.
-- El servidor (service_role) no se ve afectado.

create or replace function public.entregas_identidad_fija()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.tarea_id is distinct from old.tarea_id or new.estudiante_id is distinct from old.estudiante_id) then
    raise exception 'no se puede cambiar la tarea ni el estudiante de una entrega' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists entregas_identidad_fija on public.entregas;
create trigger entregas_identidad_fija
  before update on public.entregas
  for each row execute function public.entregas_identidad_fija();

drop policy if exists entregas_editar on public.entregas;
create policy entregas_editar on public.entregas for update
  using (estudiante_id = auth.uid())
  with check (estudiante_id = auth.uid() and public.esta_inscrito_en_tarea(tarea_id));
