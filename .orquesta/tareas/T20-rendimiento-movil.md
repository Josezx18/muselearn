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
## Bloqueos
- 2026-10-30 [T07, revisión de 33e1e1c]: no aceptada para integración. La rama informa 34 fallos de accesibilidad y Accessibility 96–97 frente al requisito de 100. No se acepta intercambiar accesibilidad por rendimiento.

## Correcciones solicitadas por T07
- [ ] **Carga real rota:** las páginas Hoy, Semana y Comprensión importan `api-cliente` desde el servidor. Sus funciones hacen `fetch("/api/...")`: en Node falta una URL absoluta y no se propaga la sesión autenticada. Los mocks ocultan el problema. Conservar la carga autenticada en cliente o solicitar un servicio de servidor específico; no solucionar con una URL pública fija ni con service_role. Probar sin mocks sin imprimir credenciales.
- [ ] **Semana bloqueada:** `Dashboard.mover()` activa `cargando` y cambia `semana`, pero se eliminó el efecto que pedía el plan y terminaba la carga. Restaurar la navegación entre semanas, el lunes como inicio (se reemplazó por la fecha UTC actual) y el reintento que ahora solo activa `cargando`. Añadir cobertura e2e de avanzar/retroceder y contenido de la semana elegida.
- [ ] **Accesibilidad:** reproducir y corregir los 34 casos indicados en la ficha. Mantener axe sin serious/critical y Lighthouse Accessibility 100. No relajar las pruebas ni aceptar la regresión. T07 autoriza para esta corrección mínima editar SelectorIdioma, Navegacion y MascotaBoton/ConMascota, además del alcance original.
- [ ] **Alcance ampliado de forma explícita:** se autorizan `src/lib/fontes.ts`, `src/components/docente/VistaMapa.tsx`, la página de Semana y el e2e de navegación semanal como auxiliares necesarios de T20. Documentar las rutas exactas modificadas. No editar API, DB ni `api-cliente.ts`.
- [ ] **SSR y carga diferida:** `ConMascota` envuelve todo Dashboard; usarlo con `ssr:false` oculta todo el contenido inicial y anula la ventaja del renderizado servidor. Mantener el contenido inicial visible y diferir solo elementos que lo permitan. Preservar la ubicación y comportamiento de RepasoIA.
- [ ] **Validación reproducible:** los tests Lighthouse deben medir build+start con mocks de forma explícita, no el servidor dev que levanta por defecto Playwright; respetar Chrome instalado, guardar puntuaciones/evidencia y no añadir dependencias nuevas. Ejecutar lint, typecheck, unitarias, accesibilidad, demo y navegación semanal. Marcar criterios solo cuando pasen; detallar cualquier limitación real.
