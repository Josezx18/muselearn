<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Reglas para TODOS los agentes de MuseLearn

> **Integrador en relevo:** si eres Codex y José te pide seguir el trabajo de Claude, lee primero `.orquesta/RELEVO-CODEX.md`.

Lo leen Claude Code (vía CLAUDE.md), Codex, OpenCode y Muse Code. Aplica a cada sesión y subagente.

## Antes de escribir código
1. Lee `.ficha-actual` (raíz de tu carpeta de trabajo): te dice qué ficha te toca, por ejemplo `T03`.
2. Lee tu ficha en `.orquesta/tareas/<ficha>.md`, luego `.orquesta/ARQUITECTURA.md` y `.orquesta/contratos/`.
3. Lee `PROGRESO.md` para ver qué está hecho y qué falta.
4. Usa la skill `muselearn-constructor` (o `muselearn-integrador` si tu ficha es T07).

## Reglas de propiedad (lo que evita choques)
- Solo modificas las carpetas listadas en **"Puedes tocar"** de tu ficha.
- **Congelados** (solo el integrador los cambia): `src/types/contratos.ts`, `src/components/ui/`,
  `supabase/migrations/`, `messages/*/comun.json`, `package.json` (dependencias), `.orquesta/ARQUITECTURA.md`,
  `.orquesta/contratos/`.
- ¿Necesitas cambiar algo congelado o de otra pieza? **No lo cambies.** Escríbelo en tu ficha,
  sección "Solicitudes al integrador", y sigue trabajando con un mock.
- ¿Necesitas una dependencia nueva? Pídela en "Solicitudes al integrador"; mientras, usa lo que ya hay.

## Reglas de código
- TypeScript estricto. Nada de `any` salvo justificado en un comentario.
- Todo dato que entra o sale de un endpoint o del modelo se valida con los esquemas Zod de `src/types/contratos.ts`.
- La IA se llama solo con `llamarMuse()` de `src/lib/ia/cliente.ts`. Nunca otra librería ni otra URL.
- Ningún texto visible escrito a mano en componentes: todo en `messages/es/<tu-modulo>.json` y `messages/en/<tu-modulo>.json`.
- El frontend llama a la API solo con `src/lib/api-cliente.ts`.
- Claves de API solo en el servidor. Nunca `NEXT_PUBLIC_` con secretos.
- Diseño móvil primero: todo funciona a 380 px de ancho sin scroll horizontal.

## Forma de trabajar (autónoma)
- Ciclo: toma el siguiente criterio sin marcar de tu ficha → impleméntalo → pruébalo → márcalo `[x]` →
  anota en `PROGRESO.md` → commit → siguiente.
- No preguntes "¿sigo?". Si una duda no bloquea, toma la decisión más razonable y anótala en la ficha ("Decisiones").
- Detente solo si (a) todos los criterios de tu ficha están `[x]` y las pruebas pasan, o (b) algo te bloquea de verdad.
  En el caso (b), descríbelo en "Bloqueos" de tu ficha.
- Commits pequeños con prefijo de ficha: `T03: analizador con validación Zod`.
- **Sin atribución de IA:** ningún commit ni descripción de PR lleva líneas `Co-Authored-By`, `Generated with…`
  ni enlaces de sesión. No cambies `user.name` ni `user.email` de git: el autor de todos los commits es el dueño del repo.
  (El hook `scripts/git-hooks/commit-msg` las quita de todos modos.)
- Antes de cada commit: `npm run lint && npm run typecheck && npm test` deben pasar.

## Notas técnicas del proyecto (T00)
- **Next.js 16.4 + React 19.3.** `src/proxy.ts` reemplaza a `middleware.ts`. `params`, `searchParams`, `cookies()` y `headers()` son asíncronos (`await`).
  Usa los tipos globales `PageProps<"/ruta">` y `LayoutProps<"/ruta">`. Ante la duda, lee `node_modules/next/dist/docs/`.
- `cacheComponents` está **desactivado** a propósito (la app es dinámica y por usuario). No lo actives.
- **Idiomas:** `next-intl`. En el cliente `useTranslations("<espacio>")`; en el servidor `await getTranslations("<espacio>")`.
  Enlaces y redirecciones con `@/i18n/navigation` (no con `next/link`). Tu espacio es tu archivo en `messages/{es,en}/`.
- **Supabase:** `@/lib/supabase/servidor` (`crearClienteServidor`, `crearClienteAdmin`) y `@/lib/supabase/cliente`.
- **IA:** `llamarMuse({ funcion, sistema, mensajes, esquema })` de `@/lib/ia/cliente`. La `funcion` decide proveedor y respaldo.
- **UI:** `@/components/ui` (Button, Input, Textarea, Card, Badge, Dialog, Tabs, Skeleton, useToast, NivelDominio, Dificultad).
  Colores como clases de Tailwind: `bg-primario`, `text-tinta`, `text-tinta-suave`, `border-borde`, `bg-acento`, `bg-nivel-1…4`.
- **Mocks:** `NEXT_PUBLIC_USAR_MOCKS=true` hace que `@/lib/api-cliente` devuelva datos de `src/lib/mocks/`.
- Comandos: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e`.

## Prohibido
- Hacer merge a `main` (solo el integrador).
- Borrar o reescribir archivos de otra ficha.
- Usar el tier *Contributor* de Muse con datos de estudiantes.
- Guardar datos reales de estudiantes en el repositorio o en los seeds.
