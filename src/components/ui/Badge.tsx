import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Tono = "neutro" | "primario" | "acento" | "peligro";

const tonos: Record<Tono, string> = {
  neutro: "bg-fondo text-tinta-suave border-borde",
  primario: "bg-primario-claro text-primario-fuerte border-transparent",
  acento: "bg-acento-claro text-tinta border-transparent",
  peligro: "bg-peligro-claro text-peligro border-transparent",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tono?: Tono;
}

export function Badge({ tono = "neutro", className, ...resto }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", tonos[tono], className)}
      {...resto}
    />
  );
}
