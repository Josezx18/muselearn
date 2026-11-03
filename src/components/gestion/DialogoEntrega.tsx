"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button, Dialog, NivelDominio, Skeleton } from "@/components/ui";
import { obtenerDetalleRevision } from "@/lib/api-cliente";
import { ReporteRevision } from "./revision/ReporteRevision";
import { VisorImagen } from "./revision/VisorImagen";
import type { DetalleEntrega, RevisionEntrega } from "@/types/contratos";
import { CalificacionEntrega } from "./CalificacionEntrega";
import { ComentarioEntrega } from "./ComentarioEntrega";

/** Lo que entregó el estudiante: texto, fotos y archivos, sus respuestas de la verificación y el informe. */
export interface FilaRevision { id: string; nombre: string; entregaId: string | null; estado: string; sinNota: boolean }
interface PropsRevision {
  entregaId: string | null; nombre: string; alCerrar: () => void;
  filas?: FilaRevision[]; alSeleccionar?: (fila: FilaRevision) => void; alActualizar?: () => void;
  /** Revisión con IA guardada y vigente para esta entrega, si existe. */
  revision?: RevisionEntrega;
}
/** Cada entrega y reapertura empieza con un reporte nuevo y sin sugerencias pendientes de otra entrega. */
export function DialogoEntrega(props: PropsRevision) {
  return <ContenidoDialogoEntrega key={props.entregaId ?? "cerrada"} {...props} />;
}
function ContenidoDialogoEntrega({ entregaId, nombre, alCerrar, filas = [], alSeleccionar, alActualizar, revision }: PropsRevision) {
  const t = useTranslations("gestion.entrega");
  const tr = useTranslations("gestion.revision");
  const ti = useTranslations("informes");
  const formato = useFormatter();
  const [detalle, setDetalle] = useState<DetalleEntrega | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!entregaId) return;
    let vivo = true;
    obtenerDetalleRevision(entregaId)
      .then((d) => vivo && setDetalle(d))
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
      setDetalle(null);
      setError(false);
    };
  }, [entregaId]);

  const [foto, setFoto] = useState<{ url: string; nombre: string } | null>(null);
  const [notaSugerida, setNotaSugerida] = useState<{ valor: number; vez: number }>();
  const [comentarioSugerido, setComentarioSugerido] = useState<{ valor: string; vez: number }>();
  const disponibles = filas.filter((f) => f.entregaId);
  const indice = disponibles.findIndex((f) => f.entregaId === entregaId);
  const anterior = disponibles[indice - 1];
  const siguiente = disponibles[indice + 1];
  const sinNota = [...disponibles.slice(indice + 1), ...disponibles.slice(0, indice)]
    .find((f) => f.sinNota && !["sinEntrega", "devuelta"].includes(f.estado));
  useEffect(() => {
    if (!entregaId || foto) return;
    const teclas = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.closest("input, textarea, select, [contenteditable]"))) return;
      const fila = e.key === "ArrowLeft" ? anterior : e.key === "ArrowRight" ? siguiente : null;
      if (fila) { e.preventDefault(); alSeleccionar?.(fila); }
    };
    window.addEventListener("keydown", teclas);
    return () => window.removeEventListener("keydown", teclas);
  }, [entregaId, foto, anterior, siguiente, alSeleccionar]);
  const imagen = (tipo: string) => tipo.startsWith("image/");
  return (
    <>
    <Dialog abierto={!!entregaId} alCerrar={alCerrar} titulo={t("titulo", { nombre })} etiquetaCerrar={t("cerrar")} className="w-[calc(100%-1rem)]! max-w-6xl! h-[96dvh] max-h-[96dvh] open:flex open:flex-col [&>div:first-child]:shrink-0 [&>div:last-child]:min-h-0 [&>div:last-child]:flex-1 [&>div:last-child]:overflow-hidden">
      <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:grid-rows-1">
      {filas.length > 0 && <aside className="min-h-0 min-w-0" aria-label={tr("estudiantes")}>
        <Button variante="secundario" onClick={alActualizar}>{tr("actualizar")}</Button>
        <ul className="mt-3 grid max-h-28 gap-2 overflow-auto lg:max-h-[65dvh]">{filas.map((f) => <li key={f.id}>
          <button type="button" disabled={!f.entregaId} aria-current={f.entregaId === entregaId ? "true" : undefined}
            onClick={() => alSeleccionar?.(f)} className={`w-full rounded-xl border-2 p-2 text-left break-words ${f.entregaId === entregaId ? "border-primario bg-fondo" : "border-borde"}`}>
            <strong>{f.nombre}</strong><span className="block text-sm">{tr("estado", { estado: tr(f.estado) })}</span>
          </button>
        </li>)}</ul>
      </aside>}
      <div className="flex min-h-0 min-w-0 flex-col">
      {filas.length > 0 && <div className="mb-3 flex shrink-0 flex-wrap gap-2">
        <Button variante="secundario" disabled={!anterior} onClick={() => anterior && alSeleccionar?.(anterior)}>{tr("anterior")}</Button>
        <Button variante="secundario" disabled={!siguiente} onClick={() => siguiente && alSeleccionar?.(siguiente)}>{tr("siguiente")}</Button>
        <Button variante="secundario" disabled={!sinNota} onClick={() => sinNota && alSeleccionar?.(sinNota)}>{tr("sinCalificar")}</Button>
      </div>}
      {error ? (
        <p role="alert" className="text-peligro">
          {t("error")}
        </p>
      ) : !detalle ? (
        <div role="status" aria-label={t("cargando")} className="grid gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <div className="grid min-h-0 min-w-0 flex-1 gap-5 overflow-y-auto break-words pr-1">
          {detalle.entrega.entregada_en && (
            <p className="text-sm text-tinta-suave">
              {t("entregada", {
                fecha: formato.dateTime(new Date(detalle.entrega.entregada_en), { dateStyle: "medium", timeStyle: "short" }),
              })}

            </p>
          )}
          {detalle.entrega.entregada_externamente && <p className="rounded-xl bg-resaltador-claro p-2 text-sm font-bold">{t("externa")}</p>}
          <section>
            <h3 className="font-bold">{t("texto")}</h3>
            {detalle.entrega.contenido_texto ? (
              <p className="papel mt-2 whitespace-pre-wrap rounded-xl border-2 border-borde p-3">{detalle.entrega.contenido_texto}</p>
            ) : (
              <p className="mt-1 text-tinta-suave">{t("sinTexto")}</p>
            )}
          </section>

          <section>
            <h3 className="font-bold">{t("archivos")}</h3>
            {detalle.adjuntos.length === 0 ? (
              <p className="mt-1 text-tinta-suave">{t("sinArchivos")}</p>
            ) : (
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {detalle.adjuntos.map((a) => (
                  <li key={a.ruta} className="overflow-hidden rounded-xl border-2 border-borde">
                    {a.url && imagen(a.tipo_mime) ? (
                      <button type="button" className="w-full" aria-label={a.nombre} onClick={() => setFoto({ url: a.url!, nombre: a.nombre })}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal: next/image no aplica */}
                        <img src={a.url} alt={a.nombre} className="h-48 w-full bg-fondo object-contain" />
                      </button>
                    ) : null}
                    <div className="flex items-center justify-between gap-2 p-2 text-sm">
                      <span className="truncate">{a.nombre}</span>
                      {a.url && imagen(a.tipo_mime) ? <button type="button" className="font-bold text-primario-fuerte" onClick={() => setFoto({ url: a.url!, nombre: a.nombre })}>{t("abrir")}</button> : a.url && (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 font-bold text-primario-fuerte underline-offset-4 hover:underline"
                        >
                          {t("abrir")}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="font-bold">{t("verificacion")}</h3>
            {detalle.preguntas.length === 0 ? (
              <p className="mt-1 text-tinta-suave">{t("sinVerificacion")}</p>
            ) : (
              <ol className="mt-2 grid gap-3">
                {detalle.preguntas.map((p, i) => (
                  <li key={p.id} className="rounded-xl border-2 border-borde p-3">
                    <p className="text-xs font-bold text-primario-fuerte">{t("pregunta", { n: i + 1 })}</p>
                    <p className="font-bold">{p.texto}</p>
                    {p.respuesta ? (
                      <p className="mt-2">
                        <span className="text-xs font-bold text-tinta-suave">
                          {t("respuesta")} {p.via === "voz" ? t("porVoz") : t("porTexto")}:
                        </span>{" "}
                        <q className="resaltado font-mano text-xl">{p.respuesta}</q>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-tinta-suave">{t("sinRespuesta")}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {detalle.informe && (
            <section>
              <h3 className="font-bold">{t("informe")}</h3>
              <p className="mt-1">
                <span className="text-sm text-tinta-suave">{t("nivel")}: </span>
                <strong>{ti(`niveles.${detalle.informe.nivel_global}`)}</strong>
              </p>
              <p className="mt-2 text-sm font-bold text-tinta-suave">{t("resumen")}</p>
              <p>{detalle.informe.resumen_docente}</p>
              <ul className="mt-3 grid gap-2">
                {detalle.informe.por_concepto.map((c) => (
                  <li key={c.concepto} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-fondo p-2">
                    <span className="font-bold">{c.concepto}</span>
                    <NivelDominio nivel={c.nivel} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ReporteRevision key={`revision-${detalle.entrega.id}`} entregaId={detalle.entrega.id} guardada={revision}
            alNota={(valor) => setNotaSugerida({ valor, vez: Date.now() })}
            alComentario={(valor) => setComentarioSugerido({ valor, vez: Date.now() })} />
          <CalificacionEntrega key={`nota-${detalle.entrega.id}`} entregaId={detalle.entrega.id} sugerida={notaSugerida} alGuardar={alActualizar} />
          <ComentarioEntrega
            key={detalle.entrega.id}
            entregaId={detalle.entrega.id}
            inicial={detalle.comentario}
            sugerido={comentarioSugerido}
            entregada={detalle.entrega.estado !== "pendiente"}
          />
        </div>
      )}
      </div></div>
    </Dialog>
    {foto && <VisorImagen imagen={foto} alCerrar={() => setFoto(null)} />}
    </>
  );
}
