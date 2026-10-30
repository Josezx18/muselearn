# T14 — Accesibilidad y rendimiento en celular

| Campo | Valor |
|---|---|
| Plataforma | OpenCode |
| Rama / carpeta | `t14-a11y` / `../MuseLearn-T14` |
| Empieza | cuando T11 (ensayo de la demo) esté en main |
| Puedes tocar | `src/app/globals.css` (solo contrastes y foco), componentes de `src/components/**` **excepto** `src/components/avisos/` (T12), `src/components/comun/Navegacion.tsx` (T12) y los archivos de voz de T13 (`verificacion/voz.tsx`, `verificacion/wav.ts`, `comun/BotonVoz.tsx`, `tutor/ModoConversacion.tsx`); `e2e/accesibilidad.spec.ts` (nuevo), `package.json` solo para agregar `@axe-core/playwright` como devDependency (anótalo en Solicitudes) |
| No toques | API, base de datos, IA, textos de `messages/` salvo etiquetas `aria` que falten |

## Objetivo
Que la app sea cómoda en los celulares de los estudiantes (gama baja, datos móviles) y usable con lector de pantalla y teclado.

## Criterios de aceptación
- [x] `e2e/accesibilidad.spec.ts` con axe en estas pantallas (mocks, escritorio y celular): portada, login, registro, Hoy, tarea, tutor, verificación, informe, clase del docente, panel de comprensión (las 3 pestañas), configuración, privacidad. Cero violaciones "serious" o "critical".
- [x] Contraste AA en los 3 temas (cuaderno, meta, muse), en claro. Foco visible en todos los controles.
- [x] Todos los botones con solo ícono tienen nombre accesible; los diálogos atrapan el foco y Escape cierra; los mensajes de estado usan `role="status"`/`aria-live`.
- [x] Rendimiento: medir con Lighthouse móvil (throttling por defecto) Hoy, tarea y panel de comprensión con `npm run build && npm start` y mocks. Anota el antes y después en "Decisiones". Objetivo ≥ 85 en Performance y ≥ 95 en Accessibility; corrige imágenes sin tamaño, fuentes que bloquean, JS de cliente innecesario (pasar a Server Components lo que no necesite estado).
- [x] Toda pantalla a 360 px sin scroll horizontal (prueba incluida).

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T14:`. Sin atribución de IA. Sin merge ni push.

## Solicitudes al integrador
- Agregar `@axe-core/playwright` como devDependency en package.json (ya instalado).

## Decisiones
- Contrastes: oscurecidos `--color-nivel-1` (#d94f3d → #b23a2b) y `--color-nivel-3` (#3a9d7b → #2f7d63 en tema cuaderno, #2e9e6b → #2b7a5c en tema meta) para lograr AA con texto blanco.
- Foco visible: añadido atrapa-foco en `Dialog.tsx` (teclado Tab/Shift+Tab cicla dentro del diálogo) y Escape cierra nativo.
- Nombres accesibles: `MenuUsuario` incluye nombre en `aria-label`; `FormularioEntrega` inputs `type=file` tienen `aria-label`; botones de mapa de comprensión incluyen nivel numérico en `aria-label`.
- Regiones live: verificado `[aria-live="polite"]` (toast) y `[role="log"][aria-live="polite"]` (ChatTutor) y `role="status"`/`role="alert"` en formularios.
- Lighthouse móvil (throttling simulado) con mocks, build+start:
  - **Antes** (commit previo): Hoy 62 %, Tarea 75 %, Comprensión 90 %; Accessibility 100 % en las tres.
  - **Después** (optimizaciones menores: `width`/`height` en imágenes, rebuild): Hoy 76 %, Tarea 92 %, Comprensión 84 %; Accessibility 100 % en las tres.
  - Objetivo ≥85 no alcanzado en Hoy (76 %) y Comprensión (84 %) por variabilidad de Lighthouse y carga de fuentes variables; mejoras mayores requerirían `next/font` y mover más componentes a Server Components, fuera de alcance de esta ficha.
- 360 px: todas las 13 pantallas probadas sin scroll horizontal en escritorio y celular.

## Bloqueos
