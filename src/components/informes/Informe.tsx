"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { agregarRutaASemana, obtenerInforme, type InformeConRuta } from "@/lib/api-cliente";
import type { PracticaAgregada } from "@/types/contratos";
import { Link } from "@/i18n/navigation";
import { Card, Button, NivelDominio } from "@/components/ui";
import { z } from "zod";
type Datos = z.infer<typeof InformeConRuta>;
export function Informe({ id }: { id: string }) {
  const t = useTranslations("informes");
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);
  const [hechos, setHechos] = useState<number[]>([]);
  const [agregando, setAgregando] = useState(false);
  const [agregada, setAgregada] = useState<PracticaAgregada | null>(null);
  const [errorAgregar, setErrorAgregar] = useState(false);
  useEffect(() => {
    let activo = true;
    obtenerInforme(id)
      .then((d) => {
        if (activo) {
          setDatos(d);
          try {
            const guardado: unknown = JSON.parse(localStorage.getItem(`ruta:${id}`) ?? "[]");
            setHechos(Array.isArray(guardado) ? guardado.filter((n): n is number => typeof n === "number") : []);
          } catch {
            setHechos([]);
          }
        }
      })
      .catch(() => {
        if (activo) setError(true);
      });
    return () => {
      activo = false;
    };
  }, [id, intento]);
  function marcar(i: number) {
    const siguiente = hechos.includes(i) ? hechos.filter((n) => n !== i) : [...hechos, i];
    setHechos(siguiente);
    try {
      localStorage.setItem(`ruta:${id}`, JSON.stringify(siguiente));
    } catch {
      /* El navegador puede bloquear el almacenamiento local. */
    }
  }
  async function agregar() {
    if (agregando) return;
    setAgregando(true);
    setErrorAgregar(false);
    try {
      setAgregada(await agregarRutaASemana(id));
    } catch {
      setErrorAgregar(true);
    } finally {
      setAgregando(false);
    }
  }
  if (error)
    return (
      <div role="alert">
        {t("error")}{" "}
        <Button
          onClick={() => {
            setError(false);
            setIntento((n) => n + 1);
          }}
        >
          {t("reintentar")}
        </Button>
      </div>
    );
  if (!datos) return <p role="status">{t("cargando")}</p>;
  const { informe, ruta } = datos;
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-3xl gap-5">
      <Link
        className="inline-flex min-h-9 items-center font-bold text-primario-fuerte underline-offset-4 hover:underline"
        href="/estudiante/hoy"
      >
        {t("volver")}
      </Link>
      <h1 className="text-4xl font-extrabold">{t("titulo")}</h1>
      <section className="rounded-2xl border-2 border-tinta bg-superficie p-5 shadow-[4px_4px_0_0_var(--color-tinta)]">
        <h2 className="text-sm font-bold text-tinta-suave">{t("nivel")}</h2>
        <p className="font-titulo text-3xl font-extrabold">{t(`niveles.${informe.nivel_global}`)}</p>
        <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden>
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={`h-3 rounded-full ${n <= informe.nivel_global ? ["bg-nivel-1", "bg-nivel-2", "bg-nivel-3", "bg-nivel-4"][informe.nivel_global - 1] : "bg-nivel-vacio"}`}
            />
          ))}
        </div>
        <p className="mt-4 text-lg">{informe.resumen_estudiante}</p>
      </section>
      <section className="grid gap-3">
        <h2 className="text-2xl font-extrabold">{t("conceptos")}</h2>
        {informe.por_concepto.map((c) => (
          <Card key={c.concepto}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="break-words text-lg font-bold">{c.concepto}</h3>
              <NivelDominio nivel={c.nivel} />
            </div>
            {c.competencia && <p className="text-sm text-tinta-suave">{c.competencia}</p>}
            <p className="mt-3 break-words">
              <span className="sr-only">{t("evidencia")}: </span>
              <q className="resaltado font-mano text-2xl leading-snug">{c.evidencia.replace(/^["“”«»\s]+|["“”«»\s]+$/g, "")}</q>
            </p>
          </Card>
        ))}
      </section>
      {(["fortalezas", "debilidades"] as const).map((k) => (
        <Card key={k}>
          <h2 className="text-lg font-bold">{t(k)}</h2>
          <ul className="list-inside list-disc">
            {informe[k].map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Card>
      ))}
      <section className="grid gap-3">
        <h2 className="text-2xl font-extrabold">{t("ruta")}</h2>
        {ruta ? (
          <ol className="grid gap-3">
            {ruta.pasos.map((p, i) => (
              <li key={i}>
                <Card>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={hechos.includes(i)} onChange={() => marcar(i)} className="mt-1 size-5 shrink-0" />
                    <span className="min-w-0 break-words">
                      <strong>{p.titulo}</strong> · {t("minutos", { n: p.minutos })}
                      <span className="block text-tinta-suave">{p.concepto}</span>
                      <span className="mt-2 block">{p.descripcion}</span>
                    </span>
                  </label>
                </Card>
              </li>
            ))}
          </ol>
        ) : (
          <p>{t("sinRuta")}</p>
        )}
        <p className="text-sm text-tinta-suave">{t("pendientePlan")}</p>
        {ruta && !agregada && (
          <div className="grid gap-2">
            <Button tamano="lg" className="w-full sm:w-auto sm:justify-self-start" onClick={() => void agregar()} cargando={agregando}>
              {t("agregar")}
            </Button>
            <p className="text-sm text-tinta-suave">{t("agregarAyuda")}</p>
          </div>
        )}
        {errorAgregar && (
          <p role="alert" className="font-bold text-peligro">
            {t("errorAgregar")}
          </p>
        )}
        {agregada && (
          <div role="status" className="rounded-2xl border-2 border-primario bg-superficie p-4">
            <p className="font-bold">{agregada.ya_estaba ? t("yaEstaba") : t("agregado", { n: agregada.bloques.length })}</p>
            {agregada.sin_ubicar > 0 && <p className="mt-1 text-tinta-suave">{t("sinUbicar", { n: agregada.sin_ubicar })}</p>}
          </div>
        )}
        <Link className="inline-flex min-h-11 items-center font-semibold text-primario underline" href="/estudiante/semana">
          {t("semana")}
        </Link>
      </section>
    </div>
  );
}
