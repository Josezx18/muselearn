# T11 — Ensayo de la demo contra la app actual

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t11-demo` / `../MuseLearn-T11` |
| Depende de | main en 3a6b88c |
| Puedes tocar | `.orquesta/DEMO.md`, `.orquesta/tareas/T11-ensayo-demo.md`, `e2e/demo-guion.spec.ts` (nuevo), `docs/capturas/` (solo capturas nuevas), `README.md` (solo la sección "Screens") |

## Objetivo
Que el guion del video del hackathon (`.orquesta/DEMO.md`, entrega el 4 de nov) coincida con lo que la app hace hoy, y que exista una prueba que recorra el guion completo con datos de demo.

## Criterios de aceptación
- [x] Recorre `.orquesta/DEMO.md` paso a paso con `NEXT_PUBLIC_USAR_MOCKS=true` (`npm run dev`) y anota en "Hallazgos" cada paso que ya no coincide (textos, botones, pantallas que cambiaron).
- [x] Actualiza el guion para incluir lo nuevo que vale mostrar en ≤ 3 minutos: crear tarea con IA, tarea que se entrega en Classroom con evidencia, conversación por voz con la mascota, panel de comprensión (General → Por estudiante), borrador de comentario. Mantén la frase clave "entregó vs. demostró comprensión".
- [x] `e2e/demo-guion.spec.ts`: recorre el guion actualizado (escritorio y celular) sin errores de consola ni scroll horizontal.
- [x] Capturas nuevas a 1440 px y a 390 px de las pantallas del guion en `docs/capturas/` (nombres `demo-XX-*.png`).
- [x] No cambies código de la app: si algo no funciona, descríbelo en "Hallazgos" con pasos para reproducirlo.

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T11:`. Sin atribución de IA. Sin merge ni push.

## Hallazgos

Ensayo local con mocks; no se cambió código de la app.

| Paso anterior | Diferencia y reproducción | Cambio del guion |
|---|---|---|
| Historia inicial | Abrir `/es/docente/comprension`, Matemática: 4/5 entregas y 2/5 con nivel global ≥3 (80 % / 40 %). Sofía tiene dificultades; los mocks no acreditan copia. | Narrar las cifras visibles; eliminar la afirmación de trabajo perfecto/copió. |
| Nueva tarea manual | Clase → Nueva tarea incluye **Crear la tarea con IA**, revisión docente y modalidad **En Classroom**. | Mostrar propuesta, revisión y guardado. |
| Nueva tarea → Hoy | Crear y guardar en mocks, navegar a Hoy: `crearTarea` no modifica `tareasMock` ni el plan. | Corte explícito a tareas preparadas; no afirmar persistencia de esa creación. |
| Hoy | La mascota se puede tocar para abrir **Conversación con tu tutor**; el botón de prioridad es un desplegable `summary`. | Incorporar conversación por voz sin extender el bloque del tutor más de 30 s. |
| Tutor por texto | Se mantiene **Necesito una pista**, ahora hay conversación con detección de pausa y síntesis del navegador. | Mostrar voz y salida **Prefiero escribir**. |
| Entrega de cuaderno | `/es/estudiante/tarea/00000000-0000-4000-8000-000000000203` muestra **Tu evidencia**, enlace a Classroom y casilla **Ya la entregué en Google Classroom.** | Distinguir entrega externa de evidencia local. La casilla no consulta ni envía a Google. |
| Explícamelo | En mocks las preguntas y el informe son siempre de ecuaciones, incluso al entregar Arduino; las nuevas entregas tampoco persisten al navegar. | Corte rotulado a la entrega preparada de ecuaciones (`201`, entrega `301`). No afirmar visión o ASR real a partir del mock. |
| Informe | El nivel y las citas son fijos; no se recalculan con las respuestas del ensayo. | Presentarlos como datos ficticios preparados; ensayo de modelos reales fuera de T11. |
| Panel docente | Hay pestañas **General**, **Por estudiante**, **Mapa**. Por estudiante requiere elegir un nombre antes de ver Sus tareas. | General → Por estudiante → Camila, en lugar de ir directamente al mapa. |
| Cierre docente | **Ver entrega** incluye **Borrador con IA** u **Otro borrador**, texto editable y envío/actualización. | Incluir revisión humana del comentario. |
| Empezar muy pronto en desarrollo | Abrir directamente la verificación con servidor frío y pulsar Empezar apenas aparece: el HTML puede preceder a la hidratación y el clic no abrir la pregunta. Esperar y volver a pulsar funciona. | Ensayar con páginas precargadas; la prueba reintenta hasta que aparece Tu explicación. |

## Decisiones

- Guion de montaje de 2:55, narración ES y subtítulos EN. Separar claramente ejemplos y datos simulados.
- Usar audio sintético solo en el navegador de prueba para ejercitar WAV/detección de pausa con la transcripción mock existente. Sin llamadas de pago ni permisos de micrófono real.
- Respetar el alcance explícito de «Puedes tocar»: el estado, bitácora y propuestas de T11 se registran aquí; no modificar `PROGRESO.md` ni `ESTADO.md`, no incluidos en la ficha.
- La regla específica de T11 «Sin merge ni push» prevalece sobre el cierre genérico de la skill; no hacer push.
- Rama actualizada con `git rebase main` (921316d), sin cambios de app.

## Bloqueos

Ninguno para el alcance T11. Voz humana, visión y entrega real en Classroom quedan explícitamente como preparación de grabación, no como resultados del ensayo mock.

## Verificación y bitácora T11

- 2026-10-29 [T11] 🟩 Lista para integrar. Guion ES/EN de 2:55 actualizado, diferencias documentadas, README Screens renovado y 22 capturas nuevas (11 pantallas × 1440/390 px), dimensiones PNG verificadas y revisión visual de voz, evidencia, informe, panel y comentario.
- `npm.cmd run lint`: OK; `npm.cmd run typecheck`: OK; `npm.cmd test`: 181 pasan, 10 omitidas opt-in/preexistentes.
- `npx.cmd playwright test e2e/demo-guion.spec.ts --workers=1`: 2/2 pasan, escritorio y celular; sin excepciones, errores de consola ni scroll horizontal en las pantallas del recorrido.
- Infraestructura local: SWC y Chrome requirieron ejecutar fuera del usuario restringido; usado Chrome instalado mediante `CHROMIUM_PATH`, sin instalar dependencias ni cambiar configuración.
- Prueba de voz estabilizada con 800 ms de silencio inicial para respetar la calibración de ruido del detector antes del tono y su pausa.

## Mejoras propuestas al integrador

- Hacer persistentes las tareas y entregas del modo demo para poder grabar el mismo caso de principio a fin sin cortes entre ejemplos.
- Añadir un ensayo opt-in de voz y visión reales con datos ficticios antes de grabar el video final.
