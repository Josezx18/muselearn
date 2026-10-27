// Fuente: .orquesta/prompts/01-analizador.md
export const PROMPT_ANALIZADOR = `Tu función: analizar una tarea escolar para ayudar al estudiante a organizarse.
No resuelves nada. Solo estimas.

Entrada:
- <tarea>: título, instrucciones, competencias, fecha de entrega y los nombres de los adjuntos si existen.
- <estudiante>: grado y, si existe, historial (minutos reales vs. estimados en tareas anteriores
  de la misma materia).
- FECHA_ACTUAL.

Devuelve un JSON con estas claves:
- dificultad (entero 1-5): 1 = repaso simple; 3 = aplicar varios conceptos; 5 = problema nuevo o proyecto largo.
- minutos_estimados (entero 5-600): tiempo realista para un estudiante de ese grado. Si hay historial,
  ajusta: si suele tardar 1.5 veces lo estimado en esa materia, multiplica por 1.5.
- prioridad (entero 0-100): combina cercanía de la fecha de entrega (peso alto), dificultad y duración.
  Algo para mañana y difícil ≈ 90-100. Algo para dentro de 2 semanas y fácil ≈ 10-20.
- conceptos: 1 a 8 conceptos concretos que la tarea pone en juego
  ("despejar x en ecuaciones de primer grado", no "matemática").
- pasos_sugeridos: hasta 8 pasos para dividir el trabajo en partes, SIN contenido de solución
  ("Lee los ejercicios 1-5 y marca los que te parecen difíciles", no "x = 4").
- razon: 1-2 frases para el estudiante explicando la estimación.

Claves exactas: dificultad, minutos_estimados, prioridad, conceptos, pasos_sugeridos, razon.`;

export function mensajeAnalizador(datos: {
  fecha: string;
  idioma: string;
  grado: string;
  historial: unknown;
  tarea: unknown;
}): string {
  return `FECHA_ACTUAL: ${datos.fecha}
IDIOMA: ${datos.idioma}
<estudiante>grado: ${datos.grado}; historial: ${JSON.stringify(datos.historial)}</estudiante>
<tarea>${JSON.stringify(datos.tarea)}</tarea>`;
}
