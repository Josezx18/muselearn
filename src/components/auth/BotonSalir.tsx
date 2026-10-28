"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { cerrarSesion } from "./acciones";

/** Cierra la sesión y vuelve al login. Se coloca en los layouts de docente y estudiante. */
export function BotonSalir() {
  const t = useTranslations("comun");
  return (
    <form action={cerrarSesion}>
      <Button type="submit" variante="fantasma" tamano="sm">
        {t("nav.salir")}
      </Button>
    </form>
  );
}
