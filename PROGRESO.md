# PROGRESO.md — Bitácora compartida

Cada sesión agrega líneas al final de su sección. No borres lo de otros.
Formato: `- AAAA-MM-DD HH:MM [Txx] qué se hizo / qué falta / decisión tomada`

## Hecho
- 2026-10-27 T00 — esqueleto, contratos, Supabase, cliente IA, mocks, UI base y rutas. Build, lint, typecheck y 25 pruebas OK.

## Pendiente (en orden)
1. José: claves en `.env.local` + `npm run prueba:ia`; crear repo público y hacer push
2. Oleada 1 en paralelo: T01, T02, T03, T04, T05
3. Oleada 2: T06
4. T07 integración continua + despliegue
5. T08 demo y entregables

## Mejoras propuestas (por los agentes; el integrador decide)
- [T06] Guardar pasos completados por estudiante en DB para sincronizar dispositivos.
- [T06] Paginar el mapa de calor y agrupar métricas/resúmenes en una sola consulta para clases grandes.
- [T06] Hacer transaccional e idempotente la incorporación de rutas al plan, conservándolas al reorganizar.
- [T04] Cierre transaccional y unicidad de sesiones/conversaciones en DB para soportar varias pestañas y procesos.
- [T04] Mostrar transcripción del cuaderno con sus incertidumbres para que el estudiante corrija partes ilegibles.
- [T04] Medir calidad del reconocimiento por concepto con audios ficticios en ambos idiomas tras habilitar ASR central.
- [T01] Verificar el correo al registrarse y recuperar contraseña (hoy el correo se confirma solo).
- [T01] Permitir al docente quitar estudiantes de la clase y regenerar el código.
- [T01] Enlace de invitación `/unirse?codigo=XXXXXX` que rellene el código.
- (T03) Guardar minutos reales por tarea (tabla o columna) para que el historial del analizador sea exacto.
- (T03) Extraer texto de los PDFs adjuntos antes de analizar (T02 no lo hizo; los PDFs ya se suben a Storage).
- (T02) Editar una tarea existente (falta `PATCH /api/tareas/:id`).
- (T03) Mostrar en Hoy los `avisos` del plan como notificación al reorganizarse.

- [T05] Incorporar descarga de adjuntos privados con URL firmada y formulario de entrega de T02.
- [T05] Persistir estados de bloques y semana solicitada en el mock del cliente compartido.

## Decisiones tomadas
- 2026-10-24 Stack: Next.js + Supabase + Meta Model API. Interfaz español + inglés. Nombre de trabajo: MuseLearn.
- 2026-10-26 Herramientas: Claude Code (T00, T01, T03, T04, T07), Codex (T05), OpenCode (T02, T06). Los $150 de Meta API solo para la app.
- 2026-10-26 Modelo abierto: Muse Spark Open en Baseten ($100 concedidos). NVIDIA Glimmer como respaldo opcional.
- 2026-10-26 Discord: se permite cualquier herramienta de programación sin declararla; Muse Code es opcional.

## Bitácora
- 2026-10-27 [T06] Por instrucción explícita del usuario, se prepara commit de todo el trabajo tras repetir lint y typecheck (OK) y npm test (116 OK, 2 fallos del mock T04, 10 omitidas). La ficha mantiene documentados ambos bloqueos de integración.
- 2026-10-27 [T06] Ruta real con Muse y validación del prompt 05, endpoints de informe/ruta con permisos, panel docente calculado sin IA, mapa de calor, indicadores y detalle, informe y práctica marcable, es/en. lint/typecheck OK y 14 pruebas T06 OK; UI verificada en Chrome a 380/1280 px. Bloqueos: contrato de pasos en plan T03 y actualización de mock test T04 (suite global: 116 OK, 2 fallos, 10 omitidas). Sin commit por regla de suite completa; detalles y solicitudes en ficha.
- 2026-10-27 [T04] Cierre de controles: lint y typecheck OK; suite local 94 pruebas OK (10 omitidas: 7 reales opt-in ya ejecutadas aparte y 3 preexistentes). Siete pruebas Muse reales OK. Permisos, WAV y recuperación probados; estado 🟨 por dependencias externas, sin marcar los cuatro criterios pendientes.
- 2026-10-27 [T04] Tutor socrático con stream/historial, verificación de tres preguntas, visión de cuaderno, informe con evidencia comprobable, ruta mock y cierre recuperable. UI es/en a 380/1280 px sin desbordamiento; pruebas reales: cinco casos del tutor OK, comprensión 4 y no explicada 1 (resultados guardados). WAV24k/PCM16, dictado de respaldo y texto editable listos. Pendientes bloqueados: adaptador ASR central T03 + audios, tres fotos reales y taller del 28 oct; detalles en ficha.
- 2026-10-27 [T00] Proyecto creado (Next 16.4). Supabase `muselearn` con migraciones 0001 y 0002. Pendiente de José: claves reales y push a GitHub.
- 2026-10-27 [T01] Auth (registro/login/salir), rutas por rol, clases con código, unirse, 3 endpoints, RLS en supabase/politicas/rls.sql, seed-auth.ts, textos es/en y 20 pruebas. Falta: aplicar RLS y seed en Supabase (ver Solicitudes en la ficha).
- 2026-10-27 [T03] Analizador, planificador determinista (+avisos con Muse), `llamarMuseStream`, endpoints `/api/ia/*` y `/api/preferencias`. lint/typecheck/test OK (57 pruebas). Pendiente: salidas reales y costo (faltan claves) — ver Bloqueos en la ficha.
- 2026-10-27 [T07] Integradas T01 y T03 en main: lint, typecheck y 77 pruebas OK. Migraciones 0003 (RLS) y 0004 aplicadas en Supabase. Las ramas nuevas salen de este main.
- 2026-10-27 [T02] Tareas y entregas: formularios (título, instrucciones, fecha, competencias, nivel ayuda, adjuntos), lista de tareas por clase, detalle con entregas por estudiante, FormularioEntrega con foto de cuaderno (cámara, compresión 1600px, máx 4), endpoints /api/tareas y /api/entregas con validación Zod, análisis IA en background al crear tarea. lint/typecheck/test OK (80 pruebas).
- 2026-10-27 [T07] Integrada T02 con correcciones: crear tarea ahora guarda, subida real de adjuntos y fotos (nuevo `POST /api/entregas/adjuntos`), `after()` para el análisis, FormularioEntrega rehecho. lint, typecheck, 83 pruebas y build OK; RLS de entregas y Storage verificado.
- 2026-10-27 [T05] Implementados Hoy, Semana lunes-domingo deslizable, tarjetas con razon desplegable, avisos descartables, reorganizacion, bloques hecho/omitir, detalle con analisis y pasos, tutor, placeholder de entrega y textos es/en. lint y typecheck OK; 77 pruebas pasan, 3 omitidas. Pendientes: revision visual (navegador no disponible) e integracion real T02; ver Bloqueos de T05.
- 2026-10-27 [T07] Integrada T05: Hoy, Semana y página de tarea con la entrega real de T02 y enlace a la verificación. Código formateado; 380 px verificado con Playwright. lint, typecheck y 83 pruebas OK.
- 2026-10-27 [T07] Integrada T04: tutor con stream e historial, verificación de 3 preguntas con evidencias verificables, informe y ruta (mock hasta T06). T07 conectó la voz (Muse Voice Transcribe, el audio no se guarda) y el reintento de evaluación. lint, typecheck y 104 pruebas OK. Falta: probar lectura de cuaderno con 3 fotos reales.
