import { cn } from "./cn";

/** Bloque gris animado para estados de carga. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-nivel-vacio", className)} aria-hidden />;
}
