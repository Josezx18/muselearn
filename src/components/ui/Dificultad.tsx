"use client";

import { useTranslations } from "next-intl";
import { cn } from "./cn";

/** Indicador de dificultad 1-5 (puntos llenos). */
export function Dificultad({ nivel, className }: { nivel: number; className?: string }) {
  const t = useTranslations("comun.dificultad");
  const valor = Math.min(5, Math.max(1, Math.round(nivel)));
  return (
    <span className={cn("inline-flex items-center gap-1", className)} role="img" aria-label={t("valor", { nivel: valor })}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("size-2 rounded-full", i <= valor ? (valor >= 4 ? "bg-nivel-1" : "bg-acento") : "bg-nivel-vacio")} />
      ))}
    </span>
  );
}
