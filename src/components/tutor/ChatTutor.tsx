"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { enviarAlTutor, historialTutor } from "@/lib/api-cliente";
import { Button, Textarea } from "@/components/ui";
import type { MensajeChat } from "@/types/contratos";
import { ErrorApi } from "@/lib/api-cliente";

/** Código corto del error para mostrar junto al mensaje (ayuda a diagnosticar). */
function codigoDe(e: unknown): string {
  return e instanceof ErrorApi ? `${e.estado} ${e.codigo}` : "red";
}

export function ChatTutor({ tareaId }: { tareaId: string }) {
  const t = useTranslations("tutor");
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(true);
  const [error, setError] = useState<false | string>(false);
  const activo = useRef(false);
  useEffect(() => {
    let vigente = true;
    historialTutor(tareaId)
      .then((m) => {
        if (vigente) setMensajes(m);
      })
      .catch((e: unknown) => {
        if (vigente) setError(codigoDe(e));
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
    } catch (e) {
      setError(codigoDe(e));
      setTexto(mensaje);
      setMensajes((prev) => (prev.at(-1)?.contenido === "" ? prev.slice(0, -1) : prev));
    } finally {
      setOcupado(false);
      activo.current = false;
    }
  }
  return (
    <section className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-4">
      <h1 className="text-4xl font-extrabold">{t("titulo")}</h1>
      <p className="text-tinta-suave">{t("introduccion")}</p>
      <div role="log" aria-label={t("historial")} aria-live="polite" className="papel flex max-h-[58vh] min-h-48 flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-borde p-3">
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 ${
              m.rol === "estudiante"
                ? "ml-auto rounded-br-md bg-tinta text-white"
                : "mr-auto rounded-bl-md border-2 border-borde bg-superficie"
            }`}
          >
            <p className={`mb-0.5 text-xs font-bold ${m.rol === "estudiante" ? "text-white/70" : "text-primario-fuerte"}`}>{t(m.rol)}</p>
            {m.contenido || t("pensando")}
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-peligro">
          {t("error")} <span className="text-xs text-tinta-suave">({error})</span>
        </p>
      )}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(texto);
        }}
      >
        <Textarea etiqueta={t("mensaje")} rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={6000} disabled={ocupado} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" cargando={ocupado} disabled={!texto.trim()}>
            {t("enviar")}
          </Button>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void enviar(t("pistaMensaje"))}
            className="inline-flex min-h-11 items-center rounded-xl border-2 border-tinta bg-resaltador px-4 font-bold shadow-[0_3px_0_0_var(--color-tinta)] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
          >
            {t("pista")}
          </button>
        </div>
      </form>
    </section>
  );
}
