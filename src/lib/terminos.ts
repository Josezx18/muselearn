// Versión vigente de los Términos de uso y la Política de privacidad. Si cambia, todos los usuarios
// vuelven a aceptarlos en su próxima entrada. Formato: fecha de la versión (aaaa-mm-dd).
export const TERMINOS_VERSION = "2026-10-29";

/** ¿Debe el usuario aceptar (o volver a aceptar) los términos? */
export function debeAceptarTerminos(
  versionAceptada: string | null | undefined,
): boolean {
  return versionAceptada !== TERMINOS_VERSION;
}
