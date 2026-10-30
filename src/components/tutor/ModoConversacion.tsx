"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ErrorApi, enviarAlTutor } from "@/lib/api-cliente";
import { Mascota } from "@/components/comun/mascotas/Mascota";
import { grabarWav, transcribirConReintento } from "@/components/verificacion/wav";
import { useVozSalida, leerPreferenciasVoz } from "@/lib/voz-salida";
import { AJUSTES_TURNO, nuevoTurno, procesarNivel } from "@/lib/turno-voz";

type Estado = "inicio" | "escuchando" | "pensando" | "hablando" | "pausa";
type Aviso = null | "silencio" | "noTeEscuche" | "sinMicrofono" | "error" | "limite";

/**
 * Conversación por voz con el tutor, como el modo voz de los asistentes: la mascota escucha, detecta
 * cuándo terminaste de hablar, piensa, responde en voz alta y vuelve a escuchar. Sin tocar botones.
 * La voz se transcribe con Muse Voice Transcribe (no se guarda) y la respuesta es la del mismo tutor
 * socrático del chat: la conversación queda en el historial.
 */
export function ModoConversacion({ tareaId }: { tareaId: string }) {
  const t = useTranslations("tutor.conversacion");
  const locale = useLocale();
  const voz = useVozSalida(locale);
  const [estado, setEstado] = useState<Estado>("inicio");
  const [aviso, setAviso] = useState<Aviso>(null);
  const [dicho, setDicho] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [volumen, setVolumen] = useState(0);

  const [audioPendiente, setAudioPendiente] = useState<Blob | null>(null);
  const vigente = useRef(true);
  const turno = useRef(0); // invalida callbacks de turnos anteriores (al interrumpir o pausar)
  const grabacion = useRef<Awaited<ReturnType<typeof grabarWav>> | null>(null);
  const escucharRef = useRef<() => void>(() => {});

  const detenerGrabacion = useCallback(async () => {
    const g = grabacion.current;
    grabacion.current = null;
    return g ? await g.detener() : null;
  }, []);

  useEffect(() => {
    vigente.current = true;
    const turnos = turno;
    return () => {
      vigente.current = false;
      turnos.current++;
      void grabacion.current?.detener();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const responder = useCallback(
    async (wav: Blob, miTurno: number) => {
      setEstado("pensando");
      setVolumen(0);
      try {
        setAudioPendiente(wav);
        const { texto } = await transcribirConReintento(wav, tareaId);
        if (!vigente.current || miTurno !== turno.current) return;
        if (!texto.trim()) {
          setAviso("noTeEscuche");
          setEstado("pausa");
          return;
        }
        setAudioPendiente(null);
        setDicho(texto);
        setRespuesta("");
        let completa = "";
        for await (const trozo of enviarAlTutor(tareaId, texto)) {
          if (!vigente.current || miTurno !== turno.current) return;
          completa += trozo;
          setRespuesta(completa);
        }
        setEstado("hablando");
        const leyo = voz.hablar(completa, {
          forzar: true,
          alTerminar: () => {
            if (vigente.current && miTurno === turno.current) escucharRef.current();
          },
        });
        // Sin voz en el navegador: se muestra el texto y se vuelve a escuchar después de un momento.
        if (!leyo) setTimeout(() => vigente.current && miTurno === turno.current && escucharRef.current(), 2500);
      } catch (e) {
        if (!vigente.current || miTurno !== turno.current) return;
        setAviso(e instanceof ErrorApi && e.codigo.startsWith("limite_diario") ? "limite" : "error");
        setEstado("pausa");
      }
    },
    [tareaId, voz],
  );

  const escuchar = useCallback(async () => {
    const miTurno = ++turno.current;
    voz.callar();
    setEstado("escuchando");
    const vad = nuevoTurno(performance.now());
    const ajustes = {...AJUSTES_TURNO, pausaMs: leerPreferenciasVoz().pausaMs};
    let cerrado = false;
    try {
      grabacion.current = await grabarWav({
        alNivel: (rms) => {
          if (cerrado || miTurno !== turno.current) return;
          setVolumen(rms);
          const d = procesarNivel(vad, rms, performance.now(), ajustes);
          if (d === "seguir") return;
          cerrado = true;
          void (async () => {
            const wav = await detenerGrabacion();
            if (!vigente.current || miTurno !== turno.current) return;
            if (d === "silencio" || !wav) {
              setAviso("silencio");
              setEstado("pausa");
              setVolumen(0);
              return;
            }
            setAviso(null);
            await responder(wav, miTurno);
          })();
        },
      });
      if (!vigente.current || miTurno !== turno.current) { await detenerGrabacion(); return; }
      // La calibración comienza cuando el micrófono está listo, no mientras pide permiso.
      vad.inicio = performance.now();
      setAviso(null);
    } catch {
      setAviso("sinMicrofono");
      setEstado("pausa");
    }
  }, [voz, detenerGrabacion, responder]);

  useEffect(() => {
    escucharRef.current = () => void escuchar();
  }, [escuchar]);

  function pausar() {
    turno.current++;
    voz.callar();
    void detenerGrabacion();
    setVolumen(0);
    setEstado("pausa");
  }

  /** Tocar a la mascota: si habla, la interrumpe y te escucha; si está en pausa, empieza a escuchar. */
  function tocarMascota() {
    if (audioPendiente) return;
    if (estado === "hablando" || estado === "pausa" || estado === "inicio") void escuchar();
  }

  const expresion = estado === "escuchando" ? "escucho" : estado === "pensando" ? "pensando" : estado === "hablando" ? "hola" : "hola";
  const textoEstado =
    estado === "inicio"
      ? t("ayuda")
      : aviso
        ? t(aviso)
        : estado === "pausa"
          ? t("pausa")
          : t(estado as "escuchando" | "pensando" | "hablando");
  const escala = 1 + Math.min(0.25, volumen * 4);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden bg-[#0b1026] text-white">
      {/* Fondo: el degradado del tema, suave */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 fondo-ia [mask-image:radial-gradient(circle_at_50%_40%,black,transparent_70%)]"
      />

      <header className="relative flex items-center justify-between gap-3 px-4 pt-4">
        <h1 className="min-w-0 truncate font-titulo text-base font-bold text-white/90">{t("titulo")}</h1>
        <Link
          href={`/estudiante/tarea/${tareaId}/tutor`}
          className="shrink-0 whitespace-nowrap rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
          onClick={() => pausar()}
        >
          {t("escribir")}
        </Link>
      </header>

      <main className="relative flex shrink-0 flex-1 flex-col items-center justify-center gap-6 px-6">
        <button
          type="button"
          onClick={tocarMascota}
          aria-label={estado === "hablando" ? t("hablando") : t("seguir")}
          className="relative grid place-items-center rounded-full"
        >
          {/* Anillos que siguen tu voz mientras escucha */}
          <span
            aria-hidden
            className="absolute size-64 rounded-full border-4 border-white/15 transition-transform duration-100 sm:size-80"
            style={{ transform: `scale(${estado === "escuchando" ? escala : 1})` }}
          />
          <span
            aria-hidden
            className="absolute size-72 rounded-full border-2 border-white/10 transition-transform duration-150 sm:size-96"
            style={{ transform: `scale(${estado === "escuchando" ? 1 + (escala - 1) * 1.6 : 1})` }}
          />
          <Mascota
            expresion={expresion}
            viva
            hablando={voz.hablando}
            flota={estado !== "escuchando"}
            className="relative size-56 sm:size-72"
          />
        </button>

        <p role="status" aria-live="polite" className="min-h-14 max-w-md text-center font-titulo text-xl font-bold">
          {textoEstado}
        </p>

        {estado === "escuchando" && <label className="w-full max-w-xs">{t("volumen", {n: Math.min(100, Math.round(volumen * 500))})}<meter className="block w-full" min={0} max={100} value={Math.min(100, Math.round(volumen * 500))} aria-label={t("nivelMicrofono")} /></label>}
        {aviso === "sinMicrofono" && <div className="max-w-md text-sm"><p>{t("permisoChrome")}</p><p>{t("permisoSafari")}</p></div>}
        {estado === "pausa" && audioPendiente && <div className="grid gap-3">
          <p role="alert">{t("audioConservado")}</p>
          <button className="min-h-11 rounded-xl bg-white/15 px-4" onClick={() => { const audio = audioPendiente; if (audio) void responder(audio, ++turno.current); }}>{t("reintentarAudio")}</button>
        </div>}
        {/* Subtítulos: lo último que dijiste y lo que responde el tutor */}
        <div className="grid w-full max-w-xl gap-3">
          {dicho && (
            <p className="rounded-2xl bg-white/10 px-4 py-3 text-white/80">
              <span className="block text-xs font-bold text-white/60">{t("tu")}</span>
              {dicho}
            </p>
          )}
          {respuesta && (
            <p className="rounded-2xl bg-white px-4 py-3 text-lg text-[#1c2b33]">
              <span className="block text-xs font-bold text-primario-fuerte">{t("tutor")}</span>
              {respuesta}
            </p>
          )}
        </div>
      </main>

      <footer className="relative flex items-center justify-center gap-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
        {estado === "inicio" ? (
          <button
            type="button"
            onClick={() => void escuchar()}
            className="min-h-14 rounded-full bg-resaltador px-8 font-titulo text-lg font-extrabold text-[#1c2b33] shadow-[0_4px_0_0_#c9a91c] active:translate-y-[2px] active:shadow-none"
          >
            {t("empezar")}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={estado === "pensando" || Boolean(audioPendiente)}
              onClick={() => (estado === "escuchando" || estado === "hablando" ? pausar() : void escuchar())}
              aria-pressed={estado === "escuchando"}
              aria-label={estado === "escuchando" || estado === "hablando" ? t("pausar") : t("seguir")}
              className={`grid size-16 place-items-center rounded-full ${estado === "escuchando" ? "bg-white text-[#1c2b33]" : "bg-white/15 text-white"}`}
            >
              <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
                {estado === "escuchando" || estado === "hablando" ? (
                  <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                ) : (
                  <>
                    <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                    <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
            <Link
              href={`/estudiante/tarea/${tareaId}`}
              onClick={() => pausar()}
              aria-label={t("terminar")}
              className="grid size-16 place-items-center rounded-full bg-peligro text-white"
            >
              <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </Link>
          </>
        )}
      </footer>
    </div>
  );
}
