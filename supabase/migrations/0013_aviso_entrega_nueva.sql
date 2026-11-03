-- Aviso al docente cuando un estudiante entrega una tarea.
alter table avisos drop constraint if exists avisos_tipo_check;
alter table avisos add constraint avisos_tipo_check
  check (tipo in ('tarea_nueva', 'entrega_devuelta', 'comentario', 'nota', 'tareas_importadas', 'entrega_nueva'));
