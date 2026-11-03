/**
 * Protección CSRF para la API: una petición que cambia datos (POST, PUT, PATCH, DELETE) solo se acepta si viene
 * de la propia app. Los navegadores envían `Origin` en esas peticiones; si viene de otro sitio, se rechaza.
 * Sin `Origin` (clientes que no son navegador) se mira `Sec-Fetch-Site`; si tampoco está, se acepta, porque esos
 * clientes no llevan las cookies del usuario por su cuenta.
 */
const SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

export function origenPermitido(metodo: string, cabeceras: Headers): boolean {
  if (SEGUROS.has(metodo.toUpperCase())) return true;
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host");
  const origen = cabeceras.get("origin");
  if (origen) {
    if (origen === "null" || !host) return false;
    try {
      return new URL(origen).host === host.split(",")[0].trim();
    } catch {
      return false;
    }
  }
  const sitio = cabeceras.get("sec-fetch-site");
  return !sitio || sitio === "same-origin" || sitio === "none";
}
