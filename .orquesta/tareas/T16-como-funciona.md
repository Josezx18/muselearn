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
- [x] `/es/como-funciona` y `/en/como-funciona`: 5 secciones cortas (Planifica, Tutor que no hace la tarea, Verifica que entendiste, El docente ve la comprensión, IA del docente) con una captura cada una (next/image o img con width/height), y una sección "Privacidad" que enlaza a `/privacidad`.
- [x] Tabla "Modelos de Meta que usamos" (Muse Spark 1.3, Muse Voice Transcribe, Muse Spark Open, Muse Glimmer de respaldo) igual que el README.
- [x] Enlace "Cómo funciona" en la portada y en el pie (`EnlacesLegales` o junto a él).
- [x] README: sección "Screens" con las capturas nuevas de T11, lista "What it does" al día (calificar/devolver, CSV, avisos, voz, Classroom, privacidad), enlace a la página.
- [x] `docs/PUBLICACION-X.md`: 3 versiones del post para X (≤ 280 caracteres, español e inglés), hashtags del hackathon, sin datos personales de estudiantes.
- [x] Textos es/en, 380 px sin scroll horizontal, `e2e/como-funciona.spec.ts`.

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T16:`. Sin atribución de IA. Sin merge ni push.

## Decisiones
- Se reutilizan las capturas de T11 mediante imports estáticos de next/image; no se copian a carpetas fuera del alcance. La página aclara que las pantallas están en español y usan datos ficticios y respuestas simuladas.
- El enlace del pie se agrega junto a EnlacesLegales solo en la portada, respetando la propiedad de los componentes existentes.
- Se conservan los proveedores y modelos documentados en README; no se cambian las rutas del cliente IA.
- Tres versiones de X con traducción: seis posts independientes, todos de menos de 280 caracteres. Hashtags descriptivos pendientes de cotejar con las etiquetas oficiales antes de publicar.
- Se respeta la regla específica de T16: commits locales, sin push ni merge.
## Bloqueos

## Verificacion
- lint y typecheck correctos; 228 pruebas unitarias pasan (10 omitidas).
- Cuatro e2e correctos: es/en a 380 y 1280 px, cinco imagenes cargadas con dimensiones, tabla de cuatro modelos, enlaces de portada/pie y privacidad, sin scroll horizontal. Capturas revisadas en test-results.
