# Data model

Application schema read from all 15 SQL migrations in `supabase/migrations/` (0001-0015). Migration 0016 is absent from both this checkout and local main at the reviewed revision. No production schema query was performed. SQL identifiers remain Spanish to match the database.

## Dictionary conventions

Every application table and column is listed below. SQL definitions preserve types, defaults, CHECKs and foreign keys; absence of NOT NULL means nullable unless the column participates in a primary key. All application foreign keys use ON DELETE CASCADE. PK columns are non-null; UNIQUE constraints are shown separately. RLS is enabled on all 18 application tables. Policies combine permissively; grants and server authorization remain additional boundaries. The service role bypasses RLS and must only be used after application authorization.

## `perfiles`

| Column | SQL definition | Meaning |
|---|---|---|
| `id` | `id uuid primary key references auth.users(id) on delete cascade` | Record identifier. |
| `rol` | `rol text not null check (rol in ('docente','estudiante'))` | Application role: teacher or student. |
| `nombre` | `nombre text not null` | Display name. |
| `idioma` | `idioma text not null default 'es' check (idioma in ('es','en'))` | Preferred interface language. |
| `creado_en` | `creado_en timestamptz not null default now()` | Creation timestamp. |
| `tema` | `tema text not null default 'muse' check (tema in ('cuaderno','meta','muse'))` | Saved color theme. |
| `mascota` | `mascota text not null default 'pagi' check (mascota in ('pagi','chispa','orbi'))` | Selected companion. |
| `terminos_version` | `terminos_version text` | Accepted legal-document version; null before acceptance. |
| `terminos_aceptados_en` | `terminos_aceptados_en timestamptz` | Acceptance timestamp; null before acceptance. |

**RLS and privileges:** SELECT: self; teachers may read students enrolled in their classes; students may read teachers of their enrolled classes. INSERT: own ID. UPDATE: own ID with column grants limited to nombre, idioma, tema and mascota. No user DELETE policy. Role and terms fields cannot be directly updated by authenticated clients.

## `clases`

| Column | SQL definition | Meaning |
|---|---|---|
| `id` | `id uuid primary key default gen_random_uuid()` | Record identifier. |
| `docente_id` | `docente_id uuid not null references perfiles(id) on delete cascade` | Teacher profile reference. |
| `nombre` | `nombre text not null` | Display name. |
| `materia` | `materia text not null` | Subject. |
| `grado` | `grado text not null` | Grade/year label. |
| `codigo_inscripcion` | `codigo_inscripcion char(6) not null unique` | Unique six-character enrollment code. |
| `creada_en` | `creada_en timestamptz not null default now()` | Creation timestamp. |

**RLS and privileges:** SELECT: owner teacher or enrolled student. INSERT: own docente_id and current role docente. UPDATE/DELETE: owner. UPDATE also checks that docente_id remains own.

## `inscripciones`

| Column | SQL definition | Meaning |
|---|---|---|
| `clase_id` | `clase_id uuid references clases(id) on delete cascade` | Class reference. |
| `estudiante_id` | `estudiante_id uuid references perfiles(id) on delete cascade` | Student profile reference. |
| `inscrito_en` | `inscrito_en timestamptz not null default now()` | Enrollment timestamp. |

Table constraints: `primary key (clase_id, estudiante_id)`.

**RLS and privileges:** SELECT/DELETE: own student row or owner of the class. No user INSERT/UPDATE policy; enrollment is a server operation after code validation.

## `tareas`

| Column | SQL definition | Meaning |
|---|---|---|
| `id` | `id uuid primary key default gen_random_uuid()` | Record identifier. |
| `clase_id` | `clase_id uuid not null references clases(id) on delete cascade` | Class reference. |
| `titulo` | `titulo text not null` | Task or notification title. |
| `instrucciones` | `instrucciones text not null` | Assignment instructions. |
| `adjuntos` | `adjuntos jsonb not null default '[]'` | Attachment metadata array: nombre, ruta and tipo_mime. |
| `fecha_entrega` | `fecha_entrega timestamptz not null` | Assignment deadline. |
| `competencias` | `competencias text[] not null default '{}'` | Competency text labels. |
| `nivel_ayuda` | `nivel_ayuda text not null default 'pistas' check (nivel_ayuda in ('pistas','ejemplos','explicacion'))` | Tutor assistance policy. |
| `creada_en` | `creada_en timestamptz not null default now()` | Creation timestamp. |
| `modalidad` | `modalidad text not null default 'muselearn' check (modalidad in ('muselearn','cuaderno','classroom','otra'))` | Where the task is completed/delivered; independent of origin. |
| `enlace_externo` | `enlace_externo text check (enlace_externo is null or (char_length(enlace_externo) <= 500 and enlace_externo ~* '^https?://'))` | Optional HTTP(S) task link. |
| `origen` | `origen text check (origen is null or origen in ('ia','repaso_ia','classroom'))` | AI proposal, AI review activity, Classroom import or null for manual work. |

**RLS and privileges:** SELECT: class teacher or enrolled student. INSERT/UPDATE/DELETE: class teacher. UPDATE checks the resulting class ownership.

## `entregas`

| Column | SQL definition | Meaning |
|---|---|---|
| `id` | `id uuid primary key default gen_random_uuid()` | Record identifier. |
| `tarea_id` | `tarea_id uuid not null references tareas(id) on delete cascade` | Task reference. |
| `estudiante_id` | `estudiante_id uuid not null references perfiles(id) on delete cascade` | Student profile reference. |
| `contenido_texto` | `contenido_texto text not null default ''` | Student work in text form. |
| `adjuntos` | `adjuntos jsonb not null default '[]'` | Attachment metadata array: nombre, ruta and tipo_mime. |
| `estado` | `estado text not null default 'pendiente' check (estado in ('pendiente','entregada','verificando','verificada'))` | Workflow state constrained to the listed values. |
| `entregada_en` | `entregada_en timestamptz` | Submission timestamp; in revisiones_ia, the version of work reviewed. |
| `entregada_externamente` | `entregada_externamente boolean not null default false` | Student confirmation of delivery outside MuseLearn. |

Table constraints: `unique (tarea_id, estudiante_id)`.

**RLS and privileges:** SELECT: own student row or task teacher. INSERT: own student ID and enrollment in the task. UPDATE: own row, still own student ID and enrolled in resulting task. No user DELETE policy. Migration 0011 trigger additionally forbids authenticated/anon changes to tarea_id or estudiante_id, even during an upsert.

## `analisis_tareas`

| Column | SQL definition | Meaning |
|---|---|---|
| `tarea_id` | `tarea_id uuid references tareas(id) on delete cascade` | Task reference. |
| `estudiante_id` | `estudiante_id uuid references perfiles(id) on delete cascade` | Student profile reference. |
| `datos` | `datos jsonb not null` | AnalisisTarea JSON: difficulty, minutes, priority, concepts, suggested steps and reason. |
| `creado_en` | `creado_en timestamptz not null default now()` | Creation timestamp. |

Table constraints: `primary key (tarea_id, estudiante_id)`.

**RLS and privileges:** SELECT: own student row or task teacher. No user write policies; server writes analysis.

## `planes`

| Column | SQL definition | Meaning |
|---|---|---|
| `estudiante_id` | `estudiante_id uuid references perfiles(id) on delete cascade` | Student profile reference. |
| `semana_inicio` | `semana_inicio date not null` | Week start date; part of the student/week key. |
| `datos` | `datos jsonb not null` | PlanSemanal JSON: student, week, blocks, notices and generation time. |
| `actualizado_en` | `actualizado_en timestamptz not null default now()` | Last update timestamp. |

Table constraints: `primary key (estudiante_id, semana_inicio)`.

**RLS and privileges:** ALL operations: estudiante_id equals auth.uid(), including the resulting row check.

## `preferencias_estudio`

| Column | SQL definition | Meaning |
|---|---|---|
| `estudiante_id` | `estudiante_id uuid primary key references perfiles(id) on delete cascade` | Student profile reference. |
| `datos` | `datos jsonb not null` | PreferenciasEstudio JSON: availability windows and maximum block length. |

**RLS and privileges:** ALL operations: estudiante_id equals auth.uid(), including the resulting row check.

## `conversaciones_tutor`

| Column | SQL definition | Meaning |
|---|---|---|
| `id` | `id uuid primary key default gen_random_uuid()` | Record identifier. |
| `tarea_id` | `tarea_id uuid not null references tareas(id) on delete cascade` | Task reference. |
| `estudiante_id` | `estudiante_id uuid not null references perfiles(id) on delete cascade` | Student profile reference. |
| `mensajes` | `mensajes jsonb not null default '[]'` | Array of MensajeChat objects. |
| `actualizada_en` | `actualizada_en timestamptz not null default now()` | Last conversation update timestamp. |

**RLS and privileges:** ALL operations: estudiante_id equals auth.uid(). Teachers have no policy to read student tutor conversations.

## `sesiones_verificacion`

| Column | SQL definition | Meaning |
|---|---|---|
| `id` | `id uuid primary key default gen_random_uuid()` | Record identifier. |
| `entrega_id` | `entrega_id uuid not null references entregas(id) on delete cascade` | Submission reference. |
| `preguntas` | `preguntas jsonb not null default '[]'` | Question/answer array with concept, response and voice/text channel. |
| `estado` | `estado text not null default 'en_curso' check (estado in ('en_curso','completada'))` | Workflow state constrained to the listed values. |
| `creada_en` | `creada_en timestamptz not null default now()` | Creation timestamp. |
| `cuaderno` | `cuaderno text` | Cached notebook reading reused during this verification session. |

**RLS and privileges:** SELECT: submission owner or task teacher via the associated submission. No user write policies; server creates/updates questions, answers and notebook reading.

## `informes`

| Column | SQL definition | Meaning |
|---|---|---|
| `entrega_id` | `entrega_id uuid primary key references entregas(id) on delete cascade` | Submission reference. |
| `informe` | `informe jsonb not null` | InformeComprension JSON: concept levels, evidence, strengths, weaknesses and summaries. |
| `ruta` | `ruta jsonb` | Nullable RutaPractica JSON with one to six steps. |
| `creado_en` | `creado_en timestamptz not null default now()` | Creation timestamp. |

**RLS and privileges:** SELECT: submission owner or task teacher via the associated submission. No user write policies; server writes report and route.

## `clases_vinculadas`

| Column | SQL definition | Meaning |
|---|---|---|
| `clase_id` | `clase_id uuid primary key references clases(id) on delete cascade` | Class reference. |
| `docente_id` | `docente_id uuid not null references perfiles(id) on delete cascade` | Teacher profile reference. |
| `proveedor` | `proveedor text not null check (proveedor in ('classroom'))` | External integration provider. |
| `externo_id` | `externo_id text not null` | Provider-side course/task identifier. |
| `sincronizada_en` | `sincronizada_en timestamptz not null default now()` | Last synchronization timestamp. |

Table constraints: `unique (docente_id, proveedor, externo_id)`.

**RLS and privileges:** ALL operations: own docente_id. INSERT/UPDATE resulting row must also belong to a class taught by that user. Anonymous access revoked.

## `comentarios_entrega`

| Column | SQL definition | Meaning |
|---|---|---|
| `entrega_id` | `entrega_id uuid primary key references entregas(id) on delete cascade` | Submission reference. |
| `docente_id` | `docente_id uuid not null references perfiles(id) on delete cascade` | Teacher profile reference. |
| `texto` | `texto text not null check (char_length(texto) between 1 and 4000)` | Teacher feedback. |
| `actualizado_en` | `actualizado_en timestamptz not null default now()` | Last update timestamp. |

**RLS and privileges:** SELECT: submission owner or task teacher. INSERT/UPDATE: task teacher with docente_id equal to current user; UPDATE checks both old access and new row. DELETE: task teacher. Anonymous access revoked.

## `uso_ia_docente`

| Column | SQL definition | Meaning |
|---|---|---|
| `id` | `id bigint generated always as identity primary key` | Record identifier. |
| `docente_id` | `docente_id uuid not null references perfiles(id) on delete cascade` | Teacher profile reference. |
| `funcion` | `funcion text not null check (funcion in ('proponer_tarea', 'sugerir_repaso', 'borrador_comentario'))` | Teacher AI quota category. |
| `creado_en` | `creado_en timestamptz not null default now()` | Creation timestamp. |

**RLS and privileges:** RLS enabled with no client policies; all privileges revoked from anon/authenticated. Server-only access. AI submission review currently records as borrador_comentario, not a separate function value.

## `tareas_vinculadas`

| Column | SQL definition | Meaning |
|---|---|---|
| `tarea_id` | `tarea_id uuid primary key references tareas(id) on delete cascade` | Task reference. |
| `clase_id` | `clase_id uuid not null references clases(id) on delete cascade` | Class reference. |
| `proveedor` | `proveedor text not null check (proveedor in ('classroom'))` | External integration provider. |
| `externo_id` | `externo_id text not null` | Provider-side course/task identifier. |
| `sincronizada_en` | `sincronizada_en timestamptz not null default now()` | Last synchronization timestamp. |

Table constraints: `unique (clase_id, proveedor, externo_id)`.

**RLS and privileges:** ALL operations: teacher of clase_id, including the resulting-row check. Anonymous access revoked.

## `calificaciones`

| Column | SQL definition | Meaning |
|---|---|---|
| `entrega_id` | `entrega_id uuid primary key references public.entregas(id) on delete cascade` | Submission reference. |
| `docente_id` | `docente_id uuid not null references public.perfiles(id) on delete cascade` | Teacher profile reference. |
| `nota` | `nota numeric(5,2) null check (nota between 0 and 100)` | Optional teacher grade with two decimal places. |
| `devuelta` | `devuelta boolean not null default false` | Whether work has been returned for correction. |
| `motivo_devolucion` | `motivo_devolucion text null check (char_length(motivo_devolucion) <= 1000)` | Optional stored return reason; return RPC requires a nonempty reason. |
| `actualizado_en` | `actualizado_en timestamptz not null default now()` | Last update timestamp. |

**RLS and privileges:** SELECT: submission owner or task teacher. INSERT/UPDATE: task teacher with own docente_id; DELETE: task teacher. Policies target authenticated. Anonymous access revoked. The server-only devolver_entrega RPC updates return state and submission state atomically.

## `avisos`

| Column | SQL definition | Meaning |
|---|---|---|
| `id` | `id uuid primary key default gen_random_uuid()` | Record identifier. |
| `usuario_id` | `usuario_id uuid not null references perfiles(id) on delete cascade` | Notification recipient profile. |
| `tipo` | `tipo text not null check (tipo in ('tarea_nueva','entrega_devuelta','comentario','nota','tareas_importadas','entrega_nueva'))` | Notification event kind. |
| `titulo` | `titulo text not null` | Task or notification title. |
| `enlace` | `enlace text not null` | Internal destination path (application convention). |
| `leido` | `leido boolean not null default false` | Read status. |
| `creado_en` | `creado_en timestamptz not null default now()` | Creation timestamp. |

**RLS and privileges:** SELECT: usuario_id equals auth.uid(). UPDATE: same owner before/after and only leido is granted for update. No client INSERT/DELETE. Server creates notices; anonymous access revoked.

## `revisiones_ia`

| Column | SQL definition | Meaning |
|---|---|---|
| `entrega_id` | `entrega_id uuid primary key references entregas(id) on delete cascade` | Submission reference. |
| `revision` | `revision jsonb not null` | Validated RevisionEntrega JSON with compliance, criterion evidence, feedback suggestions and optional grade. |
| `entregada_en` | `entregada_en timestamptz` | Submission timestamp; in revisiones_ia, the version of work reviewed. |
| `creada_en` | `creada_en timestamptz not null default now()` | Creation timestamp. |

**RLS and privileges:** SELECT only, for authenticated teacher of the associated submission task. Students cannot read these reviews. All authenticated privileges revoked then SELECT granted; anon has no access. Only server writes/deletes.

## Managed authentication and storage

`auth.users` and `storage.objects` are Supabase-managed schemas, not application-defined tables. Profiles reference Auth IDs; email and password material are managed by Auth, not copied into the profile table. Migration 0002 creates private `adjuntos` and `audios` buckets. Migration 0003 permits authenticated INSERT, SELECT and DELETE only for objects in these buckets whose owner equals auth.uid(); it defines no client UPDATE policy. Authorized server handlers issue signed URLs or download validated submission paths. Current transcription holds audio in memory and does not use the audio bucket. The old bucket comment about seven-day deletion is not an implemented scheduled retention job.

## Functions and integrity

Migration 0003 defines SECURITY DEFINER RLS helpers: es_docente_de_clase, esta_inscrito, rol_actual, es_docente_de_estudiante, es_docente_de_tarea and esta_inscrito_en_tarea. Migration 0004 revokes public/anon execution and permits authenticated/service_role. Migration 0009 adds the server-only devolver_entrega RPC with row locking, teacher ownership check, required trimmed reason and an atomic update to calificaciones plus entregas.estado. Migration 0011 fixes immutable submission identity using a trigger and strengthens the update enrollment check.

## Migration history

| Migration | Change |
|---|---|
| `0001_inicial.sql` | Base 11 application tables, constraints and RLS enablement |
| `0002_buckets.sql` | Private attachment/audio buckets |
| `0003_rls.sql` | RLS policies and helper functions |
| `0004_funciones_sin_anon.sql` | Restrict RLS-helper execution |
| `0005_apariencia_perfil.sql` | Saved appearance and limited profile updates |
| `0006_clases_vinculadas.sql` | Classroom class links |
| `0007_ia_docente.sql` | Teacher comments and teacher AI usage |
| `0008_modalidad_terminos.sql` | Task modes, external confirmation, task links and legal acceptance |
| `0009_calificaciones.sql` | Optional grades and atomic return RPC |
| `0010_avisos.sql` | In-app notifications and read-only-field update grant |
| `0011_proteger_identidad_entrega.sql` | Protect submission identity and enforce enrollment on update |
| `0012_origen_tarea.sql` | Assignment origin and backfill Classroom origin |
| `0013_aviso_entrega_nueva.sql` | New-submission notification kind |
| `0014_cuaderno_en_sesion.sql` | Cache notebook reading in verification session |
| `0015_revisiones_ia.sql` | Persist teacher AI review and reviewed submission timestamp |

See [entity relationships](06-diagrams.md) and [API authorization](08-api.md).
