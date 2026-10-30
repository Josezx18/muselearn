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
- [ ] Script que levanta (o usa) un Postgres local, crea un esquema `auth` mínimo (`auth.users`, `auth.uid()` leyendo `request.jwt.claim.sub`) y los roles `anon`, `authenticated`, `service_role`, y aplica **todas** las migraciones `0001`-`0010` en orden.
- [ ] Casos (cada uno como `set role authenticated` + `set request.jwt.claim.sub`), con datos ficticios: dos docentes, tres estudiantes, dos clases.
  - Estudiante: no ve clases, tareas, entregas, informes, comentarios, calificaciones ni avisos ajenos; no puede cambiar su `rol`, ni `terminos_version`; no puede escribir calificaciones ni comentarios; no puede ejecutar `devolver_entrega`.
  - Docente: ve solo sus clases y lo de sus estudiantes en ellas; no puede leer ni escribir en clases de otro docente; no ve `uso_ia_docente`; puede comentar y calificar solo entregas de sus tareas.
  - `anon`: no lee nada.
- [ ] `npm run rls` imprime una tabla de casos con ✓/✗ y termina con código ≠ 0 si alguno falla.
- [ ] Si un caso falla por un hueco real de seguridad, descríbelo en "Hallazgos" con la migración que propones. No lo arregles en las migraciones.

## Reglas
- Lee `AGENTS.md`. Nunca contra la base de producción ni con claves reales. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T18:`. Sin atribución de IA. Sin merge ni push.

## Hallazgos
## Bloqueos
