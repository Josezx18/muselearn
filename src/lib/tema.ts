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
// El HTML llega con el tema por defecto; si la cookie dice otro, se cambia aquí.
export const SCRIPT_TEMA = `try{var m=document.cookie.match(/(?:^|; )${COOKIE_TEMA}=(${TEMAS.join("|")})(?:;|$)/);if(m){document.documentElement.dataset.tema=m[1];var c=${JSON.stringify(
  COLOR_BARRA,
)}[m[1]],t=document.querySelector('meta[name="theme-color"]');if(t)t.setAttribute("content",c)}}catch(e){}`;

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
