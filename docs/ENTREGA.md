# Paquete de entrega de MuseLearn

Preparado el 30 oct de 2026. Borrador para que José complete y revise el formulario; no se ha enviado ni publicado ningún mensaje desde esta preparación.

## Enlaces

| Campo | Valor |
|---|---|
| Aplicación | https://muselearn-five.vercel.app |
| Repositorio público | https://github.com/Josezx18/muselearn |
| Cómo funciona, EN | https://muselearn-five.vercel.app/en/como-funciona |
| Cómo funciona, ES | https://muselearn-five.vercel.app/es/como-funciona |
| Video público de hasta 3 minutos | Pendiente de grabar y publicar por José. |
| Publicación de X | Pendiente de publicación por José. |
| Formulario del evento | https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit |

## Textos preparados en inglés

**Nombre:** MuseLearn

**Descripción corta:** A study companion that plans the week, tutors without doing the homework, and checks understanding through explanations of the student's own work.

**Problema y solución:**

As a technology teacher in the Dominican Republic, I see students submit work they cannot explain. MuseLearn connects assignments, weekly planning, Socratic tutoring, comprehension checks and targeted practice. Students explain their own steps by voice or text; teachers compare submission with demonstrated understanding and review AI-drafted feedback before sending it.

**Modelos y ejecución:**

Muse Spark handles tutoring, comprehension questions, notebook-photo reading, reports and teacher assistance through Meta Model API. Muse Voice Transcribe handles speech-to-text. Muse Spark Open is configured for task analysis and planning through an OpenAI-compatible open-weight provider such as Baseten; the client has provider fallback. Report the provider actually used in the final recording, rather than presenting every configured fallback as measured use.

**Qué se construyó:**

Product code was written during the hackathon build period starting October 27, 2026. Architecture notes, task sheets and draft prompts were prepared beforehand. The repository history records the implementation. The current product includes teacher/student accounts, classes, assignments and evidence, weekly plans, tutoring, comprehension reports, practice routes, teacher feedback, CSV exports, notices and test-mode Classroom import.

**Estado de la demostración:**

The automated rehearsal passed on desktop and phone viewports with fictional data. Separate live-model tests passed for tutoring, evaluation and task analysis. Mock reports and synthetic audio are identified as simulated; physical microphone/notebook-photo testing and the authenticated production walkthrough remain pending. The proposed MCP connector is a design document, not a shipped feature.

## Material audiovisual

- [Guion y tomas de 2:55](../.orquesta/DEMO.md).
- [Narración y pautas de grabación](video/GRABACION.md).
- [Subtítulos ingleses SRT](video/subtitulos-en.srt), pendientes de ajustar al audio final.
- [Capturas del recorrido](capturas/), con datos ficticios y respuestas simuladas.
- [Textos bilingües para X](PUBLICACION-X.md); verificar etiquetas oficiales y añadir los enlaces finales.

## Revisión final a cargo de José

- [ ] Terminar y revisar T20 antes de elegir la versión final que se graba.
- [ ] Realizar el ensayo con celular/PC y cuentas demo autenticadas; registrar observaciones en [ENSAYO.md](../.orquesta/ENSAYO.md).
- [ ] Revisar cifras, modelo/proveedor usado y rótulos de simulación de cada escena.
- [ ] Grabar y montar el video; ajustar SRT al audio; exportar con duración máxima de 3:00.
- [ ] Confirmar fecha límite, requisitos del formulario y etiquetas directamente en la cuenta del evento.
- [ ] Abrir app, repo y video desde una ventana privada. Confirmar cómo accederá el jurado a la demo sin poner contraseñas en el repo ni en publicaciones.
- [ ] Completar los campos pendientes del formulario y enviar; conservar el comprobante.
- [ ] Publicar en X, comprobar el enlace y añadirlo donde lo pida el formulario.

La página pública consultada el 30 oct anuncia cierre de proyectos el 4 nov a las 9:00 PM ET; muestra también 9:00 PM EST, equivalente a 10:00 PM en República Dominicana. La meta interna del plan sigue siendo 6:00 PM RD. Confirmar de nuevo antes del envío; la página indica que las fechas pueden cambiar. Fuente: [página oficial del evento](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit). La vista pública no mostró los campos autenticados del formulario, que no se han validado ni rellenado.
