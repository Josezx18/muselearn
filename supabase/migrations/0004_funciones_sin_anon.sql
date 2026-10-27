-- Las funciones auxiliares de RLS (SECURITY DEFINER) no deben poder llamarse sin sesión.
-- Los usuarios con sesión sí las necesitan porque las políticas se evalúan con su rol.
revoke execute on function public.es_docente_de_clase(uuid), public.esta_inscrito(uuid), public.rol_actual(),
  public.es_docente_de_estudiante(uuid), public.es_docente_de_tarea(uuid), public.esta_inscrito_en_tarea(uuid)
  from public, anon;
grant execute on function public.es_docente_de_clase(uuid), public.esta_inscrito(uuid), public.rol_actual(),
  public.es_docente_de_estudiante(uuid), public.es_docente_de_tarea(uuid), public.esta_inscrito_en_tarea(uuid)
  to authenticated, service_role;
