/** Fechas del centro independientes de las zonas horarias del servidor y del navegador. */
export function diaCentro(fecha: string | Date, offsetMin = -240): string {
  return desplazada(fecha, offsetMin).toISOString().slice(0, 10);
}

export function formatearCentro(fecha: string | Date, locale: string, opciones: Intl.DateTimeFormatOptions, offsetMin = -240): string {
  return desplazada(fecha, offsetMin).toLocaleString(locale, { ...opciones, timeZone: "UTC" });
}

function desplazada(fecha: string | Date, offsetMin: number): Date {
  return new Date(new Date(fecha).getTime() + offsetMin * 60_000);
}
