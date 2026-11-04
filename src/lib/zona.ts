/**
 * Diferencia horaria del centro en minutos (República Dominicana: -240). Módulo sin dependencias para que se pueda
 * usar tanto en el servidor como en componentes del navegador sin arrastrar el cliente de IA ni la base de datos.
 * En el navegador `ZONA_OFFSET_MIN` no existe y se usa -240.
 */
export function offsetPorDefecto(): number {
  const n = Number(process.env.ZONA_OFFSET_MIN);
  return Number.isFinite(n) && process.env.ZONA_OFFSET_MIN ? n : -240;
}
