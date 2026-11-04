-- T29: no modifica los t?tulos existentes. Aplicar mediante el integrador.
alter table public.avisos add column if not exists datos jsonb;
