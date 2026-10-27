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
- [ ] Chat del tutor en la página de la tarea, con respuestas en stream y botón "Necesito una pista".
- [ ] Respeta `nivel_ayuda` de la tarea; historial guardado en `conversaciones_tutor`.
- [ ] Pasa las 5 pruebas de `prompts/03-tutor.md` (automatizadas con el modelo real; guardar resultados).

## Criterios de aceptación — Verificación
- [ ] Al entregar, pantalla "Explícamelo" con mensaje tranquilizador y botón para empezar.
- [ ] Preguntas una por una (3-5), basadas en la entrega concreta, según prompt 04.
- [ ] Si la entrega tiene **fotos del cuaderno**, se envían a Muse Spark como imágenes: el verificador primero transcribe y describe los pasos escritos a mano, y luego pregunta sobre pasos concretos ("en la línea 3 escribiste…"). Probar con 3 fotos reales de cuaderno (letra legible, letra difícil, foto torcida).
- [ ] Responder por **voz**: botón de grabar (MediaRecorder) → `POST /api/voz/transcribir` con **Muse Voice Transcribe** (**lee `.orquesta/referencias/muse-voice-transcribe.md`**: solo acepta WAV mono 16 bits a 24 kHz, así que se graba con Web Audio y se codifica el WAV en el navegador; MediaRecorder/webm no sirve; misma `MODEL_API_KEY`, modelo `muse-voice-transcribe-1.0`, `languageBias` y `keywords` con los conceptos de la tarea); muestra la transcripción y permite corregirla antes de enviar. Respaldo: Web Speech API o solo texto si no hay micrófono.
- [ ] Ver el taller "Agents 102: Best Practices for Verifiable Agents" (mié 28) y aplicar lo útil al verificador; anotarlo en Decisiones.
- [ ] Responder por **texto** siempre disponible.
- [ ] La pregunta se puede **escuchar** (síntesis de voz del navegador) para quien prefiera oír.
- [ ] Al terminar: genera `InformeComprension` validado, lo guarda en `informes`, cambia la entrega a `verificada`, llama a `generarRuta()` (mock si T06 no existe) y redirige a `/estudiante/informe/[id]`.
- [ ] Audios en bucket `audios`; se borran después de transcribir.
- [ ] Pruebas: una entrega bien entendida (espera nivel 3-4) y una copiada que el estudiante no sabe explicar (espera 1-2), con respuestas simuladas.

## Notas del integrador (27 oct)
- Plataforma cambiada a **Codex** (Claude Code al límite de uso).
- Para el chat del tutor usa `llamarMuseStream` de `@/lib/ia/cliente` (T03): devuelve texto en partes y hace respaldo de proveedor antes del primer trozo.
- `sesiones_verificacion` e `informes` se escriben desde el servidor con `crearClienteAdmin()` tras comprobar que la entrega es del estudiante en sesión (RLS solo permite leer).
- Si T06 aún no existe, llama a un mock de `generarRuta()`.

## Decisiones
- 

## Bloqueos
- 

## Solicitudes al integrador
- 
