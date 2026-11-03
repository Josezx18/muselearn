# 4. Casos de uso e historias de usuario

Los casos siguientes reflejan flujos que aparecen en las páginas, handlers, contratos y guion de demo. El escenario de Classroom no representa una entrega transmitida a Google.

## Actores

- **Docente**: administra sus propias clases y tareas; revisa progreso y sugerencias.
- **Estudiante**: miembro inscrito; usa plan, tutor, entrega y comprobación.
- **Google Classroom**: proveedor externo opcional para importar cursos y tareas.
- **Meta Model API / modelo abierto**: procesadores externos invocados por el servidor; no son actores que deciden por el usuario.

## UC-01 Crear clase e invitar estudiantes

**Actor principal:** docente. **Precondición:** sesión autenticada con rol docente.

1. El docente indica nombre, materia y grado.
2. MuseLearn valida campos, crea la clase y un código único de seis caracteres.
3. El docente comparte el código.
4. El estudiante autenticado introduce el código; el servidor comprueba el rol, que la clase existe y que no está inscrito ya; lo inscribe.
5. Las tareas previas de la clase se analizan para el nuevo estudiante en segundo plano.

**Alternativas:** código inexistente → 404; inscripción duplicada → 409; docente intenta unirse como estudiante → 403. Fuentes: `src/app/api/clases/`, `src/lib/db/clases.ts`.

## UC-02 Crear tarea y planificar

**Actor principal:** docente. **Precondición:** clase propia con estudiantes.

1. Define instrucciones, vencimiento, competencias, modalidad, nivel de ayuda y archivos.
2. El servidor comprueba propiedad de clase, valida contenido y límite diario, y guarda la tarea.
3. Responde al docente sin esperar a todos los análisis.
4. En segundo plano, carga contexto, analiza la tarea para cada estudiante inscrito, guarda el análisis y recalcula el plan.
5. La app muestra el aviso/plan actualizado al estudiante.

**Alternativas:** error de IA → no debe invalidar la tarea guardada; el análisis/plan pueden faltar y requerir reintento/consulta. PDF se conserva como adjunto; no se garantiza extracción de texto. Fuente: `src/app/api/tareas/route.ts`, `src/lib/ia/analizador/servicio.ts`.

## UC-03 Consultar plan semanal

**Actor principal:** estudiante. **Precondición:** sesión de estudiante.

1. Abre Hoy o Semana.
2. El cliente consulta la semana; el servidor obtiene clases, tareas, análisis, preferencias y bloques propios.
3. El algoritmo organiza bloques según prioridad, disponibilidad y vencimiento; muestra estados, carga y avisos.
4. El estudiante puede marcar bloques como hechos/omitidos y solicitar reorganización.

**Alternativas:** si falta un plan guardado se calcula; tareas no acomodadas pueden figurar como riesgo. El cálculo base es determinista; la IA redacta avisos. Fuentes: `src/lib/server/data.ts`, `src/lib/ia/planificador/algoritmo.ts`, `/api/ia/plan`.

## UC-04 Pedir ayuda al tutor

**Actor principal:** estudiante. **Precondición:** inscrito en la clase de la tarea.

1. Abre el tutor desde la tarea, escribe o usa la interfaz de voz.
2. El servidor valida pertenencia, cuota diaria y mensaje.
3. La IA recibe reglas comunes y el nivel que definió el docente, y responde en streaming.
4. Se guarda el historial de la conversación.

**Alternativas:** límite diario alcanzado → 429; error de proveedor antes de iniciar stream → error controlado; si falla después de emitir texto no se cambia de proveedor a mitad de respuesta. Fuentes: `src/app/api/tutor/route.ts`, `src/lib/ia/conversacion/prompts.ts`.

## UC-05 Entregar trabajo y confirmar entrega externa

**Actor principal:** estudiante.

1. Selecciona texto y/o archivos; en celular puede capturar fotos del cuaderno.
2. Si la modalidad es externa, abre el enlace externo, entrega allá por su cuenta y marca en MuseLearn la confirmación correspondiente.
3. Adjunta evidencia y envía.
4. El sistema verifica inscripción, rutas de adjuntos y estado de entrega; almacena evidencia.
5. La entrega queda lista para iniciar la verificación.

**Alternativas:** archivo no admitido o demasiado grande → error; entrega ya verificándose/verificada → 409; estudiante no inscrito → 403. La confirmación local no confirma el estado de Google. Fuentes: `src/app/api/entregas/route.ts`, `src/app/api/entregas/adjuntos/route.ts`.

## UC-06 Verificar comprensión por texto/voz y obtener informe

**Actor principal:** estudiante. **Precondición:** entrega propia no pendiente.

1. Inicia sesión de verificación; se crea o recupera sesión vigente.
2. El servidor prepara contexto de la entrega. Si hay fotos compatibles, descarga las imágenes privadas y solicita lectura visual, incluida incertidumbre.
3. Presenta una pregunta a la vez; el estudiante responde por texto o voz. El audio se transcribe en memoria y no se almacena en MuseLearn.
4. Después de tres preguntas, el sistema evalúa respuestas y exige citas literales localizables en las respuestas.
5. Guarda informe y ruta; si falla la ruta, usa una ruta básica de respaldo; marca la entrega verificada.

**Alternativas:** sesión obsoleta/pregunta fuera de turno → 409; se puede reintentar el cierre sin perder respuesta guardada; voz no disponible → escribir. La lectura de manuscritos reales y ASR en aula necesitan validación en dispositivos reales. Fuentes: `src/app/api/verificacion/`, `src/lib/ia/conversacion/verificador.ts`, `src/app/api/voz/transcribir/route.ts`.

## UC-07 Revisar comprensión, calificar y devolver

**Actor principal:** docente. **Precondición:** docente propietario de la tarea.

1. Abre panel por clase y tarea; revisa indicadores, conceptos y estudiantes.
2. Abre una entrega, compara evidencia y nivel.
3. Opcionalmente guarda nota y comentario; puede generar un borrador IA, editarlo y decidir si lo envía.
4. Si devuelve la entrega, introduce motivo; el estudiante recibe un aviso y conserva evidencia para corregir/reentregar.
5. El docente puede exportar CSV de la clase.

**Alternativas:** clase/entrega ajena → acceso denegado; un borrador de IA no se publica automáticamente. Fuentes: `/api/docente/`, `/api/entregas/[id]/`, `/api/clases/[id]/exportar`.

## UC-08 Importar Google Classroom (opcional)

**Actor principal:** docente. **Precondición:** cuenta Google configurada y autorización concedida.

1. Conecta cuenta mediante OAuth.
2. Selecciona curso del que es docente.
3. El sistema importa curso/estudiantes y tareas próximas; evita duplicados y aplica límites diarios.
4. Las tareas pendientes entran a análisis/plan en segundo plano.

**Límites:** el conector no entrega trabajos a Google; si faltan scopes para tareas, puede importar curso/alumnos y notificar que no hubo permiso. Fuentes: `src/app/api/integraciones/classroom/`, `src/lib/integraciones/`.

## UC-09 Gestionar privacidad y cuenta

**Actor principal:** usuario autenticado.

1. Revisa/acepta términos vigentes antes de usar la aplicación (si aplica la migración/versión).
2. Cambia datos permitidos del perfil.
3. Solicita una copia JSON de sus datos o confirma la eliminación escribiendo `ELIMINAR`/`DELETE`.

**Advertencia:** la exportación está filtrada por rol/RLS; cualquier error de consulta puede producir una colección vacía. La eliminación de una cuenta docente puede cascadar datos de clases y estudiantes inscritos. Revisar documento 09 antes de operación real.

## Historias de usuario resumidas

- Como estudiante, quiero ver el siguiente bloque recomendado para empezar sin tener que organizar todas mis tareas manualmente.
- Como estudiante, quiero recibir pistas que respeten la ayuda acordada por el docente.
- Como estudiante, quiero explicar mi trabajo por texto o voz y conocer qué concepto debo practicar.
- Como docente, quiero distinguir trabajo entregado de comprensión demostrada para orientar el apoyo.
- Como docente, quiero revisar y editar las propuestas de IA antes de compartirlas.
- Como docente, quiero devolver una entrega con instrucciones de corrección sin perder el trabajo previo.
