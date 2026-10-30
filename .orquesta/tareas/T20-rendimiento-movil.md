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
