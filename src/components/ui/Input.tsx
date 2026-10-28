import { useId, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
}

export function Input({ etiqueta, error, ayuda, className, id, ...resto }: InputProps) {
  const generado = useId();
  const idCampo = id ?? generado;
  return (
    <div className="flex flex-col gap-1.5">
      {etiqueta && (
        <label htmlFor={idCampo} className="text-sm font-bold text-tinta">
          {etiqueta}
        </label>
      )}
      <input
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || ayuda ? `${idCampo}-nota` : undefined}
        className={cn(
          "h-11 w-full rounded-xl border-2 bg-superficie px-3 text-base text-tinta placeholder:text-tinta-suave",
          error ? "border-peligro" : "border-borde focus:border-primario focus:outline-none focus:ring-4 focus:ring-primario-claro",
          className,
        )}
        {...resto}
      />
      {(error || ayuda) && (
        <p id={`${idCampo}-nota`} className={cn("text-sm", error ? "text-peligro" : "text-tinta-suave")}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
}
