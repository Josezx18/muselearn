# T16 — Página "Cómo funciona", README y texto para X

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t16-como-funciona` / `../MuseLearn-T16` |
| Puedes tocar | `src/app/[locale]/(legal)/como-funciona/` (nuevo; usa el layout legal), `src/components/legal/` (solo componentes nuevos), `src/app/[locale]/page.tsx` (solo un enlace "Cómo funciona" en la portada y el pie), `messages/*/legal.json` (solo agregar la clave `comoFunciona`), `README.md`, `docs/PUBLICACION-X.md` (nuevo), `e2e/como-funciona.spec.ts` (nuevo) |
| No toques | API, base de datos, otras pantallas |

## Objetivo
Para el jurado del hackathon y para las familias/docentes: explicar en una página pública, sin iniciar sesión, qué hace MuseLearn y cómo usa la IA, con las capturas de `docs/capturas/demo-*.png`.

## Criterios de aceptación
- [ ] `/es/como-funciona` y `/en/como-funciona`: 5 secciones cortas (Planifica, Tutor que no hace la tarea, Verifica que entendiste, El docente ve la comprensión, IA del docente) con una captura cada una (next/image o img con width/height), y una sección "Privacidad" que enlaza a `/privacidad`.
- [ ] Tabla "Modelos de Meta que usamos" (Muse Spark 1.3, Muse Voice Transcribe, Muse Spark Open, Muse Glimmer de respaldo) igual que el README.
- [ ] Enlace "Cómo funciona" en la portada y en el pie (`EnlacesLegales` o junto a él).
- [ ] README: sección "Screens" con las capturas nuevas de T11, lista "What it does" al día (calificar/devolver, CSV, avisos, voz, Classroom, privacidad), enlace a la página.
- [ ] `docs/PUBLICACION-X.md`: 3 versiones del post para X (≤ 280 caracteres, español e inglés), hashtags del hackathon, sin datos personales de estudiantes.
- [ ] Textos es/en, 380 px sin scroll horizontal, `e2e/como-funciona.spec.ts`.

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T16:`. Sin atribución de IA. Sin merge ni push.

## Decisiones
## Bloqueos
