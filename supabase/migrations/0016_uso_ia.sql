-- Solo metadatos. Aplicación a cargo del integrador.
create table if not exists public.uso_ia (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  funcion text not null check (funcion in ('analizar','planificar','leer_cuaderno','tutor','verificar','evaluar','ruta','docente','voz')),
  proveedor text not null check (proveedor in ('meta','abierto','nvidia')),
  modelo text not null,
  tokens_entrada bigint check (tokens_entrada >= 0),
  tokens_salida bigint check (tokens_salida >= 0),
  audio_ms bigint check (audio_ms >= 0 and funcion = 'voz'),
  stream boolean not null default false,
  ok boolean not null,
  error varchar(300),
  usuario_id uuid references auth.users(id) on delete set null,
  check (not ok or error is null)
);
create index if not exists uso_ia_creado_en_idx on public.uso_ia (creado_en);
create index if not exists uso_ia_proveedor_creado_en_idx on public.uso_ia (proveedor, creado_en);
alter table public.uso_ia enable row level security;
revoke all on public.uso_ia from anon, authenticated;
grant select, insert on public.uso_ia to service_role;
