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
- [ ] Configuración → Voz: elegir la voz del navegador (filtrada por idioma es/en, con una voz recomendada por defecto), velocidad (0.8-1.3) y botón "Probar". Se guarda en `localStorage` (try/catch) y lo usan el tutor, la verificación y la conversación.
- [ ] Mejor detección del fin de turno en un aula con ruido: el umbral se adapta al ruido de fondo medido durante la calibración y se recalibra si el ruido cambia; pausa configurable entre 1.0 y 2.0 s ("hablo despacio"). Pruebas unitarias con secuencias de RMS simuladas (silencio, ruido constante, voz con pausas cortas).
- [ ] Si la transcripción falla por red o 5xx, reintento automático una vez y, si sigue fallando, mensaje claro con opción de escribir; nunca se pierde lo que el estudiante dijo sin avisar.
- [ ] Indicador visual de volumen accesible (no solo color) y textos de ayuda si el micrófono no da permiso, con pasos para Chrome Android y Safari iOS.
- [ ] El texto que se lee en voz alta no lee markdown, emojis ni URLs (ampliar `textoParaVoz`, con pruebas).
- [ ] Textos es/en; 380 px; `e2e/voz.spec.ts` con mocks (la configuración de voz se guarda y se muestra).

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T13:`. Sin atribución de IA. Sin merge ni push. Si no puedes probar con micrófono real, dilo en "Bloqueos".

## Decisiones
## Bloqueos
