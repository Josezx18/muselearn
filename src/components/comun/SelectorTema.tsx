"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui";
import {
  MASCOTAS,
  MASCOTA_POR_DEFECTO,
  TEMAS,
  TEMA_POR_DEFECTO,
  aplicarMascota,
  aplicarTema,
  mascotaActual,
  temaActual,
  type Tema,
} from "@/lib/tema";
import { Pagi } from "./mascotas/Pagi";
import { Chispa } from "./mascotas/Chispa";
import { Orbi } from "./mascotas/Orbi";

// Muestra de cada tema (colores fijos: es una vista previa, no depende del tema activo).
const MUESTRA: Record<Tema, string> = {
  cuaderno: "linear-gradient(135deg, #1f6f5c 0 60%, #ffd84d 60%)",
  meta: "linear-gradient(135deg, #0668e1 0 60%, #ffd84d 60%)",
  muse: "linear-gradient(120deg, #0668e1, #6a4cf5 55%, #c44fb6)",
};

const DIBUJO = { pagi: Pagi, chispa: Chispa, orbi: Orbi };

function suscribir(aviso: () => void) {
  const o = new MutationObserver(aviso);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema", "data-mascota"] });
  return () => o.disconnect();
}

/** Botón "Apariencia": elige la paleta de colores y la mascota. La elección se guarda en este navegador. */
export function SelectorTema({ className }: { className?: string }) {
  const t = useTranslations("comun.tema");
  const tema = useSyncExternalStore(suscribir, temaActual, () => TEMA_POR_DEFECTO);
  const mascota = useSyncExternalStore(suscribir, mascotaActual, () => MASCOTA_POR_DEFECTO);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", cerrar);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", cerrar);
    };
  }, [abierto]);

  return (
    <div ref={caja} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-label={t("etiqueta")}
        title={t("etiqueta")}
        onClick={() => setAbierto((a) => !a)}
        className="grid size-9 place-items-center rounded-lg border border-borde bg-superficie hover:border-tinta-suave"
      >
        <span
          aria-hidden
          className="size-5 rounded-full border-2 border-superficie shadow-[0_0_0_1px_var(--color-borde)]"
          style={{ background: MUESTRA[tema] }}
        />
      </button>
      {abierto && (
        <div
          role="group"
          aria-label={t("etiqueta")}
          className="absolute right-0 top-11 z-40 w-60 rounded-2xl border-2 border-tinta bg-superficie p-2 shadow-[4px_4px_0_0_var(--sombra-fuerte)]"
        >
          <p className="px-2 pb-1 pt-0.5 text-xs font-bold text-tinta-suave">{t("colores")}</p>
          <div role="radiogroup" aria-label={t("colores")}>
            {TEMAS.map((opcion) => (
              <button
                key={opcion}
                type="button"
                role="radio"
                aria-checked={tema === opcion}
                onClick={() => aplicarTema(opcion)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left",
                  tema === opcion ? "bg-primario-claro" : "hover:bg-fondo",
                )}
              >
                <span aria-hidden className="size-7 shrink-0 rounded-lg" style={{ background: MUESTRA[opcion] }} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{t(`${opcion}.nombre`)}</span>
                  <span className="block text-xs text-tinta-suave">{t(`${opcion}.detalle`)}</span>
                </span>
                {tema === opcion && (
                  <svg viewBox="0 0 24 24" className="ml-auto size-5 shrink-0 text-primario" aria-hidden>
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label={t("mascota")} className="mt-2 border-t-2 border-borde pt-2">
            <p className="px-2 pb-1 text-xs font-bold text-tinta-suave">{t("mascota")}</p>
            <div className="grid grid-cols-3 gap-1">
              {MASCOTAS.map((opcion) => {
                const Dibujo = DIBUJO[opcion];
                return (
                  <button
                    key={opcion}
                    type="button"
                    role="radio"
                    aria-checked={mascota === opcion}
                    onClick={() => aplicarMascota(opcion)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-xs font-bold",
                      mascota === opcion ? "bg-primario-claro ring-2 ring-primario" : "hover:bg-fondo",
                    )}
                  >
                    <Dibujo expresion="hola" className="size-11" />
                    {t(`mascotas.${opcion}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
