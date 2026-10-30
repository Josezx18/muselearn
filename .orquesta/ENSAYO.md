# Ensayo real de la demo

Estado: **ensayo automatizado realizado por T07 el 30 oct de 2026; ensayo con dispositivos reales pendiente**. Las comprobaciones de interfaz usan mocks; las pruebas separadas del tutor, evaluación y analizador sí llamaron a proveedores reales con datos ficticios.

## Resultados comprobados por T07

| Prueba | Entorno y alcance | Resultado |
|---|---|---|
| Suite completa de navegador | Chrome local, proyectos escritorio y celular, `NEXT_PUBLIC_USAR_MOCKS=true`, un worker | 150 correctas, 2 omitidas; 7,1 minutos. |
| Guion completo de demo | Crear tarea, Hoy, conversación con audio sintético, evidencia de Classroom, tres explicaciones, informe, panel y comentario | Correcto en escritorio y celular; sin excepciones ni errores de consola detectados por el guion. |
| Accesibilidad y ancho | axe, contraste, foco, regiones live y comprobaciones a 360 px incluidas en la suite | Correctas. No es una medición nueva de Lighthouse. |
| Tutor y evaluación reales | `PRUEBAS_T04_REALES=true`; cinco casos de tutor y dos de comprensión | 7/7 correctas; 100,48 s en total. Comprensión demostrada: nivel 4; sin justificación: nivel 1. |
| Analizador real | `IA_EN_VIVO=1`, archivo analizador.test.ts con entorno local | 12/12 correctas, incluidas tres tareas reales de prueba; 24,42 s en total. |
| Páginas públicas desplegadas | GET de `/es`, `/en`, `/es/como-funciona`, `/es/privacidad`, `/es/terminos` en muselearn-five.vercel.app | Todas HTTP 200. No acredita un recorrido autenticado en producción. |

Comandos usados: `npm run e2e -- --workers=1` (Chrome instalado y mocks), `npm test -- src/lib/ia/conversacion/modelo-real.test.ts` (opt-in real) y `node --env-file=.env.local node_modules/vitest/vitest.mjs run src/lib/ia/analizador/analizador.test.ts` (opt-in real). No se imprimieron claves ni se usaron datos reales de estudiantes.

Evidencia del modelo: `.orquesta/evidencia/T04/resultados-modelo-real.json`. No se detectaron fallos funcionales en las comprobaciones ejecutadas. La suite emitió una advertencia de React sobre una etiqueta `script` al navegar entre idiomas; las pruebas afectadas pasaron. Se registra para observarla si se reproduce un fallo visible, sin convertirla en un fallo funcional confirmado.

### Límites y comprobaciones pendientes
- Cámara y lectura de tres fotos reales de cuaderno: no probadas.
- ASR con habla humana, micrófono, altavoz y ruido de aula: no probados; el navegador utilizó un tono sintético y transcripción mock.
- Persistencia en Supabase con docente y estudiante autenticados, llegada de tarea, plan y comentario: no probada en este ensayo.
- Entrega real en Google Classroom: no probada; la suite comprueba evidencia y confirmación dentro de MuseLearn.
- Lighthouse móvil y tiempos por operación con dispositivos reales: pendientes de T20/ensayo físico. La duración total de una suite no mide la latencia de cada interacción.

## Registro del ensayo con dispositivos reales

Sigue `.orquesta/DEMO.md` con las cuentas ficticias de demo, en celular y PC. No anotes contraseñas, claves ni datos reales de estudiantes.

## Datos del ensayo
- Fecha y hora: pendiente.
- Dispositivo, navegador y versión: pendiente.
- Versión publicada probada: pendiente.
- Recorrido completo: pendiente.

## Fallos observados
Todavía no hay fallos funcionales confirmados. Copia este bloque por cada fallo observado en dispositivos reales:

### E01 — Título del fallo
- Pantalla y dispositivo:
- Pasos para reproducir:
- Resultado esperado:
- Resultado observado:
- Tiempo de espera, si corresponde:
- Captura con datos ficticios, si existe:
- ¿Impide continuar la demo?:

## Comprobaciones del recorrido
- [ ] Docente: crear tarea con IA, comentar, calificar, devolver y exportar CSV.
- [ ] Estudiante: Hoy, Semana, tutor y entrega de foto de cuaderno.
- [ ] Verificación: lectura del cuaderno, voz y transcripción en el entorno del aula.
- [ ] Conversación por voz y preferencias de voz.
- [ ] Informe, ruta de práctica y panel de comprensión del docente.
- [ ] Campana de avisos y entrega externa en Classroom.
- [ ] Anotar cualquier operación que tarde más de 10 segundos.

## Clasificación del integrador
Pendiente de observaciones reales. Los fallos de datos/API/IA se trasladan a T19; los visuales se asignan a T20 sin solapar archivos.
