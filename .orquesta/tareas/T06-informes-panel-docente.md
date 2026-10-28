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
- [x] `generarRuta(informe, tarea)` según prompt 05, validada con Zod; guarda en `informes.ruta`.
- [x] Página `/estudiante/informe/[id]`: nivel global, nivel por concepto con evidencia, fortalezas, debilidades, resumen en tono amable y ruta de práctica como lista de pasos marcables.
- [ ] Los pasos de la ruta se pueden "Agregar a mi semana" (crea bloques; coordinar con T03 vía `POST /api/ia/plan`).
- [x] Panel docente `/docente/comprension`: selector de clase y tarea, **mapa de calor** estudiante × concepto (colores por nivel 1-4, gris si no hay dato), lista "conceptos a reforzar" y detalle por estudiante con `resumen_docente`.
- [x] Indicadores: % que entregó vs. % que demostró comprensión (nivel ≥ 3). Esta comparación es la frase clave del pitch.
- [x] Endpoint `GET /api/docente/comprension` calcula el `MapaComprension` con consultas a la base (sin IA).
- [x] Textos en es y en. Funciona en celular (el mapa de calor se desplaza dentro de su propio contenedor).

## Notas del integrador (27 oct)
- **Ya integrado en main:** T01 (auth, clases), T02 (tareas, entregas con fotos en Storage), T03 (análisis y plan), T04 (tutor y verificación), T05 (Hoy, Semana, tarea).
- **T04 ya guarda el informe:** al terminar la verificación, `src/app/api/verificacion/responder/route.ts` hace upsert en `informes` (`entrega_id`, `informe`, `ruta`) y pone la entrega en `verificada`. Hoy la ruta la crea un **adaptador temporal** `generarRuta()` en `src/lib/ia/conversacion/verificador.ts`. Tu trabajo: crear el `generarRuta(informe, tarea, idioma)` real en `src/lib/ia/informes/` (prompt 05, `llamarMuse({ funcion: "ruta", … })`, validado con `RutaPractica`) y cambiar ese adaptador para que llame al tuyo. No toques el resto de T04.
- T04 y T05 enlazan a `/estudiante/informe/[id]`: revisa en `verificar/page.tsx` y `Verificacion.tsx` si `[id]` es el `entrega_id` y usa lo mismo.
- RLS: `informes` se puede **leer** con la sesión (el estudiante el suyo, el docente los de sus tareas). Las escrituras van con `crearClienteAdmin()` después de comprobar permisos.
- El panel docente y `GET /api/docente/comprension` se calculan con consultas (sin IA). Usa `@/lib/api-cliente` en el frontend; si te falta una función, agrégala al final de ese archivo y anótalo aquí.
- Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Commits pequeños con prefijo `T06:`. Si no puedes ver el navegador, dilo en Bloqueos en vez de marcar el criterio de 380 px.

## Revisión del integrador (28 oct, madrugada)
- Integrada en main. Ruta real con prompt 05 y validación estricta, informe del estudiante, mapa de calor, indicadores "entregó vs. demostró comprensión" y endpoint sin IA. Buen trabajo.
- **Respaldo:** si `generarRuta` falla al cerrar la verificación, se guarda `rutaBasica()` (sin IA) y el informe nunca se pierde; se puede regenerar con `POST /api/informes/[id]/ruta`.
- Arreglado el mock de `conversacion.test.ts` (ahora responde una `RutaPractica` a `funcion: "ruta"`). 119 pruebas OK.
- UI: comillas duplicadas en la evidencia, enlaces sin estilo, texto interno "pendiente de integración" visible al estudiante, `<main>` anidado, `bg-gray-200` → token `bg-nivel-vacio`. Código formateado.
- **"Agregar a mi semana" queda como mejora**: el planificador recalcula la semana desde cero y borraría los bloques de práctica; requiere rediseñar T03. Hoy los pasos se marcan en el propio informe.

## Decisiones
- `[id]` es `entrega_id`, como en T04/T05. El adaptador T04 solo reexporta la implementación T06; su cierre existente guarda informe y ruta.
- Ruta: esquema compartido refinado según prompt 05 (2–6 pasos, 5–25 minutos y conceptos de nivel 1–2; 1–2 retos si todos son ≥ 3). Identidad fijada por servidor. No se usó la API real de IA en estas pruebas.
- Lectura de informes con sesión/RLS. Regeneración solo por el estudiante propietario, mediante comprobación de entrega antes de usar admin; ruta existente se reutiliza.
- En todas las tareas, el mapa toma el informe más reciente por concepto. Indicadores sobre estudiantes inscritos: al menos una entrega / al menos un informe global ≥ 3. El texto de la pantalla explica el denominador.
- Pasos marcados persisten localmente por entrega. No se afirma haber añadido bloques al plan mientras falte la ampliación T03.
- Se agregó únicamente `cargarComprension()` al final de `src/lib/api-cliente.ts`, según autorización explícita de las notas del integrador; compone endpoints existentes y usa un mock coherente y filtrable.
- Validación: lint y typecheck pasan; 14 pruebas nuevas T06 pasan (ruta, mapa, RLS/identidad y permisos). Chrome real en modo headless: es/en, 380/1280 px, detalle docente y persistencia de casillas. Ancho de página 380/380; mapa de calor 314 px visibles y 525 px internos.

## Bloqueos
- No puede completarse «Agregar a mi semana»: `POST /api/ia/plan` solo acepta `semana_inicio`; el planificador excluye las tareas ya entregadas y no incorpora pasos de práctica. Sus archivos son propiedad de T03 y no están autorizados por esta ficha. Se solicitó al usuario una excepción puntual; pendiente de respuesta.
- La suite completa tiene 116 pruebas OK, 10 omitidas y 2 fallos en `src/lib/ia/conversacion/conversacion.test.ts`: el mock de `llamarMuse` devuelve siempre un InformeComprension, incluso cuando la función ahora requiere RutaPractica. Es necesario ajustar el mock por `funcion` o programar una segunda respuesta para `ruta`; ese test es propiedad de T04. No se alteró código de producción para aceptar salidas inválidas.
- El usuario autorizó explícitamente hacer commit tras ejecutar los tres controles, aun con estos dos fallos documentados. No se hizo push.

## Solicitudes al integrador
- T03: ampliar `POST /api/ia/plan` para aceptar `entrega_id` y los índices de pasos de una ruta guardada; comprobar propiedad, tomar títulos/duraciones desde `informes.ruta`, crear bloques sin solapar y deduplicar reintentos. Integrar el cliente «Agregar a mi semana» al contrato acordado. Mientras tanto, la UI muestra la práctica marcable y acceso a Semana.
- T04: actualizar el mock del test citado para responder un `RutaPractica` válido a `funcion: "ruta"` (2 pasos para nivel 1, 1–2 retos para nivel 4). La nueva llamada a Muse es parte de la sustitución del adaptador solicitada por el integrador.
