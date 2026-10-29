"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Textarea } from "@/components/ui";
import { ErrorApi, proponerTareaIA } from "@/lib/api-cliente";
import type { PropuestaTarea } from "@/types/contratos";

/**
 * "Crear con IA": el docente escribe qué quiere que practiquen y Muse propone la tarea completa.
 * La propuesta llena el formulario; el docente la revisa y la edita antes de guardarla.
 */
export function AsistenteTarea({
  claseId,
  alProponer,
}: {
  claseId: string;
  alProponer: (p: PropuestaTarea) => void;
}) {
  const t = useTranslations("tareas.ia");
  const [abierto, setAbierto] = useState(false);
  const [tema, setTema] = useState("");
  const [detalles, setDetalles] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propuesta, setPropuesta] = useState<PropuestaTarea | null>(null);

  async function proponer() {
    if (tema.trim().length < 3) {
      setError(t("errores.tema"));
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const p = await proponerTareaIA({
        clase_id: claseId,
        tema: tema.trim(),
        detalles: detalles.trim() || undefined,
      });
      setPropuesta(p);
      alProponer(p);
    } catch (e) {
      const codigo = e instanceof ErrorApi ? e.codigo : "";
      setError(
        codigo === "limite_diario_ia_docente"
          ? t("errores.limite")
          : t("errores.general"),
      );
    } finally {
      setCargando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fondo-ia flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 font-titulo font-extrabold text-white shadow-[0_3px_0_0_var(--sombra-fuerte)] active:translate-y-[2px] active:shadow-none"
      >
        <span aria-hidden>✦</span> {t("abrir")}
      </button>
    );
  }

  return (
    <section
      aria-labelledby="titulo-asistente-tarea"
      className="rounded-2xl border-2 border-primario bg-primario-claro/40 p-4"
    >
      <h3
        id="titulo-asistente-tarea"
        className="flex items-center gap-2 font-titulo text-lg font-extrabold"
      >
        <span
          aria-hidden
          className="fondo-ia grid size-7 place-items-center rounded-full text-sm text-white"
        >
          ✦
        </span>
        {t("titulo")}
      </h3>
      <p className="mt-1 text-sm text-tinta-suave">{t("ayuda")}</p>
      <div className="mt-3 grid gap-3">
        <Textarea
          etiqueta={t("tema")}
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder={t("temaEjemplo")}
          rows={2}
          maxLength={500}
        />
        <Textarea
          etiqueta={t("detalles")}
          value={detalles}
          onChange={(e) => setDetalles(e.target.value)}
          placeholder={t("detallesEjemplo")}
          rows={2}
          maxLength={1500}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-peligro">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variante="secundario"
            tamano="sm"
            onClick={() => setAbierto(false)}
            disabled={cargando}
          >
            {t("cerrar")}
          </Button>
          <Button
            type="button"
            tamano="sm"
            onClick={proponer}
            cargando={cargando}
          >
            {cargando ? t("pensando") : propuesta ? t("otra") : t("proponer")}
          </Button>
        </div>
        {propuesta && !cargando && (
          <p role="status" className="rounded-xl bg-superficie p-3 text-sm">
            <strong>
              {t("lista", { minutos: propuesta.minutos_estimados })}
            </strong>{" "}
            {propuesta.razon}
          </p>
        )}
      </div>
    </section>
  );
}
