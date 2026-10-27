# T00 — Esqueleto, contratos, mocks y UI base

| Campo | Valor |
|---|---|
| Plataforma | Claude Code (una sola sesión, en `main`) |
| Rama | `main` (es la única ficha que trabaja directo en main) |
| Oleada | 0 — martes 27 oct (primer día del periodo de construcción), bloquea a todas |
| Depende de | nada |
| Puedes tocar | todo el repositorio |

## Objetivo
Dejar un proyecto que compila, con los contratos, la base de datos, los mocks y la UI base,
para que cinco sesiones puedan trabajar en paralelo desde el día 2 sin pisarse.

## Criterios de aceptación
- [ ] Proyecto Next.js (App Router, TypeScript estricto, Tailwind, ESLint) creado; `npm run dev` funciona.
- [ ] Scripts en package.json: `dev`, `build`, `lint`, `typecheck`, `test` (Vitest), `e2e` (Playwright).
- [ ] Todas las dependencias del proyecto instaladas desde ya: `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `openai`, `next-intl`, `vitest`, `@playwright/test`, `date-fns` (evita que cada ficha toque package.json).
- [ ] `next-intl` configurado con rutas `/[locale]` (es por defecto, en), selector de idioma en el layout, y archivos vacíos `messages/{es,en}/{comun,auth,clases,tareas,estudiante,tutor,verificacion,informes,docente}.json` cargados por espacio de nombres.
- [ ] `src/types/contratos.ts` copiado de `.orquesta/contratos/contratos.ts`.
- [ ] `supabase/migrations/0001_inicial.sql` desde `.orquesta/contratos/esquema.sql`, aplicado al proyecto de Supabase.
- [ ] `src/config/marca.ts` con nombre "MuseLearn" y colores (cambiar nombre = cambiar 1 archivo).
- [ ] `src/lib/supabase/{cliente,servidor}.ts` y middleware de sesión.
- [ ] `src/lib/ia/cliente.ts` con la firma de `llamarMuse()` (implementación mínima funcionando contra Meta Model API; T03 la mejora).
- [ ] `src/lib/api-cliente.ts`: una función tipada por endpoint de `.orquesta/contratos/api.md`, que usa mocks si `NEXT_PUBLIC_USAR_MOCKS=true`.
- [ ] `src/lib/mocks/<modulo>.ts` con datos de ejemplo realistas para cada contrato (3 clases, 8 tareas de distintas materias, análisis, un plan semanal, una sesión de verificación y un informe).
- [ ] `src/components/ui/`: Button, Input, Textarea, Card, Badge, Dialog, Tabs, Skeleton, Toast, NivelDominio (chip 1-4 con color), Dificultad (1-5).
- [ ] Layouts vacíos con navegación para `docente/` y `estudiante/` y páginas "en construcción" en cada ruta de ARQUITECTURA §5.
- [ ] `.env.example` con: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MODEL_API_KEY`, `MUSE_MODELO=muse-spark-1.3`, `MODELO_ABIERTO_URL=https://inference.baseten.co/v1`, `MODELO_ABIERTO_KEY=`, `MODELO_ABIERTO_ID=meta-models/muse-spark-open-1026`, `NVIDIA_API_KEY=` (respaldo opcional), `NEXT_PUBLIC_USAR_MOCKS=true`.
- [ ] `CLAUDE.md` existe e importa `AGENTS.md` (lo crea `instalar-kit.sh`); `.gitignore` incluye `.env*`, `.ficha-actual`, `.orquesta-stop-count`.
- [ ] Prueba de humo: una llamada real a `llamarMuse()` responde y una transcripción corta con Muse Voice Transcribe funciona (verifica IDs de modelo en dev.meta.ai/docs/models; anota en Decisiones).
- [ ] Repositorio en GitHub **público** desde el primer commit de código (requisito del hackathon). Verificar que `.env*` no se sube.
- [ ] `npm run build`, `lint`, `typecheck` y `test` pasan. Commit y push a `main`.

## Decisiones
- 

## Bloqueos
- 

## Solicitudes al integrador
- 
