"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui";
import { formatearCentro } from "@/lib/fechas-centro";
import type { MisClase } from "@/lib/server/data";

/** Tarjeta de una clase inscrita: nombre, materia, grado, docente, tareas pendientes y próxima entrega. */
export function TarjetaClase({ clase, docente, pendientes, proximaFecha }: MisClase) {
  const t = useTranslations("estudiante");
  const locale = useLocale();
  const fecha = proximaFecha ? formatearCentro(new Date(proximaFecha), locale, { weekday: "short", day: "numeric", month: "short" }) : null;
  return (
    <Link
      href={`/estudiante/clases/${clase.id}`}
      className="group block min-w-0 rounded-2xl border-2 border-borde bg-superficie p-4 sm:p-5 hover:border-tinta-suave transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-tinta leading-snug">{clase.nombre}</h3>
          <p className="mt-0.5 text-sm text-tinta-suave">
            {clase.materia} · {clase.grado}
          </p>
          <p className="mt-1 text-sm text-tinta-suave">{t("docente", { nombre: docente.nombre })}</p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:items-start">
          <Badge tono="primario" className="min-w-fit">
            {t("tareasPendientes", { n: pendientes })}
          </Badge>
          {fecha ? (
            <time dateTime={proximaFecha ?? undefined} className="text-sm text-tinta-suave">
              {t("proximaEntrega", { fecha })}
            </time>
          ) : (
            <span className="text-sm text-tinta-suave">{t("sinProximaEntrega")}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
