"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";
import { Link } from "@/i18n/navigation";
import { actualizarBloque, listarAnalisis, listarClases, listarTareas, obtenerPlan, recalcularPlan } from "@/lib/api-cliente";
import { Button, Card, Skeleton } from "@/components/ui";
import type { Usuario, PlanSemanal, Tarea, AnalisisTarea, Clase, BloquePlan, EstadoBloque } from "@/types/contratos";
import { TarjetaTarea } from "./TarjetaTarea";
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
  const bloques = [...(plan?.bloques ?? [])].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const proximo = bloques.find((b) => b.estado === "planificado" && new Date(b.fin) > hoy);
  const tarjeta = (ta: Tarea) => (
    <TarjetaTarea
      key={ta.id}
      tarea={ta}
      analisis={analisis.find((a) => a.tarea_id === ta.id)}
      materia={clases.find((c) => c.id === ta.clase_id)?.materia}
    />
  );
  function bloque(b: BloquePlan) {
    return (
      <Card key={b.id} className="min-w-0 space-y-3 break-words">
        <Link className="font-semibold underline" href={`/estudiante/tarea/${b.tarea_id}`}>
          {b.titulo}
        </Link>
        <p className="text-sm">
          {new Date(b.inicio).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })} /{" "}
          {t("minutos", { n: Math.round((Date.parse(b.fin) - Date.parse(b.inicio)) / 60000) })}
        </p>
        <p>{t(b.estado)}</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              aria-label={`${t("hecho")}: ${b.titulo}`}
              checked={b.estado === "hecho"}
              disabled={ocupado}
              onChange={(e) => void cambiar(b, e.target.checked ? "hecho" : "planificado")}
            />
            {t("hecho")}
          </label>
          <Button
            variante="fantasma"
            tamano="sm"
            aria-label={`${t("omitir")}: ${b.titulo}`}
            disabled={ocupado || b.estado === "omitido"}
            onClick={() => void cambiar(b, "omitido")}
          >
            {t("omitir")}
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <div className="min-w-0 space-y-6">
      <header className="space-y-2">
        <p className="text-primario">{t("saludo", { nombre: usuario.nombre })}</p>
        <h1 className="text-3xl font-bold">{t(vista)}</h1>
        <p className="text-tinta-suave">{t("subtitulo")}</p>
      </header>
      <Button
        className="h-auto min-h-11 whitespace-normal py-2"
        cargando={ocupado}
        disabled={cargando || !plan}
        onClick={() => void reorganizar()}
      >
        {t("reorganizar")}
      </Button>
      {error && (
        <div role="alert">
          <p>{t("error")}</p>
          <Button
            variante="secundario"
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
          <p>{t("carga")}</p>
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : (
        <>
          <div aria-live="polite" className="space-y-2">
            {plan?.avisos
              .filter((a) => !cerrados.includes(a))
              .map((a, i) => (
                <Card key={`${i}-${a}`} className="space-y-2 border-primario">
                  <p>{a}</p>
                  <Button variante="fantasma" tamano="sm" onClick={() => setCerrados((c) => [...c, a])}>
                    {t("cerrar")}
                  </Button>
                </Card>
              ))}
          </div>
          {!tareas.length && <Card>{t("vacio")}</Card>}
          {vista === "hoy" ? (
            <>
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t("proximo")}</h2>
                {proximo ? (
                  <div className="rounded-2xl border-2 border-primario p-2">
                    {bloque(proximo)}
                    {tareas.filter((x) => x.id === proximo.tarea_id).map(tarjeta)}
                  </div>
                ) : (
                  <p>{t("sinProximo")}</p>
                )}
              </section>
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t("bloques")}</h2>
                {bloques.filter((b) => isSameDay(new Date(b.inicio), hoy)).map(bloque)}
                {!bloques.some((b) => isSameDay(new Date(b.inicio), hoy)) && <p>{t("sinBloques")}</p>}
              </section>
              <section className="space-y-3">
                <h2 className="text-xl font-semibold">{t("entregas")}</h2>
                {[...tareas].sort((a, b) => a.fecha_entrega.localeCompare(b.fecha_entrega)).map(tarjeta)}
              </section>
            </>
          ) : (
            <>
              <nav className="flex flex-wrap justify-between gap-2">
                <Button variante="secundario" onClick={() => mover(-1)}>
                  {t("anterior")}
                </Button>
                <Button variante="secundario" onClick={() => mover(1)}>
                  {t("siguiente")}
                </Button>
              </nav>
              <div
                role="region"
                aria-label={t("semana")}
                tabIndex={0}
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 lg:grid lg:grid-cols-7"
              >
                {Array.from({ length: 7 }, (_, i) => addDays(new Date(`${semana}T12:00:00`), i)).map((d) => (
                  <section key={d.toISOString()} className="w-full min-w-0 shrink-0 snap-start space-y-3 lg:w-auto">
                    <h2 className="sticky top-0 rounded-xl bg-primario p-3 text-superficie">
                      {d.toLocaleDateString(locale, { weekday: "long", month: "short", day: "numeric" })}
                    </h2>
                    {bloques.filter((b) => isSameDay(new Date(b.inicio), d)).map(bloque)}
                    {!bloques.some((b) => isSameDay(new Date(b.inicio), d)) && <p>{t("sinBloques")}</p>}
                    {tareas.filter((ta) => isSameDay(new Date(ta.fecha_entrega), d)).map(tarjeta)}
                  </section>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
