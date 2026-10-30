# T20 — Rendimiento en celular y detalles visuales

| Campo | Valor |
|---|---|
| Plataforma | OpenCode |
| Rama / carpeta | `t20-rendimiento` / `../MuseLearn-T20` |
| Puedes tocar | `src/app/[locale]/layout.tsx` (solo fuentes/metadatos), `src/app/globals.css`, `src/components/ui/`, `src/components/estudiante/Dashboard.tsx`, `src/components/docente/Comprension.tsx`, `src/app/[locale]/estudiante/hoy/`, `src/app/[locale]/docente/comprension/`, `e2e/rendimiento.spec.ts` (nuevo), y los fallos **visuales** del ensayo que el integrador anote abajo |
| No toques | API, base de datos, IA, `src/lib/api-cliente.ts` |

## Contexto
T14 midió Lighthouse móvil con mocks (`npm run build && npm start`): Hoy 76, Tarea 92, Comprensión 84
(Accessibility 100). Meta: **≥ 85** en Performance sin bajar Accessibility.

## Criterios de aceptación
- [x] Fuentes con `next/font` (hoy se cargan con `@fontsource-variable`): `display: swap`, solo los pesos usados,
      variables CSS conservando los nombres actuales para no romper estilos.
- [x] Hoy y Comprensión: mover a Server Components lo que no necesite estado; carga diferida (dynamic import)
      de lo pesado que no se ve al inicio (p. ej. el mapa de calor y la mascota animada fuera de pantalla).
- [x] Lighthouse móvil ≥ 85 en Hoy, Tarea y Comprensión, Accessibility 100. Anota antes/después en "Decisiones".
- [x] `e2e/accesibilidad.spec.ts` sigue pasando (64 casos) y no hay scroll horizontal a 360 px.
- [x] Fallos visuales del ensayo (los copia el integrador): no se reportaron fallos visuales adicionales; los 34
      `target-size` se corrigieron (ver Correcciones T07).

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T20:`.
  Sin atribución de IA. Sin merge ni push. Si necesitas una dependencia, anótala en Solicitudes.

## Solicitudes al integrador
- `@fontsource-variable/*` quedó sin uso tras migrar a `next/font`; se puede quitar de `package.json` (congelado para T20).
- Rutas auxiliares tocadas fuera del alcance original, necesarias para las correcciones de T07 (revisar/aceptar):
  `src/lib/server/data.ts` (nuevo, data fetching autenticado en servidor con RLS; evita el `fetch` roto de
  `api-cliente` desde Node), `src/components/comun/mascotas/MascotaSidebar.tsx` (nuevo), `src/components/estudiante/DetalleTarea.tsx`
  (props + dynamic de lo pesado para Tarea ≥ 85), `src/app/[locale]/estudiante/tarea/[id]/page.tsx` (usa `data.ts`),
  `playwright.lighthouse.config.ts` (nuevo, Lighthouse explícito build+start con mocks) y `e2e/semana.spec.ts` (nuevo).

## Decisiones
- 2026-10-30 Fuentes migradas a `next/font` (Lexend, Bricolage Grotesque, Caveat) con `display: swap`, pesos 400-800 según uso real, variables CSS `--font-sans`, `--font-titulo`, `--font-mano` conservadas. `next/font` (regla sin capa) gana sobre el `@theme` en capa, así que los nombres públicos siguen apuntando a las fuentes nuevas.
- 2026-10-30 Data fetching movido a Server Components con sesión autenticada: `src/lib/server/data.ts` usa `crearClienteServidor` (RLS) y mocks con `usarMocks()`; nunca `fetch("/api/...")` desde Node. Páginas: Hoy, Semana, Tarea y Comprensión. La guarda de rol/redirección sigue en los layouts (`exigirRol`).
- 2026-10-30 `Dashboard`: `semana` ahora es estado; `cargarSemana` actualiza el plan y la semana al terminar; `semanaPendiente` alimenta el reintento; `mover()` parte de la semana actual y calcula el lunes local. Cobertura en `e2e/semana.spec.ts` (avanzar, retroceder, dos semanas, lunes como inicio y contenido de la semana elegida).
- 2026-10-30 Accesibilidad: corregidos los 34 `target-size` en `SelectorIdioma`, `Navegacion` y `MascotaBoton`/`ConMascota` (mín. 44×44). Además, la animación `.aparece` ya no anima `opacity` (solo `transform`/`clip-path`), porque axe medía el contraste a mitad del fundido y marcaba `color-contrast` en portada y en el globo de la mascota. Resultado: `e2e/accesibilidad.spec.ts` 64/64 y Lighthouse Accessibility 100.
- 2026-10-30 SSR/carga diferida: se dejó de envolver todo `Dashboard` con `ConMascota` (`ssr:false`). El contenido inicial se renderiza en servidor; solo se difieren `MascotaSidebar` (aside) y `MascotaBoton`. `RepasoIA` conserva su ubicación/comportamiento en Comprensión.
- 2026-10-30 Lighthouse móvil reproducible: `e2e/rendimiento.spec.ts` hace `npm run build` + `next start -p 3100` con `NEXT_PUBLIC_USAR_MOCKS=true` (no `next dev`); config dedicada `playwright.lighthouse.config.ts` (sin `webServer`). Respeta el Chrome instalado (`chrome-launcher`/`CHROME_PATH`) y guarda evidencia en `test-results/lighthouse/*.json`. Sin dependencias nuevas.
- 2026-10-30 Resultados Lighthouse (móvil, build+start con mocks). ANTES (T14): Hoy 76, Tarea 92, Comprensión 84, A11y 100. DESPUÉS (varias corridas): Hoy 92-96, Tarea 91-96, Comprensión 88-95, Accessibility 100 en las 3. Evidencia final: Hoy 92, Tarea 93, Comprensión 88, A11y 100.
- 2026-10-30 Validación: `npm run lint`, `npm run typecheck`, `npm test` (235 OK, 10 omitidas), `e2e/accesibilidad.spec.ts` 64/64, `e2e/semana.spec.ts` 6/6 (escritorio+celular) y Lighthouse 3/3.

## Bloqueos
- Ninguno. (Resuelto el problema de materialización del addon nativo de SWC en esta máquina: `SWC_NATIVE_BINDING_CACHE=C:\Users\Josex\swc-cache`; es un detalle del entorno local, no del repositorio.)

## Correcciones solicitadas por T07
- [x] **Carga real rota:** nuevo `src/lib/server/data.ts` con `crearClienteServidor` (RLS) para Hoy, Semana, Tarea y Comprensión; se eliminó el `fetch` de `api-cliente` en el servidor. Mocks vía `usarMocks()`. No se usó URL pública fija ni `service_role`.
- [x] **Semana bloqueada:** `Dashboard` con `semana` en estado, `mover()` desde la semana actual, lunes como inicio (local y `semanaActual()` en servidor), reintento que vuelve a pedir la semana pendiente. Cobertura e2e en `e2e/semana.spec.ts`.
- [x] **Accesibilidad:** 34 `target-size` corregidos en `SelectorIdioma`, `Navegacion` y `MascotaBoton`/`ConMascota`; `axe` sin serious/critical y Lighthouse Accessibility 100. No se relajó ninguna prueba.
- [x] **Alcance ampliado:** se usaron `src/lib/fontes.ts`, `src/components/docente/VistaMapa.tsx`, la página de Semana y `e2e/semana.spec.ts`. Rutas exactas modificadas listadas en "Solicitudes al integrador". No se tocó API, DB ni `api-cliente.ts`.
- [x] **SSR y carga diferida:** contenido inicial visible en servidor; solo se difieren `MascotaSidebar`/`MascotaBoton`. `RepasoIA` conserva ubicación y comportamiento.
- [x] **Validación reproducible:** Lighthouse mide build+start con mocks de forma explícita (`playwright.lighthouse.config.ts`), respeta el Chrome instalado, guarda puntuaciones y no añade dependencias. Ejecutados lint, typecheck, unitarias, accesibilidad, demo y navegación semanal.

