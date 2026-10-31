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

## Revisión de integración T07
- Revisión inicial de `33e1e1c`: devuelta por carga relativa de API desde servidor, Semana sin recarga y 34 fallos de accesibilidad. La segunda revisión parte de `dbbee50`, conservando el historial de ambas rondas.
- T07 acepta las rutas auxiliares declaradas en Solicitudes. Las dependencias `@fontsource-variable/*` se conservan durante el cierre para evitar una limpieza de dependencias ajena al arreglo; ya no se importan desde los estilos.
- Ajustes de integración: validar filas/JSON con los contratos Zod y propagar errores de Supabase; reutilizar sesión y listado de clases con RLS; tarea inexistente responde 404 en lugar de sustituirla por otra o quedar en carga infinita; actualizar la entrega en pantalla tras enviar; recuperar devoluciones/correcciones del almacenamiento local en mocks; recuperar el plan inicial ausente mediante el endpoint existente; mantener RepasoIA en la vista General.
- Fechas SSR: zona del centro por offset y referencia inicial común, para evitar divergencias con el navegador; prueba de hidratación UTC y pruebas de cambio de día/mes. Sin cambios de permisos ni llamadas nuevas al modelo.
- Validación intermedia T07: lint/typecheck y 245 unitarias correctas (10 omitidas). Lighthouse inicial 94/98/97, A11y 100; otra corrida dio Hoy 82/Tarea 81/Comprensión 97 (A11y 100). Se conserva el umbral 85 y se guardará el informe completo para diagnóstico; no se consideran aprobadas las mediciones fallidas.
- Un servidor de `MuseLearn-T20` ocupaba el puerto 3000: se interrumpió una ejecución funcional que lo reutilizaba. La validación de integración usa `PLAYWRIGHT_PORT=3020`, con reutilización desactivada al especificar puerto. No se detuvo el servidor ajeno.
- Aceptación final T07: Lighthouse por mediana de cinco corridas consecutivas (criterio 85 conservado, mínimo de accesibilidad 100 en todas). Hoy **93** (82/93/94/91/95); Tarea **90** (88/90/83/93/92); Comprensión **96** (85/96/97/96/97). No se descartan muestras bajas. La mediana anterior del panel era 80; se corrigió que el mapa oculto se montaba pese al import dinámico. Solo se difiere el mapa; General y Por estudiante conservan sus estados. Muestras y metodología en `.orquesta/evidencia/T20/`.
- Verificación final: lint, typecheck, **245 unitarias** (10 omitidas) y build correctos. Suite completa: 156 correctas/8 omitidas/2 fallos del diseño inicial de la prueba UTC por advertencia previa de script al cambiar idioma; los dos casos acotados a hidratar y abrir campana pasaron después. Tras el ajuste del mapa, **16/16** pruebas dirigidas de panel, accesibilidad, mapa, demo, repaso y comentarios correctas. Las 64 de accesibilidad y seis de Semana ya pasaron en la suite completa. No se repite toda la suite tras el cambio exclusivo de montaje del mapa; se repiten los flujos afectados.
- T07 acepta la integración local; sin push, nuevas dependencias, migraciones ni cambios de autoría. Rebase desde main recomendado para trabajo posterior. Cámara/micrófono físico y recorrido autenticado de producción siguen fuera de este ensayo.
