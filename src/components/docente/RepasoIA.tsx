"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { ErrorApi, sugerirRepasoIA } from "@/lib/api-cliente";
import type { SugerenciaRepaso } from "@/types/contratos";

/**
 * "Sugerir repaso": Muse lee el mapa de comprensión de la clase (solo datos agregados, sin nombres)
 * y propone actividades concretas para la próxima clase. Quien lo usa le pone key por clase y tarea,
 * para que la sugerencia se reinicie al cambiarlas.
 */
export function RepasoIA({
  claseId,
  tareaId,
  hayInformes,
}: {
  claseId: string;
  tareaId?: string;
  hayInformes: boolean;
}) {
  const t = useTranslations("docente.repaso");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sugerencia, setSugerencia] = useState<SugerenciaRepaso | null>(null);

  async function sugerir() {
    setCargando(true);
    setError(null);
    try {
      setSugerencia(await sugerirRepasoIA(claseId, tareaId));
    } catch (e) {
      const codigo = e instanceof ErrorApi ? e.codigo : "";
      setError(
        t(
          codigo === "limite_diario_ia_docente"
            ? "errores.limite"
            : codigo === "sin_informes"
              ? "errores.sinInformes"
              : "errores.general",
        ),
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <section
      aria-labelledby="titulo-repaso"
      className="rounded-2xl border-2 border-primario bg-superficie p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="titulo-repaso"
            className="flex items-center gap-2 font-titulo text-xl font-extrabold"
          >
            <span
              aria-hidden
              className="fondo-ia grid size-8 place-items-center rounded-full text-white"
            >
              ✦
            </span>
            {t("titulo")}
          </h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {hayInformes ? t("ayuda") : t("sinInformes")}
          </p>
        </div>
        <Button
          type="button"
          onClick={sugerir}
          cargando={cargando}
          disabled={!hayInformes}
        >
          {cargando ? t("pensando") : sugerencia ? t("otra") : t("sugerir")}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-peligro">
          {error}
        </p>
      )}

      {sugerencia && !cargando && (
        <div role="status" className="mt-4 grid gap-3">
          <p className="rounded-xl bg-primario-claro/50 p-3">
            {sugerencia.resumen}
          </p>
          <ol className="grid gap-3">
            {sugerencia.actividades.map((a, i) => (
              <li
                key={`${a.concepto}-${i}`}
                className="rounded-xl border-2 border-borde p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-titulo text-lg font-extrabold">
                    {i + 1}. {a.concepto}
                  </h3>
                  <span className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-resaltador-claro px-2.5 py-1">
                      {t("minutos", { n: a.minutos })}
                    </span>
                    <span className="rounded-full bg-fondo px-2.5 py-1">
                      {t(`agrupacion.${a.agrupacion}`)}
                    </span>
                  </span>
                </div>
                <p className="mt-2 text-sm text-tinta-suave">
                  <strong>{t("porQue")}</strong> {a.por_que}
                </p>
                <p className="mt-2 whitespace-pre-wrap">{a.actividad}</p>
              </li>
            ))}
          </ol>
          <p className="text-xs text-tinta-suave">{t("aviso")}</p>
        </div>
      )}
    </section>
  );
}
