"use client";
import { useLocale, useTranslations } from "next-intl";
import type { Tarea, AnalisisTarea, Entrega } from "@/types/contratos";
import { Dificultad, Skeleton } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { enlaceArchivo } from "@/lib/archivos";
import dynamic from "next/dynamic";

const CalificacionEntregaDynamic = dynamic(() => import("@/components/gestion/CalificacionEntrega").then((m) => m.CalificacionEntrega), { ssr: false });
const FormularioEntregaDynamic = dynamic(() => import("@/components/entregas").then((m) => m.FormularioEntrega), { ssr: false });
const ComentarioDocenteDynamic = dynamic(() => import("./ComentarioDocente").then((m) => m.ComentarioDocente), { ssr: false });

interface DetalleTareaProps {
  tarea: Tarea | null;
  analisis?: AnalisisTarea;
  materia?: string;
  entrega: Entrega | null;
}

export function DetalleTarea({ tarea, analisis, materia, entrega }: DetalleTareaProps) {
  const t = useTranslations("estudiante");
  const locale = useLocale();
  const fecha = tarea ? new Date(tarea.fecha_entrega) : null;

  if (!tarea || !fecha) {
    return (
      <div role="status" className="mt-4 space-y-3">
        <p className="sr-only">{t("carga")}</p>
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="min-w-0 break-words">
      <Link className="inline-flex min-h-9 items-center font-bold text-primario-fuerte underline-offset-4 hover:underline" href="/estudiante/hoy">
        ‹ {t("volver")}
      </Link>
      <header className="mt-3">
        <p className="font-bold text-primario-fuerte">{materia ?? t("materia")}</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">{tarea.titulo}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border-2 border-borde bg-superficie px-3 py-1 font-bold">
            {t("fecha", { fecha: fecha.toLocaleString(locale, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) })}
          </span>
          {analisis && (
            <>
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-borde bg-superficie px-3 py-1">
                <Dificultad nivel={analisis.dificultad} />
              </span>
              <span className="rounded-full border-2 border-borde bg-superficie px-3 py-1">{t("minutos", { n: analisis.minutos_estimados })}</span>
            </>
          )}
        </div>
      </header>

      {tarea.modalidad !== "muselearn" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-tinta bg-resaltador-claro p-4">
          <p className="font-bold">
            {t(`modalidad.${tarea.modalidad}`)}
            {entrega?.entregada_externamente && <span className="ml-2 font-normal text-tinta-suave">· {t("modalidad.marcada")}</span>}
          </p>
          {tarea.enlace_externo && (
            <a
              href={tarea.enlace_externo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center rounded-xl bg-tinta px-4 text-sm font-bold text-superficie"
            >
              {t(tarea.modalidad === "classroom" ? "modalidad.abrirClassroom" : "modalidad.abrir")} ↗
            </a>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="titulo-instrucciones" className="papel papel-margen rounded-2xl border-2 border-borde py-5 pl-14 pr-5">
            <h2 id="titulo-instrucciones" className="text-xl font-extrabold">
              {t("instrucciones")}
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-lg leading-[2.2rem]">{tarea.instrucciones}</p>
            {tarea.adjuntos.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm text-tinta-suave">
                {tarea.adjuntos.map((a, i) => (
                  <li key={i}>
                    <a href={enlaceArchivo(a.ruta)} target="_blank" rel="noopener noreferrer" className="font-bold text-primario-fuerte underline-offset-4 hover:underline">
                      📎 {a.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="titulo-analisis" className="rounded-2xl border-2 border-borde bg-superficie p-5">
            <h2 id="titulo-analisis" className="text-xl font-extrabold">
              {t("pasos")}
            </h2>
            {analisis ? (
              <>
                <ol className="mt-3 space-y-3">
                  {analisis.pasos_sugeridos.map((paso, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-tinta bg-resaltador-claro font-titulo text-sm font-extrabold">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{paso}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-sm text-tinta-suave">{analisis.razon}</p>
                <ul className="mt-3 flex flex-wrap gap-2" aria-label={t("analisis")}>
                  {analisis.conceptos.map((c) => (
                    <li key={c} className="rounded-full bg-primario-claro px-3 py-1 text-sm font-bold text-primario-fuerte">
                      {c}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-tinta-suave">{t("sinAnalisis")}</p>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Link
            className="flex min-h-13 items-center justify-center gap-2 rounded-xl border-2 border-tinta bg-resaltador px-4 font-titulo text-lg font-extrabold shadow-[0_3px_0_0_var(--color-tinta)] active:translate-y-[2px] active:shadow-none"
            href={`/estudiante/tarea/${tarea.id}/tutor`}
          >
            {t("tutor")}
          </Link>
          {entrega && <CalificacionEntregaDynamic key={`nota-${entrega.id}-${entrega.estado}`} entregaId={entrega.id} estudiante />}
          <FormularioEntregaDynamic key={`${entrega?.id ?? tarea.id}-${entrega?.estado ?? "nueva"}`} tareaId={tarea.id} modalidad={tarea.modalidad} entregaExistente={entrega} alEntregar={() => {}} />
          {entrega && entrega.estado !== "pendiente" && (
            <Link
              className="flex min-h-13 items-center justify-center rounded-xl bg-primario px-4 text-center font-bold text-white shadow-[0_3px_0_0_var(--color-primario-fuerte)] active:translate-y-[2px] active:shadow-none"
              href={`/estudiante/tarea/${tarea.id}/verificar`}
            >
              {t(entrega.estado === "verificada" ? "verInforme" : "irVerificar")}
            </Link>
          )}
          {entrega && <ComentarioDocenteDynamic entregaId={entrega.id} />}
        </aside>
      </div>
    </div>
  );
}