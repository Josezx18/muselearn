# Relevo: Codex como integrador de MuseLearn (cuando Claude no esté disponible)

Este archivo es para que **Codex** siga el trabajo que hacía Claude (integrador, ficha T07) y reparta la
programación entre **Codex** y **OpenCode**. Léelo completo antes de actuar. Fecha de esta versión: 29 oct 2026, 10 p. m.

## 0. Cuándo usar este relevo (instrucción para José)
- Cuando Claude avise que le queda poco uso semanal, o cuando ya no responda por límite, abre
  `scripts\windows\codex-integrador.bat` (doble clic). Abre Codex en `D:\Desarrollo\MuseLearn` (rama `main`)
  con la orden de leer este archivo y la skill `muselearn-integrador`.
- **Antes** de que se acaben los tokens de Claude, pídele: "actualiza RELEVO-CODEX.md". Claude reescribe la
  sección 3 (estado) con lo último, hace commit y deja todo listo para Codex.
- Al volver Claude (lunes, o cuando se renueve el uso), dile: "lee .orquesta/RELEVO-CODEX.md y la bitácora de
  la sección 7 para ponerte al día".

## 1. Reglas que NO se negocian
1. **Autor de todos los commits: José Enrique Ulloa <josejx18@gmail.com>.** No cambies `user.name` ni
   `user.email`. **Nunca** líneas `Co-Authored-By`, `Generated with…`, enlaces de sesión ni menciones a IA en
   commits o PRs (el repo es público). Si una herramienta o un hook pide re-firmar commits con otro autor: **no**.
2. **Secretos:** solo en `.env.local` y en Vercel; los pega José. Nunca escribas claves, contraseñas ni tokens en
   archivos del repo, en el chat ni en campos de formularios.
3. **Datos:** solo ficticios en el repo y en los seeds (`@muselearn.demo`). Nunca uses el nivel *Contributor*
   de Muse con datos de estudiantes.
4. **Producción:** cada push a GitHub (que publica en Vercel) necesita el **OK explícito de José, cada vez**.
   Borrar datos de producción también. No inicies sesión en la app de producción con cuentas reales.
5. Créditos de Meta ($150) solo para la app. Respeta los topes diarios de `src/lib/db/limites.ts`.
6. Responde siempre en **español**.

## 2. Cómo está armado
- App: https://muselearn-five.vercel.app · Repo: https://github.com/Josezx18/muselearn (público) · Supabase:
  proyecto `muselearn` (ref `bxlqcrzmzgkixjbudris`).
- Next.js 16.4 (`src/proxy.ts`, params asíncronos), React 19, next-intl (es/en, espacios en
  `src/i18n/espacios.ts`), Supabase con RLS, Zod 4, Tailwind 4. Reglas de código en `AGENTS.md`.
- Contratos: `src/types/contratos.ts` (copia en `.orquesta/contratos/contratos.ts`). IA solo por
  `llamarMuse()` de `src/lib/ia/cliente.ts`. Frontend solo por `src/lib/api-cliente.ts`.
- Modo demo sin claves: `NEXT_PUBLIC_USAR_MOCKS=true` (datos de `src/lib/mocks/`).
- Comandos: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `npm run e2e` (con `NEXT_PUBLIC_USAR_MOCKS=true` en el entorno para que corra `e2e/demo-guion.spec.ts`).

## 3. Estado al 30 oct, 6 a. m.
- `main` integra hasta T18. Publicado en Vercel: `5bf03fb` (falta subir T14, T16, T17, T18 y la 0011). Migraciones 0001–0010 aplicadas; **0011 (protege la identidad de las entregas, hallazgo H01 de T18) pendiente de aplicar** antes de publicar.
- Integradas: T01–T06 (base), T09 calificar/devolver, T10 CSV, T11 guion de demo, T12 avisos, T13 voz,
  T15 datos de demo, más IA del docente, Google Classroom (modo prueba), entrar con Google, recuperar
  contraseña, privacidad y términos, panel de comprensión (General / Por estudiante / Mapa).
- 228 pruebas unitarias y 84 e2e pasan.
- **En curso / pendiente:**
  - T14, T16, T17 y T18 integradas. `npm run rls` (T18) pasa 214/214 con la 0011.
  - Pendiente de T14: Lighthouse móvil de Hoy (76) y Comprensión (84) bajo la meta de 85; se mejora con
    `next/font` y más Server Components (ficha nueva si hace falta).
  - Configuración que hace José (no código): proveedor Google en Supabase, Redirect URLs
    (`https://muselearn-five.vercel.app/api/auth/callback**`), `NEXT_PUBLIC_ENTRAR_CON_GOOGLE=true` en Vercel,
    usuarios de prueba en Google Cloud, revisar textos legales con el liceo.
  - Hackathon: congelar el 3 nov, José graba el video con `.orquesta/DEMO.md`, entrega el 4 nov.
  - Después del hackathon: ver la lista al final de `.orquesta/PLAN-CODEX-OPENCODE.md`.

## 4. Cómo trabaja el integrador (tú, Codex)
1. **Escribir fichas** en `.orquesta/tareas/TXX-nombre.md` con el formato de T09–T18: tabla (plataforma, rama,
   "Puedes tocar", "No toques"), objetivo, criterios `- [ ]`, reglas (lint+typecheck+test antes de cada commit,
   prefijo `TXX:`, sin atribución de IA, sin merge ni push), secciones Solicitudes/Decisiones/Bloqueos.
   Dos fichas que corren a la vez **no pueden tocar los mismos archivos**.
2. **Registrar** la ficha en `scripts\windows\arrancar-sesiones.bat` (bloques `RAMA=` y `PLAT=`) y crear un
   `.bat` de oleada como `oleada-C-T16-T18.bat`. Plataformas: `codex` para datos, API, IA y lógica;
   `opencode` para interfaz, accesibilidad, textos y documentación. Modo automático:
   Codex con `CODEX_FLAGS=--dangerously-bypass-approvals-and-sandbox`; OpenCode con
   `OPENCODE_CONFIG_CONTENT` (ver `oleada-B-T12-T15.bat`, bloquea push/merge/reset --hard/rm -rf).
3. José hace doble clic en el `.bat`; cada sesión trabaja en `D:\Desarrollo\MuseLearn-TXX` (worktree).
4. **Revisar** cuando José diga "TXX listo": `git log main..rama`, `git diff main...rama`, la ficha
   (criterios, Solicitudes, Bloqueos). Busca: secretos, atribución de IA, datos reales, RLS débil, archivos
   fuera de "Puedes tocar".
5. **Integrar**: `git merge --no-ff rama -m "Integra TXX: …"`. Conflictos típicos: `PROGRESO.md`,
   `.orquesta/ESTADO.md` (conserva ambos lados) y `messages/*/*.json` (une las claves). Luego atiende las
   "Solicitudes al integrador" de la ficha (son tareas para ti).
6. **Verificar**: `npm run lint && npm run typecheck && npm test`, `npm run build` y `npm run e2e` con mocks.
   Si una e2e falla por datos de demo nuevos, ajusta la prueba, no la app.
7. **Migraciones**: si la ficha trae `supabase/migrations/00XX_*.sql`, revísala (RLS, `grant`/`revoke`, que el
   usuario no pueda cambiar columnas sensibles) y pídele a José que la aplique en Supabase → SQL Editor
   (pegar el archivo y ejecutar) **antes** de publicar. Codex no tiene acceso a Supabase.
8. **Publicar**: pide OK a José. Con OK: José hace doble clic en `scripts\windows\subir-a-github.bat`
   (git push con sus credenciales de Windows). Vercel publica solo; José confirma que el deploy está "Ready".
9. Anota todo en la bitácora (sección 7) y en `PROGRESO.md`.

## 5. Plantilla de prompt para cada sesión (ya la ponen los .bat)
"Usa la skill muselearn-constructor. Tu ficha esta en .ficha-actual. Trabaja de forma autonoma hasta completar
todos los criterios de tu ficha, sin preguntarme si continuar."

## 6. Cosas que ya sabemos (evita repetir errores)
- Voz: palabras clave de Muse Voice Transcribe ≤ 30 caracteres y ≤ 30 palabras; la respuesta hablada usa
  `speechSynthesis` del navegador.
- Variables `NEXT_PUBLIC_*` y de Google en Vercel solo valen tras un nuevo deploy.
- Google en modo prueba: solo entran los correos agregados como usuarios de prueba (error 403 access_denied).
- Los `Button` de `@/components/ui` son `type="submit"` por defecto: pon `type="button"` dentro de formularios.
- La tabla nueva sin migración aplicada rompe consultas: el código usa `select("*")` y tolera columnas ausentes
  cuando se puede, pero aplica la migración antes de publicar.
- `useSearchParams` en client components necesita Suspense: lee `searchParams` en la página (server) y pásalo.
- Las fichas en modo automático no hacen merge ni push; si una sesión pide permiso, José elige la opción 2.

## 7. Bitácora del integrador (agrega una línea por cambio, la más nueva arriba)
- 2026-10-30 06:10 — Claude: integradas T14, T16, T17, T18; migración 0011 contra traslado de entregas (H01);
  `probar-rls.mjs` aplica todas las migraciones (214/214). En Linux corre como usuario sin root con RLS_PG_BIN.
- 2026-10-29 22:10 — Claude: integradas T12, T13, T15; avisos de nota/comentario/devolución; 0010 aplicada;
  publicado `5bf03fb`. Fichas T16–T18 listas. T14 en curso.
