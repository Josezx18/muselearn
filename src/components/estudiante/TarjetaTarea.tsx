"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Dificultad } from "@/components/ui";
import type { Tarea, AnalisisTarea } from "@/types/contratos";

/** Tarjeta de una tarea: materia, título, fecha de entrega y el análisis (dificultad, minutos, prioridad y por qué). */
export function TarjetaTarea({ tarea, analisis, materia }: { tarea: Tarea; analisis?: AnalisisTarea; materia?: string }) {
  const t = useTranslations("estudiante");
  const locale = useLocale();
  const fecha = new Date(tarea.fecha_entrega);
  const urgente = analisis ? analisis.prioridad >= 75 : false;
  return (
    <article className="flex min-w-0 flex-col gap-2 break-words rounded-2xl border-2 border-borde bg-superficie p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-primario-fuerte">{materia ?? t("materia")}</p>
        <time dateTime={tarea.fecha_entrega} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${urgente ? "bg-peligro-claro text-peligro" : "bg-fondo text-tinta-suave"}`}>
          {fecha.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}
        </time>
      </div>
      <h3 className="text-lg font-bold leading-snug">
        <Link className="underline-offset-4 hover:underline" href={`/estudiante/tarea/${tarea.id}`}>
          {tarea.titulo}
        </Link>
      </h3>
      {analisis ? (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tinta-suave">
            <Dificultad nivel={analisis.dificultad} />
            <span>{t("minutos", { n: analisis.minutos_estimados })}</span>
            <span>{t("prioridad", { n: analisis.prioridad })}</span>
          </div>
          <details className="group text-sm">
            <summary className="cursor-pointer font-bold text-primario-fuerte marker:text-primario">{t("razon")}</summary>
            <p className="mt-1.5 text-tinta">{analisis.razon}</p>
          </details>
        </>
      ) : (
        <p className="text-sm text-tinta-suave">{t("sinAnalisis")}</p>
      )}
    </article>
  );
}
