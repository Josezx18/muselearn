# AGENTS.md — Reglas para TODOS los agentes de MuseLearn

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

## Prohibido
- Hacer merge a `main` (solo el integrador).
- Borrar o reescribir archivos de otra ficha.
- Usar el tier *Contributor* de Muse con datos de estudiantes.
- Guardar datos reales de estudiantes en el repositorio o en los seeds.
