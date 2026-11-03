import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, NivelDominio } from "@/components/ui";
import type { obtenerPerfilEstudiante } from "@/lib/server/data";
type Datos = NonNullable<Awaited<ReturnType<typeof obtenerPerfilEstudiante>>>;
export async function PerfilEstudiante({ datos, locale }: {
    datos: Datos;
    locale: string;
}) {
    const t = await getTranslations("docente.perfil");
    const { clase, estudiante, entregas, informes, calificaciones, comentarios } = datos;
    const tareas = [...datos.tareas].sort((a, b) => b.creada_en.localeCompare(a.creada_en) || b.fecha_entrega.localeCompare(a.fecha_entrega));
    const enviadas = entregas.filter((e) => e.entregada_en && e.estado !== "pendiente");
    const aTiempo = enviadas.filter((e) => Date.parse(e.entregada_en!) <= Date.parse(tareas.find((t) => t.id === e.tarea_id)!.fecha_entrega)).length;
    const notas = calificaciones.flatMap((c) => c.nota === null ? [] : [c.nota]);
    const comprendidas = tareas.filter((tarea) => informes.some((i) => i.nivel_global >= 3 && entregas.some((e) => e.id === i.entrega_id && e.tarea_id === tarea.id))).length;
    const actividad = [...entregas.map((e) => e.entregada_en), ...informes.map((i) => i.generado_en)].filter((d): d is string => !!d).sort((a, b) => Date.parse(b) - Date.parse(a))[0];
    const fecha = (valor?: string | null) => valor ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santo_Domingo" }).format(new Date(valor)) : t("sinDato");
    const resumen = [
        [t("entregadas"), `${enviadas.length} / ${tareas.length}`], [t("aTiempo"), String(aTiempo)],
        [t("tarde"), String(enviadas.length - aTiempo)], [t("promedio"), notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toLocaleString(locale, { maximumFractionDigits: 1 }) : t("sinDato")],
        [t("comprension"), tareas.length ? `${Math.round(comprendidas / tareas.length * 100)} %` : t("sinDato")], [t("actividad"), fecha(actividad)],
    ];
    return <div className="grid min-w-0 gap-6 break-words">
    <header><Link className="inline-flex min-h-11 items-center font-bold text-primario-fuerte underline" href={`/docente/clases/${clase.id}`}>{t("volver")}</Link><p className="text-tinta-suave">{clase.nombre}</p><h1 className="text-3xl font-extrabold">{estudiante.nombre}</h1></header>
    <section aria-labelledby="resumen"><h2 id="resumen" className="mb-3 text-xl font-bold">{t("resumen")}</h2><dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{resumen.map(([nombre, valor]) => <Card key={nombre}><dt className="text-sm text-tinta-suave">{nombre}</dt><dd className="mt-1 text-xl font-bold">{valor}</dd></Card>)}</dl><p className="mt-2 text-sm text-tinta-suave">{t("base")}</p></section>
    {!enviadas.length && <Card>{t("sinEntregas")}</Card>}
    <section aria-labelledby="conceptos"><h2 id="conceptos" className="mb-3 text-xl font-bold">{t("conceptos")}</h2><div className="grid gap-3">{!informes.length && <p>{t("sinInformes")}</p>}{tareas.map((tarea) => {
            const entrega = entregas.find((e) => e.tarea_id === tarea.id);
            const informe = informes.filter((i) => i.entrega_id === entrega?.id).sort((a, b) => b.generado_en.localeCompare(a.generado_en))[0];
            return informe && <Card key={tarea.id}><h3 className="font-bold">{tarea.titulo}</h3><ul className="mt-3 grid gap-3">{informe.por_concepto.map((c) => <li key={c.concepto} className="flex flex-wrap items-center justify-between gap-2"><span>{c.concepto}</span><NivelDominio nivel={c.nivel}/></li>)}</ul></Card>;
        })}</div></section>
    <section aria-labelledby="historial"><h2 id="historial" className="mb-3 text-xl font-bold">{t("historial")}</h2>{!tareas.length && <p>{t("sinTareas")}</p>}<ul className="grid gap-3">{tareas.map((tarea) => {
            const entrega = entregas.find((e) => e.tarea_id === tarea.id);
            const informe = informes.find((i) => i.entrega_id === entrega?.id);
            const nota = calificaciones.find((c) => c.entrega_id === entrega?.id);
            const comentario = comentarios.find((c) => c.entrega_id === entrega?.id);
            return <li key={tarea.id}><Card><h3><Link className="inline-flex min-h-11 items-center font-bold text-primario-fuerte underline" href={`/docente/tareas/${tarea.id}`}>{tarea.titulo}</Link></h3><dl className="mt-2 grid gap-3 sm:grid-cols-2">
      <div><dt className="text-sm text-tinta-suave">{t("estado")}</dt><dd>{t(`estados.${entrega?.estado ?? "pendiente"}`)}</dd></div>
      <div><dt className="text-sm text-tinta-suave">{t("fecha")}</dt><dd>{fecha(entrega?.entregada_en)}</dd></div>
      <div><dt className="text-sm text-tinta-suave">{t("nota")}</dt><dd>{nota?.nota ?? t("sinDato")}</dd></div>
      <div><dt className="text-sm text-tinta-suave">{t("nivel")}</dt><dd>{informe ? <NivelDominio nivel={informe.nivel_global}/> : t("sinInformes")}</dd></div>
      <div><dt className="text-sm text-tinta-suave">{t("devolucion")}</dt><dd>{nota?.devuelta ? t("devuelta") : t("noDevuelta")}{nota?.motivo_devolucion && <p className="mt-1 whitespace-pre-wrap">{nota.motivo_devolucion}</p>}</dd></div>
      <div><dt className="text-sm text-tinta-suave">{t("comentario")}</dt><dd className="whitespace-pre-wrap">{comentario?.texto ?? t("sinComentario")}</dd></div>
      </dl></Card></li>;
        })}</ul></section>
  </div>;
}
