"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { listarClases, cargarComprension } from "@/lib/api-cliente";
import type { Clase, Tarea, Usuario, Entrega, InformeComprension, MapaComprension } from "@/types/contratos";
import { Button, Card } from "@/components/ui";
const colores = { 1: "bg-nivel-1", 2: "bg-nivel-2", 3: "bg-nivel-3", 4: "bg-nivel-4" };
type Datos = {
  mapa: MapaComprension;
  estudiantes: Usuario[];
  entregas: Entrega[];
  informes: { estudiante: string; titulo: string; informe: InformeComprension }[];
};
export function Comprension() {
  const t = useTranslations("docente"),
    comun = useTranslations("informes");
  const [clases, setClases] = useState<Clase[]>([]),
    [clase, setClase] = useState("");
  const [tareas, setTareas] = useState<Tarea[]>([]),
    [tarea, setTarea] = useState("");
  const [datos, setDatos] = useState<Datos | null>(null),
    [seleccion, setSeleccion] = useState("");
  const [error, setError] = useState(false),
    [intento, setIntento] = useState(0);
  useEffect(() => {
    let activo = true;
    listarClases()
      .then((cs) => {
        if (activo) {
          setClases(cs);
          setClase(cs[0]?.id ?? "");
        }
      })
      .catch(() => {
        if (activo) setError(true);
      });
    return () => {
      activo = false;
    };
  }, [intento]);
  useEffect(() => {
    if (!clase) return;
    let activo = true;
    async function cargar() {
      const resultado = await cargarComprension(clase, tarea || undefined);
      if (activo) {
        setTareas(resultado.tareas);
        setDatos(resultado);
      }
    }
    cargar().catch(() => {
      if (activo) setError(true);
    });
    return () => {
      activo = false;
    };
  }, [clase, tarea, intento]);
  const porcentaje = (ids: string[]) =>
    datos?.estudiantes.length
      ? Math.round((100 * datos.estudiantes.filter((e) => ids.includes(e.id)).length) / datos.estudiantes.length)
      : 0;
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-5">
      <h1 className="text-2xl font-bold">{t("titulo")}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor="comprension-clase" className="grid gap-1">
          {t("clase")}
          <select
            id="comprension-clase"
            className="w-full min-w-0 rounded border border-borde p-2"
            value={clase}
            onChange={(e) => {
              setDatos(null);
              setError(false);
              setClase(e.target.value);
              setTarea("");
              setSeleccion("");
            }}
          >
            <option value="">{t("sinDato")}</option>
            {clases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="comprension-tarea" className="grid gap-1">
          {t("tarea")}
          <select
            id="comprension-tarea"
            className="w-full min-w-0 rounded border border-borde p-2"
            value={tarea}
            onChange={(e) => {
              setDatos(null);
              setError(false);
              setTarea(e.target.value);
              setSeleccion("");
            }}
          >
            <option value="">{t("todas")}</option>
            {tareas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.titulo}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p role="alert">
          {comun("error")}{" "}
          <Button
            onClick={() => {
              setError(false);
              setDatos(null);
              setIntento((n) => n + 1);
            }}
          >
            {comun("reintentar")}
          </Button>
        </p>
      ) : !datos ? (
        <p role="status">{clase ? comun("cargando") : comun("vacio")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <p className="text-3xl font-bold">
                {porcentaje(datos.entregas.filter((e) => e.estado !== "pendiente").map((e) => e.estudiante_id))}%
              </p>
              {t("entrego")}
            </Card>
            <Card>
              <p className="text-3xl font-bold">
                {porcentaje(datos.informes.filter((f) => f.informe.nivel_global >= 3).map((f) => f.estudiante))}%
              </p>
              {t("comprendio")}
            </Card>
          </div>
          <p className="text-sm text-tinta-suave">{t("base")}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {([1, 2, 3, 4] as const).map((n) => (
              <span key={n} className={`rounded px-2 py-1 ${colores[n]}`}>
                {n} · {comun(`niveles.${n}`)}
              </span>
            ))}
            <span className="rounded bg-nivel-vacio px-2 py-1">{t("sinDato")}</span>
          </div>
          {!datos.mapa.conceptos.length && <p>{t("vacio")}</p>}
          <div
            role="region"
            aria-label={t("titulo")}
            tabIndex={0}
            className="min-w-0 max-w-full overflow-x-auto rounded border border-borde"
          >
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{t("titulo")}</caption>
              <thead>
                <tr>
                  <th className="p-3 text-left">{t("detalle")}</th>
                  {datos.mapa.conceptos.map((c) => (
                    <th className="min-w-36 p-3" key={c}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.estudiantes.map((u) => (
                  <tr key={u.id}>
                    <th className="p-3 text-left">
                      <button className="text-primario underline" onClick={() => setSeleccion(u.id)}>
                        {u.nombre}
                      </button>
                    </th>
                    {datos.mapa.conceptos.map((c) => {
                      const nivel = datos.mapa.celdas.find((x) => x.estudiante_id === u.id && x.concepto === c)?.nivel;
                      return (
                        <td className="border border-borde p-1" key={c}>
                          <button
                            onClick={() => setSeleccion(u.id)}
                            aria-label={`${u.nombre}, ${c}: ${nivel ? comun(`niveles.${nivel}`) : t("sinDato")}`}
                            className={`w-full rounded p-3 ${nivel ? colores[nivel] : "bg-nivel-vacio"}`}
                          >
                            {nivel ?? t("sinDato")}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card>
            <h2 className="text-lg font-semibold">{t("reforzar")}</h2>
            <ul className="list-inside list-disc">
              {datos.mapa.conceptos_a_reforzar.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="text-lg font-semibold">{t("detalle")}</h2>
            {!seleccion ? (
              <p>{t("seleccionar")}</p>
            ) : (
              <>
                <h3 className="font-semibold">{datos.estudiantes.find((u) => u.id === seleccion)?.nombre}</h3>
                {datos.informes.filter((f) => f.estudiante === seleccion).length ? (
                  datos.informes
                    .filter((f) => f.estudiante === seleccion)
                    .map((f) => (
                      <article className="mt-3" key={f.informe.entrega_id}>
                        <h4>
                          {f.titulo} · {comun(`niveles.${f.informe.nivel_global}`)}
                        </h4>
                        <p>{f.informe.resumen_docente}</p>
                      </article>
                    ))
                ) : (
                  <p>{t("sinInforme")}</p>
                )}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
