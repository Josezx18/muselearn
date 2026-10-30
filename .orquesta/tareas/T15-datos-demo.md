# T15 — Datos de demo completos y ficticios

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t15-demo-datos` / `../MuseLearn-T15` |
| Empieza | cuando T09 esté en main (para incluir notas y devoluciones) |
| Puedes tocar | `supabase/seed-auth.ts`, `supabase/seed-demo.sql`, `supabase/demo/` , `src/lib/mocks/**` (solo datos, sin cambiar firmas), `README.md` (solo la sección de cuentas demo), `scripts/seed-demo.mjs` (nuevo, opcional) |
| No toques | código de la app, migraciones |

## Objetivo
Que el video y cualquier jurado vean una clase viva: el panel General con variedad de niveles, gente que necesita apoyo, tareas en las 4 modalidades, comentarios y notas. **Todo ficticio**: nombres inventados, correos `@muselearn.demo`, sin datos reales de estudiantes.

## Criterios de aceptación
- [ ] 1 docente demo y 12 estudiantes demo (nombres dominicanos inventados), 2 clases ("Matemática 4to A", "Tecnología 4to B").
- [ ] 8 tareas repartidas en las modalidades `muselearn`, `cuaderno`, `classroom` (con enlace de ejemplo `https://classroom.google.com/`) y `otra`; fechas relativas a "hoy" (algunas vencidas, otras esta semana y la próxima).
- [ ] Entregas, verificaciones con respuestas creíbles, informes con niveles 1-4 variados (que haya 3-4 estudiantes en "Necesitan apoyo"), comentarios del docente, notas y una entrega devuelta.
- [ ] Planes semanales y horas de estudio para Camila (la estudiante del guion) para que "Hoy" y "Semana" se vean llenos.
- [ ] El seed es idempotente: se puede ejecutar dos veces sin duplicar (usa ids fijos y `on conflict`). Solo crea/borra filas de cuentas `@muselearn.demo`.
- [ ] Los mocks (`src/lib/mocks/`) reflejan los mismos datos para que la demo sin claves se vea igual.
- [ ] Instrucciones en el README: cómo cargar la demo y qué cuentas usar (contraseñas solo en `.env.local`, nunca en el repo).

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T15:`. Sin atribución de IA. Sin merge ni push. No ejecutes el seed contra la base de producción: lo hace el integrador.

## Decisiones
## Bloqueos
