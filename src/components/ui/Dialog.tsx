"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "./cn";

export interface DialogProps {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  children: ReactNode;
  etiquetaCerrar?: string;
  className?: string;
}

/** Diálogo modal accesible basado en <dialog> nativo (Esc y clic fuera lo cierran). */
export function Dialog({ abierto, alCerrar, titulo, children, etiquetaCerrar = "Cerrar", className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={alCerrar}
      onClick={(e) => e.target === ref.current && alCerrar()}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-borde bg-superficie p-0 text-tinta backdrop:bg-tinta/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-borde px-5 py-4">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <button type="button" onClick={alCerrar} aria-label={etiquetaCerrar} className="rounded-lg p-1 text-tinta-suave hover:bg-fondo">
          ✕
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
