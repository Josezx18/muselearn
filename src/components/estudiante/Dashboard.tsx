"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";
import { Link } from "@/i18n/navigation";
import { actualizarBloque, listarAnalisis, listarClases, listarTareas, obtenerPlan, recalcularPlan } from "@/lib/api-cliente";
import { Button, Card, Skeleton } from "@/components/ui";
import type { Usuario, PlanSemanal, Tarea, AnalisisTarea, Clase, BloquePlan, EstadoBloque } from "@/types/contratos";
import { TarjetaTarea } from "./TarjetaTarea";
import { enlaceDeBloque } from "@/lib/practica";
import { Pagi } from "@/components/comun/Pagi";
export function Dashboard({ vista, usuario }: { vista: "hoy" | "semana"; usuario: Usuario }) {
  const t = useTranslations("estudiante");
  const locale = useLocale();
  const [semana, setSemana] = useState(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [plan, setPlan] = useState<PlanSemanal | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [analisis, setAnalisis] = useState<AnalisisTarea[]>([]);
  const [clases, setClases] = useState<Clase[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [cerrados, setCerrados] = useState<string[]>([]);
  const refHoy = useRef<HTMLElement | null>(null);
  // En Semana (celular), mostrar primero el día de hoy.
  useEffect(() => {
    if (vista === "semana" && !cargando) refHoy.current?.scrollIntoView({ block: "nearest", inline: "start" });
  }, [vista, cargando]);
  useEffect(() => {
    let activo = true;
    Promise.all([obtenerPlan(semana), listarTareas(), listarAnalisis(usuario.id), listarClases()])
      .then(([p, ts, a, cs]) => {
        if (activo) {
          setPlan(p);
          setTareas(ts);
          setAnalisis(a);
          setClases(cs);
          setError(false);
        }
      })
      .catch(() => {
        if (activo) setError(true);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [semana, usuario.id, intento]);
  async function reorganizar() {
    setOcupado(true);
    setError(false);
    try {
      setPlan(await recalcularPlan(semana));
      setCerrados([]);
    } catch {
      setError(true);
    } finally {
      setOcupado(false);
    }
  }
  async function cambiar(b: BloquePlan, estado: EstadoBloque) {
    setOcupado(true);
    setError(false);
    try {
      const nuevo = await actualizarBloque(b.id, estado);
      setPlan((p) => p && { ...p, bloques: p.bloques.map((x) => (x.id === b.id ? nuevo : x)) });
    } catch {
      setError(true);
    } finally {
      setOcupado(false);
    }
  }
  function mover(n: number) {
    setCargando(true);
    setSemana(format(addDays(new Date(`${semana}T12:00:00`), n * 7), "yyyy-MM-dd"));
  }
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const bloques = [...(plan?.bloques ?? [])].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const proximo = bloques.find((b) => b.estado === "planificado" && new Date(b.fin) > hoy);
  const delDia = (d: Date) => bloques.filter((b) => isSameDay(new Date(b.inicio), d));
  const proximasEntregas = [...tareas]
    .filter((ta) => new Date(ta.fecha_entrega) >= inicioHoy)
    .sort((a, b) => a.fecha_entrega.localeCompare(b.fecha_entrega))
    .slice(0, 6);
  const hora = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const minutos = (b: BloquePlan) => Math.round((Date.parse(b.fin) - Date.parse(b.inicio)) / 60000);
  const materiaDe = (tareaId: string) => clases.find((c) => c.id === tareas.find((x) => x.id === tareaId)?.clase_id)?.materia;
  const tarjeta = (ta: Tarea) => (
    <TarjetaTarea
      key={ta.id}
      tarea={ta}
      analisis={analisis.find((a) => a.tarea_id === ta.id)}
      materia={clases.find((c) => c.id === ta.clase_id)?.materia}
    />
  );

  /** Una fila del horario: hora a la izquierda, bloque a la derecha (como el horario de clases). */
  function fila(b: BloquePlan) {
    const hecho = b.estado === "hecho";
    const omitido = b.estado === "omitido";
    return (
      <li key={b.id} className="grid grid-cols-[3.75rem_1fr] gap-3">
        <time dateTime={b.inicio} className="pt-3 text-right font-titulo text-sm font-bold text-tinta-suave tabular-nums">
          {hora(b.inicio)}
        </time>
        <div className={`min-w-0 rounded-2xl border-2 bg-superficie p-3 ${hecho ? "border-nivel-3/40" : "border-borde"}`}>
          <Link
            className={`block font-bold leading-snug underline-offset-4 hover:underline ${hecho || omitido ? "text-tinta-suave line-through decoration-2" : ""}`}
            href={enlaceDeBloque(b)}
          >
            {b.titulo}
          </Link>
          <p className="mt-0.5 text-sm text-tinta-suave">
            {materiaDe(b.tarea_id) ? `${materiaDe(b.tarea_id)}, ` : ""}
            {t("minutos", { n: minutos(b) })}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                className="size-5 accent-primario"
                aria-label={`${t("hecho")}: ${b.titulo}`}
                checked={hecho}
                disabled={ocupado}
                onChange={(e) => void cambiar(b, e.target.checked ? "hecho" : "planificado")}
              />
              {t("hecho")}
            </label>
            {!hecho && (
              <Button
                variante="fantasma"
                tamano="sm"
                aria-label={`${t("omitir")}: ${b.titulo}`}
                disabled={ocupado || omitido}
                onClick={() => void cambiar(b, "omitido")}
              >
                {omitido ? t("omitido") : t("omitir")}
              </Button>
            )}
          </div>
        </div>
      </li>
    );
  }

  const avisos = plan?.avisos.filter((a) => !cerrados.includes(a)) ?? [];

  return (
    <div className="min-w-0 space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-3">
          <Pagi expresion="hola" flota className="size-16 sm:size-20" />
          <div>
            <p className="font-bold text-primario-fuerte">{t("saludo", { nombre: usuario.nombre.split(" ")[0] })}</p>
            <h1 className="text-4xl font-extrabold">{t(vista)}</h1>
            <p className="mt-1 text-tinta-suave">{t("subtitulo")}</p>
          </div>
        </div>
        <Button variante="secundario" cargando={ocupado} disabled={cargando || !plan} onClick={() => void reorganizar()}>
          {t("reorganizar")}
        </Button>
      </header>

      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-peligro bg-peligro-claro p-4">
          <p className="font-bold text-peligro">{t("error")}</p>
          <Button
            variante="secundario"
            tamano="sm"
            onClick={() => {
              setCargando(true);
              setIntento((i) => i + 1);
            }}
          >
            {t("reintentar")}
          </Button>
        </div>
      )}

      {cargando ? (
        <div role="status" className="space-y-3">
          <p className="sr-only">{t("carga")}</p>
          <Skeleton className="h-40" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <>
          {avisos.length > 0 && (
            <ul aria-live="polite" className="space-y-2">
              {avisos.map((a, i) => (
                <li
                  key={`${i}-${a}`}
                  className="flex items-start gap-3 rounded-xl border-l-[6px] border-resaltador bg-resaltador-claro p-3 pl-4"
                >
                  <p className="flex-1">{a}</p>
                  <button
                    type="button"
                    onClick={() => setCerrados((c) => [...c, a])}
                    aria-label={t("cerrar")}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-xl leading-none text-tinta-suave hover:bg-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!tareas.length && (
            <Card className="papel flex flex-col items-center gap-2 text-center text-lg">
              <Pagi expresion="lograste" className="size-24" />
              {t("vacio")}
            </Card>
          )}

          {vista === "hoy" ? (
            <>
              <section aria-labelledby="titulo-proximo">
                <h2 id="titulo-proximo" className="text-2xl font-extrabold">
                  {t("proximo")}
                </h2>
                {proximo ? (
                  <div className="mt-3 rounded-2xl border-2 border-tinta bg-superficie p-5 shadow-[4px_4px_0_0_var(--sombra-fuerte)]">
                    <p className="text-sm font-bold text-primario-fuerte">{materiaDe(proximo.tarea_id) ?? t("materia")}</p>
                    <p className="mt-1 font-titulo text-2xl font-extrabold leading-tight">
                      <span className="resaltado">{proximo.titulo}</span>
                    </p>
                    <p className="mt-2 text-tinta-suave tabular-nums">
                      {isSameDay(new Date(proximo.inicio), hoy)
                        ? ""
                        : `${new Date(proximo.inicio).toLocaleDateString(locale, { weekday: "long" })}, `}
                      {hora(proximo.inicio)} – {hora(proximo.fin)} ({t("minutos", { n: minutos(proximo) })})
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={enlaceDeBloque(proximo)}
                        className="inline-flex min-h-11 items-center rounded-xl bg-primario px-5 font-bold text-white shadow-[0_3px_0_0_var(--color-primario-fuerte)] active:translate-y-[2px] active:shadow-none"
                      >
                        {t("abrir")}
                      </Link>
                      <Button variante="secundario" disabled={ocupado} onClick={() => void cambiar(proximo, "hecho")}>
                        {t("hecho")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 rounded-2xl border-2 border-dashed border-borde p-5 text-tinta-suave">{t("sinProximo")}</p>
                )}
              </section>

              <section aria-labelledby="titulo-bloques">
                <h2 id="titulo-bloques" className="text-2xl font-extrabold">
                  {t("bloques")}
                </h2>
                {delDia(hoy).length ? (
                  <ol className="mt-3 space-y-3">{delDia(hoy).map(fila)}</ol>
                ) : (
                  <p className="mt-3 text-tinta-suave">{t("sinBloques")}</p>
                )}
              </section>

              <section aria-labelledby="titulo-entregas">
                <h2 id="titulo-entregas" className="text-2xl font-extrabold">
                  {t("entregas")}
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">{proximasEntregas.map(tarjeta)}</div>
              </section>
            </>
          ) : (
            <>
              <nav className="flex items-center justify-between gap-2">
                <Button variante="secundario" tamano="sm" onClick={() => mover(-1)}>
                  ‹ {t("anterior")}
                </Button>
                <Button variante="secundario" tamano="sm" onClick={() => mover(1)}>
                  {t("siguiente")} ›
                </Button>
              </nav>
              <div
                role="region"
                aria-label={t("semana")}
                tabIndex={0}
                className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-7 lg:px-0"
              >
                {Array.from({ length: 7 }, (_, i) => addDays(new Date(`${semana}T12:00:00`), i)).map((d) => {
                  const esHoy = isSameDay(d, hoy);
                  const entregasDia = tareas.filter((ta) => isSameDay(new Date(ta.fecha_entrega), d));
                  return (
                    <section
                      key={d.toISOString()}
                      ref={esHoy ? refHoy : undefined}
                      className="w-[85%] min-w-0 shrink-0 snap-start space-y-2 sm:w-[45%] lg:w-auto"
                    >
                      <h2
                        className={`rounded-xl px-3 py-2 text-base font-extrabold capitalize ${esHoy ? "bg-tinta text-white" : "bg-superficie border-2 border-borde"}`}
                      >
                        {d.toLocaleDateString(locale, { weekday: "long", day: "numeric" })}
                      </h2>
                      {entregasDia.map((ta) => (
                        <Link
                          key={ta.id}
                          href={`/estudiante/tarea/${ta.id}`}
                          className="block rounded-xl border-2 border-nivel-1/50 bg-peligro-claro px-3 py-2 text-sm font-bold leading-snug"
                        >
                          {t("entregaDia", { titulo: ta.titulo })}
                        </Link>
                      ))}
                      {delDia(d).map((b) => (
                        <Link
                          key={b.id}
                          href={enlaceDeBloque(b)}
                          className={`block rounded-xl border-2 bg-superficie px-3 py-2 text-sm leading-snug ${b.estado === "hecho" ? "border-nivel-3/40 text-tinta-suave line-through" : "border-borde"}`}
                        >
                          <span className="block font-titulo font-bold tabular-nums text-tinta-suave no-underline">{hora(b.inicio)}</span>
                          {b.titulo}
                        </Link>
                      ))}
                      {!delDia(d).length && !entregasDia.length && <p className="px-1 text-sm text-tinta-suave">{t("sinBloques")}</p>}
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
