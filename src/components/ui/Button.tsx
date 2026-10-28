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
  // Botones con "canto" inferior, como una tecla o una regla: se hunden al tocarlos.
  primario:
    "bg-primario text-white shadow-[0_3px_0_0_var(--color-primario-fuerte)] hover:bg-primario-fuerte active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--color-primario-fuerte)]",
  secundario:
    "bg-superficie text-tinta border-2 border-borde shadow-[0_3px_0_0_var(--color-borde)] hover:border-tinta-suave/40 active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--color-borde)]",
  fantasma: "bg-transparent text-primario-fuerte underline-offset-4 hover:bg-primario-claro",
  peligro: "bg-peligro text-white shadow-[0_3px_0_0_#8f2c1e] hover:opacity-95 active:translate-y-[2px] active:shadow-none",
};

const tamanos: Record<Tamano, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-base",
  lg: "min-h-13 px-6 text-lg",
};

export function Button({ variante = "primario", tamano = "md", cargando, disabled, className, children, ...resto }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl py-1.5 text-center font-bold transition-[background-color,transform,box-shadow] duration-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0",
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
