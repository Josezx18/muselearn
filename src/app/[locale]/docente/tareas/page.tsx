"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, Skeleton, Badge } from "@/components/ui";
import { listarTareas, listarClases } from "@/lib/api-cliente";
import type { Tarea, Clase } from "@/types/contratos";
import { OrigenTarea } from "@/components/tareas/OrigenTarea";

export default function PaginaTareasDocente() {
  const t = useTranslations("tareas");
  const formato = useFormatter();
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[] | null>(null);
  const [clases, setClases] = useState<Clase[] | null>(null);
  const [error, setError] = useState(false);
  const [claseFiltro, setClaseFiltro] = useState("");

  const cargar = async () => {
    try {
      const [ts, cs] = await Promise.all([listarTareas(), listarClases()]);
      setTareas(ts);
      setClases(cs);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
    cargar();
  }, []);

  const claseNombre = (claseId: string) => clases?.find((c) => c.id === claseId)?.nombre ?? "—";

  const obtenerNivelAyudaTexto = (nivel: string) => {
    switch (nivel) {
      case "pistas":
        return t("estados.pistas");
      case "ejemplos":
        return t("estados.ejemplos");
      case "explicacion":
        return t("estados.explicacion");
      default:
        return nivel;
    }
  };

  if (error) return <p role="alert" className="text-sm font-medium text-peligro">{t("lista.error")}</p>;
  if (!tareas || !clases) return <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  if (tareas.length === 0) {
    return (
      <Card className="text-center text-tinta-suave">
        {t("lista.vacio")}
        <Button variante="primario" className="mt-4" onClick={() => router.push("/docente/clases")}>
          {t("nueva.boton")}
        </Button>
      </Card>
    );
  }

  const visibles = tareas
    .filter((t) => !claseFiltro || t.clase_id === claseFiltro)
    .sort((a, b) => Date.parse(b.creada_en) - Date.parse(a.creada_en));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("titulo")}</h1>
        {clases.length > 1 && (
          <label className="grid gap-1 text-sm font-semibold">
            {t("filtro.clase")}
            <select
              value={claseFiltro}
              onChange={(e) => setClaseFiltro(e.target.value)}
              className="w-full min-w-0 rounded border border-borde bg-superficie p-2 font-normal"
            >
              <option value="">{t("filtro.todas")}</option>
              {clases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {visibles.length === 0 && <Card className="text-center text-tinta-suave">{t("filtro.vacio")}</Card>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {visibles.map((tarea) => (
          <li key={tarea.id}>
            <Card className="flex h-full flex-col gap-3">
              <div>
                <OrigenTarea origen={tarea.origen} />
                <h2 className="text-lg font-semibold">{tarea.titulo}</h2>
                <p className="text-sm text-tinta-suave">{claseNombre(tarea.clase_id)}</p>
                <p className="text-sm text-tinta-suave mt-1">
                  {t("detalle.fechaEntrega")} {formato.dateTime(new Date(tarea.fecha_entrega), { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              {tarea.competencias.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tarea.competencias.map((c, i) => (
                    <Badge key={i} tono="neutro">{c}</Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <Badge tono="primario">{obtenerNivelAyudaTexto(tarea.nivel_ayuda)}</Badge>
                <Button variante="primario" tamano="sm" onClick={() => router.push(`/docente/tareas/${tarea.id}`)}>
                  {t("lista.verEntregas")}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}