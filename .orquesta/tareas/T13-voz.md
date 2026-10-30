# T13 — Mejorar la voz (escuchar y hablar)

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t13-voz` / `../MuseLearn-T13` |
| Puedes tocar | `src/lib/voz-salida.ts` (+ test), `src/lib/turno-voz.ts` (+ test), `src/components/verificacion/wav.ts`, `src/components/verificacion/voz.tsx`, `src/components/comun/BotonVoz.tsx`, `src/components/tutor/ModoConversacion.tsx`, `src/components/cuenta/PaginaConfiguracion.tsx` (solo una sección "Voz" nueva), `src/app/api/voz/transcribir/route.ts`, `src/lib/ia/cliente.ts` (solo `crearTranscriptor`), `messages/*/tutor.json`, `messages/*/verificacion.json`, `messages/*/cuenta.json`, `e2e/voz.spec.ts` (nuevo) |
| No toques | los prompts, el tutor socrático, la base de datos |

## Contexto
- La respuesta hablada usa `speechSynthesis` del navegador (`useVozSalida`). Meta no tiene modelo de voz a texto inverso.
- La transcripción usa Muse Voice Transcribe (`/asr/transcribe`), con palabras clave de ≤ 30 caracteres (máx. 30).
- La conversación por voz (`ModoConversacion`) detecta el fin del turno con `procesarNivel` (RMS): calibra 400 ms, pausa 1300 ms, espera 12 s, máximo 45 s.

## Criterios de aceptación
- [x] Configuración → Voz: elegir la voz del navegador (filtrada por idioma es/en, con una voz recomendada por defecto), velocidad (0.8-1.3) y botón "Probar". Se guarda en `localStorage` (try/catch) y lo usan el tutor, la verificación y la conversación.
- [x] Mejor detección del fin de turno en un aula con ruido: el umbral se adapta al ruido de fondo medido durante la calibración y se recalibra si el ruido cambia; pausa configurable entre 1.0 y 2.0 s ("hablo despacio"). Pruebas unitarias con secuencias de RMS simuladas (silencio, ruido constante, voz con pausas cortas).
- [x] Si la transcripción falla por red o 5xx, reintento automático una vez y, si sigue fallando, mensaje claro con opción de escribir; nunca se pierde lo que el estudiante dijo sin avisar.
- [x] Indicador visual de volumen accesible (no solo color) y textos de ayuda si el micrófono no da permiso, con pasos para Chrome Android y Safari iOS.
- [x] El texto que se lee en voz alta no lee markdown, emojis ni URLs (ampliar `textoParaVoz`, con pruebas).
- [x] Textos es/en; 380 px; `e2e/voz.spec.ts` con mocks (la configuración de voz se guarda y se muestra).

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T13:`. Sin atribución de IA. Sin merge ni push. Si no puedes probar con micrófono real, dilo en "Bloqueos".

## Decisiones
- Preferencias por dispositivo y voz por idioma; recomendación por la puntuación existente. Si desaparece una voz instalada, la lectura usa la recomendada.
- El cliente compartido reintenta red/5xx una vez; el servidor conserva corrección de palabras clave y reintento 429, evitando duplicar reintentos 5xx.
- El audio fallido se conserva solo en memoria durante esta pantalla, con aviso de descarte al pasar a texto/salir. Nunca se guarda en servidor ni localStorage.
- La calibración empieza después del permiso. El fondo se actualiza gradualmente; niveles moderados estables durante unos 850 ms se recalibran, preservando habla variable y pausas de 1–2 s.
- E2E con Chrome instalado y configuración temporal en puerto 3013: otra sesión usa el 3000. No se modifica la configuración compartida.
- Verificación: lint/typecheck correctos, 216 pruebas pasan (10 omitidas preexistentes), seis e2e con mocks es/en a 380/1280 px, incluyendo permiso denegado; capturas revisadas.

## Bloqueos
- No hay micrófono físico disponible en esta sesión: pendiente probar voz real en un aula y los menús de permisos en Android/iOS reales. Se verificó con secuencias RMS simuladas, mocks de voces y denegación de permisos. Validar con equipo real antes de la demo.
