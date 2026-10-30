# Guion del video — 2:55 (máximo 3:00)

Ensayo T11, 29 de octubre de 2026. Narración ES, subtítulos EN, interfaz ES.
Estudiante en celular (390 px), docente en escritorio (1440 px). Entrega: 4 de noviembre.
Frase central: **entregó vs. demostró comprensión**.

## Datos y continuidad

Ensayar con `NEXT_PUBLIC_USAR_MOCKS=true`: datos ficticios, sin llamadas a proveedores ni a Classroom.
Matemática 4to A (`MAT4KQ`) tiene cinco estudiantes: cuatro entregaron (80 %) y dos demostraron comprensión (40 %).
No narrar el antiguo 100 % / 60 % con los mocks. Sofía necesita apoyo; estos datos no demuestran que copiara.

Los mocks no conservan la tarea nueva al navegar. Después de crearla, hacer un corte explícito a las tareas preparadas.
Classroom se muestra con **Semáforo con Arduino**. La verificación y el informe, con **Práctica: ecuaciones de primer grado**.
Rotular el corte «Otro ejemplo: ecuaciones». Los informes mock son fijos, no una evaluación real de las respuestas del ensayo.

## Escenas

| Tiempo | Pantalla y acciones | Narración ES | Subtítulo EN |
|---|---|---|---|
| 0:00–0:12 | Portada o cámara. | Soy docente de Tecnología en República Dominicana. Una tarea entregada ya no prueba que alguien aprendió. | I teach technology in the Dominican Republic. A submitted assignment no longer proves learning. |
| 0:12–0:35 | Docente → Matemática 4to A → **Nueva tarea** → **Crear la tarea con IA**. Tema «Ecuaciones de primer grado» → **Proponer tarea**. Revisar título, instrucciones y ayuda; fecha futura, **En Classroom**, enlace → **Guardar**. | Muse propone la tarea y sus competencias. Yo reviso, decido cuánta ayuda recibe el estudiante y dónde entrega: también en Classroom. | Muse drafts assignments and competencies. I review them and choose tutor support and where students submit, including Classroom. |
| 0:35–0:53 | Corte a Camila → **Hoy**: «Lo próximo que te toca», aviso y prioridad. | El agente analiza dificultad, tiempo y prioridad, y organiza la semana. Camila ve qué le toca y por qué. | The agent analyzes difficulty, time and priority, and organizes the week. Camila sees what comes next and why. |
| 0:53–1:15 | Tocar la mascota → **Conversación con tu tutor** → **Empezar a conversar**. Decir «Necesito una pista». Esperar respuesta; **Prefiero escribir** muestra el chat y **Necesito una pista**. | Con un toque habla con su mascota. Al hacer una pausa, el tutor responde con una pregunta que la ayuda a pensar. | One tap starts a voice conversation with her companion. When she pauses, the tutor responds with a guiding question. |
| 1:15–1:35 | **Semáforo con Arduino** → mostrar **Abrir Classroom**. En **Tu evidencia**, escribir cómo programó los LED o agregar foto; marcar **Ya la entregué en Google Classroom.** → **Entregar**. | La tarea se entrega en Classroom. Aquí aporta evidencia y confirma que ya la entregó, para después explicar su trabajo. | She submits in Classroom. Here she provides evidence and confirms submission, ready to explain her work. |
| 1:35–2:00 | Corte rotulado «Otro ejemplo: ecuaciones». **Explícamelo** → **Empezar** → tres respuestas con cortes. Mocks: texto. Real: ensayar voz y foto previamente. | Entregar y comprender son cosas distintas. En esta práctica de ecuaciones, explica por qué hace cada operación y cómo comprueba el resultado. | Submission and understanding are different. In this equations example, she explains each operation and how she checks the result. |
| 2:00–2:15 | **Tu comprensión** → conceptos, evidencia y **Tu ruta de práctica**. | Recibe un nivel por concepto, evidencia de su explicación y una ruta corta para practicar lo que le falta. | She gets a level per concept, evidence from her explanation, and a short practice path. |
| 2:15–2:35 | Docente → **Comprensión** → **General**: 80 % / 40 %. **Por estudiante** → elegir Camila; opcional Sofía para mostrar apoyo. | Yo comparo entregó vs. demostró comprensión: aquí, ochenta frente a cuarenta por ciento. Paso de la clase a cada estudiante para saber quién necesita apoyo. | I compare submission with demonstrated understanding: here, eighty versus forty percent. I move from the class overview to each student's needs. |
| 2:35–2:48 | Camila → **Ver entrega** → **Borrador con IA** (u **Otro borrador**). Editar → **Enviar comentario** o **Actualizar**. | Muse sugiere un comentario basado en la entrega y su explicación. Yo lo reviso y lo envío. | Muse drafts feedback from the submission and explanation. I review and send it. |
| 2:48–2:55 | Portada. | Muse Spark, Muse Voice Transcribe y Muse Spark Open. Entregar no es aprender. Demuéstralo. | Muse Spark, Muse Voice Transcribe and Muse Spark Open. Show what you learned. |

Los tiempos corresponden al montaje final: cortar esperas, preparar tomas, mantener voz comprensible.
Tutor: menos de 30 segundos. Mostrar el ciclo organizar → aprender → entregar → demostrar → mejorar.
La mención de modelos describe la implementación real; los mocks no validan proveedores, costos, ASR ni visión.

## Reproducir

En PowerShell, servidor:

```powershell
$env:NEXT_PUBLIC_USAR_MOCKS='true'
npm.cmd run dev
```

Otra terminal:

```powershell
$env:NEXT_PUBLIC_USAR_MOCKS='true'
$env:DEMO_CAPTURAS='true'
# Opcional, si falta el Chromium de Playwright:
$env:CHROMIUM_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
npx.cmd playwright test e2e/demo-guion.spec.ts --workers=1
```

El ensayo comprueba consola, excepciones y desbordamiento en escritorio y celular.
Las capturas se guardan en `docs/capturas/demo-XX-*-1440.png` y `demo-XX-*-390.png`.
El audio automatizado es un tono seguido de silencio: ejercita captura WAV, detección de pausa y transcripción mock.
La voz audible y el reconocimiento de habla humana se ensayan manualmente en el dispositivo real.

## Antes de grabar

- [ ] Elegir mocks rotulados como demostración o cuentas ficticias reales. No mezclar cifras del seed con las de mocks.
- [ ] App publicada: https://muselearn-five.vercel.app. Cuentas en `supabase/seed-auth.ts`; no mostrar credenciales.
- [ ] En modo real, refrescar fechas del seed y confirmar los porcentajes antes de narrarlos.
- [ ] Confirmar con dos sesiones reales que la tarea creada llega a Camila y reorganiza el plan; los mocks no prueban esa persistencia.
- [ ] Entregar de verdad en Classroom antes de marcar la casilla. MuseLearn registra la confirmación del estudiante; no envía ni comprueba la entrega en Google.
- [ ] Ensayar micrófono, altavoz y foto clara del cuaderno. No afirmar lectura de un paso si la pregunta no lo cita.
- [ ] Revisar el comentario y comprobar que llega al estudiante con cuentas reales.
- [ ] Celular sin notificaciones; PC a 100 % para reproducir capturas. Narración aparte, subtítulos EN; exportación ≤ 3:00.

## Alternativas

- IA lenta: usar toma de la propuesta lista conservando la revisión docente.
- Sin micrófono: **Prefiero escribir**; en verificación, **Tu explicación**.
- Foto ilegible: evidencia escrita, sin afirmar lectura de la foto.
- Classroom sin acceso: mostrar enlace y evidencia ficticia sin fingir una entrega externa real.
