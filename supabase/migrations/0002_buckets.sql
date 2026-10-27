-- Buckets privados de Storage para adjuntos de tareas/entregas y audios de verificación.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('adjuntos', 'adjuntos', false, 10485760),  -- 10 MB
  ('audios',   'audios',   false, 10485760)
on conflict (id) do nothing;
-- Las políticas de acceso a storage.objects las escribe T01 junto con el resto de RLS.
