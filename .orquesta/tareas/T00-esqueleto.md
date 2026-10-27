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
- [x] Proyecto Next.js (App Router, TypeScript estricto, Tailwind, ESLint) creado; `npm run dev` funciona.
- [x] Scripts en package.json: `dev`, `build`, `lint`, `typecheck`, `test` (Vitest), `e2e` (Playwright).
- [x] Todas las dependencias del proyecto instaladas desde ya: `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `openai`, `next-intl`, `vitest`, `@playwright/test`, `date-fns` (evita que cada ficha toque package.json).
- [x] `next-intl` configurado con rutas `/[locale]` (es por defecto, en), selector de idioma en el layout, y archivos vacíos `messages/{es,en}/{comun,auth,clases,tareas,estudiante,tutor,verificacion,informes,docente}.json` cargados por espacio de nombres.
- [x] `src/types/contratos.ts` copiado de `.orquesta/contratos/contratos.ts`.
- [x] `supabase/migrations/0001_inicial.sql` desde `.orquesta/contratos/esquema.sql`, aplicado al proyecto de Supabase.
- [x] `src/config/marca.ts` con nombre "MuseLearn" y colores (cambiar nombre = cambiar 1 archivo).
- [x] `src/lib/supabase/{cliente,servidor}.ts` y middleware de sesión.
- [x] `src/lib/ia/cliente.ts` con la firma de `llamarMuse()` (implementación mínima funcionando contra Meta Model API; T03 la mejora).
- [x] `src/lib/api-cliente.ts`: una función tipada por endpoint de `.orquesta/contratos/api.md`, que usa mocks si `NEXT_PUBLIC_USAR_MOCKS=true`.
- [x] `src/lib/mocks/<modulo>.ts` con datos de ejemplo realistas para cada contrato (3 clases, 8 tareas de distintas materias, análisis, un plan semanal, una sesión de verificación y un informe).
- [x] `src/components/ui/`: Button, Input, Textarea, Card, Badge, Dialog, Tabs, Skeleton, Toast, NivelDominio (chip 1-4 con color), Dificultad (1-5).
- [x] Layouts vacíos con navegación para `docente/` y `estudiante/` y páginas "en construcción" en cada ruta de ARQUITECTURA §5.
- [x] `.env.example` con: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MODEL_API_KEY`, `MUSE_MODELO=muse-spark-1.3`, `MODELO_ABIERTO_URL=https://inference.baseten.co/v1`, `MODELO_ABIERTO_KEY=`, `MODELO_ABIERTO_ID=meta-models/muse-spark-open-1026`, `NVIDIA_API_KEY=` (respaldo opcional), `NEXT_PUBLIC_USAR_MOCKS=true`.
- [x] `CLAUDE.md` existe e importa `AGENTS.md` (lo crea `instalar-kit.sh`); `.gitignore` incluye `.env*`, `.ficha-actual`, `.orquesta-stop-count`.
- [ ] Prueba de humo (pendiente: José pone sus claves en `.env.local` y ejecuta `npm run prueba:ia`): una llamada real a `llamarMuse()` responde y una transcripción corta con Muse Voice Transcribe funciona (verifica IDs de modelo en dev.meta.ai/docs/models; anota en Decisiones).
- [ ] Repositorio en GitHub **público** desde el primer commit de código (requisito del hackathon). Verificar que `.env*` no se sube.
- [x] `npm run build`, `lint`, `typecheck` y `test` pasan. Commit en `main`.
- [ ] Push a `main` en GitHub (pendiente: la red de José no conectaba con GitHub).

## Decisiones
- Next.js 16.4.3, React 19.3, Tailwind 4, next-intl 4.14, zod 4.6, openai 7.45, Vitest 5, Playwright 1.64.
- `cacheComponents` y `partialPrefetching` (activados por la plantilla) se desactivaron: la app es dinámica por usuario.
- `middleware.ts` ahora es `src/proxy.ts` (convención de Next 16): next-intl + refresco de sesión de Supabase.
- No hay `app/layout.tsx` raíz: el layout raíz es `app/[locale]/layout.tsx` (patrón de next-intl).
- Fuentes del sistema (sin Google Fonts) para no depender de red al compilar.
- Supabase: proyecto `muselearn` (ref `bxlqcrzmzgkixjbudris`, us-east-1). Migraciones 0001 (tablas + RLS activo sin políticas) y 0002 (buckets privados `adjuntos` y `audios`) aplicadas. Las políticas RLS las escribe T01: hasta entonces la base no devuelve filas a usuarios normales.
- Se usa la clave pública nueva de Supabase (`sb_publishable_…`) en `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `llamarMuse()` ya enruta por función (abierto → Meta → NVIDIA para análisis/plan; Meta para visión, tutor y verificación), pide JSON con esquema y reintenta una vez; T03 lo amplía.
- `npm run typecheck` ejecuta `next typegen` antes de `tsc` (genera los tipos `PageProps` / `LayoutProps`).
- Script `npm run prueba:ia` para la prueba de humo de los proveedores con las claves reales.

## Bloqueos
- 

## Solicitudes al integrador
- 
