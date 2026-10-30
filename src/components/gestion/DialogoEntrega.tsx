"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Dialog, NivelDominio, Skeleton } from "@/components/ui";
import { obtenerDetalleEntregaCalificada } from "@/lib/api-cliente";
import type { DetalleEntrega } from "@/types/contratos";
import { CalificacionEntrega } from "./CalificacionEntrega";
import { ComentarioEntrega } from "./ComentarioEntrega";

/** Lo que entregó el estudiante: texto, fotos y archivos, sus respuestas de la verificación y el informe. */
export function DialogoEntrega({ entregaId, nombre, alCerrar }: { entregaId: string | null; nombre: string; alCerrar: () => void }) {
  const t = useTranslations("gestion.entrega");
  const ti = useTranslations("informes");
  const formato = useFormatter();
  const [detalle, setDetalle] = useState<DetalleEntrega | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!entregaId) return;
    let vivo = true;
    obtenerDetalleEntregaCalificada(entregaId)
      .then((d) => vivo && setDetalle(d))
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
      setDetalle(null);
      setError(false);
    };
  }, [entregaId]);

  const imagen = (tipo: string) => tipo.startsWith("image/");
  return (
    <Dialog abierto={!!entregaId} alCerrar={alCerrar} titulo={t("titulo", { nombre })} etiquetaCerrar={t("cerrar")} className="max-w-2xl">
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
        <div className="grid max-h-[70vh] gap-5 overflow-y-auto pr-1">
          {detalle.entrega.entregada_en && (
            <p className="text-sm text-tinta-suave">
              {t("entregada", {
                fecha: formato.dateTime(new Date(detalle.entrega.entregada_en), { dateStyle: "medium", timeStyle: "short" }),
              })}
          {detalle.entrega.entregada_externamente && (
            <p className="rounded-xl bg-resaltador-claro p-2 text-sm font-bold">{t("externa")}</p>
          )}
            </p>
          )}
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
                      <a href={a.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal: next/image no aplica */}
                        <img src={a.url} alt={a.nombre} className="h-48 w-full bg-fondo object-contain" />
                      </a>
                    ) : null}
                    <div className="flex items-center justify-between gap-2 p-2 text-sm">
                      <span className="truncate">{a.nombre}</span>
                      {a.url && (
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

          <CalificacionEntrega key={`nota-${detalle.entrega.id}`} entregaId={detalle.entrega.id} />
          <ComentarioEntrega
            key={detalle.entrega.id}
            entregaId={detalle.entrega.id}
            inicial={detalle.comentario}
            entregada={detalle.entrega.estado !== "pendiente"}
          />
        </div>
      )}
    </Dialog>
  );
}
