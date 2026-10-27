# Muse Voice Transcribe (voz → texto) — resumen para T04

Fuente: documentación de Meta Model API ("Speech to text"), copiada por José el 27 oct 2026.

## Lo esencial
- **Misma clave que Muse Spark:** `MODEL_API_KEY`. No hay clave aparte.
- **ID del modelo:** `muse-voice-transcribe-1.0` (variable `MUSE_VOZ_MODELO`).
- **Precio:** $0.18 por hora de audio. Las peticiones fallidas y los 429 no se cobran.
- 25 idiomas, incluidos español e inglés, con cambio de idioma dentro del mismo audio.

## Endpoint que usamos: archivo grabado (HTTP)
`POST https://api.meta.ai/v1/asr/transcribe?sessionId=<id-opcional>`
- Cabecera: `Authorization: Bearer $MODEL_API_KEY`
- `multipart/form-data` con dos partes:
  - `request` (application/json):
    `{"mode":"PUSH_TO_TALK","model":"muse-voice-transcribe-1.0","audioEncoding":"WAV","languageBias":["Spanish","English"],"keywords":[...conceptos de la tarea...]}`
  - `audio`: el archivo WAV.
- Respuesta JSON: `{ sessionId, transcript, audioDurationMs, turns: [] }` → usamos `transcript`.

## Restricciones del audio (importante)
- Solo **WAV RIFF, mono, PCM 16 bits, 16 kHz o 24 kHz** (24 kHz es la nativa).
- `MediaRecorder` del navegador produce webm/opus → **NO sirve directo**.
  Decisión: grabar en el navegador con Web Audio (AudioContext + AudioWorklet o ScriptProcessor),
  remuestrear a 24 kHz mono y codificar el WAV en el cliente (cabecera RIFF de 44 bytes).
  Así el servidor (Vercel) no necesita ffmpeg.
- Máximo 10 minutos por audio y 32 MB por petición (400 / 413). Para verificación bastan 1–2 min.
- 429 → reintentar con espera exponencial. 500 → reintentar una vez.

## Por qué NO usamos el modo en tiempo real (WebSocket)
`wss://api.meta.ai/v1/asr/realtime` se autentica con la clave en el primer mensaje.
Desde el navegador eso expondría `MODEL_API_KEY`. La clave solo vive en el servidor (AGENTS.md).

## Útiles para nosotros
- `keywords`: pasar los conceptos de la tarea (p. ej. "fotosíntesis", "Arduino", "ley de Ohm")
  mejora el reconocimiento de términos técnicos.
- `languageBias`: `["Spanish","English"]` según el idioma del estudiante.
- No hay marcas de tiempo por palabra ni nivel de confianza.
