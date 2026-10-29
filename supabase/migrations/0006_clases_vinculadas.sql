-- Clases importadas de otra plataforma (por ahora Google Classroom): evita importar dos veces el mismo curso
-- y permite volver a sincronizar los estudiantes. Solo el docente dueño ve y cambia sus vínculos.
create table if not exists clases_vinculadas (
  clase_id uuid primary key references clases(id) on delete cascade,
  docente_id uuid not null references perfiles(id) on delete cascade,
  proveedor text not null check (proveedor in ('classroom')),
  externo_id text not null,
  sincronizada_en timestamptz not null default now(),
  unique (docente_id, proveedor, externo_id)
);

alter table clases_vinculadas enable row level security;

drop policy if exists vinculos_propios on clases_vinculadas;
create policy vinculos_propios on clases_vinculadas for all
  using (docente_id = auth.uid())
  with check (docente_id = auth.uid() and es_docente_de_clase(clase_id));

grant select, insert, update, delete on clases_vinculadas to authenticated;
revoke all on clases_vinculadas from anon;
