"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui";
import { formatearCentro } from "@/lib/fechas-centro";
import { offsetPorDefecto } from "@/lib/zona";
import type { MisTareasDeClase, TareaConEstado } from "@/lib/server/data";

/** Detalle de una clase: encabezado y tareas del estudiante agrupadas en Pendientes, Entregadas y Vencidas. */
export function DetalleClase({ clase, docente, pendientes, entregadas, vencidas }: MisTareasDeClase) {
  const t = useTranslations("estudiante");
  const locale = useLocale();
  const offsetMin = offsetPorDefecto();
  const fecha = (iso: string) => formatearCentro(new Date(iso), locale, { weekday: "short", day: "numeric", month: "short" }, offsetMin);
  const seccion = (titulo: string, estadoGrupo: "pendiente" | "entregada" | "vencida", items: TareaConEstado[]) => {
    const etiqueta = t(`estado.${estadoGrupo}`);
    const tono = estadoGrupo === "entregada" ? "neutro" : "peligro";
    const fila = (item: TareaConEstado) => (
      <Link
        key={item.tarea.id}
        href={`/estudiante/tarea/${item.tarea.id}`}
        className="flex items-center justify-between gap-3 rounded-xl border-2 border-borde bg-superficie p-3 hover:border-tinta-suave transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="font-bold text-tinta leading-snug">{item.tarea.titulo}</p>
          <p className="mt-0.5 text-sm text-tinta-suave">
            {item.tarea.modalidad ? t(`modalidad.${item.tarea.modalidad}`) : ""} · {fecha(item.tarea.fecha_entrega)}
          </p>
        </div>
        <Badge tono={tono}>{etiqueta}</Badge>
      </Link>
    );
    return (
      <section className="mt-6">
        <h3 className="text-lg font-bold text-tinta">{titulo}</h3>
        <div className="mt-2 space-y-2">{items.map(fila)}</div>
        {!items.length && <p className="mt-2 text-sm text-tinta-suave">{t("sinTareasEnGrupo")}</p>}
      </section>
    );
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-tinta">{clase.nombre}</h1>
          <p className="mt-0.5 text-sm text-tinta-suave">{clase.materia} · {clase.grado}</p>
          <p className="mt-1 text-sm text-tinta-suave">{t("docente", { nombre: docente.nombre })}</p>
        </div>
        <Link
          href="/estudiante/clases"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-borde bg-superficie px-4 py-2 text-sm font-bold hover:border-tinta-suave"
        >
          {t("volverAClases")}
        </Link>
      </div>
      {seccion(t("grupoPendientes"), "pendiente", pendientes)}
      {seccion(t("grupoEntregadas"), "entregada", entregadas)}
      {seccion(t("grupoVencidas"), "vencida", vencidas)}
    </div>
  );
}
