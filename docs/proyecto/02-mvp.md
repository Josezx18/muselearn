# 2. Alcance del MVP

**Definición:** alcance mínimo demostrable que cierra el ciclo educativo de MuseLearn. Este documento distingue capacidad del producto de su nivel de validación.

## Resultado mínimo

Un docente crea una clase y una tarea; un estudiante se une, recibe la tarea en su plan, consulta al tutor sin recibir la solución, entrega evidencia y explica su razonamiento; MuseLearn produce un informe con evidencia y una ruta de práctica; el docente ve el nivel por concepto y decide qué hacer.

## Funciones incluidas

| Capacidad | Criterio de aceptación del MVP | Estado encontrado |
|---|---|---|
| Identidad y roles | Registro/login, perfil docente/estudiante y rutas protegidas | Implementación descrita en T01 y presente en rutas/auth; configuración remota no se confirmó |
| Clases | Crear clase, generar código, inscribir estudiante | Implementado; estado del proyecto remoto no revalidado |
| Tareas | Docente crea/edita/elimina y establece instrucciones, fecha, competencias y nivel de ayuda | Implementado según handlers y fichas T02; PDF no tiene extracción de texto documentada |
| Plan | Análisis de tarea y vistas Hoy/Semana; replanificación al analizar tarea | Implementado; algoritmo determinista y avisos de IA; pruebas de integración remota no reejecutadas |
| Tutor | Preguntas/pistas adaptadas al nivel docente, sin dar respuesta final | Implementado por prompt/route; pruebas reales históricas documentadas, no repetidas en esta revisión |
| Evidencia | Texto, archivos PDF/imágenes y fotos del cuaderno; modalidad externa | Implementado. Máximo 10 MB por archivo; hasta 4 fotos desde formulario, según T02 |
| Comprensión | 3 preguntas en flujo normal, texto o voz; informe por concepto con citas de respuestas | Implementado. Voz usa transcripción y no guarda el audio en MuseLearn; prueba física pendiente |
| Docente | Panel de comprensión, notas, devolución, comentarios y CSV | Implementado según código/README |
| Uso de IA docente | Propuesta de tarea, sugerencias de repaso y borradores de comentarios | Implementado como propuesta/borrador; se requiere revisión del docente |
| Localización/accesibilidad | Español/inglés, móvil desde 360 px, teclado/lector de pantalla | Evidencia automatizada previa en `.orquesta/ENSAYO.md` y T20; no se volvió a ejecutar |
| Privacidad | Consentimiento de términos, exportación y eliminación de cuenta | Funciones presentes; revisar riesgos de cascada y contenido legal en `09-seguridad-privacidad-ia.md` |

## Fuera del MVP o no comprometido

- Aplicación móvil nativa, push, vista mensual y automatización de asignaciones desde pizarra.
- Extracción de texto de PDFs para análisis automático (aparece como pendiente en T02/PROGRESO).
- Entrega real de trabajos a Google Classroom: la app registra evidencia/confirmación y puede importar cursos, estudiantes y tareas, pero no envía la entrega del estudiante.
- Tutor que entrega soluciones, evaluación automática con autoridad final o decisiones automáticas disciplinarias.
- Servidor MCP: existe `.orquesta/MCP.md` como propuesta; no hay endpoint implementado.
- Garantía de lectura correcta de cualquier escritura manuscrita, transcripción vocal en condiciones de aula o impacto en notas/aprendizaje.

## Criterios para considerar el MVP listo para una demostración pública

1. La ruta feliz completa funciona con dos cuentas ficticias y persistencia real.
2. La misma ruta tiene una alternativa de texto cuando cámara/micrófono/proveedor no está disponible.
3. El usuario distingue datos/respuestas simulados de uso de IA real.
4. Se comprueban permisos de dos estudiantes y docentes distintos; las pruebas RLS alcanzan el resultado vigente esperado.
5. No se publican credenciales ni datos reales; los modelos y proveedores mostrados coinciden con llamadas realmente observadas.
6. La experiencia móvil, accesibilidad y recuperación ante errores se prueban en dispositivos/navegadores objetivo.
7. El video y formulario de hackathon se completan por el responsable humano.

Los puntos 1–7 son criterios recomendados de salida, no una afirmación de que ya están completos. La evidencia del repositorio indica que la demo automatizada pasó con mocks, pero deja pendientes el ensayo físico, la persistencia autenticada completa y pruebas de cámara/voz reales (`.orquesta/ENSAYO.md`).

## Fuentes y advertencias

`README.md` (Status, What it does), `META.md`, `.orquesta/tareas/T01–T06`, `T09`, `T12–T20`, `PROGRESO.md` y `.orquesta/ENSAYO.md`. Las fichas contienen estados históricos; para el estado efectivo prevalecen el código del commit objetivo y pruebas reejecutadas.
