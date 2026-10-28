"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { enviarAlTutor, historialTutor } from "@/lib/api-cliente";
import { Button, Textarea } from "@/components/ui";
import type { MensajeChat } from "@/types/contratos";

export function ChatTutor({ tareaId }: { tareaId: string }) {
  const t = useTranslations("tutor");
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(true);
  const [error, setError] = useState(false);
  const activo = useRef(false);
  useEffect(() => {
    let vigente = true;
    historialTutor(tareaId)
      .then((m) => {
        if (vigente) setMensajes(m);
      })
      .catch(() => {
        if (vigente) setError(true);
      })
      .finally(() => {
        if (vigente) setOcupado(false);
      });
    return () => {
      vigente = false;
    };
  }, [tareaId]);
  async function enviar(mensaje: string) {
    if (activo.current || ocupado || !mensaje.trim()) return;
    activo.current = true;
    setOcupado(true);
    setError(false);
    setTexto("");
    const ahora = new Date().toISOString();
    setMensajes((prev) => [
      ...prev,
      { rol: "estudiante", contenido: mensaje, creado_en: ahora },
      { rol: "agente", contenido: "", creado_en: ahora },
    ]);
    try {
      for await (const trozo of enviarAlTutor(tareaId, mensaje)) {
        setMensajes((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, contenido: m.contenido + trozo } : m)));
      }
    } catch {
      setError(true);
      setTexto(mensaje);
      setMensajes((prev) => (prev.at(-1)?.contenido === "" ? prev.slice(0, -1) : prev));
    } finally {
      setOcupado(false);
      activo.current = false;
    }
  }
  return (
    <section className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">{t("titulo")}</h1>
      <p className="text-tinta-suave">{t("introduccion")}</p>
      <div role="log" aria-label={t("historial")} aria-live="polite" className="flex max-h-[55vh] min-h-32 flex-col gap-3 overflow-y-auto">
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap break-words rounded-xl p-3 ${m.rol === "estudiante" ? "ml-6 bg-primario-claro" : "mr-6 border border-borde bg-superficie"}`}
          >
            <p className="mb-1 text-sm font-semibold">{t(m.rol)}</p>
            {m.contenido || t("pensando")}
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-peligro">
          {t("error")}
        </p>
      )}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(texto);
        }}
      >
        <Textarea etiqueta={t("mensaje")} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={6000} disabled={ocupado} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" cargando={ocupado} disabled={!texto.trim()}>
            {t("enviar")}
          </Button>
          <Button type="button" variante="secundario" disabled={ocupado} onClick={() => void enviar(t("pistaMensaje"))}>
            {t("pista")}
          </Button>
        </div>
      </form>
    </section>
  );
}
