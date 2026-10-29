"use client";

import { cn } from "@/components/ui";

/** Interruptor "Voz del tutor": si está encendido, el tutor y las preguntas se leen en voz alta solos. */
export function BotonVoz({
  activa,
  alCambiar,
  etiquetas,
  className,
}: {
  activa: boolean;
  alCambiar: (v: boolean) => void;
  etiquetas: { encendida: string; apagada: string };
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={() => alCambiar(!activa)}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border-2 px-3 text-sm font-bold",
        activa ? "border-primario bg-primario-claro text-primario-fuerte" : "border-borde bg-superficie text-tinta-suave",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
        {activa ? (
          <path
            d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          <path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
      {activa ? etiquetas.encendida : etiquetas.apagada}
    </button>
  );
}
