import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variante = "primario" | "secundario" | "fantasma" | "peligro";
type Tamano = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
}

const variantes: Record<Variante, string> = {
  primario: "bg-primario text-white hover:bg-primario-fuerte",
  secundario: "bg-superficie text-tinta border border-borde hover:bg-fondo",
  fantasma: "bg-transparent text-primario hover:bg-primario-claro",
  peligro: "bg-peligro text-white hover:opacity-90",
};

const tamanos: Record<Tamano, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-base",
  lg: "h-13 px-6 text-lg",
};

export function Button({ variante = "primario", tamano = "md", cargando, disabled, className, children, ...resto }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantes[variante],
        tamanos[tamano],
        className,
      )}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}
