"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button, Input, Textarea } from "@/components/ui";
import { obtenerCalificacion, guardarCalificacion, devolverEntrega } from "@/lib/api-cliente";
import { EntradaCalificacion, type Calificacion } from "@/lib/db/calificaciones";

export function CalificacionEntrega({ entregaId, estudiante = false, resumen = false }: {
  entregaId: string; estudiante?: boolean; resumen?: boolean;
}) {
  const t = useTranslations("gestion.calificacion");
  const formato = useFormatter();
  const [registro, setRegistro] = useState<Calificacion | null>(null);
  const [nota, setNota] = useState("");
  const [motivo, setMotivo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let vivo = true;
    obtenerCalificacion(entregaId).then((c) => {
      if (!vivo) return;
      setRegistro(c); setNota(c?.nota == null ? "" : String(c.nota)); setMotivo(c?.motivo_devolucion ?? "");
      setError(false); setCargando(false);
    }).catch(() => { if (vivo) { setError(true); setCargando(false); } });
    return () => { vivo = false; };
  }, [entregaId, intento]);
  const entrada = EntradaCalificacion.safeParse({ nota: nota.trim() === "" ? null : Number(nota) });
  async function guardar(devolver = false) {
    setOcupado(true); setError(false); setGuardado(false);
    try {
      const c = devolver ? await devolverEntrega(entregaId, motivo) : await guardarCalificacion(entregaId, entrada.success ? entrada.data.nota : null);
      setRegistro(c); setGuardado(true);
    } catch { setError(true); } finally { setOcupado(false); }
  }
  if (cargando) return <p role="status" className="text-sm">{t("cargando")}</p>;
  if (resumen) return error ? <span className="text-sm text-peligro">{t("error")}</span> : <span className="text-sm font-bold">{registro?.devuelta ? t("devuelta") : registro?.nota != null ? t("valor", { nota: formato.number(registro.nota) }) : t("sinNota")}</span>;
  if (estudiante) return <div className="grid min-w-0 gap-2 break-words">
    {error && <p role="alert">{t("error")} <button type="button" className="underline" onClick={() => setIntento((n) => n + 1)}>{t("reintentar")}</button></p>}
    {registro?.nota != null && <p className="rounded-xl border-2 border-borde p-3 font-bold">{t("valor", { nota: formato.number(registro.nota) })}</p>}
    {registro?.devuelta && <p role="status" className="whitespace-pre-wrap rounded-xl border-2 border-primario bg-resaltador-claro p-3">{t("aviso", { motivo: registro.motivo_devolucion ?? "" })}</p>}
  </div>;
  return <section className="grid min-w-0 gap-3 rounded-2xl border-2 border-borde p-4" aria-label={t("titulo")}>
    <h3 className="font-bold">{t("titulo")}</h3>
    <label className="grid gap-1 text-sm font-bold">{t("nota")}
      <Input type="number" min={0} max={100} step="0.01" value={nota} disabled={ocupado || error} onChange={(e) => { setNota(e.target.value); setGuardado(false); }} />
    </label>
    <Button type="button" disabled={ocupado || error || !entrada.success} onClick={() => guardar()}>{t("guardar")}</Button>
    <label className="grid gap-1 text-sm font-bold">{t("motivo")}
      <Textarea value={motivo} maxLength={1000} rows={3} disabled={ocupado || error} onChange={(e) => { setMotivo(e.target.value); setGuardado(false); }} />
    </label>
    <Button type="button" variante="secundario" disabled={ocupado || error || !motivo.trim()} onClick={() => guardar(true)}>{t("devolver")}</Button>
    {registro?.devuelta && <p className="text-sm font-bold">{t("devuelta")}</p>}
    {guardado && <p role="status" className="text-sm">{t("guardado")}</p>}
    {error && <p role="alert" className="text-sm text-peligro">{t("error")} <button type="button" className="underline" onClick={() => setIntento((n) => n + 1)}>{t("reintentar")}</button></p>}
  </section>;
}
