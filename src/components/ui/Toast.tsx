"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "./cn";

type TonoToast = "info" | "exito" | "error";
interface Aviso {
  id: number;
  texto: string;
  tono: TonoToast;
}

const ContextoToast = createContext<(texto: string, tono?: TonoToast) => void>(() => {});

/** Envuelve la app (ya está en el layout). Uso: const avisar = useToast(); avisar("Guardado", "exito") */
export function ProveedorToast({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const avisar = useCallback((texto: string, tono: TonoToast = "info") => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a, { id, texto, tono }]);
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <ContextoToast.Provider value={avisar}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {avisos.map((a) => (
          <div
            key={a.id}
            role="status"
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
              a.tono === "exito" && "bg-primario text-white",
              a.tono === "error" && "bg-peligro text-white",
              a.tono === "info" && "bg-tinta text-white",
            )}
          >
            {a.texto}
          </div>
        ))}
      </div>
    </ContextoToast.Provider>
  );
}

export const useToast = () => useContext(ContextoToast);
