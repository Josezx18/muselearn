"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { enviarAlTutor, historialTutor } from "@/lib/api-cliente";
import { Button, Textarea } from "@/components/ui";
import type { MensajeChat } from "@/types/contratos";
import { ErrorApi } from "@/lib/api-cliente";
import { Mascota } from "@/components/comun/mascotas/Mascota";
import { ConMascota } from "@/components/comun/mascotas/ConMascota";
import { BotonVoz } from "@/components/comun/BotonVoz";
import { EntradaVoz } from "@/components/verificacion/voz";
import { useVozSalida } from "@/lib/voz-salida";

/** Código corto del error para mostrar junto al mensaje (ayuda a diagnosticar). */
function codigoDe(e: unknown): string {
  return e instanceof ErrorApi ? `${e.estado} ${e.codigo}` : "red";
}

export function ChatTutor({ tareaId }: { tareaId: string }) {
  const t = useTranslations("tutor");
  const tm = useTranslations("mascota.tutor");
  const locale = useLocale();
  const voz = useVozSalida(locale);
  const [escuchando, setEscuchando] = useState(false);
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
    voz.callar();
    try {
      let respuesta = "";
      for await (const trozo of enviarAlTutor(tareaId, mensaje)) {
        respuesta += trozo;
        setMensajes((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, contenido: m.contenido + trozo } : m)));
      }
      voz.hablar(respuesta);
    } catch (e) {
      setError(codigoDe(e));
      setTexto(mensaje);
      setMensajes((prev) => (prev.at(-1)?.contenido === "" ? prev.slice(0, -1) : prev));
    } finally {
      setOcupado(false);
      activo.current = false;
    }
  }
  const pensando = ocupado && mensajes.at(-1)?.rol === "agente" && !mensajes.at(-1)?.contenido;
  const expresion = escuchando ? "escucho" : pensando ? "pensando" : voz.hablando ? "hola" : mensajes.length ? "pista" : "hola";
  const mensajeMascota = escuchando ? tm("escuchando") : pensando ? tm("pensando") : voz.hablando ? tm("hablando") : tm("inicio");
  return (
    <ConMascota expresion={expresion} mensaje={mensajeMascota} hablando={voz.hablando}>
      <section className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-4xl font-extrabold">{t("titulo")}</h1>
          {voz.disponible && (
            <BotonVoz
              activa={voz.activa}
              alCambiar={voz.activar}
              etiquetas={{ encendida: t("voz.encendida"), apagada: t("voz.apagada") }}
            />
          )}
        </div>
        <p className="text-tinta-suave">{t("introduccion")}</p>
        <div
          role="log"
          aria-label={t("historial")}
          aria-live="polite"
          className="papel flex max-h-[58vh] min-h-48 flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-borde p-3"
        >
          {mensajes.map((m, i) => {
            const burbuja = (
              <div
                className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 ${
                  m.rol === "estudiante"
                    ? "ml-auto rounded-br-md bg-tinta text-white"
                    : "min-w-0 rounded-bl-md border-2 border-borde bg-superficie"
                }`}
              >
                <p className={`mb-0.5 text-xs font-bold ${m.rol === "estudiante" ? "text-white/70" : "text-primario-fuerte"}`}>
                  {t(m.rol)}
                </p>
                {m.contenido || t("pensando")}
                {m.rol === "agente" && m.contenido && voz.disponible && (
                  <button
                    type="button"
                    onClick={() => (voz.hablando ? voz.callar() : voz.hablar(m.contenido, { forzar: true }))}
                    className="mt-1 block text-xs font-bold text-primario-fuerte underline-offset-4 hover:underline"
                  >
                    🔊 {voz.hablando ? t("voz.callar") : t("voz.escuchar")}
                  </button>
                )}
              </div>
            );
            return m.rol === "estudiante" ? (
              <div key={i}>{burbuja}</div>
            ) : (
              <div key={i} className="mr-auto flex max-w-[94%] items-end gap-2">
                <Mascota
                  expresion={m.contenido ? (i === mensajes.length - 1 ? "pista" : "hola") : "pensando"}
                  flota={!m.contenido}
                  hablando={voz.hablando && i === mensajes.length - 1}
                  viva={i === mensajes.length - 1}
                  className="size-11"
                />
                {burbuja}
              </div>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="text-peligro">
            {error.includes("limite_diario") ? t("limite") : t("error")} <span className="text-xs text-tinta-suave">({error})</span>
          </p>
        )}
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void enviar(texto);
          }}
        >
          <EntradaVoz
            tareaId={tareaId}
            etiquetaGrabar={t("voz.hablale")}
            disabled={ocupado}
            onOcupado={setEscuchando}
            onTexto={(dicho) => {
              // Con la voz encendida es una conversación: lo que dices se envía solo. Si no, queda para revisar.
              if (voz.activa) void enviar(dicho);
              else setTexto(dicho);
            }}
          />
          <Textarea
            etiqueta={t("mensaje")}
            rows={3}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={6000}
            disabled={ocupado}
          />
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
    </ConMascota>
  );
}
