# T18 — Pruebas automáticas de seguridad (RLS) con Postgres local

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t18-rls` / `../MuseLearn-T18` |
| Puedes tocar | `supabase/pruebas-rls/` (nuevo: SQL y script), `scripts/probar-rls.mjs` (nuevo), `package.json` (solo agregar el script `"rls": ...`; sin dependencias nuevas salvo `pg` como devDependency, anótalo), `.orquesta/tareas/T18-pruebas-rls.md`, `README.md` (solo una línea en "Run it locally") |
| No toques | `supabase/migrations/` (si encuentras un hueco, descríbelo y propone la migración en la ficha; no la escribas), código de la app |

## Objetivo
Comprobar con pruebas reales en Postgres (no con mocks) que cada usuario solo ve y cambia lo suyo. T15 ya validó el seed en un PostgreSQL local; reutiliza ese método (`supabase/demo/probar-local.mjs`).

## Criterios de aceptación
- [x] Script que levanta (o usa) un Postgres local, crea un esquema `auth` mínimo (`auth.users`, `auth.uid()` leyendo `request.jwt.claim.sub`) y los roles `anon`, `authenticated`, `service_role`, y aplica **todas** las migraciones `0001`-`0010` en orden.
- [x] Casos (cada uno como `set role authenticated` + `set request.jwt.claim.sub`), con datos ficticios: dos docentes, tres estudiantes, dos clases.
  - Estudiante: no ve clases, tareas, entregas, informes, comentarios, calificaciones ni avisos ajenos; no puede cambiar su `rol`, ni `terminos_version`; no puede escribir calificaciones ni comentarios; no puede ejecutar `devolver_entrega`.
  - Docente: ve solo sus clases y lo de sus estudiantes en ellas; no puede leer ni escribir en clases de otro docente; no ve `uso_ia_docente`; puede comentar y calificar solo entregas de sus tareas.
  - `anon`: no lee nada.
- [x] `npm run rls` imprime una tabla de casos con ✓/✗ y termina con código ≠ 0 si alguno falla.
- [x] Si un caso falla por un hueco real de seguridad, descríbelo en "Hallazgos" con la migración que propones. No lo arregles en las migraciones.

## Validación
- 2026-10-29: `npm run lint` y `npm run typecheck` correctos; `npm test`: 228 pruebas correctas, 10 omitidas.
- `npm run rls`: PostgreSQL 18.4 temporal, migraciones 0001–0010 completas; **211/214 casos correctos**, tres reproducciones de H01, salida **1** comprobada. Clúster detenido al finalizar. Ninguna conexión remota ni dato real.
- Los cuatro criterios se refieren a implementar/verificar las pruebas y documentar huecos; están completos. No significa que las políticas estén libres de vulnerabilidades: H01 sigue pendiente del integrador.

## Reglas
- Lee `AGENTS.md`. Nunca contra la base de producción ni con claves reales. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T18:`. Sin atribución de IA. Sin merge ni push.

## Hallazgos
- **H01 — Traslado de entrega a clase ajena (confirmado en PostgreSQL 18.4).** La política `entregas_editar` de `0003_rls.sql` tiene `USING (estudiante_id = auth.uid()) WITH CHECK (estudiante_id = auth.uid())`, pero no restringe `tarea_id` ni vuelve a comprobar inscripción. Con `SET LOCAL ROLE authenticated` y el JWT ficticio del estudiante 3, `UPDATE entregas SET tarea_id='18000000-0000-4000-8000-000000000022' WHERE id='18000000-0000-4000-8000-000000000033'` se acepta aunque solo pertenece a la clase A y esa tarea es de la clase B. También se reproduce con los estudiantes 4 y 5. Cada prueba se revierte.
  - Consecuencia: un estudiante puede asociar su entrega y sus evidencias/comentarios/notas existentes a tareas ajenas; por las políticas de lectura basadas en la tarea, podrían quedar visibles para otro docente. No necesita conocer el código de inscripción, solo el UUID de una tarea.
  - **Migración propuesta `0011_proteger_identidad_entrega.sql` (solo integrador):** revocar el privilegio UPDATE de tabla `entregas` a authenticated y conceder UPDATE únicamente de `contenido_texto`, `adjuntos`, `estado`, `entregada_en`, `entregada_externamente`; mantener inmutables `id`, `tarea_id`, `estudiante_id`. Reemplazar `entregas_editar` para añadir `esta_inscrito_en_tarea(tarea_id)` al WITH CHECK. Revisar compatibilidad con el flujo de corrección/UPSERT del servidor antes de aplicar. Alternativa: trigger que impida cambiar identidad a usuarios autenticados, preservando service_role.
  - Las pruebas quedan rojas deliberadamente en estos tres casos y `npm run rls` debe terminar con código 1 hasta integrar la corrección. No se modifica ninguna migración desde T18.

## Decisiones
- Se reutiliza el método de T15 (`psql` y PostgreSQL 18 local), ampliado a un clúster temporal nuevo por ejecución. Sin `pg` ni otras dependencias, sin archivos `.env` y sin conexiones remotas.
- Se reproduce la infraestructura mínima de Auth/Storage y los grants por defecto de Supabase antes de aplicar íntegramente 0001–0010; nunca se conceden permisos adicionales después de los REVOKE de las migraciones.
- Cada caso usa una sesión autenticada SQL y una transacción con ROLLBACK; los rechazos esperados comprueban SQLSTATE 42501. Se incluyen controles positivos y separación entre compañeros de la misma clase.
- Se agregan pruebas de traslado de entregas entre clases, vínculos Classroom y datos privados del estudiante, además del alcance mínimo.
- No hay cambios de Next.js ni de interfaz: no aplica revisión visual a 380 px. Se respeta «Sin merge ni push» de esta ficha, que prevalece sobre el cierre genérico de la skill.
## Bloqueos
- Ninguno para entregar la batería. H01 requiere una migración del integrador para dejar todos los casos RLS verdes; no se oculta ni se considera un rechazo correcto.
