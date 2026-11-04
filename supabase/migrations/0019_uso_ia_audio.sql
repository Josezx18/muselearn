-- Arreglo de 0016: la regla de audio_ms rechazaba todo lo que no era voz. `audio_ms >= 0 and funcion = 'voz'`
-- da FALSO (no "desconocido") cuando funcion <> 'voz' aunque audio_ms sea nulo, así que ningún registro se guardaba.
-- Ahora: audio_ms puede ser nulo siempre; si tiene valor, debe ser >= 0 y solo en llamadas de voz.
-- Se busca la regla por su definición (su nombre automático depende del orden de creación).
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where conrelid = 'public.uso_ia'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%audio_ms%' and conname <> 'uso_ia_audio_ms_check'
  loop
    execute format('alter table public.uso_ia drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.uso_ia drop constraint if exists uso_ia_audio_ms_check;
alter table public.uso_ia add constraint uso_ia_audio_ms_check
  check (audio_ms is null or (audio_ms >= 0 and funcion = 'voz'));
