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
- [ ] `e2e/accesibilidad.spec.ts` con axe en estas pantallas (mocks, escritorio y celular): portada, login, registro, Hoy, tarea, tutor, verificación, informe, clase del docente, panel de comprensión (las 3 pestañas), configuración, privacidad. Cero violaciones "serious" o "critical".
- [ ] Contraste AA en los 3 temas (cuaderno, meta, muse), en claro. Foco visible en todos los controles.
- [ ] Todos los botones con solo ícono tienen nombre accesible; los diálogos atrapan el foco y Escape cierra; los mensajes de estado usan `role="status"`/`aria-live`.
- [ ] Rendimiento: medir con Lighthouse móvil (throttling por defecto) Hoy, tarea y panel de comprensión con `npm run build && npm start` y mocks. Anota el antes y después en "Decisiones". Objetivo ≥ 85 en Performance y ≥ 95 en Accessibility; corrige imágenes sin tamaño, fuentes que bloquean, JS de cliente innecesario (pasar a Server Components lo que no necesite estado).
- [ ] Toda pantalla a 360 px sin scroll horizontal (prueba incluida).

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T14:`. Sin atribución de IA. Sin merge ni push.

## Solicitudes al integrador
## Decisiones
## Bloqueos
