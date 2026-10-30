# T11 — Ensayo de la demo contra la app actual

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t11-demo` / `../MuseLearn-T11` |
| Depende de | main en 3a6b88c |
| Puedes tocar | `.orquesta/DEMO.md`, `.orquesta/tareas/T11-ensayo-demo.md`, `e2e/demo-guion.spec.ts` (nuevo), `docs/capturas/` (solo capturas nuevas), `README.md` (solo la sección "Screens") |

## Objetivo
Que el guion del video del hackathon (`.orquesta/DEMO.md`, entrega el 4 de nov) coincida con lo que la app hace hoy, y que exista una prueba que recorra el guion completo con datos de demo.

## Criterios de aceptación
- [ ] Recorre `.orquesta/DEMO.md` paso a paso con `NEXT_PUBLIC_USAR_MOCKS=true` (`npm run dev`) y anota en "Hallazgos" cada paso que ya no coincide (textos, botones, pantallas que cambiaron).
- [ ] Actualiza el guion para incluir lo nuevo que vale mostrar en ≤ 3 minutos: crear tarea con IA, tarea que se entrega en Classroom con evidencia, conversación por voz con la mascota, panel de comprensión (General → Por estudiante), borrador de comentario. Mantén la frase clave "entregó vs. demostró comprensión".
- [ ] `e2e/demo-guion.spec.ts`: recorre el guion actualizado (escritorio y celular) sin errores de consola ni scroll horizontal.
- [ ] Capturas nuevas a 1440 px y a 390 px de las pantallas del guion en `docs/capturas/` (nombres `demo-XX-*.png`).
- [ ] No cambies código de la app: si algo no funciona, descríbelo en "Hallazgos" con pasos para reproducirlo.

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T11:`. Sin atribución de IA. Sin merge ni push.

## Hallazgos
## Bloqueos
