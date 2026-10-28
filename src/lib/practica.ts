// Bloques de práctica: los pasos de una ruta de práctica que el estudiante agregó a su semana.
// Viven en el mismo plan que los bloques de tareas, con un id reconocible para que el planificador
// no los recalcule y para que la interfaz enlace al informe y no a la tarea (que ya está entregada).
const PREFIJO = "practica-";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function idPractica(entrega_id: string, paso: number): string {
  return `${PREFIJO}${entrega_id}-${paso}`;
}

export function esPractica(bloque_id: string): boolean {
  return bloque_id.startsWith(PREFIJO);
}

/** Entrega a la que pertenece un bloque de práctica (null si no es de práctica). */
export function entregaDePractica(bloque_id: string): string | null {
  if (!esPractica(bloque_id)) return null;
  const entrega = bloque_id.slice(PREFIJO.length, PREFIJO.length + 36);
  return UUID.test(entrega) ? entrega : null;
}

/** Ruta a la que lleva un bloque del plan: el informe para la práctica, la tarea para lo demás. */
export function enlaceDeBloque(b: { id: string; tarea_id: string }): string {
  const entrega = entregaDePractica(b.id);
  return entrega ? `/estudiante/informe/${entrega}` : `/estudiante/tarea/${b.tarea_id}`;
}
