import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Card({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-borde bg-superficie p-4 sm:p-5", className)} {...resto} />;
}

export function CardTitulo({ className, ...resto }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold text-tinta", className)} {...resto} />;
}

export function CardTexto({ className, ...resto }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-tinta-suave", className)} {...resto} />;
}
