# T04 — Tutor socrático y verificación de comprensión ("Explícamelo")

| Campo | Valor |
|---|---|
| Plataforma | Claude Code (segunda sesión; Muse Code si tomas la suscripción) |
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
- [ ] Responder por **voz**: botón de grabar (MediaRecorder) → `POST /api/voz/transcribir` con **Muse Voice Transcribe** (ver dev.meta.ai/models/muse-voice-transcribe y el cookbook `meta-models/meta-model-cookbook`); muestra la transcripción y permite corregirla antes de enviar. Respaldo: Web Speech API o solo texto si no hay micrófono.
- [ ] Ver el taller "Agents 102: Best Practices for Verifiable Agents" (mié 28) y aplicar lo útil al verificador; anotarlo en Decisiones.
- [ ] Responder por **texto** siempre disponible.
- [ ] La pregunta se puede **escuchar** (síntesis de voz del navegador) para quien prefiera oír.
- [ ] Al terminar: genera `InformeComprension` validado, lo guarda en `informes`, cambia la entrega a `verificada`, llama a `generarRuta()` (mock si T06 no existe) y redirige a `/estudiante/informe/[id]`.
- [ ] Audios en bucket `audios`; se borran después de transcribir.
- [ ] Pruebas: una entrega bien entendida (espera nivel 3-4) y una copiada que el estudiante no sabe explicar (espera 1-2), con respuestas simuladas.

## Decisiones
- 

## Bloqueos
- 

## Solicitudes al integrador
- 
