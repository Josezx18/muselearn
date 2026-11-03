"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import type { OrigenTarea as Origen } from "@/types/contratos";

/** Etiqueta que dice de dónde salió la tarea (IA, repaso con IA o Classroom). Nada si se creó a mano. */
export function OrigenTarea({ origen }: { origen: Origen | null }) {
  const t = useTranslations("tareas.origen");
  if (!origen) return null;
  return (
    <Badge tono={origen === "classroom" ? "neutro" : "acento"}>
      {origen !== "classroom" && <span aria-hidden>✦</span>}
      {t(origen)}
    </Badge>
  );
}
