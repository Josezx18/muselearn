"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { ErrorApi, crearTarea, proponerTareaIA, sugerirRepasoIA } from "@/lib/api-cliente";
import type { NivelAyuda, SugerenciaRepaso } from "@/types/contratos";

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
                <AsignarActividad
                  claseId={claseId}
                  concepto={a.concepto}
                  porQue={a.por_que}
                  actividad={a.actividad}
                />
              </li>
            ))}
          </ol>
          <p className="text-xs text-tinta-suave">{t("aviso")}</p>
        </div>
      )}
    </section>
  );
}

/** Fecha local "YYYY-MM-DDTHH:mm" para un input datetime-local: dentro de dos días, a las 23:59. */
function fechaPorDefecto() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(23, 59, 0, 0);
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/**
 * Convierte una actividad sugerida en una tarea de práctica para los estudiantes: Muse reescribe la
 * actividad (pensada para el docente) como instrucciones para el estudiante y se crea la tarea con la
 * fecha elegida. Si la IA no responde, se usa el texto de la actividad. El docente puede editarla después.
 */
function AsignarActividad({
  claseId,
  concepto,
  porQue,
  actividad,
}: {
  claseId: string;
  concepto: string;
  porQue: string;
  actividad: string;
}) {
  const t = useTranslations("docente.repaso.asignar");
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(fechaPorDefecto);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tareaId, setTareaId] = useState<string | null>(null);

  async function asignar() {
    if (!fecha || new Date(fecha) <= new Date()) {
      setError(t("errorFecha"));
      return;
    }
    setCargando(true);
    setError(null);
    try {
      let contenido = {
        titulo: t("tituloTarea", { concepto }).slice(0, 200),
        instrucciones: actividad,
        competencias: [concepto],
        nivel_ayuda: "pistas" as NivelAyuda,
      };
      try {
        const p = await proponerTareaIA({
          clase_id: claseId,
          tema: t("temaIA", { concepto }).slice(0, 500),
          detalles: t("detallesIA", { porQue, actividad }).slice(0, 1500),
        });
        contenido = { titulo: p.titulo, instrucciones: p.instrucciones, competencias: p.competencias, nivel_ayuda: p.nivel_ayuda };
      } catch {
        // Sin IA (límite diario o error): se asigna la actividad tal como la sugirió Muse.
      }
      const tarea = await crearTarea({
        clase_id: claseId,
        ...contenido,
        fecha_entrega: new Date(fecha).toISOString(),
        modalidad: "muselearn",
        enlace_externo: null,
        origen: "repaso_ia",
        adjuntos: [],
      });
      setTareaId(tarea.id);
      setAbierto(false);
    } catch {
      setError(t("error"));
    } finally {
      setCargando(false);
    }
  }

  if (tareaId) {
    return (
      <p role="status" className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-primario">
        ✓ {t("listo")}
        <Link href={`/docente/tareas/${tareaId}`} className="text-primario underline">
          {t("ver")}
        </Link>
      </p>
    );
  }

  if (!abierto) {
    return (
      <div className="mt-3 flex justify-end">
        <Button type="button" tamano="sm" onClick={() => setAbierto(true)}>
          {t("boton")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2 rounded-xl bg-fondo p-3">
      <Input
        etiqueta={t("fecha")}
        type="datetime-local"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />
      <p className="text-xs text-tinta-suave">{t("ayuda")}</p>
      {error && (
        <p role="alert" className="text-sm font-medium text-peligro">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variante="secundario" tamano="sm" onClick={() => setAbierto(false)} disabled={cargando}>
          {t("cancelar")}
        </Button>
        <Button type="button" tamano="sm" onClick={asignar} cargando={cargando}>
          {cargando ? t("creando") : t("confirmar")}
        </Button>
      </div>
    </div>
  );
}
