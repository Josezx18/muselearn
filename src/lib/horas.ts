import type { PreferenciasEstudio } from "@/types/contratos";

type Franja = PreferenciasEstudio["horas_disponibles"][number];

/** Minutos libres por semana según las franjas. */
export function minutosSemana(franjas: Franja[]): number {
  const min = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
  return franjas.reduce((s, f) => s + Math.max(0, min(f.hasta) - min(f.desde)), 0);
}

export function franjasValidas(franjas: Franja[]): boolean {
  const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
  return franjas.every((f) => hhmm.test(f.desde) && hhmm.test(f.hasta) && f.desde < f.hasta);
}
