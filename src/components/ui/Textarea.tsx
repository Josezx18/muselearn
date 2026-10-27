import { useId, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta?: string;
  error?: string;
  ayuda?: string;
}

export function Textarea({ etiqueta, error, ayuda, className, id, rows = 4, ...resto }: TextareaProps) {
  const generado = useId();
  const idCampo = id ?? generado;
  return (
    <div className="flex flex-col gap-1.5">
      {etiqueta && (
        <label htmlFor={idCampo} className="text-sm font-medium text-tinta">
          {etiqueta}
        </label>
      )}
      <textarea
        id={idCampo}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || ayuda ? `${idCampo}-nota` : undefined}
        className={cn(
          "w-full rounded-xl border bg-superficie px-3 py-2.5 text-base text-tinta placeholder:text-tinta-suave",
          error ? "border-peligro" : "border-borde focus:border-primario",
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
