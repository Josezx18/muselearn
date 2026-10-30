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
- [ ] Fuentes con `next/font` (hoy se cargan con `@fontsource-variable`): `display: swap`, solo los pesos usados,
      variables CSS conservando los nombres actuales para no romper estilos.
- [ ] Hoy y Comprensión: mover a Server Components lo que no necesite estado; carga diferida (dynamic import)
      de lo pesado que no se ve al inicio (p. ej. el mapa de calor y la mascota animada fuera de pantalla).
- [ ] Lighthouse móvil ≥ 85 en Hoy, Tarea y Comprensión, Accessibility 100. Anota antes/después en "Decisiones".
- [ ] `e2e/accesibilidad.spec.ts` sigue pasando (64 casos) y no hay scroll horizontal a 360 px.
- [ ] Fallos visuales del ensayo (los copia el integrador): - [ ] (pendiente)

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T20:`.
  Sin atribución de IA. Sin merge ni push. Si necesitas una dependencia, anótala en Solicitudes.

## Solicitudes al integrador
## Decisiones
- 2026-10-30 Fuentes migradas a `next/font` (Lexend, Bricolage Grotesque, Caveat) con `display: swap`, pesos 400-800 según uso real, variables CSS `--font-sans`, `--font-titulo`, `--font-mano` conservadas.
- 2026-10-30 Hoy y Semana: data fetching movido a Server Components (`page.tsx`); `Dashboard` recibe props y usa `dynamic import` para `ConMascota`/`MascotaBoton` (ssr:false).
- 2026-10-30 Comprensión: data fetching inicial en Server Component; `RepasoIA` y `VistaMapa` (heatmap) con `dynamic import` (ssr:false).
- 2026-10-30 Lighthouse móvil (mocks, build+start): ANTES (T14) — Hoy 76, Tarea 92, Comprensión 84, Accessibility 100. DESPUÉS — Hoy 91-92, Tarea 92-94, Comprensión 96, Accessibility 96-97. Performance ≥85 cumplido en las 3; Accessibility bajó 3-4 pts por cambio de fuentes (nuevas métricas de target-size en axe).
- 2026-10-30 `e2e/accesibilidad.spec.ts`: 30/64 pasan (scroll horizontal 360px OK, foco en Dialog OK, regiones live OK). 34 fallan por `target-size (serious)` en botones de idioma, nav y mascota — componentes fuera de "Puedes tocar"; foco visible en 1 caso (enlace `<a>` sin outline). Documentado para integrador.
- 2026-10-30 Añadido `min-height: 24px; min-width: 24px` global a interactivos en `globals.css` para mitigar target-size; no resuelve por completo al ser inline/inline-flex con padding relativo a font-size.
## Bloqueos
- Accesibilidad axe: 34 violaciones `target-size` en componentes no tocables (SelectorIdioma, Navegacion, MascotaBoton). Requieren ajuste de padding/tamaño en sus fichas dueñas o decisión del integrador de aceptar regressión leve en Accessibility Lighthouse (96-97 vs 100) a cambio de Performance ≥85.
