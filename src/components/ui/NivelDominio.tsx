"use client";

import { useTranslations } from "next-intl";
import { cn } from "./cn";

const colores: Record<1 | 2 | 3 | 4, string> = {
  1: "bg-nivel-1 text-white",
  2: "bg-nivel-2 text-tinta",
  3: "bg-nivel-3 text-white",
  4: "bg-nivel-4 text-white",
};

/** Chip del nivel de dominio MINERD (1 Inicial · 2 En proceso · 3 Logrado · 4 Destacado). */
export function NivelDominio({ nivel, compacto, className }: { nivel: 1 | 2 | 3 | 4; compacto?: boolean; className?: string }) {
  const t = useTranslations("comun.nivelDominio");
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", colores[nivel], className)}>
      <span aria-hidden>{nivel}</span>
      {compacto ? <span className="sr-only">{t(String(nivel))}</span> : t(String(nivel))}
    </span>
  );
}
