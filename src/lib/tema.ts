// Apariencia de la app: tres paletas sobre el mismo sistema "el cuaderno".
// La elección vive en una cookie (no es un dato sensible) y un script en <head> la aplica antes de pintar.
export const TEMAS = ["cuaderno", "meta", "muse"] as const;
export type Tema = (typeof TEMAS)[number];
export const TEMA_POR_DEFECTO: Tema = "muse";
export const COOKIE_TEMA = "tema";

export function esTema(valor: unknown): valor is Tema {
  return typeof valor === "string" && (TEMAS as readonly string[]).includes(valor);
}

/** Color de la barra del navegador en el celular para cada tema. */
export const COLOR_BARRA: Record<Tema, string> = { cuaderno: "#1f6f5c", meta: "#0668e1", muse: "#4b39d8" };

/** Script que corre en <head> antes del primer pintado: evita que la página parpadee con otro tema. */
export const MASCOTAS = ["pagi", "chispa", "orbi"] as const;
export type Mascota = (typeof MASCOTAS)[number];
export const MASCOTA_POR_DEFECTO: Mascota = "pagi";
export const COOKIE_MASCOTA = "mascota";

export function esMascota(valor: unknown): valor is Mascota {
  return typeof valor === "string" && (MASCOTAS as readonly string[]).includes(valor);
}

// El HTML llega con el tema y la mascota por defecto; si las cookies dicen otra cosa, se cambia aquí, antes de pintar.
// Solo se aceptan los valores de las listas: nada de la cookie se inyecta tal cual.
export const SCRIPT_TEMA = `try{var d=document.documentElement,m=document.cookie.match(/(?:^|; )${COOKIE_TEMA}=(${TEMAS.join("|")})(?:;|$)/);if(m){d.dataset.tema=m[1];var c=${JSON.stringify(
  COLOR_BARRA,
)}[m[1]],t=document.querySelector('meta[name="theme-color"]');if(t)t.setAttribute("content",c)}var k=document.cookie.match(/(?:^|; )${COOKIE_MASCOTA}=(${MASCOTAS.join("|")})(?:;|$)/);if(k)d.dataset.mascota=k[1]}catch(e){}`;

/** Guarda el tema en la cookie (1 año) y lo aplica al documento. Solo en el navegador. */
export function aplicarTema(tema: Tema) {
  document.documentElement.dataset.tema = tema;
  document.cookie = `${COOKIE_TEMA}=${tema}; path=/; max-age=31536000; samesite=lax`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOR_BARRA[tema]);
}

export function temaActual(): Tema {
  const t = document.documentElement.dataset.tema;
  return esTema(t) ? t : TEMA_POR_DEFECTO;
}

/** Guarda la mascota en la cookie (1 año) y la muestra en toda la página. Solo en el navegador. */
export function aplicarMascota(mascota: Mascota) {
  document.documentElement.dataset.mascota = mascota;
  document.cookie = `${COOKIE_MASCOTA}=${mascota}; path=/; max-age=31536000; samesite=lax`;
}

export function mascotaActual(): Mascota {
  const m = document.documentElement.dataset.mascota;
  return esMascota(m) ? m : MASCOTA_POR_DEFECTO;
}
