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

export function EntradaVoz({ disabled, onTexto, onOcupado }: { disabled: boolean; onTexto: (texto: string) => void; onOcupado: (valor: boolean) => void }) {
  const t = useTranslations("verificacion");
  const locale = useLocale();
  const [grabando, setGrabando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const disponible = useSyncExternalStore(suscribir, () => Boolean(navigator.mediaDevices?.getUserMedia), () => false);
  const grabacion = useRef<Awaited<ReturnType<typeof grabarWav>> | null>(null);
  const respaldo = useRef<Reconocimiento | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const vigente = useRef(true);
  useEffect(() => { onOcupado(grabando || procesando); }, [grabando, procesando, onOcupado]);
  useEffect(() => {
    vigente.current = true;
    return () => { vigente.current = false; clearTimeout(timer.current); void grabacion.current?.detener(); respaldo.current?.abort(); };
  }, []);
  async function detener() {
    clearTimeout(timer.current);
    setGrabando(false); setProcesando(true);
    try {
      const audio = await grabacion.current?.detener(); grabacion.current = null;
      if (!audio || audio.size <= 44) throw new Error("audio_vacio");
      const { texto } = await transcribirVoz(audio);
      if (vigente.current) onTexto(texto);
    } catch { if (vigente.current) setFallo(true); }
    finally { if (vigente.current) setProcesando(false); }
  }
  async function empezar() {
    setProcesando(true); setFallo(false);
    try {
      const nueva = await grabarWav();
      if (!vigente.current) { await nueva.detener(); return; }
      grabacion.current = nueva; setGrabando(true);
      timer.current = setTimeout(() => void detener(), 120000);
    } catch { setFallo(true); } finally { if (vigente.current) setProcesando(false); }
  }
  function dictar() {
    const navegador = window as NavegadorVoz;
    const Constructor = navegador.SpeechRecognition ?? navegador.webkitSpeechRecognition;
    if (!Constructor) return;
    const reconocimiento = new Constructor(); respaldo.current = reconocimiento;
    reconocimiento.lang = locale === "en" ? "en-US" : "es-ES";
    reconocimiento.onresult = e => { if (vigente.current) onTexto(e.results[0][0].transcript); };
    reconocimiento.onerror = () => { if (vigente.current) setFallo(true); };
    reconocimiento.onend = () => { if (vigente.current) setProcesando(false); };
    try { reconocimiento.start(); setProcesando(true); } catch { setFallo(true); }
  }
  return <div className="flex flex-col gap-2">
    {disponible && <Button type="button" variante="secundario" disabled={disabled || procesando} onClick={() => void (grabando ? detener() : empezar())}>{t(grabando ? "detener" : "grabar")}</Button>}
    <p className="text-sm text-tinta-suave" role="status">{t(procesando ? "transcribiendo" : grabando ? "grabando" : "vozOpcional")}</p>
    {fallo && <><p role="alert" className="text-peligro">{t("errorVoz")}</p><Button type="button" variante="fantasma" disabled={disabled || procesando} onClick={dictar}>{t("dictar")}</Button></>}
  </div>;
}

const suscribir = () => () => {};
