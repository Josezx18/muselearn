"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { obtenerInforme, type InformeConRuta } from "@/lib/api-cliente";
import { Link } from "@/i18n/navigation";
import { Card, Button } from "@/components/ui";
import { z } from "zod";
type Datos = z.infer<typeof InformeConRuta>;
export function Informe({ id }: { id: string }) {
  const t = useTranslations("informes");
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);
  const [hechos, setHechos] = useState<number[]>([]);
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
      <Link className="text-primario underline" href="/estudiante/hoy">
        {t("volver")}
      </Link>
      <h1 className="text-2xl font-bold">{t("titulo")}</h1>
      <Card>
        <h2 className="font-semibold">
          {t("nivel")}: {t(`niveles.${informe.nivel_global}`)}
        </h2>
        <p className="mt-3">{informe.resumen_estudiante}</p>
      </Card>
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">{t("conceptos")}</h2>
        {informe.por_concepto.map((c) => (
          <Card key={c.concepto}>
            <h3 className="font-semibold break-words">
              {c.concepto} · {t(`niveles.${c.nivel}`)}
            </h3>
            {c.competencia && <p className="text-tinta-suave">{c.competencia}</p>}
            <p className="mt-2 break-words">
              {t("evidencia")}: <q>{c.evidencia.replace(/^["“”«»\s]+|["“”«»\s]+$/g, "")}</q>
            </p>
          </Card>
        ))}
      </section>
      {(["fortalezas", "debilidades"] as const).map((k) => (
        <Card key={k}>
          <h2 className="font-semibold">{t(k)}</h2>
          <ul className="list-inside list-disc">
            {informe[k].map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Card>
      ))}
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">{t("ruta")}</h2>
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
        <Link className="inline-flex min-h-11 items-center font-semibold text-primario underline" href="/estudiante/semana">
          {t("semana")}
        </Link>
      </section>
    </div>
  );
}
