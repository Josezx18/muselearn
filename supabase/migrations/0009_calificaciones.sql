-- T09: preparada para el integrador; NO aplicada desde esta ficha.
create table public.calificaciones (
  entrega_id uuid primary key references public.entregas(id) on delete cascade,
  docente_id uuid not null references public.perfiles(id) on delete cascade,
  nota numeric(5,2) null check (nota between 0 and 100),
  devuelta boolean not null default false,
  motivo_devolucion text null check (char_length(motivo_devolucion) <= 1000),
  actualizado_en timestamptz not null default now()
);
alter table public.calificaciones enable row level security;
create policy calificaciones_leer on public.calificaciones for select to authenticated
  using (exists (select 1 from public.entregas e where e.id = entrega_id
    and (e.estudiante_id = auth.uid() or public.es_docente_de_tarea(e.tarea_id))));
create policy calificaciones_insertar on public.calificaciones for insert to authenticated
  with check (docente_id = auth.uid() and exists (select 1 from public.entregas e
    where e.id = entrega_id and public.es_docente_de_tarea(e.tarea_id)));
create policy calificaciones_editar on public.calificaciones for update to authenticated
  using (exists (select 1 from public.entregas e where e.id = entrega_id and public.es_docente_de_tarea(e.tarea_id)))
  with check (docente_id = auth.uid() and exists (select 1 from public.entregas e
    where e.id = entrega_id and public.es_docente_de_tarea(e.tarea_id)));
create policy calificaciones_borrar on public.calificaciones for delete to authenticated
  using (exists (select 1 from public.entregas e where e.id = entrega_id and public.es_docente_de_tarea(e.tarea_id)));
grant select, insert, update, delete on public.calificaciones to authenticated;
revoke all on public.calificaciones from anon;
grant all on public.calificaciones to service_role;

-- Invocada exclusivamente por admin tras comprobar la sesión y la pertenencia en el endpoint.
-- Bloqueo de fila y transacción: evita guardar la devolución sin desbloquear la entrega.
create function public.devolver_entrega(p_entrega_id uuid, p_docente_id uuid, p_motivo text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare resultado public.calificaciones;
begin
  if p_motivo is null or char_length(btrim(p_motivo)) not between 1 and 1000 then
    raise exception 'motivo_invalido';
  end if;
  perform e.id from public.entregas e
    join public.tareas t on t.id = e.tarea_id
    join public.clases c on c.id = t.clase_id
    where e.id = p_entrega_id and c.docente_id = p_docente_id for update of e;
  if not found then raise exception 'entrega_no_permitida'; end if;
  insert into public.calificaciones (entrega_id, docente_id, devuelta, motivo_devolucion)
    values (p_entrega_id, p_docente_id, true, btrim(p_motivo))
    on conflict (entrega_id) do update set devuelta = true,
      motivo_devolucion = excluded.motivo_devolucion, docente_id = excluded.docente_id, actualizado_en = now()
    returning * into resultado;
  update public.entregas set estado = 'pendiente' where id = p_entrega_id;
  return to_jsonb(resultado);
end;
$$;
revoke all on function public.devolver_entrega(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.devolver_entrega(uuid, uuid, text) to service_role;
