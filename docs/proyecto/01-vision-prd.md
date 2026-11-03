# 1. Visión y requisitos de producto (PRD)

**Estado:** borrador as-built basado en el repositorio. No es una validación con usuarios.

## Resumen

MuseLearn es una plataforma bilingüe para docentes y estudiantes de secundaria. Su propuesta central es distinguir **entregar** de **demostrar comprensión**: organiza las tareas en un plan semanal, ofrece tutoría socrática que no resuelve el trabajo, pide al estudiante explicar su propia entrega y presenta evidencia de comprensión al estudiante y al docente.

## Problema

Una tarea entregada no demuestra por sí sola que el estudiante comprenda el contenido. El docente puede descubrir la brecha tarde, mientras que el estudiante necesita apoyo para priorizar, avanzar y reconocer qué conceptos reforzar. Los chatbots que entregan respuestas pueden eludir el aprendizaje que se intenta evaluar.

Esta formulación aparece en `README.md` y `.orquesta/ARQUITECTURA.md`; no se presenta como hallazgo cuantitativo de investigación de usuarios.

## Usuarios y necesidades

- **Estudiante de secundaria:** ver qué estudiar y cuándo; recibir una pista acorde con la tarea; entregar texto, archivos o fotos de cuaderno; explicar el razonamiento por texto o voz; entender qué domina y qué practicar.
- **Docente:** gestionar clases y tareas; decidir el nivel de ayuda; observar entregas y comprensión por concepto; decidir calificaciones, correcciones y retroalimentación.
- **Administrador/centro educativo:** no hay un rol de administrador institucional separado identificado en el código; los controles están basados en roles docente/estudiante y pertenencia a clases.

## Propuesta de valor

El ciclo del producto es **organizar → aprender → entregar → demostrar → mejorar**. La unidad de valor no es el chat, sino el flujo entre tarea, planificación, tutor, comprobación de comprensión, ruta de práctica e información útil para el docente.

## Objetivos del producto

1. Reducir la fricción para que el estudiante priorice y planifique trabajo escolar.
2. Dar apoyo guiado sin producir la respuesta final de la tarea.
3. Obtener evidencia explicable del razonamiento sobre el trabajo propio.
4. Ayudar al docente a identificar conceptos que requieren refuerzo y mantener la decisión humana.
5. Funcionar en español e inglés y en pantallas móviles de baja anchura.
6. Minimizar y proteger datos de estudiantes, incluyendo menores de edad.

Los objetivos 1–6 describen intención; el repositorio no aporta métricas de impacto educativo longitudinal.

## Alcance funcional del producto actual

- Cuentas de docente/estudiante, clases con código e inscripción.
- Tareas, competencias, fechas, nivel de ayuda, modalidades de entrega y adjuntos.
- Análisis de dificultad/tiempo/prioridad/conceptos y generación determinista del plan semanal con avisos.
- Tutor socrático, conversación guardada por estudiante/tarea y preferencias de voz del navegador.
- Entrega de texto/archivos/fotos, verificación por texto o voz, informe por concepto y ruta de práctica.
- Panel docente, mapa de comprensión, IA para borrador de tareas/repasos/comentarios, comentarios, calificaciones y devolución para corrección.
- Avisos dentro de la aplicación, exportación CSV, gestión de perfil/privacidad, interfaz ES/EN e importación opcional de Google Classroom.

El catálogo completo se encuentra en `03-srs.md` y `08-api.md`.

## Principios de producto y límites

- La IA guía, no resuelve; el nivel de ayuda lo elige el docente.
- La evidencia de evaluación debe derivarse de respuestas del estudiante y las citas verificables; el modelo no fija identidad ni fecha del informe.
- La IA puede equivocarse. El docente revisa borradores y conserva la decisión de evaluación.
- Los datos del estudiante son contenido no confiable, no instrucciones para el modelo.
- La interfaz de Classroom registra una confirmación/evidencia en MuseLearn; no implica que MuseLearn entregue ni verifique una tarea en Google.
- Las sugerencias para repaso usan agregados por concepto; no se debe describir como anonimización garantizada sin revisar el posible contenido de las evidencias.

## Indicadores propuestos para medir el producto

No son resultados medidos en el repositorio:

- proporción de estudiantes que completa el plan semanal;
- tiempo entre asignación y análisis/plan visible;
- proporción de entregas seguidas por una explicación completa;
- mejora de niveles por concepto entre intentos;
- porcentaje de sugerencias de IA revisadas/aceptadas por docentes;
- accesibilidad, latencia por operación y tasa de errores en dispositivos reales.

Antes de instrumentarlos se requiere definir privacidad, población, línea base y consentimiento.

## Referencias internas

`README.md` (problema, usuarios y funcionalidades), `.orquesta/ARQUITECTURA.md` (tesis, ciclo y flujos), `META.md` (criterios del hackathon), `src/lib/ia/prompts/reglas-comunes.ts` y `src/types/contratos.ts`.
