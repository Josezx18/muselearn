import type { IdProveedor } from "./cliente";

/** Lee un precio de una variable de entorno. Acepta "1.25", "1,25", "$1.25" o " 1.25 USD ". */
export function precio(valor: string | undefined): number | null {
  const limpio = valor?.replace(/[$\s]|usd/gi, "").replace(",", ".");
  if (!limpio) return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}
export function calcularCosto(proveedor: IdProveedor, entrada: number | null, salida: number | null, env = process.env): number | null {
  const prefijo = `PRECIO_${proveedor.toUpperCase()}`;
  const pe = precio(env[`${prefijo}_ENTRADA`]);
  const ps = precio(env[`${prefijo}_SALIDA`]);
  return pe === null || ps === null || entrada === null || salida === null ? null : (entrada * pe + salida * ps) / 1_000_000;
}
