# T04 — Tutor socrático y verificación de comprensión ("Explícamelo")

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t04-tutor-verificacion` / `../muselearn-T04` |
| Oleada | 1 |
| Depende de | T00; usa `llamarMuse()` de T03 (la versión mínima de T00 basta para empezar) |
| Puedes tocar | `src/lib/ia/conversacion/`, `src/app/api/tutor/`, `src/app/api/verificacion/`, `src/app/api/voz/`, `src/app/[locale]/estudiante/tarea/[id]/tutor/`, `src/app/[locale]/estudiante/tarea/[id]/verificar/`, `src/components/tutor/`, `src/components/verificacion/`, `src/lib/mocks/conversacion.ts`, `messages/*/tutor.json`, `messages/*/verificacion.json` |
| Contratos | `MensajeChat`, `SesionVerificacion`, `PreguntaVerificacion`, `InformeComprension`; prompts 03 y 04 |

## Objetivo
La función estrella. Es lo que más debe brillar en la demo.

## Criterios de aceptación — Tutor
- [x] Chat del tutor en la página de la tarea, con respuestas en stream y botón "Necesito una pista".
- [x] Respeta `nivel_ayuda` de la tarea; historial guardado en `conversaciones_tutor`.
- [x] Pasa las 5 pruebas de `prompts/03-tutor.md` (automatizadas con el modelo real; guardar resultados).

## Criterios de aceptación — Verificación
- [x] Al entregar, pantalla "Explícamelo" con mensaje tranquilizador y botón para empezar.
- [x] Preguntas una por una (3-5), basadas en la entrega concreta, según prompt 04.
- [ ] Si la entrega tiene **fotos del cuaderno**, se envían a Muse Spark como imágenes: el verificador primero transcribe y describe los pasos escritos a mano, y luego pregunta sobre pasos concretos ("en la línea 3 escribiste…"). Probar con 3 fotos reales de cuaderno (letra legible, letra difícil, foto torcida).
- [x] Responder por **voz** (T07 conectó Muse Voice Transcribe: `transcribirAudio()` en `src/lib/ia/cliente.ts`): botón de grabar (MediaRecorder) → `POST /api/voz/transcribir` con **Muse Voice Transcribe** (**lee `.orquesta/referencias/muse-voice-transcribe.md`**: solo acepta WAV mono 16 bits a 24 kHz, así que se graba con Web Audio y se codifica el WAV en el navegador; MediaRecorder/webm no sirve; misma `MODEL_API_KEY`, modelo `muse-voice-transcribe-1.0`, `languageBias` y `keywords` con los conceptos de la tarea); muestra la transcripción y permite corregirla antes de enviar. Respaldo: Web Speech API o solo texto si no hay micrófono.
- [ ] Ver el taller "Agents 102: Best Practices for Verifiable Agents" (mié 28) y aplicar lo útil al verificador; anotarlo en Decisiones.
- [x] Responder por **texto** siempre disponible.
- [x] La pregunta se puede **escuchar** (síntesis de voz del navegador) para quien prefiera oír.
- [x] Al terminar: genera `InformeComprension` validado, lo guarda en `informes`, cambia la entrega a `verificada`, llama a `generarRuta()` (mock si T06 no existe) y redirige a `/estudiante/informe/[id]`.
- [x] Audios: **no se guardan** (decisión T07, más privada): el WAV se valida y se transcribe en memoria; nunca llega a Storage.
- [x] Pruebas: una entrega bien entendida (espera nivel 3-4) y una copiada que el estudiante no sabe explicar (espera 1-2), con respuestas simuladas.

## Notas del integrador (27 oct)
- Plataforma cambiada a **Codex** (Claude Code al límite de uso).
- Para el chat del tutor usa `llamarMuseStream` de `@/lib/ia/cliente` (T03): devuelve texto en partes y hace respaldo de proveedor antes del primer trozo.
- `sesiones_verificacion` e `informes` se escriben desde el servidor con `crearClienteAdmin()` tras comprobar que la entrega es del estudiante en sesión (RLS solo permite leer).
- Si T06 aún no existe, llama a un mock de `generarRuta()`.

## Revisión del integrador (27 oct, noche)
- Integrada en main. Buen trabajo: permisos antes del cliente admin, evidencias verificables, cierre recuperable.
- **Voz conectada:** `transcribirAudio()` en el cliente IA (WAV, `muse-voice-transcribe-1.0`, `languageBias` según idioma, `keywords` = conceptos del análisis + competencias de la tarea, 1 reintento ante 429/5xx, 4 pruebas). `/api/voz/transcribir` acepta `tarea_id` opcional; el cliente ya envía `respuesta.wav`.
- `evaluar()` reintenta una vez si alguna evidencia no es una cita textual (antes fallaba toda la verificación).
- `maxDuration = 120` en `/api/verificacion/iniciar` y `/responder` (lectura de cuaderno + evaluación).
- Capturas, script de revisión y resultados del modelo real movidos a `.orquesta/evidencia/T04/` (no van en `src/`). Código formateado con Prettier.
- La entrega de T02 ya existe y T05 enlaza a `/verificar` tras entregar.
- **Pendiente de José:** 3 fotos reales de cuaderno (legible, difícil, torcida) para probar la lectura con Muse Spark.

## Decisiones
- 27 oct: tres preguntas adaptadas por entrega, dentro del rango 3-5; cada llamada recibe las respuestas previas. La sesión se reanuda sin regenerar preguntas al recargar.
- 27 oct: visión usa exclusivamente `llamarMuse(funcion: leer_cuaderno)` con imágenes privadas descargadas desde Storage y enviadas como contenido multimodal; transcripción numerada, pasos e incertidumbres validados. Nunca se inventan líneas ilegibles.
- 27 oct: Web Audio captura mono, remuestrea y codifica PCM16 WAV a 24 kHz; máximo dos minutos, micrófono liberado al parar/desmontar. Dictado Web Speech de respaldo y texto editable. El servidor detecta el formato real aunque el cliente compartido aún nombre el archivo `respuesta.webm`.
- 27 oct: adaptador local `generarRuta()` devuelve una ruta mock validada hasta integrar T06. Enlace desde T02: `/estudiante/tarea/{tarea_id}/verificar?entrega_id={entrega_id}`; sin parámetro busca la entrega mediante el cliente API compartido.
- 27 oct: evidencias del informe deben ser citas localizables en las respuestas, máximo 20 palabras. Guardar la tercera respuesta antes de evaluar permite reintentar fallos; un informe ya guardado permite recuperar el cierre sin repetir la IA. Estas medidas son decisiones propias; NO se atribuyen al taller pendiente.
- 27 oct: cinco casos de tutor y dos evaluaciones reales pasaron con Muse; niveles observados 4 y 1. Resultados en `src/lib/ia/conversacion/resultados-modelo-real.json`. Repetir: `$env:PRUEBAS_T04_REALES='true'; npm.cmd test -- src/lib/ia/conversacion/modelo-real.test.ts`.
- 27 oct: flujo UI con mocks revisado a 380 y 1280 px: pista en stream, tres respuestas y redirección al informe; sin errores de navegador ni desbordamiento. Evidencia y script en `src/components/verificacion/`. `npm.cmd` evita la política de ejecución de npm.ps1 en Windows; SWC requiere typecheck fuera del sandbox en esta máquina.

## Bloqueos
- Voz Muse y ciclo bucket/borrado: el punto único de IA de T03 no ofrece ASR; `FuncionIA` solo admite chat/visión y `llamarMuse` solo envía Chat Completions. La regla de AGENTS impide usar otra URL y la propiedad impide editar el cliente de T03. Grabación WAV, validación de formato y respaldo implementados; endpoint devuelve 503 explícito sin guardar audio hasta disponer del adaptador. No se marcan voz ni borrado como terminados.
- Fotos: la implementación multimodal está hecha, pero no hay tres fotos reales de cuaderno disponibles en el repositorio (legible, difícil y torcida). No se sustituyen por imágenes sintéticas ni se marca la prueba como completada.
- Taller: la ficha lo programa para el miércoles 28 oct; durante este trabajo aún es martes 27 oct en America/La_Paz. No hay enlace/grabación en el repositorio ni se encontró con búsqueda por el título exacto. No se afirma haberlo visto.

## Solicitudes al integrador
- T03: exponer transcripción de WAV mediante el punto central autorizado (`llamarMuse` o autorización explícita para un adaptador ASR en T04). Debe usar misma MODEL_API_KEY, muse-voice-transcribe-1.0, languageBias y keywords obtenidas del contexto de tarea. Conectar después el endpoint T04, subir temporalmente al bucket privado audios y borrar en finally tras transcribir (también ante fallo del proveedor).
- T02/T05: enlazar entrega exitosa a la pantalla verificar con entrega_id. El mock compartido solo tiene una entrega verificada y otra pendiente; añadir una entregada para probar el recorrido desde la lista sin parámetro.
- DB: añadir unicidad de conversación por (tarea_id, estudiante_id) y sesión activa por entrega; RPC transaccional/idempotente para finalizar sesión+informe+ruta+entrega. El cierre actual es recuperable ante fallos parciales y compara preguntas para detectar concurrencia, pero no constituye una transacción entre tablas ni bloquea reintentos idénticos desde dos procesos.
- Facilitar las tres fotos autorizadas de prueba y el enlace/grabación del taller cuando esté disponible. Al integrar T06, reemplazar el adaptador local de generarRuta por su exportación real.
