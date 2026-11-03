-- De dónde salió cada tarea, para que el docente las distinga en la lista:
-- 'ia' (propuesta con "Crear con IA"), 'repaso_ia' (actividad de repaso sugerida por la IA) o
-- 'classroom' (importada). Nulo = creada a mano. Es nulable para que los seeds sin esta columna sigan funcionando.
alter table tareas
  add column if not exists origen text check (origen is null or origen in ('ia', 'repaso_ia', 'classroom'));

update tareas t set origen = 'classroom'
  from tareas_vinculadas v
  where v.tarea_id = t.id and t.origen is null;
