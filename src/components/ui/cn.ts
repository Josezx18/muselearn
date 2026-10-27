/** Une clases de CSS ignorando valores vacíos: cn("a", cond && "b") */
export function cn(...clases: (string | false | null | undefined)[]): string {
  return clases.filter(Boolean).join(" ");
}
