"use client";
// Voz que habla al estudiante (tutor y preguntas de verificación) con la síntesis de voz del navegador.
// Meta no ofrece un modelo de texto a voz; el navegador sí (Chrome/Android, Edge, Safari), sin costo.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const CLAVE = "muselearn-voz";
const oyentes = new Set<() => void>();

/** ¿La voz del tutor está activada en este dispositivo? (por defecto, sí) */
function leerActiva(): boolean {
  try {
    return localStorage.getItem(CLAVE) !== "no";
  } catch {
    return true;
  }
}

export function guardarVozActiva(activa: boolean) {
  try {
    localStorage.setItem(CLAVE, activa ? "si" : "no");
  } catch {
    /* el navegador puede bloquear el almacenamiento: queda solo en esta página */
  }
  if (!activa) window.speechSynthesis?.cancel();
  oyentes.forEach((o) => o());
}

function suscribir(aviso: () => void) {
  oyentes.add(aviso);
  return () => oyentes.delete(aviso);
}

/** Puntúa las voces instaladas: primero las naturales/neuronales y el español de América (más cercano a RD). */
export function puntuarVoz(v: { name: string; lang: string; localService?: boolean }, idioma: "es" | "en"): number {
  const lang = v.lang.toLowerCase();
  if (!lang.startsWith(idioma)) return -1;
  let p = 0;
  if (/natural|neural|online/i.test(v.name)) p += 6;
  if (/google/i.test(v.name)) p += 4;
  if (/microsoft/i.test(v.name)) p += 2;
  if (idioma === "es" && /es-(us|mx|419|do|co|ar|cl|pe)/.test(lang)) p += 2;
  if (idioma === "es" && lang === "es-es") p += 1;
  if (idioma === "en" && lang === "en-us") p += 1;
  return p;
}

/** Quita lo que no se debe leer en voz alta (markdown, emojis, URLs). */
export function textoParaVoz(texto: string): string {
  return texto
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_#`>~|]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function useVozSalida(locale: string) {
  const disponible = useSyncExternalStore(
    suscribir,
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false,
  );
  const activa = useSyncExternalStore(suscribir, leerActiva, () => false);
  const [hablando, setHablando] = useState(false);
  const voz = useRef<SpeechSynthesisVoice | null>(null);
  const idioma: "es" | "en" = locale === "en" ? "en" : "es";

  useEffect(() => {
    if (!disponible) return;
    const elegir = () => {
      const voces = window.speechSynthesis.getVoices();
      voz.current =
        voces
          .map((v) => ({ v, p: puntuarVoz(v, idioma) }))
          .filter((x) => x.p >= 0)
          .sort((a, b) => b.p - a.p)[0]?.v ?? null;
    };
    elegir();
    window.speechSynthesis.addEventListener("voiceschanged", elegir);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", elegir);
      window.speechSynthesis.cancel();
    };
  }, [disponible, idioma]);

  const callar = useCallback(() => {
    if (!disponible) return;
    window.speechSynthesis.cancel();
    setHablando(false);
  }, [disponible]);

  /**
   * Lee el texto en voz alta. `forzar` lo lee aunque la voz automática esté apagada (botón "Escuchar").
   * `alTerminar` se llama al acabar o si la voz falla. Devuelve false si no se pudo leer.
   */
  const hablar = useCallback(
    (texto: string, opciones: { forzar?: boolean; alTerminar?: () => void } = {}): boolean => {
      if (!disponible || (!opciones.forzar && !leerActiva())) return false;
      const limpio = textoParaVoz(texto);
      if (!limpio) return false;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(limpio);
      u.lang = voz.current?.lang ?? (idioma === "es" ? "es-US" : "en-US");
      if (voz.current) u.voice = voz.current;
      u.rate = 1;
      u.pitch = 1.05;
      u.onstart = () => setHablando(true);
      u.onend = () => {
        setHablando(false);
        opciones.alTerminar?.();
      };
      u.onerror = () => {
        setHablando(false);
        opciones.alTerminar?.();
      };
      window.speechSynthesis.speak(u);
      return true;
    },
    [disponible, idioma],
  );

  return { disponible, activa, hablando, hablar, callar, activar: guardarVozActiva };
}
