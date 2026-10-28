"use client";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, Dificultad } from "@/components/ui";
import type { Tarea, AnalisisTarea } from "@/types/contratos";
export function TarjetaTarea({ tarea, analisis, materia }: { tarea: Tarea; analisis?: AnalisisTarea; materia?: string }) {
  const t = useTranslations("estudiante");
  const locale = useLocale();
  return (
    <Card className="min-w-0 space-y-3 break-words">
      <p className="text-sm text-primario">{materia ?? t("materia")}</p>
      <h3 className="font-semibold">
        <Link className="underline" href={`/estudiante/tarea/${tarea.id}`}>
          {tarea.titulo}
        </Link>
      </h3>
      <p className="text-sm text-tinta-suave">
        {t("fecha", { fecha: new Date(tarea.fecha_entrega).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) })}
      </p>
      {analisis ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Dificultad nivel={analisis.dificultad} />
            <span>{t("minutos", { n: analisis.minutos_estimados })}</span>
            <span>{t("prioridad", { n: analisis.prioridad })}</span>
          </div>
          <details>
            <summary className="cursor-pointer text-primario">{t("razon")}</summary>
            <p className="mt-2">{analisis.razon}</p>
          </details>
        </>
      ) : (
        <p>{t("sinAnalisis")}</p>
      )}
    </Card>
  );
}
