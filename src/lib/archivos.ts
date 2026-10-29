/** Enlace de la app que abre un adjunto: el servidor comprueba el acceso y redirige a una URL firmada. */
export const enlaceArchivo = (ruta: string) => `/api/archivos?ruta=${encodeURIComponent(ruta)}`;
