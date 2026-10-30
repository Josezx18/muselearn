"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Button, Card, Skeleton, cn, useToast } from "@/components/ui";
import { actualizarPerfil, guardarPreferencias, obtenerPreferencias, recalcularPlan } from "@/lib/api-cliente";
import {
  MASCOTAS,
  MASCOTA_POR_DEFECTO,
  TEMAS,
  TEMA_POR_DEFECTO,
  aplicarMascota,
  aplicarTema,
  mascotaActual,
  temaActual,
  type Mascota,
  type Tema,
} from "@/lib/tema";
import { Pagi } from "@/components/comun/mascotas/Pagi";
import { Chispa } from "@/components/comun/mascotas/Chispa";
import { Orbi } from "@/components/comun/mascotas/Orbi";
import type { PreferenciasEstudio } from "@/types/contratos";
import { franjasValidas, minutosSemana } from "@/lib/horas";
import { PrivacidadDatos } from "./PrivacidadDatos";

import { leerPreferenciasVoz, guardarPreferenciasVoz, vocesPorIdioma, useVozSalida, type PreferenciasVoz } from "@/lib/voz-salida";

const MUESTRA: Record<Tema, string> = {
  cuaderno: "linear-gradient(135deg, #1f6f5c 0 60%, #ffd84d 60%)",
  meta: "linear-gradient(135deg, #0668e1 0 60%, #ffd84d 60%)",
  muse: "linear-gradient(120deg, #0668e1, #6a4cf5 55%, #c44fb6)",
};
const DIBUJO = { pagi: Pagi, chispa: Chispa, orbi: Orbi };

function suscribir(aviso: () => void) {
  const o = new MutationObserver(aviso);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema", "data-mascota"] });
  return () => o.disconnect();
}

/** Configuración de la cuenta: apariencia (colores y mascota), idioma y, para el estudiante, sus horas de estudio. */
export function PaginaConfiguracion({ rol }: { rol: "docente" | "estudiante" }) {
  const t = useTranslations("cuenta.config");
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-2xl gap-6">
      <header>
        <h1 className="text-4xl font-extrabold">{t("titulo")}</h1>
        <p className="mt-2 text-tinta-suave">{t("intro")}</p>
      </header>
      <Apariencia />
      <Idioma />
      <ConfiguracionVoz />
      {rol === "estudiante" && <HorasDeEstudio />}
      <PrivacidadDatos rol={rol} />
    </div>
  );
}

function Apariencia() {
  const t = useTranslations("cuenta.config");
  const tt = useTranslations("comun.tema");
  const avisar = useToast();
  const tema = useSyncExternalStore(suscribir, temaActual, () => TEMA_POR_DEFECTO);
  const mascota = useSyncExternalStore(suscribir, mascotaActual, () => MASCOTA_POR_DEFECTO);

  async function guardar(cambio: { tema?: Tema; mascota?: Mascota }) {
    if (cambio.tema) aplicarTema(cambio.tema);
    if (cambio.mascota) aplicarMascota(cambio.mascota);
    try {
      await actualizarPerfil(cambio);
      avisar(t("guardado"), "exito");
    } catch {
      avisar(t("error"), "error");
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-bold">{t("apariencia")}</h2>
      <h3 className="mt-4 text-sm font-bold text-tinta-suave">{t("colores")}</h3>
      <div role="radiogroup" aria-label={t("colores")} className="mt-2 grid gap-2 sm:grid-cols-3">
        {TEMAS.map((op) => (
          <button
            key={op}
            type="button"
            role="radio"
            aria-checked={tema === op}
            onClick={() => void guardar({ tema: op })}
            className={cn(
              "flex items-center gap-3 rounded-xl border-2 p-3 text-left",
              tema === op ? "border-primario bg-primario-claro" : "border-borde hover:border-tinta-suave",
            )}
          >
            <span aria-hidden className="size-9 shrink-0 rounded-lg" style={{ background: MUESTRA[op] }} />
            <span className="min-w-0">
              <span className="block font-bold">{tt(`${op}.nombre`)}</span>
              <span className="block text-xs text-tinta-suave">{tt(`${op}.detalle`)}</span>
            </span>
          </button>
        ))}
      </div>
      <h3 className="mt-5 text-sm font-bold text-tinta-suave">{t("mascota")}</h3>
      <div role="radiogroup" aria-label={t("mascota")} className="mt-2 grid grid-cols-3 gap-2">
        {MASCOTAS.map((op) => {
          const Dibujo = DIBUJO[op];
          return (
            <button
              key={op}
              type="button"
              role="radio"
              aria-checked={mascota === op}
              onClick={() => void guardar({ mascota: op })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border-2 p-3 font-bold",
                mascota === op ? "border-primario bg-primario-claro" : "border-borde hover:border-tinta-suave",
              )}
            >
              <Dibujo expresion={mascota === op ? "lograste" : "hola"} className="size-20" />
              {tt(`mascotas.${op}`)}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Idioma() {
  const t = useTranslations("cuenta.config");
  const ti = useTranslations("comun.idioma");
  const actual = useLocale();
  const router = useRouter();
  const ruta = usePathname();
  const [pendiente, iniciar] = useTransition();

  async function cambiar(l: Locale) {
    if (l === actual) return;
    await actualizarPerfil({ idioma: l }).catch(() => undefined);
    iniciar(() => router.replace(ruta, { locale: l }));
  }

  return (
    <Card>
      <h2 className="text-xl font-bold">{t("idioma")}</h2>
      <div role="radiogroup" aria-label={t("idioma")} className="mt-3 flex flex-wrap gap-2">
        {routing.locales.map((l: Locale) => (
          <button
            key={l}
            type="button"
            role="radio"
            lang={l}
            aria-checked={actual === l}
            disabled={pendiente}
            onClick={() => void cambiar(l)}
            className={cn(
              "rounded-xl border-2 px-4 py-2 font-bold",
              actual === l ? "border-primario bg-primario-claro" : "border-borde hover:border-tinta-suave",
            )}
          >
            {ti(l)}
          </button>
        ))}
      </div>
    </Card>
  );
}

type Franja = PreferenciasEstudio["horas_disponibles"][number];
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0]; // lunes primero

function HorasDeEstudio() {
  const t = useTranslations("cuenta.config");
  const avisar = useToast();
  const [prefs, setPrefs] = useState<PreferenciasEstudio | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [invalido, setInvalido] = useState(false);

  useEffect(() => {
    let vivo = true;
    obtenerPreferencias()
      .then((p) => vivo && setPrefs(p))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);

  if (!prefs) return <Skeleton className="h-64" />;
  const franjas = prefs.horas_disponibles;
  const cambiar = (nuevas: Franja[]) => {
    setInvalido(false);
    setPrefs({ ...prefs, horas_disponibles: nuevas });
  };

  async function guardar() {
    if (!prefs) return;
    if (!franjasValidas(prefs.horas_disponibles)) {
      setInvalido(true);
      return;
    }
    setGuardando(true);
    try {
      await guardarPreferencias(prefs);
      await recalcularPlan().catch(() => undefined);
      avisar(t("horas.guardado"), "exito");
    } catch {
      setInvalido(true);
    } finally {
      setGuardando(false);
    }
  }

  const horas = Math.round((minutosSemana(franjas) / 60) * 10) / 10;
  return (
    <Card>
      <h2 className="text-xl font-bold">{t("horas.titulo")}</h2>
      <p className="mt-1 text-tinta-suave">{t("horas.intro")}</p>
      <ul className="mt-4 grid gap-3">
        {ORDEN_DIAS.map((dia) => {
          const delDia = franjas.map((f, i) => ({ f, i })).filter(({ f }) => f.dia === dia);
          return (
            <li key={dia} className="rounded-xl border-2 border-borde p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{t(`dias.${dia}`)}</span>
                <Button variante="fantasma" tamano="sm" onClick={() => cambiar([...franjas, { dia, desde: "15:00", hasta: "17:00" }])}>
                  + {t("horas.agregar")}
                </Button>
              </div>
              {delDia.map(({ f, i }) => (
                <div key={i} className="mt-2 flex flex-wrap items-end gap-2">
                  <label className="grid text-xs font-bold text-tinta-suave">
                    {t("horas.desde")}
                    <input
                      type="time"
                      value={f.desde}
                      step={900}
                      onChange={(e) => cambiar(franjas.map((x, j) => (j === i ? { ...x, desde: e.target.value } : x)))}
                      className="mt-1 min-h-11 rounded-lg border-2 border-borde bg-superficie px-2 text-base text-tinta"
                    />
                  </label>
                  <label className="grid text-xs font-bold text-tinta-suave">
                    {t("horas.hasta")}
                    <input
                      type="time"
                      value={f.hasta}
                      step={900}
                      onChange={(e) => cambiar(franjas.map((x, j) => (j === i ? { ...x, hasta: e.target.value } : x)))}
                      className="mt-1 min-h-11 rounded-lg border-2 border-borde bg-superficie px-2 text-base text-tinta"
                    />
                  </label>
                  <Button variante="fantasma" tamano="sm" onClick={() => cambiar(franjas.filter((_, j) => j !== i))}>
                    {t("horas.quitar")}
                  </Button>
                </div>
              ))}
            </li>
          );
        })}
      </ul>
      <label className="mt-4 grid max-w-xs text-sm font-bold">
        {t("horas.bloque")}
        <select
          value={prefs.max_minutos_bloque}
          onChange={(e) => setPrefs({ ...prefs, max_minutos_bloque: Number(e.target.value) })}
          className="mt-1 min-h-11 rounded-lg border-2 border-borde bg-superficie px-2 text-base font-normal"
        >
          {[20, 30, 45, 60, 90].map((n) => (
            <option key={n} value={n}>
              {t("horas.minutos", { n })}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-4 font-bold">{franjas.length ? t("horas.total", { horas }) : t("horas.sinHoras")}</p>
      {invalido && (
        <p role="alert" className="mt-2 font-bold text-peligro">
          {t("horas.error")}
        </p>
      )}
      <Button className="mt-4" cargando={guardando} disabled={!franjas.length} onClick={() => void guardar()}>
        {t("horas.guardar")}
      </Button>
    </Card>
  );
}

function ConfiguracionVoz() {
  const t = useTranslations("cuenta.voz");
  const locale = useLocale();
  const idioma = locale === "en" ? "en" : "es";
  const voz = useVozSalida(locale);
  const [prefs, setPrefs] = useState<PreferenciasVoz | null>(null);
  const [voces, setVoces] = useState<SpeechSynthesisVoice[]>([]);
  const [guardado, setGuardado] = useState<boolean | null>(null);
  useEffect(() => {
    const actualizar = () => { setPrefs(leerPreferenciasVoz()); setVoces(window.speechSynthesis?.getVoices() ?? []); };
    actualizar();
    window.speechSynthesis?.addEventListener("voiceschanged", actualizar);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", actualizar);
  }, []);
  if (!prefs) return null;
  const opciones = vocesPorIdioma(voces, idioma);
  function cambiar(p: PreferenciasVoz) { setPrefs(p); setGuardado(guardarPreferenciasVoz(p)); }
  return <Card>
    <h2 className="text-xl font-bold">{t("titulo")}</h2>
    <p className="mt-1 text-sm text-tinta-suave">{t("local")}</p>
    <div className="mt-3 grid min-w-0 gap-4">
      <label className="grid min-w-0 gap-1">{t("voz")}
        <select className="min-h-11 w-full min-w-0 rounded-lg border-2 border-borde bg-superficie p-2" value={prefs.voces[idioma] ?? ""} onChange={e => cambiar({...prefs, voces: {...prefs.voces, [idioma]: e.target.value}})}>
          <option value="">{t("recomendada", {nombre: opciones[0]?.name ?? t("sistema")})}</option>
          {opciones.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
        </select>
      </label>
      <label className="grid gap-1">{t("velocidad", {n: prefs.velocidad})}
        <input aria-label={t("ritmo")} type="range" min="0.8" max="1.3" step="0.1" value={prefs.velocidad} onChange={e => cambiar({...prefs, velocidad: Number(e.target.value)})} />
      </label>
      <label className="grid gap-1">{t("pausa", {n: prefs.pausaMs / 1000})}
        <input aria-label={t("despacio")} type="range" min="1000" max="2000" step="100" value={prefs.pausaMs} onChange={e => cambiar({...prefs, pausaMs: Number(e.target.value)})} />
      </label>
      <Button disabled={!voz.disponible} onClick={() => voz.hablar(t("muestra"), {forzar: true})}>{t("probar")}</Button>
      {!voz.disponible && <p>{t("noDisponible")}</p>}
      {guardado !== null && <p role="status">{t(guardado ? "guardado" : "error")}</p>}
    </div>
  </Card>;
}
