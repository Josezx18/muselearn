// Generador de códigos de inscripción: 6 caracteres sin O/0/I/1 (se confunden al dictarlos).
export const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 símbolos
export const LONGITUD_CODIGO = 6;

/** Código aleatorio. 32 símbolos dividen 256 exacto, así que `byte % 32` no introduce sesgo. */
export function generarCodigo(aleatorio: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  return Array.from(aleatorio(LONGITUD_CODIGO), (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join("");
}

/** Mayúsculas y sin espacios: lo que el estudiante teclea puede venir "mat4 kq ". */
export function normalizarCodigo(texto: string): string {
  return texto.replace(/\s|-/g, "").toUpperCase();
}

export function esCodigoValido(codigo: string): boolean {
  return codigo.length === LONGITUD_CODIGO && [...codigo].every((c) => ALFABETO_CODIGO.includes(c));
}
