# T08 — Demo, video y entrega

| Campo | Valor |
|---|---|
| Responsable | José (con ayuda de Claude) |
| Oleada | final (mar 3 y mié 4 nov) |
| Depende de | T07 desplegado |
| Entrega | cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit — antes de las **10:00 PM RD del 4 nov** (meta: 6:00 PM) |

## Requisitos oficiales
- Video de **3 minutos** que muestre **solo** lo construido durante el hackathon. Es uno de los artefactos principales del juzgamiento.
- Repositorio **público** y enlace del video accesible.
- Los jueces deben poder identificar con claridad qué se creó durante el evento (si no, descalificación).
- El proyecto debe usar la Meta Model API o modelos abiertos de Meta (filtro de la etapa 1).

## Criterios de aceptación
- [ ] Ensayar el guion de `.orquesta/DEMO.md` 3 veces sobre la URL pública con datos de demo.
- [ ] Grabar el video de 3:00 como máximo. Subtítulos en inglés si se narra en español. Subirlo con enlace público.
- [x] README en inglés: problema, solución, capturas, arquitectura, **modelos de Meta usados** y cómo correrlo. Tabla actual: Muse Spark Open preferido para análisis/plan, Spark para tutor/verificación/informe y Voice Transcribe para voz; proveedores de respaldo identificados.
- [ ] Sección **"Built during the hackathon"** en el README: todo el código fue escrito entre el 27 oct y el 4 nov (comprobable en el historial de git). Mencionar con honestidad que la planificación (arquitectura, fichas y borradores de prompts en `.orquesta/`) se escribió antes del inicio, según lo que respondan en el Discord.
- [ ] Revisar que la interfaz en inglés no tenga textos en español sueltos.
- [ ] Revisar que el repo no tenga secretos ni datos reales de estudiantes.
- [ ] Llenar el formulario de entrega y comprobar que el repo y el video abren en una ventana privada.
- [ ] Si hubo prueba con usuarios: 2-3 frases o datos para el pitch, sin nombres.
- [x] README: sección "Meta open-weight models" que diga qué modelo abierto y qué proveedor ejecuta el análisis (para el premio de modelos abiertos).
- [ ] Publicar el video en X (texto corto en inglés y español, etiquetar a la cuenta del hackathon) y enviar el enlace del post en la plataforma. Interacción cuenta hasta el 8 nov.
- [ ] Mensaje para pedir votos de la comunidad (galería pública, se anuncia el 16 nov) a docentes, formadores y comunidad STEAM.

## Preparación T07 — 30 oct
- Narración por escenas y pautas en `docs/video/GRABACION.md`; subtítulos EN importables en `docs/video/subtitulos-en.srt` (28 bloques, 2:55). Sin audio/video final grabado; falta ajustar sincronización a la voz de José.
- Borrador del formulario y enlaces en `docs/ENTREGA.md`; textos X con enlace a la app añadidos a `docs/PUBLICACION-X.md`. Ningún mensaje publicado ni formulario enviado.
- README actualizado: migraciones hasta 0011, mocks por entrega/semana y comentarios ya conectados, audio procesado en memoria, preparación previa al hackathon declarada y capturas con cifras 100 %/42 %.
- Capturas renovadas con mocks de main; la versión de T20 no está integrada. No se acredita ensayo autenticado en producción ni cámara/micrófono físicos.
- La página pública del evento consultada el 30 oct indica entrega el 4 nov a las 9:00 PM ET (muestra también EST); equivale a 10:00 PM RD. Mantener meta interna 6:00 PM y volver a confirmar el formulario autenticado antes de enviar. La vista pública no confirma las demás fechas históricas de esta ficha.
- Validación de esta preparación: lint/typecheck y 235 pruebas OK (10 omitidas), guion e2e 2/2 en escritorio/celular. 22 PNG con anchura 1440/390 comprobada; móvil 390×900 para conservar la vista real sin superponer la barra fija en una captura larga. Revisión visual de panel, voz e informe. SRT: 28 bloques ordenados, máximo dos líneas de 42 caracteres, duración 2:55. Enlaces locales correctos y ocho borradores de X con menos de 280 caracteres. No acredita revisión completa de traducciones ni de seguridad del repositorio.
