"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { ErrorApi, revisarEntregaIA } from "@/lib/api-cliente";
import type { RevisionEntrega } from "@/types/contratos";
export function ReporteRevision({ entregaId, guardada, alNota, alComentario }: {
  entregaId: string; guardada?: RevisionEntrega; alNota: (nota: number) => void; alComentario: (texto: string) => void;
}) {
  const t = useTranslations("gestion.revision");
  const [reporte, setReporte] = useState<RevisionEntrega | null>(guardada ?? null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <section className="grid min-w-0 gap-3 rounded-xl border-2 border-primario p-3">
    <Button cargando={ocupado} onClick={async () => {
      setOcupado(true); setError(null);
      try { setReporte(await revisarEntregaIA(entregaId)); }
      catch (e) {
        const codigo = e instanceof ErrorApi ? e.codigo : "";
        setError(t(codigo === "limite_diario_ia_docente" ? "limite"
          : ["imagen_no_disponible", "imagen_no_admitida", "demasiadas_imagenes"].includes(codigo) ? "errorImagen"
          : codigo === "sin_entregar" ? "errorSinEntregar" : "error"));
      }
      finally { setOcupado(false); }
    }}>{ocupado ? t("pensando") : reporte ? t("revisarOtra") : t("revisar")}</Button>
    <p className="text-sm font-bold">{t("aviso")}</p>
    {error && <p role="alert" className="text-sm font-medium text-peligro">{error}</p>}
    {reporte && <div className="grid gap-3" role="status">
      <h3 className="font-bold">{t(reporte.cumple)}</h3><p>{reporte.resumen}</p>
      <ul className="grid gap-2">{reporte.criterios.map((c, i) => <li key={i} className="rounded-lg bg-fondo p-2">
        <strong>{c.criterio}: {t(c.cumple)}</strong><p>{c.evidencia}</p>
      </li>)}</ul>
      <p>{t("confianza", { valor: t(reporte.confianza) })}</p>
      <ul>{reporte.sugerencias_para_estudiante.map((s, i) => <li key={i}>{s}</li>)}</ul>
      {reporte.nota_sugerida !== null && <><p>{t("nota", { nota: reporte.nota_sugerida })}</p>
        <Button variante="secundario" onClick={() => alNota(reporte.nota_sugerida!)}>{t("usarNota")}</Button></>}
      <Button variante="secundario" disabled={!reporte.sugerencias_para_estudiante.length}
        onClick={() => alComentario(reporte.sugerencias_para_estudiante.join("\n\n"))}>{t("usarComentario")}</Button>
    </div>}
  </section>;
}
