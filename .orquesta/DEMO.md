# Guion del video (3:00 exactos, requisito oficial)

**Formato recomendado:** narración en español (es auténtico y es el tema *Build for Your World*) con **subtítulos en inglés**.
Interfaz en español. Grabar la pantalla del celular para el estudiante y la PC para el docente.
Que se vea como un **sistema de agentes que actúa solo**, no como un chat.

App: https://muselearn-five.vercel.app · Cuentas de demo en `supabase/seed-auth.ts` (contraseña `Demo-Muse-2026`).

## La historia
Clase **Matemática 4to A** (código MAT4KQ), 5 estudiantes ficticios. Los datos de demo (`supabase/seed-demo.sql`) ya traen
dos tareas verificadas. En la de ecuaciones **todos entregaron (100 %), pero solo 3 de 5 demostraron comprensión (60 %)**,
y **Sofía** entregó un trabajo perfecto que no supo explicar. En el video, **Camila** hace en vivo la tarea nueva.

## Escenas

| Tiempo | Pantalla | Qué hacer | Narración (ES) | Subtítulo (EN) |
|---|---|---|---|---|
| 0:00–0:15 | Tú en cámara, o la portada | — | Soy docente de Tecnología en República Dominicana. Hoy una tarea entregada ya no prueba que alguien aprendió: la IA la puede hacer por ellos. | I teach technology in the Dominican Republic. Today a submitted assignment no longer proves anyone learned: AI can do it for them. |
| 0:15–0:30 | PC · docente · Tareas → **Nueva tarea** | Crear "Sistemas de ecuaciones 2x2", nivel de ayuda **Solo pistas**. | Asigno una práctica y decido cuánta ayuda puede dar el tutor: solo pistas. | I assign practice and choose how much help the tutor may give: hints only. |
| 0:30–0:55 | Celular · Camila · **Hoy** | Mostrar el aviso amarillo y "Lo próximo que te toca". Tocar "¿Por qué esta prioridad?". | Sin que nadie pregunte, MuseLearn analiza la tarea para cada estudiante —dificultad, minutos, prioridad— y reorganiza su semana. Y le explica por qué. | Without anyone asking, MuseLearn analyzes the task for each student — difficulty, minutes, priority — and re-plans their week, explaining why. |
| 0:55–1:20 | Celular · **Tutor** | Escribir: *"Dame la respuesta del ejercicio 2"*. Luego tocar **Necesito una pista**. | Camila pide la respuesta. El tutor no se la da: le hace la pregunta que la lleva a descubrir el paso. | Camila asks for the answer. The tutor won't give it: it asks the question that leads her to the step. |
| 1:20–1:35 | Celular · tarea → **Tomar foto del cuaderno** | Fotografiar la hoja escrita a mano y **Entregar**. | Entrega como siempre: una foto de su cuaderno. | She submits like always: a photo of her notebook. |
| 1:35–2:15 | Celular · **Explícamelo** | Empezar. Escuchar la pregunta (debe citar un paso de la foto). Tocar el **micrófono** y responder hablando. | Muse Spark lee su letra y le pregunta por un paso concreto que escribió. Ella responde hablando; Muse Voice Transcribe lo pasa a texto. Tres preguntas, sobre su propio trabajo. | Muse Spark reads her handwriting and asks about a specific step she wrote. She answers out loud; Muse Voice Transcribe turns it into text. Three questions, about her own work. |
| 2:15–2:30 | Celular · **Tu comprensión** | Bajar despacio: nivel por concepto, evidencia resaltada, ruta de práctica. | Recibe su nivel por concepto, con la evidencia de lo que dijo, y una ruta de práctica corta para lo que le falta. | She gets her level per concept, backed by her own words, and a short practice route for what's missing. |
| 2:30–2:50 | PC · docente · **Comprensión** | Elegir la tarea "Ecuaciones de primer grado". Mostrar las dos barras y tocar a **Sofía**. | Y yo veo lo que ningún aula virtual muestra: el 100 % entregó, pero solo el 60 % demostró que entendió. Sofía entregó un trabajo perfecto… y no pudo explicar ningún paso. | And I see what no LMS shows: 100% submitted, but only 60% showed they understood. Sofía turned in perfect work… and couldn't explain a single step. |
| 2:50–3:00 | Portada | — | Hecho durante el hackathon con Muse Spark, Muse Voice Transcribe y Muse Spark Open. Entregar no es aprender. Demuéstralo. | Built during the hackathon with Muse Spark, Muse Voice Transcribe and Muse Spark Open. Proof of learning, not just proof of delivery. |

**Qué suma cada escena a la rúbrica:** 0:15–0:55 *agente autónomo* (Best Agentic Use-Case) y modelo abierto (Muse Spark Open en Baseten);
0:55–2:30 *uso creativo de Meta* (visión + voz + tutor con reglas); 2:30–2:50 *impacto*.

## Preparar antes de grabar
- [ ] Volver a cargar los datos de demo (`supabase/seed-demo.sql`) para que las fechas queden alrededor del día de la grabación.
- [ ] Una hoja real de cuaderno con **Sistemas 2x2** resuelto a mano (letra clara, foto derecha, buena luz).
- [ ] Ensayar el flujo completo una vez en la app publicada: tutor, foto, verificación por voz, informe.
- [ ] Celular: modo No molestar, brillo alto, sin notificaciones. PC: zoom del navegador al 110 %.
- [ ] Dos sesiones abiertas: docente (PC) y Camila (celular).
- [ ] Grabar varias tomas del tutor y de la verificación (las respuestas de la IA varían; elegir la mejor).
- [ ] Narración grabada aparte, con micrófono cerca; subtítulos en inglés quemados en el video.
- [ ] Duración final: 3:00 o menos.

## Plan B si algo falla en vivo
- El tutor tarda: dejar el corte en la respuesta ya escrita (es streaming; se puede acelerar 1,5× en edición).
- La lectura del cuaderno no cita un paso: repetir con una foto más clara; si sigue, usar la toma por texto.
- La voz falla: el botón "Probar dictado del navegador" o escribir la respuesta (mostrar que siempre hay alternativa).
