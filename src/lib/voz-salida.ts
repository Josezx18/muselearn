"use client";
// Voz que habla al estudiante (tutor y preguntas de verificación) con la síntesis de voz del navegador.
// Meta no ofrece un modelo de texto a voz; el navegador sí (Chrome/Android, Edge, Safari), sin costo.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const CLAVE = "muselearn-voz";
const oyentes = new Set<() => void>();

/** Preferencias locales compartidas por todas las salidas de voz. */
export interface PreferenciasVoz { voces: Record<string, string>; velocidad: number; pausaMs: number }
export function leerPreferenciasVoz(): PreferenciasVoz {
  const defecto = { voces: {}, velocidad: 1, pausaMs: 1300 };
  try {
    const p = JSON.parse(localStorage.getItem("muselearn-voz-ajustes") ?? "null") as {voces?: unknown; velocidad?: unknown; pausaMs?: unknown} | null;
    return { voces: typeof p?.voces === "object" && p.voces !== null ? Object.fromEntries(Object.entries(p.voces).filter((entrada): entrada is [string, string] => typeof entrada[1] === "string")) : {},
      velocidad: typeof p?.velocidad === "number" && p.velocidad >= 0.8 && p.velocidad <= 1.3 ? p.velocidad : 1,
      pausaMs: typeof p?.pausaMs === "number" && p.pausaMs >= 1000 && p.pausaMs <= 2000 ? p.pausaMs : 1300 };
  } catch { return defecto; }
}
export function guardarPreferenciasVoz(p: PreferenciasVoz): boolean {
  try { localStorage.setItem("muselearn-voz-ajustes", JSON.stringify(p)); oyentes.forEach(o => o()); return true; }
  catch { return false; }
}
export function vocesPorIdioma(voces: SpeechSynthesisVoice[], idioma: "es" | "en") {
  return voces.filter(v => puntuarVoz(v, idioma) >= 0).sort((a,b) => puntuarVoz(b, idioma) - puntuarVoz(a, idioma));
}

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
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/^\s*\[[^\]]+\]:.*$/gm, " ")
    .replace(/(?:https?:\/\/|www\.)\S+/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s*(?:[-+*]|\d+[.)])\s+/gm, "")
    .replace(/^\s*[-=]{3,}\s*$/gm, " ")
    .replace(/[*_#`>~|]/g, "")
    .replace(/[#*0-9]\uFE0F?\u20E3/gu, "")
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\u200D\uFE0F\u20E3]/gu, "")
    .replace(/[\[\]]/g, "")
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
      const preferencias = leerPreferenciasVoz();
      const elegida = vocesPorIdioma(window.speechSynthesis.getVoices(), idioma).find(v => v.voiceURI === preferencias.voces[idioma]) ?? voz.current;
      if (elegida) { u.voice = elegida; u.lang = elegida.lang; }
      u.rate = preferencias.velocidad;
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
