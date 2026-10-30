-- =====================================================================
-- MuseLearn — Tabla de avisos (T12)
-- Crea la tabla avisos y políticas RLS.
-- El integrador la aplica en Supabase.
-- =====================================================================

create table avisos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references perfiles(id) on delete cascade,
  tipo text not null check (tipo in ('tarea_nueva','entrega_devuelta','comentario','nota','tareas_importadas')),
  titulo text not null,
  enlace text not null, -- ruta interna que empieza con "/"
  leido boolean not null default false,
  creado_en timestamptz not null default now()
);

create index idx_avisos_usuario_creado on avisos (usuario_id, creado_en desc);

alter table avisos enable row level security;

-- Cada usuario lee solo sus propios avisos
create policy "avisos_select_own" on avisos
  for select to authenticated
  using (usuario_id = auth.uid());

-- Cada usuario puede marcar como leídos solo sus propios avisos (solo actualiza columna 'leido')
create policy "avisos_update_own_leido" on avisos
  for update to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- Crear avisos solo el servidor (service_role), no hay policy de insert para authenticated

-- Integrador: el usuario solo puede cambiar la columna "leido" (no el título ni el enlace) y anon no ve nada.
revoke all on avisos from anon;
revoke insert, update, delete on avisos from authenticated;
grant select on avisos to authenticated;
grant update (leido) on avisos to authenticated;
grant all on avisos to service_role;
