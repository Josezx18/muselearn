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
- [T13] Validar y ajustar la detección de turnos con micrófonos reales y ruido de aula en Android/iOS.
- [T15] Resolver por entrega y semana los datos del cliente mock compartido para que detalle, comentarios y navegación entre semanas coincidan con la demo de Supabase (solicitud concreta en T15).
- [T15] Ampliar después la demo con evidencias ficticias de cuaderno y más verificaciones en Tecnología; hoy los niveles se concentran en la práctica de ecuaciones del guion.
- [T10] Centralizar descargas binarias en api-cliente para comunicar errores del servidor dentro de la página.
- [T10] Para clases grandes, paginar consultas y transmitir CSV para superar el límite de filas de Supabase.
- [T09] Versionar los intentos de entrega/verificación para conservar evidencia histórica al corregir sin reutilizar preguntas o informes anteriores.
- [T09] Cargar las calificaciones de una tarea en una consulta agrupada para evitar una petición por estudiante.
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
- (T03/T06) "Agregar a mi semana": que los pasos de la ruta se vuelvan bloques del plan sin que "Reorganizar" los borre.
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
- 2026-10-29 [T15] 6/7 criterios: 13 cuentas ficticias @muselearn.demo, 2 clases, 8 tareas en 4 modalidades, 62 entregas, 8 verificaciones/informes, 4 estudiantes en Necesitan apoyo, comentarios, notas y devolución de Elian; dos semanas de Camila con 14 bloques cada una. Generador único desde mocks, contraseña obligatoria solo de entorno y README. lint/typecheck OK; 212 pruebas pasan (10 omitidas); seed ejecutado dos veces en PostgreSQL 18 temporal local sin duplicados y con colisiones ajenas rechazadas; Hoy/Semana/General a 380/1280 px sin desbordamiento. Bloqueo: criterio 6 requiere conexiones de detalle/comentarios/semana en api-cliente.ts, fuera de alcance; documentado en ficha. Sin seed remoto, push ni merge.
- 2026-10-29 [T10] CSV Excel de entregas y comprensión: sesión y dueño/RLS, BOM UTF-8, punto y coma, fechas en zona del centro, fórmulas neutralizadas, notas opcionales y botones es/en con mocks. lint/typecheck OK; 199 pruebas pasan (10 omitidas), 4 e2e de descarga OK a 380/1280 px y revisión visual. Ficha completa; sin push ni merge.
- 2026-10-29 [T09] Calificaciones opcionales 0–100, devolución atómica con motivo y RLS en migración 0009 preparada sin aplicar; endpoints con pertenencia y Zod, UI docente/estudiante es/en, corrección que conserva texto/adjuntos y mocks persistentes. Lint/typecheck correctos, 191 pruebas unitarias correctas (10 omitidas), 4 e2e T09 correctos y capturas revisadas a 380/1280 px. Bloqueo del cuarto criterio: conectar `limpiarDevolucionPropia` en POST /api/entregas (ruta fuera de «Puedes tocar»), documentado en ficha; sin push.
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
- 2026-10-28 [T07] Integrada T06: informe del estudiante, ruta de práctica con Muse (y respaldo sin IA), mapa de calor y "entregó vs. comprendió". lint, typecheck, 119 pruebas y build OK; 380 px verificado. Producto completo de punta a punta; falta probar la lectura del cuaderno con fotos reales, el despliegue y el video.
- 2026-10-28 [T07] Datos de demo: `supabase/seed-demo.sql` (generado por `supabase/demo/generar-seed-demo.py`, validado con los contratos): 5 estudiantes ficticios, 4 tareas, entregas, informes y rutas; la historia muestra "entregó 100 % / comprendió 60 %" y el caso de copia (Sofía). seed-auth crea ahora 5 estudiantes. **Pendiente: ejecutar el SQL** (el servidor de Supabase pidió confirmación y no hubo respuesta). Prueba e2e `e2e/flujo-demo.spec.ts`: 14/14 OK en escritorio y celular.
- 2026-10-28 [T07] Arreglo en producción: los contratos rechazaban las fechas de Supabase ("+00:00"); `FechaHora = z.iso.datetime({ offset: true })` en `contratos.ts`. Síntoma: las tareas no cargaban y crear clase daba error aunque se guardaba. Prueba de regresión en `src/types/contratos.test.ts`.
- 2026-10-28 [T07] Rediseño visual "el cuaderno": papel cuadriculado, tinta azul, verde pizarra, resaltador solo para "lo próximo" y la evidencia; tipografías Bricolage Grotesque (títulos), Lexend (lectura) y Caveat (lo que el estudiante "escribe"). Portada nueva con la hoja de cuaderno; Hoy como horario; tarea con instrucciones en papel; tutor tipo chat; verificación con botón de voz grande; panel docente con la comparación entregó/comprendió; informe con la evidencia resaltada. Arreglados los textos de nivel de ayuda que faltaban. 380 px y escritorio revisados; 123 pruebas y 14 e2e OK.

- 2026-10-29 [T13] Voz configurable por idioma, velocidad y pausa persistidas localmente; fondo adaptable, medidor accesible, ayuda de permisos Android/iOS, limpieza de markdown/emojis/enlaces y reintento único con audio recuperable. lint/typecheck y 216 pruebas OK (10 omitidas); seis e2e con mocks y revisión visual a 380/1280 px, es/en. Falta ensayo con micrófono físico (documentado en ficha). Sin push ni merge.
