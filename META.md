# META.md — Qué significa "terminado" para el hackathon

Entrega: **miércoles 4 de noviembre, 9:00 PM hora del Este = 10:00 PM en RD**. Meta interna: 6:00 PM RD.
Periodo de construcción: 27 oct – 4 nov. Todo el código debe escribirse en ese periodo.

## El producto está terminado cuando (todo verificable)

### Canal mínimo
- [ ] Un docente se registra, crea una clase y obtiene un código de 6 caracteres.
- [ ] Un estudiante se registra y se une con ese código.
- [ ] El docente crea una tarea con instrucciones, fecha, competencias y nivel de ayuda; puede adjuntar un PDF o imagen.
- [ ] El estudiante entrega texto, un archivo o **fotos de su cuaderno** tomadas con el celular.

### Organizador
- [ ] Al crear una tarea, cada estudiante recibe su análisis (dificultad, minutos, prioridad, conceptos) en menos de 15 s.
- [ ] Vista **Hoy**: qué hacer ahora, ordenado, con tiempo estimado.
- [ ] Vista **Semana**: calendario con entregas y bloques de estudio.
- [ ] Al llegar una tarea nueva, el plan se reorganiza y aparece un aviso explicando el cambio.

### Tutor
- [ ] El tutor guía con preguntas y pistas y pasa las 5 pruebas de `.orquesta/prompts/03-tutor.md`.
- [ ] Respeta el nivel de ayuda elegido por el docente.

### Verificación de comprensión
- [ ] Tras entregar, el estudiante responde 3 a 5 preguntas sobre su propio trabajo, incluidos pasos escritos a mano en la foto del cuaderno.
- [ ] Puede responder por **voz** (grabar en el celular) o por texto.
- [ ] Recibe un informe con nivel por concepto, fortalezas, debilidades y una ruta de práctica de 2 a 6 pasos.

### Docente
- [ ] Panel con mapa de calor estudiante × concepto y "conceptos a reforzar".

### Calidad
- [ ] Toda la interfaz en español e inglés (botón de idioma).
- [ ] Funciona en celular (380 px) y en computadora.
- [ ] Desplegado en Vercel con URL pública y datos de demo cargados.
- [ ] El flujo de demo completo pasa la prueba e2e de Playwright.
- [ ] Ningún secreto en el repositorio. RLS activo en todas las tablas.

### Entregables del hackathon (guía oficial)
- [ ] Video demo de **3 minutos** con solo lo construido durante el evento.
- [ ] README en inglés con problema, solución, modelos de Meta usados, cómo correrlo y sección "Built during the hackathon".
- [ ] Repositorio **público**.
- [ ] Usa la Meta Model API (Muse Spark con visión + Muse Voice Transcribe) y un modelo abierto de Meta (Muse Spark Open o Glimmer) para el análisis en lote.
- [ ] Video publicado en X y enlace enviado por la plataforma (premio viral, cuenta hasta el 8 nov).

## Fuera de alcance (no hacer hasta que todo lo anterior esté [x])
Foto de pizarra → tarea, vista mensual, generar tareas con IA, integración con Classroom/Moodle/Teams,
notificaciones push, app móvil nativa.
