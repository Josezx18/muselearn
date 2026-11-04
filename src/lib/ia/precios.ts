import type { IdProveedor } from "./cliente";

export function precio(valor: string | undefined): number | null {
  if (!valor?.trim()) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}
export function calcularCosto(proveedor: IdProveedor, entrada: number | null, salida: number | null, env = process.env): number | null {
  const prefijo = `PRECIO_${proveedor.toUpperCase()}`;
  const pe = precio(env[`${prefijo}_ENTRADA`]);
  const ps = precio(env[`${prefijo}_SALIDA`]);
  return pe === null || ps === null || entrada === null || salida === null ? null : (entrada * pe + salida * ps) / 1_000_000;
}
