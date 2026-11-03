# 12. Guía de usuario

Guía inicial para la app web actual. Los nombres de botones pueden variar por idioma o por versión. Usa solamente una cuenta de prueba autorizada y no compartas contraseñas. El README contiene información de acceso a la demo ficticia; no se reproducen credenciales aquí.

## Para el docente

### 1. Accede y crea una clase

1. Regístrate/inicia sesión con rol **Docente**.
2. En **Clases**, crea una clase con nombre, materia y grado.
3. Comparte el código de seis caracteres únicamente con los estudiantes autorizados.
4. Si un código se comparte por error, genera uno nuevo desde la clase.

### 2. Crea una tarea

1. Abre la clase y selecciona **Nueva tarea**.
2. Indica título, instrucciones, fecha/hora, competencias y modalidad: MuseLearn, cuaderno, Classroom u otra plataforma.
3. Define el nivel de ayuda del tutor: **Pistas**, **Ejemplos** o **Explicación**. El tutor no debe resolver el ejercicio asignado en ningún nivel.
4. Opcionalmente agrega PDF/imagen o usa la propuesta de IA.
5. Revisa/edita la propuesta antes de guardar. El análisis puede procesarse en segundo plano y alimentar el plan del estudiante.

### 3. Revisa aprendizaje y entregas

1. Abre **Comprensión** y selecciona clase y tarea o vista general.
2. Compara estudiantes que entregaron con quienes demostraron comprensión; revisa el nivel por concepto y los casos sin informe.
3. Abre una entrega para ver evidencia, respuesta/verificación e informe permitidos.
4. Puedes guardar una nota opcional, escribir un comentario o pedir un borrador a la IA. Revisa y edita cualquier borrador antes de enviarlo.
5. Para pedir corrección, devuelve la entrega con un motivo claro. El estudiante verá el motivo y podrá volver a entregar.
6. Exporta la información de clase a CSV si tienes autorización para manejar el archivo.

### IA de repaso

La sugerencia de repaso usa resultados agregados por concepto. Revísala antes de compartirla; no sustituye el criterio docente ni una evaluación pedagógica.

## Para el estudiante

### 1. Únete a tu clase

1. Regístrate/inicia sesión como **Estudiante**.
2. Introduce el código que te dio tu docente.
3. Si el código no existe o ya estás inscrito, revisa el mensaje y confirma el código con el docente.

### 2. Organiza la semana

1. Abre **Hoy** para ver lo próximo y el tiempo estimado; **Semana** muestra bloques y vencimientos.
2. Abre una tarea para ver instrucciones, análisis y pasos sugeridos.
3. Marca bloques como hechos/omitidos cuando corresponda; si el plan cambió, revisa el aviso.
4. Si no ves análisis/plan, puede estar pendiente o la integración/IA puede no estar configurada.

### 3. Pide una pista

1. Desde la tarea, abre **Tutor**.
2. Escribe lo que intentaste o usa la conversación de voz si tu navegador permite micrófono.
3. El tutor guía con preguntas y pistas; no proporciona la respuesta final.
4. Si falla voz o transcripción, cambia a escribir. El audio se procesa para transcribir y MuseLearn no lo guarda según el flujo implementado.

### 4. Entrega y explica tu trabajo

1. Envía texto y/o archivos; en móvil puedes usar **Tomar foto** para adjuntar páginas del cuaderno.
2. Si la tarea se entrega en Classroom/otra plataforma, realiza la entrega allí primero. MuseLearn solo guarda tu evidencia y confirmación; no envía ni comprueba la entrega externa.
3. Después de enviar, inicia **Explícamelo** y responde las preguntas sobre tu propio razonamiento. Puedes responder por texto o voz.
4. Revisa el nivel, evidencia, fortalezas/debilidades y ruta de práctica. El informe apoya el aprendizaje; no es una decisión automática de nota.
5. Si el docente devuelve el trabajo, lee el motivo, corrige y vuelve a enviar.

## Ajustes y privacidad

- En configuración puedes cambiar idioma, tema/mascota y preferencias de voz disponibles según navegador.
- En **Privacidad y datos** puedes descargar datos o solicitar eliminación. La eliminación puede borrar de forma irreversible datos relacionados con clases/tareas; lee el mensaje de confirmación y consulta al centro/docente antes de continuar.
- No subas datos personales de terceros, datos sensibles innecesarios ni material que no tengas derecho a compartir.

## Si algo no funciona

- **Pantalla con datos ficticios:** la app puede estar en modo mocks; esas respuestas no prueban IA real ni se guardan en Supabase.
- **No carga la clase/tarea:** confirma sesión/rol, conexión y que perteneces a la clase.
- **No funciona cámara/micrófono:** concede permiso al sitio o utiliza texto/archivo.
- **El tutor/IA tarda o falla:** intenta nuevamente cuando la conexión esté estable; no repitas la entrega si ya aparece guardada.
- **Aviso sobre Classroom:** revisa permiso y conexión; la app importa elementos pero no entrega tu tarea a Google.

## Para ensayo/demo

Sigue el guion versionado en `.orquesta/DEMO.md`. Distingue de manera visible datos ficticios/mocks de llamadas reales a modelos, y no afirmes lectura de manuscrito ni reconocimiento de voz sin una prueba real correspondiente.
