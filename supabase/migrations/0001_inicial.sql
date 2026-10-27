-- =====================================================================
-- MuseLearn — Esquema de base de datos (Supabase / Postgres)
-- Referencia para T00, que lo coloca en supabase/migrations/0001_inicial.sql.
-- Cambios posteriores: SOLO el integrador, con una migración nueva.
-- =====================================================================

create extension if not exists "pgcrypto";

-- Perfiles (1:1 con auth.users)
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rol text not null check (rol in ('docente','estudiante')),
  nombre text not null,
  idioma text not null default 'es' check (idioma in ('es','en')),
  creado_en timestamptz not null default now()
);

create table clases (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references perfiles(id) on delete cascade,
  nombre text not null,
  materia text not null,
  grado text not null,
  codigo_inscripcion char(6) not null unique,
  creada_en timestamptz not null default now()
);

create table inscripciones (
  clase_id uuid references clases(id) on delete cascade,
  estudiante_id uuid references perfiles(id) on delete cascade,
  inscrito_en timestamptz not null default now(),
  primary key (clase_id, estudiante_id)
);

create table tareas (
  id uuid primary key default gen_random_uuid(),
  clase_id uuid not null references clases(id) on delete cascade,
  titulo text not null,
  instrucciones text not null,
  adjuntos jsonb not null default '[]',
  fecha_entrega timestamptz not null,
  competencias text[] not null default '{}',
  nivel_ayuda text not null default 'pistas' check (nivel_ayuda in ('pistas','ejemplos','explicacion')),
  creada_en timestamptz not null default now()
);

create table entregas (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references tareas(id) on delete cascade,
  estudiante_id uuid not null references perfiles(id) on delete cascade,
  contenido_texto text not null default '',
  adjuntos jsonb not null default '[]',
  estado text not null default 'pendiente' check (estado in ('pendiente','entregada','verificando','verificada')),
  entregada_en timestamptz,
  unique (tarea_id, estudiante_id)
);

-- Salidas de IA (se guardan como JSON validado contra contratos.ts)
create table analisis_tareas (
  tarea_id uuid references tareas(id) on delete cascade,
  estudiante_id uuid references perfiles(id) on delete cascade,
  datos jsonb not null,                -- AnalisisTarea
  creado_en timestamptz not null default now(),
  primary key (tarea_id, estudiante_id)
);

create table planes (
  estudiante_id uuid references perfiles(id) on delete cascade,
  semana_inicio date not null,
  datos jsonb not null,                -- PlanSemanal
  actualizado_en timestamptz not null default now(),
  primary key (estudiante_id, semana_inicio)
);

create table preferencias_estudio (
  estudiante_id uuid primary key references perfiles(id) on delete cascade,
  datos jsonb not null                 -- PreferenciasEstudio
);

create table conversaciones_tutor (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references tareas(id) on delete cascade,
  estudiante_id uuid not null references perfiles(id) on delete cascade,
  mensajes jsonb not null default '[]', -- MensajeChat[]
  actualizada_en timestamptz not null default now()
);

create table sesiones_verificacion (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references entregas(id) on delete cascade,
  preguntas jsonb not null default '[]', -- PreguntaVerificacion[]
  estado text not null default 'en_curso' check (estado in ('en_curso','completada')),
  creada_en timestamptz not null default now()
);

create table informes (
  entrega_id uuid primary key references entregas(id) on delete cascade,
  informe jsonb not null,              -- InformeComprension
  ruta jsonb,                          -- RutaPractica
  creado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RLS (resumen; T01 escribe las políticas completas)
-- ---------------------------------------------------------------------
alter table perfiles enable row level security;
alter table clases enable row level security;
alter table inscripciones enable row level security;
alter table tareas enable row level security;
alter table entregas enable row level security;
alter table analisis_tareas enable row level security;
alter table planes enable row level security;
alter table preferencias_estudio enable row level security;
alter table conversaciones_tutor enable row level security;
alter table sesiones_verificacion enable row level security;
alter table informes enable row level security;

-- Reglas que deben cumplir las políticas:
-- * Estudiante: lee/escribe solo filas donde estudiante_id = auth.uid();
--   lee clases y tareas de las clases en que está inscrito.
-- * Docente: lee/escribe clases donde docente_id = auth.uid(),
--   y lee entregas, informes y análisis de estudiantes de SUS clases.
-- * Las llamadas a la IA corren en el servidor con service_role,
--   siempre verificando antes que el usuario tiene permiso sobre esos datos.

-- Buckets de Storage: 'adjuntos' (privado), 'audios' (privado, borrar a los 7 días)
