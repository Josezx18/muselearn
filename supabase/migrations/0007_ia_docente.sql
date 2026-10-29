-- IA para el docente: comentarios del docente en cada entrega y registro de uso de la IA del docente
-- (para el tope diario, igual que los del estudiante).

-- Comentario del docente sobre una entrega. Lo escribe el docente de la tarea; lo leen él y el estudiante.
create table if not exists comentarios_entrega (
  entrega_id uuid primary key references entregas(id) on delete cascade,
  docente_id uuid not null references perfiles(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 4000),
  actualizado_en timestamptz not null default now()
);

alter table comentarios_entrega enable row level security;

drop policy if exists comentarios_leer on comentarios_entrega;
create policy comentarios_leer on comentarios_entrega for select
  using (
    exists (
      select 1 from entregas e
      where e.id = entrega_id and (e.estudiante_id = auth.uid() or es_docente_de_tarea(e.tarea_id))
    )
  );

drop policy if exists comentarios_escribir on comentarios_entrega;
create policy comentarios_escribir on comentarios_entrega for insert
  with check (
    docente_id = auth.uid()
    and exists (select 1 from entregas e where e.id = entrega_id and es_docente_de_tarea(e.tarea_id))
  );

drop policy if exists comentarios_editar on comentarios_entrega;
create policy comentarios_editar on comentarios_entrega for update
  using (exists (select 1 from entregas e where e.id = entrega_id and es_docente_de_tarea(e.tarea_id)))
  with check (
    docente_id = auth.uid()
    and exists (select 1 from entregas e where e.id = entrega_id and es_docente_de_tarea(e.tarea_id))
  );

drop policy if exists comentarios_borrar on comentarios_entrega;
create policy comentarios_borrar on comentarios_entrega for delete
  using (exists (select 1 from entregas e where e.id = entrega_id and es_docente_de_tarea(e.tarea_id)));

grant select, insert, update, delete on comentarios_entrega to authenticated;
revoke all on comentarios_entrega from anon;

-- Cada llamada a la IA del docente (proponer tarea, sugerir repaso, borrador de comentario).
-- Solo la escribe y la lee el servidor (service_role): sin políticas para los usuarios.
create table if not exists uso_ia_docente (
  id bigint generated always as identity primary key,
  docente_id uuid not null references perfiles(id) on delete cascade,
  funcion text not null check (funcion in ('proponer_tarea', 'sugerir_repaso', 'borrador_comentario')),
  creado_en timestamptz not null default now()
);

create index if not exists uso_ia_docente_por_dia on uso_ia_docente (docente_id, creado_en);

alter table uso_ia_docente enable row level security;
revoke all on uso_ia_docente from anon, authenticated;
