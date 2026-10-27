-- =====================================================================
-- MuseLearn — Políticas RLS completas (T01).
-- El integrador lo convierte en una migración (supabase/migrations/0003_rls.sql).
-- Es idempotente: se puede ejecutar más de una vez.
-- Las rutas de IA del servidor usan service_role (salta RLS) y verifican permisos antes.
-- =====================================================================

-- ---------- Funciones auxiliares (security definer evita recursión entre políticas) ----------
create or replace function public.es_docente_de_clase(p_clase uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from clases where id = p_clase and docente_id = auth.uid());
$$;

create or replace function public.esta_inscrito(p_clase uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from inscripciones where clase_id = p_clase and estudiante_id = auth.uid());
$$;

create or replace function public.rol_actual()
returns text language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid();
$$;

-- ¿Es el docente de alguna clase en la que está inscrito este estudiante?
create or replace function public.es_docente_de_estudiante(p_estudiante uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from inscripciones i join clases c on c.id = i.clase_id
    where i.estudiante_id = p_estudiante and c.docente_id = auth.uid()
  );
$$;

-- ¿La tarea pertenece a una clase de este docente / en la que está inscrito el usuario?
create or replace function public.es_docente_de_tarea(p_tarea uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from tareas t join clases c on c.id = t.clase_id where t.id = p_tarea and c.docente_id = auth.uid());
$$;

create or replace function public.esta_inscrito_en_tarea(p_tarea uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tareas t join inscripciones i on i.clase_id = t.clase_id
    where t.id = p_tarea and i.estudiante_id = auth.uid()
  );
$$;

-- ---------- perfiles ----------
drop policy if exists perfiles_leer_propio on perfiles;
create policy perfiles_leer_propio on perfiles for select using (id = auth.uid());

drop policy if exists perfiles_leer_estudiantes_de_mis_clases on perfiles;
create policy perfiles_leer_estudiantes_de_mis_clases on perfiles for select
  using (es_docente_de_estudiante(id));

drop policy if exists perfiles_leer_docente_de_mis_clases on perfiles;
create policy perfiles_leer_docente_de_mis_clases on perfiles for select
  using (exists (select 1 from clases c where c.docente_id = perfiles.id and esta_inscrito(c.id)));

drop policy if exists perfiles_crear_propio on perfiles;
create policy perfiles_crear_propio on perfiles for insert with check (id = auth.uid());

drop policy if exists perfiles_editar_propio on perfiles;
create policy perfiles_editar_propio on perfiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Nadie cambia su propio rol: solo nombre e idioma.
revoke update on perfiles from authenticated, anon;
grant update (nombre, idioma) on perfiles to authenticated;

-- ---------- clases ----------
drop policy if exists clases_leer on clases;
create policy clases_leer on clases for select using (docente_id = auth.uid() or esta_inscrito(id));

drop policy if exists clases_crear on clases;
create policy clases_crear on clases for insert
  with check (docente_id = auth.uid() and rol_actual() = 'docente');

drop policy if exists clases_editar on clases;
create policy clases_editar on clases for update using (docente_id = auth.uid()) with check (docente_id = auth.uid());

drop policy if exists clases_borrar on clases;
create policy clases_borrar on clases for delete using (docente_id = auth.uid());

-- ---------- inscripciones ----------
-- No hay política de insert para estudiantes: unirse pasa por POST /api/clases/unirse (service_role),
-- que valida el código. Así nadie se inscribe en una clase solo conociendo su id.
drop policy if exists inscripciones_leer on inscripciones;
create policy inscripciones_leer on inscripciones for select
  using (estudiante_id = auth.uid() or es_docente_de_clase(clase_id));

drop policy if exists inscripciones_salir on inscripciones;
create policy inscripciones_salir on inscripciones for delete
  using (estudiante_id = auth.uid() or es_docente_de_clase(clase_id));

-- ---------- tareas ----------
drop policy if exists tareas_leer on tareas;
create policy tareas_leer on tareas for select using (es_docente_de_clase(clase_id) or esta_inscrito(clase_id));

drop policy if exists tareas_crear on tareas;
create policy tareas_crear on tareas for insert with check (es_docente_de_clase(clase_id));

drop policy if exists tareas_editar on tareas;
create policy tareas_editar on tareas for update using (es_docente_de_clase(clase_id)) with check (es_docente_de_clase(clase_id));

drop policy if exists tareas_borrar on tareas;
create policy tareas_borrar on tareas for delete using (es_docente_de_clase(clase_id));

-- ---------- entregas ----------
drop policy if exists entregas_leer on entregas;
create policy entregas_leer on entregas for select
  using (estudiante_id = auth.uid() or es_docente_de_tarea(tarea_id));

drop policy if exists entregas_crear on entregas;
create policy entregas_crear on entregas for insert
  with check (estudiante_id = auth.uid() and esta_inscrito_en_tarea(tarea_id));

drop policy if exists entregas_editar on entregas;
create policy entregas_editar on entregas for update
  using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());

-- ---------- análisis, planes, preferencias (del estudiante; el docente lee el análisis) ----------
drop policy if exists analisis_leer on analisis_tareas;
create policy analisis_leer on analisis_tareas for select
  using (estudiante_id = auth.uid() or es_docente_de_tarea(tarea_id));
-- La escritura del análisis la hace el servidor (service_role).

drop policy if exists planes_propios on planes;
create policy planes_propios on planes for all using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());

drop policy if exists preferencias_propias on preferencias_estudio;
create policy preferencias_propias on preferencias_estudio for all
  using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());

-- ---------- conversaciones del tutor (solo el estudiante; el docente no lee el chat) ----------
drop policy if exists conversaciones_propias on conversaciones_tutor;
create policy conversaciones_propias on conversaciones_tutor for all
  using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());

-- ---------- sesiones de verificación e informes ----------
drop policy if exists sesiones_leer on sesiones_verificacion;
create policy sesiones_leer on sesiones_verificacion for select
  using (exists (
    select 1 from entregas e
    where e.id = entrega_id and (e.estudiante_id = auth.uid() or es_docente_de_tarea(e.tarea_id))
  ));
-- Crear y actualizar sesiones lo hace el servidor (service_role).

drop policy if exists informes_leer on informes;
create policy informes_leer on informes for select
  using (exists (
    select 1 from entregas e
    where e.id = entrega_id and (e.estudiante_id = auth.uid() or es_docente_de_tarea(e.tarea_id))
  ));

-- ---------- Storage (buckets 'adjuntos' y 'audios', privados) ----------
-- Convención de ruta: <clase_o_tarea_id>/<archivo>. Cada usuario sube y lee lo que él mismo subió
-- (storage.objects.owner = auth.uid()); el servidor entrega URLs firmadas a quien corresponda.
drop policy if exists storage_subir_propio on storage.objects;
create policy storage_subir_propio on storage.objects for insert to authenticated
  with check (bucket_id in ('adjuntos', 'audios') and owner = auth.uid());

drop policy if exists storage_leer_propio on storage.objects;
create policy storage_leer_propio on storage.objects for select to authenticated
  using (bucket_id in ('adjuntos', 'audios') and owner = auth.uid());

drop policy if exists storage_borrar_propio on storage.objects;
create policy storage_borrar_propio on storage.objects for delete to authenticated
  using (bucket_id in ('adjuntos', 'audios') and owner = auth.uid());
