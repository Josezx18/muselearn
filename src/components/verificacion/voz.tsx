"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { transcribirVoz } from "@/lib/api-cliente";
import { grabarWav } from "./wav";

interface Reconocimiento {
  lang: string;
  onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}
type NavegadorVoz = Window & { SpeechRecognition?: new () => Reconocimiento; webkitSpeechRecognition?: new () => Reconocimiento };

export function EntradaVoz({
  disabled,
  onTexto,
  onOcupado,
  tareaId,
}: {
  disabled: boolean;
  onTexto: (texto: string) => void;
  onOcupado: (valor: boolean) => void;
  tareaId?: string;
}) {
  const t = useTranslations("verificacion");
  const locale = useLocale();
  const [grabando, setGrabando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const disponible = useSyncExternalStore(
    suscribir,
    () => Boolean(navigator.mediaDevices?.getUserMedia),
    () => false,
  );
  const grabacion = useRef<Awaited<ReturnType<typeof grabarWav>> | null>(null);
  const respaldo = useRef<Reconocimiento | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const vigente = useRef(true);
  useEffect(() => {
    onOcupado(grabando || procesando);
  }, [grabando, procesando, onOcupado]);
  useEffect(() => {
    vigente.current = true;
    return () => {
      vigente.current = false;
      clearTimeout(timer.current);
      void grabacion.current?.detener();
      respaldo.current?.abort();
    };
  }, []);
  async function detener() {
    clearTimeout(timer.current);
    setGrabando(false);
    setProcesando(true);
    try {
      const audio = await grabacion.current?.detener();
      grabacion.current = null;
      if (!audio || audio.size <= 44) throw new Error("audio_vacio");
      const { texto } = await transcribirVoz(audio, tareaId);
      if (vigente.current) onTexto(texto);
    } catch {
      if (vigente.current) setFallo(true);
    } finally {
      if (vigente.current) setProcesando(false);
    }
  }
  async function empezar() {
    setProcesando(true);
    setFallo(false);
    try {
      const nueva = await grabarWav();
      if (!vigente.current) {
        await nueva.detener();
        return;
      }
      grabacion.current = nueva;
      setGrabando(true);
      timer.current = setTimeout(() => void detener(), 120000);
    } catch {
      setFallo(true);
    } finally {
      if (vigente.current) setProcesando(false);
    }
  }
  function dictar() {
    const navegador = window as NavegadorVoz;
    const Constructor = navegador.SpeechRecognition ?? navegador.webkitSpeechRecognition;
    if (!Constructor) return;
    const reconocimiento = new Constructor();
    respaldo.current = reconocimiento;
    reconocimiento.lang = locale === "en" ? "en-US" : "es-ES";
    reconocimiento.onresult = (e) => {
      if (vigente.current) onTexto(e.results[0][0].transcript);
    };
    reconocimiento.onerror = () => {
      if (vigente.current) setFallo(true);
    };
    reconocimiento.onend = () => {
      if (vigente.current) setProcesando(false);
    };
    try {
      reconocimiento.start();
      setProcesando(true);
    } catch {
      setFallo(true);
    }
  }
  return (
    <div className="flex flex-col gap-2">
      {disponible && (
        <button
          type="button"
          disabled={disabled || procesando}
          onClick={() => void (grabando ? detener() : empezar())}
          aria-pressed={grabando}
          className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left font-titulo text-lg font-extrabold transition-colors disabled:opacity-50 ${
            grabando
              ? "border-peligro bg-peligro-claro text-peligro"
              : "border-tinta bg-superficie shadow-[0_3px_0_0_var(--color-tinta)] active:translate-y-[2px] active:shadow-none"
          }`}
        >
          <span className={`relative grid size-12 shrink-0 place-items-center rounded-full text-white ${grabando ? "bg-peligro" : "fondo-ia"}`}>
            {grabando && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-peligro/40" />}
            <svg viewBox="0 0 24 24" className="relative size-6" aria-hidden>
              {grabando ? (
                <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
              ) : (
                <>
                  <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                  <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </svg>
          </span>
          {t(grabando ? "detener" : "grabar")}
        </button>
      )}
      <p className="text-sm text-tinta-suave" role="status">
        {t(procesando ? "transcribiendo" : grabando ? "grabando" : "vozOpcional")}
      </p>
      {fallo && (
        <>
          <p role="alert" className="text-peligro">
            {t("errorVoz")}
          </p>
          <Button type="button" variante="fantasma" disabled={disabled || procesando} onClick={dictar}>
            {t("dictar")}
          </Button>
        </>
      )}
    </div>
  );
}

const suscribir = () => () => {};
