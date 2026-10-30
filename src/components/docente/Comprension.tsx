"use client";
import { BotonExportar } from "@/lib/exportar/BotonExportar";
import { useEffect, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { listarClases, cargarComprension } from "@/lib/api-cliente";
import type { Clase, Tarea, Usuario, Entrega, MapaComprension, NivelDominio } from "@/types/contratos";
import { Button, Card, NivelDominio as Nivel, Tabs } from "@/components/ui";
import { fichaEstudiante, necesitanApoyo, resumenPorConcepto, resumenPorTarea, type InformeDeEstudiante } from "@/lib/comprension-resumen";
import { DialogoEntrega } from "@/components/gestion/DialogoEntrega";
import { RepasoIA } from "./RepasoIA";

const colores = { 1: "bg-nivel-1 text-white", 2: "bg-nivel-2 text-tinta", 3: "bg-nivel-3 text-white", 4: "bg-nivel-4 text-white" };
const NIVELES = [1, 2, 3, 4] as const;
type Datos = {
  mapa: MapaComprension;
  estudiantes: Usuario[];
  entregas: Entrega[];
  tareas: Tarea[];
  informes: InformeDeEstudiante[];
};
type Vista = "general" | "estudiante" | "mapa";

/**
 * Panel de comprensión del docente. Tres vistas: General (cómo va la clase por concepto y por tarea, y quién
 * necesita apoyo), Por estudiante (su ficha en todas las tareas) y Mapa (estudiante × concepto).
 */
export function Comprension() {
  const t = useTranslations("docente"),
    comun = useTranslations("informes");
  const [clases, setClases] = useState<Clase[]>([]),
    [clase, setClase] = useState("");
  const [tareas, setTareas] = useState<Tarea[]>([]),
    [tarea, setTarea] = useState("");
  const [datos, setDatos] = useState<Datos | null>(null),
    [seleccion, setSeleccion] = useState("");
  const [vista, setVista] = useState<Vista>("general");
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

  const verEstudiante = (id: string) => {
    setSeleccion(id);
    setVista("estudiante");
  };

  const porcentaje = (ids: string[]) =>
    datos?.estudiantes.length ? Math.round((100 * datos.estudiantes.filter((e) => ids.includes(e.id)).length) / datos.estudiantes.length) : 0;
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-5">
      <h1 className="text-4xl font-extrabold">{t("titulo")}</h1>
      <BotonExportar claseId={clase} tipo="comprension" etiqueta={t("exportarComprension")} error={t("exportarError")} />
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
          {(() => {
            const entrego = porcentaje(datos.entregas.filter((e) => e.estado !== "pendiente").map((e) => e.estudiante_id));
            const comprendio = porcentaje(datos.informes.filter((f) => f.informe.nivel_global >= 3).map((f) => f.estudiante));
            return (
              <section className="rounded-2xl border-2 border-tinta bg-superficie p-5 shadow-[4px_4px_0_0_var(--sombra-fuerte)]">
                <dl className="grid gap-4">
                  <Barra etiqueta={t("entrego")} valor={entrego} clase="bg-tinta-suave" />
                  <Barra etiqueta={t("comprendio")} valor={comprendio} clase="bg-primario" />
                </dl>
                <p className="mt-3 text-sm text-tinta-suave">{t("base")}</p>
              </section>
            );
          })()}
          <Tabs
            activa={vista}
            alCambiar={(v) => setVista(v as Vista)}
            pestanas={[
              {
                id: "general",
                etiqueta: t("vistas.general"),
                contenido: <VistaGeneral datos={datos} tareaFiltro={tarea} claseId={clase} alVerEstudiante={verEstudiante} />,
              },
              {
                id: "estudiante",
                etiqueta: t("vistas.estudiante"),
                contenido: <VistaEstudiante datos={datos} seleccion={seleccion} alElegir={setSeleccion} />,
              },
              { id: "mapa", etiqueta: t("vistas.mapa"), contenido: <VistaMapa datos={datos} alVerEstudiante={verEstudiante} /> },
            ]}
          />
        </>
      )}
    </div>
  );
}

function Barra({ etiqueta, valor, clase }: { etiqueta: string; valor: number; clase: string }) {
  return (
    <div className="grid grid-cols-2 items-baseline gap-3">
      <dt className="font-bold">{etiqueta}</dt>
      <dd className="text-right font-titulo text-3xl font-extrabold tabular-nums">{valor}%</dd>
      <div className="col-span-2 h-4 overflow-hidden rounded-full bg-nivel-vacio" aria-hidden>
        <div className={`h-full rounded-full ${clase}`} style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

function Leyenda() {
  const t = useTranslations("docente"),
    comun = useTranslations("informes");
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {NIVELES.map((n) => (
        <span key={n} className={`rounded-lg px-2.5 py-1 font-bold ${colores[n]}`}>
          {n} · {comun(`niveles.${n}`)}
        </span>
      ))}
      <span className="rounded-lg bg-nivel-vacio px-2.5 py-1 font-bold text-tinta-suave">{t("sinDato")}</span>
    </div>
  );
}

// ---------------- General ----------------
function VistaGeneral({
  datos,
  tareaFiltro,
  claseId,
  alVerEstudiante,
}: {
  datos: Datos;
  tareaFiltro: string;
  claseId: string;
  alVerEstudiante: (id: string) => void;
}) {
  const t = useTranslations("docente"),
    comun = useTranslations("informes");
  const formato = useFormatter();
  const elegidas = useMemo(() => datos.tareas.filter((x) => !tareaFiltro || x.id === tareaFiltro), [datos.tareas, tareaFiltro]);
  const conceptos = useMemo(() => resumenPorConcepto(datos.mapa), [datos.mapa]);
  const tareas = useMemo(() => resumenPorTarea(elegidas, datos.estudiantes, datos.entregas, datos.informes), [elegidas, datos]);
  const apoyo = useMemo(() => necesitanApoyo(datos.estudiantes, datos.mapa, elegidas, datos.entregas), [elegidas, datos]);

  return (
    <div className="grid gap-5">
      <Card>
        <h2 className="text-lg font-extrabold">{t("general.conceptos")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("general.conceptosAyuda")}</p>
        {!conceptos.length ? (
          <p className="mt-3">{t("vacio")}</p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {conceptos.map((c) => {
              const total = NIVELES.reduce((s, n) => s + c.niveles[n], 0) + c.sinDato || 1;
              return (
                <li key={c.concepto}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-bold">{c.concepto}</span>
                    <span className="text-sm text-tinta-suave">{c.promedio !== null ? t("general.promedio", { n: c.promedio }) : t("sinDato")}</span>
                  </div>
                  <div
                    className="mt-1.5 flex h-6 overflow-hidden rounded-lg bg-nivel-vacio"
                    role="img"
                    aria-label={NIVELES.map((n) => `${comun(`niveles.${n}`)}: ${c.niveles[n]}`)
                      .concat(`${t("sinDato")}: ${c.sinDato}`)
                      .join(", ")}
                  >
                    {NIVELES.map((n) =>
                      c.niveles[n] ? (
                        <span
                          key={n}
                          className={`grid place-items-center text-xs font-extrabold ${colores[n]}`}
                          style={{ width: `${(100 * c.niveles[n]) / total}%` }}
                        >
                          {c.niveles[n]}
                        </span>
                      ) : null,
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4">
          <Leyenda />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-extrabold">{t("general.tareas")}</h2>
        {!tareas.length ? (
          <p className="mt-2 text-tinta-suave">{t("general.sinTareas")}</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {tareas.map((r) => (
              <li key={r.tarea.id} className="grid gap-2 rounded-xl border-2 border-borde p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate font-bold">{r.tarea.titulo}</p>
                  <p className="text-xs text-tinta-suave">
                    {formato.dateTime(new Date(r.tarea.fecha_entrega), { dateStyle: "medium" })}
                    {r.vencida ? ` · ${t("general.vencida")}` : ""}
                  </p>
                </div>
                <dl className="flex flex-wrap gap-2 text-sm">
                  <Dato etiqueta={t("general.entregaron")} valor={`${r.entregaron}/${r.total}`} />
                  <Dato etiqueta={t("general.verificaron")} valor={`${r.verificaron}`} />
                  <Dato etiqueta={t("general.comprendieron")} valor={r.comprendieron === null ? "—" : `${r.comprendieron}%`} />
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-extrabold">{t("general.apoyo")}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{t("general.apoyoAyuda")}</p>
        {!apoyo.length ? (
          <p className="mt-3 font-bold text-primario-fuerte">{t("general.nadie")}</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {apoyo.map((a) => (
              <li key={a.estudiante.id} className="rounded-xl bg-fondo p-3">
                <button
                  type="button"
                  onClick={() => alVerEstudiante(a.estudiante.id)}
                  className="font-bold text-primario-fuerte underline underline-offset-2"
                >
                  {a.estudiante.nombre}
                </button>
                <p className="text-sm text-tinta-suave">
                  {[
                    a.conceptosBajos.length ? t("general.conceptosBajos", { lista: a.conceptosBajos.join(", ") }) : null,
                    a.sinEntregar ? t("general.sinEntregar", { n: a.sinEntregar }) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {datos.mapa.conceptos_a_reforzar.length > 0 && (
        <Card>
          <h2 className="text-lg font-extrabold">{t("reforzar")}</h2>
          <ul className="mt-2 list-inside list-disc">
            {datos.mapa.conceptos_a_reforzar.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Card>
      )}
      <RepasoIA key={`${claseId}-${tareaFiltro}`} claseId={claseId} tareaId={tareaFiltro || undefined} hayInformes={datos.informes.length > 0} />
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg bg-fondo px-2.5 py-1">
      <dt className="inline text-xs text-tinta-suave">{etiqueta} </dt>
      <dd className="inline font-bold tabular-nums">{valor}</dd>
    </div>
  );
}

// ---------------- Por estudiante ----------------
function VistaEstudiante({ datos, seleccion, alElegir }: { datos: Datos; seleccion: string; alElegir: (id: string) => void }) {
  const t = useTranslations("docente"),
    tt = useTranslations("tareas");
  const formato = useFormatter();
  const [abierta, setAbierta] = useState<string | null>(null);
  const estudiante = datos.estudiantes.find((u) => u.id === seleccion);
  const ficha = useMemo(
    () => (seleccion ? fichaEstudiante(seleccion, datos.mapa, datos.tareas, datos.entregas, datos.informes) : null),
    [seleccion, datos],
  );

  return (
    <div className="grid gap-4">
      <label htmlFor="comprension-estudiante" className="grid gap-1">
        {t("estudiante.elegir")}
        <select
          id="comprension-estudiante"
          className="w-full min-w-0 rounded border border-borde p-2"
          value={seleccion}
          onChange={(e) => alElegir(e.target.value)}
        >
          <option value="">{t("seleccionar")}</option>
          {datos.estudiantes.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </select>
      </label>

      {estudiante && ficha && (
        <Card>
          <h2 className="text-2xl font-extrabold">{t("detalle")}</h2>
          <p className="mt-1 text-lg font-bold">{estudiante.nombre}</p>
          <dl className="mt-3 flex flex-wrap gap-2 text-sm">
            <Dato etiqueta={t("estudiante.entregadas")} valor={`${ficha.entregadas}/${ficha.tareas.length}`} />
            <Dato etiqueta={t("estudiante.promedio")} valor={ficha.promedio === null ? "—" : `${ficha.promedio}`} />
          </dl>

          <h3 className="mt-5 font-bold">{t("estudiante.conceptos")}</h3>
          {!ficha.conceptos.length ? (
            <p className="mt-1 text-tinta-suave">{t("vacio")}</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {ficha.conceptos.map((c) => (
                <li key={c.concepto} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-fondo p-2">
                  <span className="font-bold">{c.concepto}</span>
                  {c.nivel ? <Nivel nivel={c.nivel as NivelDominio} /> : <span className="text-sm text-tinta-suave">{t("sinDato")}</span>}
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-5 font-bold">{t("estudiante.tareas")}</h3>
          <ul className="mt-2 grid gap-2">
            {ficha.tareas.map(({ tarea, entrega, informe }) => (
              <li key={tarea.id} className="rounded-xl border-2 border-borde p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">{tarea.titulo}</p>
                    <p className="text-xs text-tinta-suave">
                      {formato.dateTime(new Date(tarea.fecha_entrega), { dateStyle: "medium" })} · {tt(`estados.${entrega?.estado ?? "pendiente"}`)}
                    </p>
                  </div>
                  {informe && <Nivel nivel={informe.nivel_global} />}
                </div>
                {informe && <p className="mt-2 text-sm">{informe.resumen_docente}</p>}
                {!informe && entrega && entrega.estado !== "pendiente" && <p className="mt-2 text-sm text-tinta-suave">{t("sinInforme")}</p>}
                {entrega && entrega.estado !== "pendiente" && (
                  <button
                    type="button"
                    onClick={() => setAbierta(entrega.id)}
                    className="mt-2 text-sm font-bold text-primario-fuerte underline-offset-4 hover:underline"
                  >
                    {t("estudiante.verEntrega")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <DialogoEntrega entregaId={abierta} nombre={estudiante?.nombre ?? ""} alCerrar={() => setAbierta(null)} />
    </div>
  );
}

// ---------------- Mapa ----------------
function VistaMapa({ datos, alVerEstudiante }: { datos: Datos; alVerEstudiante: (id: string) => void }) {
  const t = useTranslations("docente"),
    comun = useTranslations("informes");
  return (
    <div className="grid gap-4">
      <Leyenda />
      {!datos.mapa.conceptos.length && <p>{t("vacio")}</p>}
      <div role="region" aria-label={t("titulo")} tabIndex={0} className="min-w-0 max-w-full overflow-x-auto rounded border border-borde">
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
                  <button className="text-primario underline" onClick={() => alVerEstudiante(u.id)}>
                    {u.nombre}
                  </button>
                </th>
                {datos.mapa.conceptos.map((c) => {
                  const nivel = datos.mapa.celdas.find((x) => x.estudiante_id === u.id && x.concepto === c)?.nivel;
                  return (
                    <td className="border border-borde p-1" key={c}>
                      <button
                        onClick={() => alVerEstudiante(u.id)}
                        aria-label={`${u.nombre}, ${c}: ${nivel ? `${nivel} · ${comun(`niveles.${nivel}`)}` : t("sinDato")}`}
                        className={`w-full rounded-lg p-3 font-titulo font-extrabold ${nivel ? colores[nivel] : "bg-nivel-vacio text-tinta-suave"}`}
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
    </div>
  );
}
