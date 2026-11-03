"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui";
import { TarjetaClase } from "./TarjetaClase";
import type { MisClase } from "@/lib/server/data";

/** Listado de las clases en las que el estudiante está inscrito. */
export function MisClases({ clases }: { clases: MisClase[] }) {
  const t = useTranslations("estudiante");
  if (!clases.length) {
    return (
      <Card className="papel flex flex-col items-center gap-2 text-center text-lg py-12">
        <p>{t("sinClases")}</p>
      </Card>
    );
  }
  return (
    <section>
      <h2 className="text-2xl font-extrabold text-tinta">{t("clases")}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clases.map((c) => (
          <TarjetaClase key={c.clase.id} clase={c.clase} docente={c.docente} pendientes={c.pendientes} proximaFecha={c.proximaFecha} />
        ))}
      </div>
    </section>
  );
}
