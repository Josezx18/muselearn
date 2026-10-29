"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";

export interface Pestana {
  id: string;
  etiqueta: string;
  contenido: ReactNode;
}

export interface TabsProps {
  pestanas: Pestana[];
  inicial?: string;
  /** Pestaña activa controlada desde fuera (si se pasa, manda sobre la interna). */
  activa?: string;
  alCambiar?: (id: string) => void;
  className?: string;
}

/** Pestañas accesibles (flechas izquierda/derecha para moverse). */
export function Tabs({ pestanas, inicial, activa: controlada, alCambiar, className }: TabsProps) {
  const base = useId();
  const [interna, setActiva] = useState(inicial ?? pestanas[0]?.id);
  const activa = controlada ?? interna;

  const elegir = (id: string) => {
    setActiva(id);
    alCambiar?.(id);
  };

  const teclado = (e: KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const siguiente = (i + (e.key === "ArrowRight" ? 1 : -1) + pestanas.length) % pestanas.length;
    elegir(pestanas[siguiente].id);
    document.getElementById(`${base}-tab-${pestanas[siguiente].id}`)?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl bg-fondo p-1">
        {pestanas.map((p, i) => (
          <button
            key={p.id}
            id={`${base}-tab-${p.id}`}
            role="tab"
            type="button"
            aria-selected={activa === p.id}
            aria-controls={`${base}-panel-${p.id}`}
            tabIndex={activa === p.id ? 0 : -1}
            onClick={() => elegir(p.id)}
            onKeyDown={(e) => teclado(e, i)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold",
              activa === p.id ? "bg-superficie text-tinta shadow-sm" : "text-tinta-suave hover:text-tinta",
            )}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>
      {pestanas.map((p) => (
        <div key={p.id} id={`${base}-panel-${p.id}`} role="tabpanel" aria-labelledby={`${base}-tab-${p.id}`} hidden={activa !== p.id} className="pt-4">
          {p.contenido}
        </div>
      ))}
    </div>
  );
}
