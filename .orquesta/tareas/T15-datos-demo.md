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
- [x] 1 docente demo y 12 estudiantes demo (nombres dominicanos inventados), 2 clases ("Matemática 4to A", "Tecnología 4to B").
- [x] 8 tareas repartidas en las modalidades `muselearn`, `cuaderno`, `classroom` (con enlace de ejemplo `https://classroom.google.com/`) y `otra`; fechas relativas a "hoy" (algunas vencidas, otras esta semana y la próxima).
- [x] Entregas, verificaciones con respuestas creíbles, informes con niveles 1-4 variados (que haya 3-4 estudiantes en "Necesitan apoyo"), comentarios del docente, notas y una entrega devuelta.
- [x] Planes semanales y horas de estudio para Camila (la estudiante del guion) para que "Hoy" y "Semana" se vean llenos.
- [x] El seed es idempotente: se puede ejecutar dos veces sin duplicar (usa ids fijos y `on conflict`). Solo crea/borra filas de cuentas `@muselearn.demo`.
- [ ] Los mocks (`src/lib/mocks/`) reflejan los mismos datos para que la demo sin claves se vea igual.
- [x] Instrucciones en el README: cómo cargar la demo y qué cuentas usar (contraseñas solo en `.env.local`, nunca en el repo).

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T15:`. Sin atribución de IA. Sin merge ni push. No ejecutes el seed contra la base de producción: lo hace el integrador.

## Decisiones
- 2026-10-29: rebase de `main` antes de empezar; T09 ya integrado. Prevalece la regla de esta ficha: sin push ni merge.
- Fuente única: datos de `src/lib/mocks/`; `node supabase/demo/generar.mjs` produce SQL, cuentas y objetos validados con Zod. El comando Python anterior delega al generador nuevo.
- IDs fijos compartidos por Auth, SQL y mocks. No se migran ni borran las antiguas cuentas `@demo.muselearn`; usar un proyecto dedicado a demo. Contraseña obligatoria de `.env.local`, sin valor predeterminado ni impresión.
- Fechas respecto del lunes actual en Santo Domingo; ocho tareas vencidas, actuales y próximas. Camila dispone de dos bloques diarios y dos semanas en el seed.
- General muestra 100 % entregó / 42 % demostró comprensión y cuatro casos de apoyo: Camila, Sofía, Valeria y Alondra. Tres tienen nivel global 1–2; Camila conserva su debilidad al comprobar. Elian tiene una devolución de funciones lineales con motivo y nota.
- Repetibilidad comprobada en PostgreSQL 18 temporal local, sin claves de Supabase: dos ejecuciones iguales y colisiones de cuentas/clases con rollback; ver `supabase/demo/PRUEBAS.md`.
- Hoy, Semana y General revisados a 380/1280 px: sin desbordamiento horizontal ni errores de página. Capturas temporales en `%TEMP%/muselearn-t15-capturas`.
- Validación final: `npm run lint`, `npm run typecheck` y `npm test` correctos (212 pruebas, 10 omitidas). PostgreSQL temporal y servidor de revisión detenidos al terminar. No se ejecutó ningún seed remoto.

## Solicitudes al integrador
- Completar criterio 6 en `src/lib/api-cliente.ts` (fuera de «Puedes tocar»): `obtenerDetalleEntrega` y `obtenerInforme` deben resolver informe y preguntas por `entrega_id`; ahora devuelven siempre los de Camila. Inicializar `comentariosMock` con los comentarios de demo y seleccionar el plan por semana. Datos disponibles en `supabase/demo/objetos.json`; no faltan contratos ni dependencias.
- Actualizar expectativas y capturas del ensayo T11: General pasa de 80 % / 40 % a 100 % / 42 % y el grupo tiene doce estudiantes. No se modificaron e2e ni capturas de otra ficha.

## Bloqueos
- Criterio 6 pendiente de las conexiones anteriores del cliente compartido. Roster, clases, tareas, entregas, niveles del panel, plan actual y notas iniciales coinciden con el seed; detalle y comentarios no pueden verse iguales sin editar código de la app, prohibido para T15. No queda otro criterio implementable dentro del alcance autorizado.
