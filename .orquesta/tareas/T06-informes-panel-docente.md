# T06 — Informe de comprensión, ruta de práctica y panel docente

| Campo | Valor |
|---|---|
| Plataforma | Codex (cambiado por el integrador el 27 oct) |
| Rama / carpeta | `t06-informes` / `../muselearn-T06` |
| Oleada | 2 (puede empezar con mocks cuando T02 esté hecha) |
| Depende de | T00; usa `InformeComprension` producido por T04 (mock mientras tanto) |
| Puedes tocar | `src/lib/ia/informes/`, `src/lib/ia/conversacion/verificador.ts` (solo para reemplazar el adaptador `generarRuta`), `src/app/api/informes/`, `src/app/api/docente/comprension/`, `src/app/[locale]/estudiante/informe/`, `src/app/[locale]/docente/comprension/`, `src/components/informes/`, `src/components/docente/`, `src/lib/mocks/informes.ts`, `messages/*/informes.json`, `messages/*/docente.json` |
| Contratos | `InformeComprension`, `RutaPractica`, `MapaComprension`; prompt 05 |

## Objetivo
Cerrar el ciclo: el estudiante sabe qué mejorar y el docente sabe quién entendió.

## Criterios de aceptación
- [ ] `generarRuta(informe, tarea)` según prompt 05, validada con Zod; guarda en `informes.ruta`.
- [ ] Página `/estudiante/informe/[id]`: nivel global, nivel por concepto con evidencia, fortalezas, debilidades, resumen en tono amable y ruta de práctica como lista de pasos marcables.
- [ ] Los pasos de la ruta se pueden "Agregar a mi semana" (crea bloques; coordinar con T03 vía `POST /api/ia/plan`).
- [ ] Panel docente `/docente/comprension`: selector de clase y tarea, **mapa de calor** estudiante × concepto (colores por nivel 1-4, gris si no hay dato), lista "conceptos a reforzar" y detalle por estudiante con `resumen_docente`.
- [ ] Indicadores: % que entregó vs. % que demostró comprensión (nivel ≥ 3). Esta comparación es la frase clave del pitch.
- [ ] Endpoint `GET /api/docente/comprension` calcula el `MapaComprension` con consultas a la base (sin IA).
- [ ] Textos en es y en. Funciona en celular (el mapa de calor se desplaza dentro de su propio contenedor).

## Notas del integrador (27 oct)
- **Ya integrado en main:** T01 (auth, clases), T02 (tareas, entregas con fotos en Storage), T03 (análisis y plan), T04 (tutor y verificación), T05 (Hoy, Semana, tarea).
- **T04 ya guarda el informe:** al terminar la verificación, `src/app/api/verificacion/responder/route.ts` hace upsert en `informes` (`entrega_id`, `informe`, `ruta`) y pone la entrega en `verificada`. Hoy la ruta la crea un **adaptador temporal** `generarRuta()` en `src/lib/ia/conversacion/verificador.ts`. Tu trabajo: crear el `generarRuta(informe, tarea, idioma)` real en `src/lib/ia/informes/` (prompt 05, `llamarMuse({ funcion: "ruta", … })`, validado con `RutaPractica`) y cambiar ese adaptador para que llame al tuyo. No toques el resto de T04.
- T04 y T05 enlazan a `/estudiante/informe/[id]`: revisa en `verificar/page.tsx` y `Verificacion.tsx` si `[id]` es el `entrega_id` y usa lo mismo.
- RLS: `informes` se puede **leer** con la sesión (el estudiante el suyo, el docente los de sus tareas). Las escrituras van con `crearClienteAdmin()` después de comprobar permisos.
- El panel docente y `GET /api/docente/comprension` se calculan con consultas (sin IA). Usa `@/lib/api-cliente` en el frontend; si te falta una función, agrégala al final de ese archivo y anótalo aquí.
- Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Commits pequeños con prefijo `T06:`. Si no puedes ver el navegador, dilo en Bloqueos en vez de marcar el criterio de 380 px.

## Decisiones
- 

## Bloqueos
- 

## Solicitudes al integrador
- 
