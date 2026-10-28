"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { iniciarVerificacion, listarEntregas, responderVerificacion } from "@/lib/api-cliente";
import { useRouter } from "@/i18n/navigation";
import { Button, Textarea } from "@/components/ui";
import type { SesionVerificacion } from "@/types/contratos";
import { EntradaVoz } from "./voz";

export function Verificacion({ tareaId, entregaId }: { tareaId: string; entregaId?: string }) {
  const t = useTranslations("verificacion");
  const locale = useLocale();
  const router = useRouter();
  const [sesion, setSesion] = useState<SesionVerificacion | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [via, setVia] = useState<"voz" | "texto">("texto");
  const [ocupado, setOcupado] = useState(false);
  const [vozOcupada, setVozOcupada] = useState(false);
  const [error, setError] = useState(false);
  const vozDisponible = useSyncExternalStore(suscribir, () => "speechSynthesis" in window, () => false);
  const activo = useRef(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const pregunta = sesion?.preguntas.at(-1);
  function cargarSesion(nueva: SesionVerificacion) {
    setSesion(nueva);
    setRespuesta(nueva.preguntas.at(-1)?.respuesta ?? "");
    setVia(nueva.preguntas.at(-1)?.via ?? "texto");
  }
  async function empezar() {
    if (activo.current) return;
    activo.current = true; setOcupado(true); setError(false);
    try {
      if (entregaId) { cargarSesion(await iniciarVerificacion(entregaId)); return; }
      const entrega = (await listarEntregas(tareaId)).find(e => e.estado !== "pendiente");
      if (!entrega) throw new Error("sin_entrega");
      if (entrega.estado === "verificada") { router.push(`/estudiante/informe/${entrega.id}`); return; }
      cargarSesion(await iniciarVerificacion(entrega.id));
    } catch { setError(true); } finally { activo.current = false; setOcupado(false); }
  }
  async function enviar() {
    if (!sesion || !pregunta || !respuesta.trim() || activo.current || vozOcupada) return;
    activo.current = true; setOcupado(true); setError(false);
    window.speechSynthesis?.cancel();
    try {
      const resultado = await responderVerificacion({ sesion_id: sesion.id, pregunta_id: pregunta.id, respuesta, via });
      if ("informe" in resultado) router.push(`/estudiante/informe/${sesion.entrega_id}`);
      else {
        setSesion({ ...sesion, preguntas: [...sesion.preguntas.map(p => p.id === pregunta.id ? { ...p, respuesta, via } : p), resultado.siguiente] });
        setRespuesta(""); setVia("texto");
      }
    } catch { setError(true); } finally { activo.current = false; setOcupado(false); }
  }
  function escuchar() {
    if (!pregunta) return;
    window.speechSynthesis.cancel();
    const voz = new SpeechSynthesisUtterance(pregunta.texto); voz.lang = locale === "en" ? "en-US" : "es-ES";
    window.speechSynthesis.speak(voz);
  }
  return <section className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-4 p-4">
    <h1 className="text-2xl font-bold">{t("titulo")}</h1><p className="text-tinta-suave">{t("tranquilidad")}</p>
    {error && <p role="alert" className="text-peligro">{t("error")}</p>}
    {!pregunta ? <Button onClick={() => void empezar()} cargando={ocupado}>{t("empezar")}</Button> : <>
      <p className="text-sm text-tinta-suave">{t("progreso", { numero: sesion!.preguntas.length })}</p>
      <h2 className="break-words rounded-xl border border-borde bg-superficie p-4 text-lg" aria-live="polite">{pregunta.texto}</h2>
      {vozDisponible && <Button variante="fantasma" onClick={escuchar}>{t("escuchar")}</Button>}
      <form className="flex flex-col gap-3" onSubmit={e => { e.preventDefault(); void enviar(); }}>
        <Textarea etiqueta={t("respuesta")} ayuda={t("corregir")} value={respuesta} maxLength={10000} disabled={ocupado} onChange={e => setRespuesta(e.target.value)} />
        <EntradaVoz disabled={ocupado} onOcupado={setVozOcupada} onTexto={texto => { setRespuesta(texto); setVia("voz"); }} />
        <Button type="submit" cargando={ocupado} disabled={!respuesta.trim() || vozOcupada}>{t("enviar")}</Button>
      </form>
    </>}
  </section>;
}

const suscribir = () => () => {};
