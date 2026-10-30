"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/components/ui";
import { listarAvisos, marcarAvisosLeidos as marcarAvisosLeidosApi } from "@/lib/api-cliente";

interface Aviso {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  enlace: string;
  leido: boolean;
  creado_en: string;
}

export function Campana() {
  const t = useTranslations("avisos");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [noLeidos, setNoLeidos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cargadoInicialRef = useRef(false);

  const cargar = useCallback(async () => {
    try {
      const res = await listarAvisos();
      setAvisos(res.avisos as Aviso[]);
      setNoLeidos(res.noLeidos);
    } catch {
      setAvisos([]);
      setNoLeidos(0);
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga inicial (usamos ref para evitar el warning de setState en effect)
  useEffect(() => {
    if (!cargadoInicialRef.current) {
      cargadoInicialRef.current = true;
      cargar();
    }
  }, [cargar]);

  // Intervalo de actualización cada 60s solo si la pestaña está visible
  useEffect(() => {
    intervaloRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        cargar();
      }
    }, 60_000);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [cargar]);

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && botonRef.current && !botonRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && abierto) {
        setAbierto(false);
        botonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClickFuera);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      document.removeEventListener("keydown", onEscape);
    };
  }, [abierto]);

  const manejarClickAviso = async (aviso: Aviso) => {
    if (!aviso.leido) {
      try {
        await marcarAvisosLeidosApi([aviso.id]);
        setAvisos((prev) => prev.map((a) => (a.id === aviso.id ? { ...a, leido: true } : a)));
        setNoLeidos((prev) => Math.max(0, prev - 1));
      } catch {
      }
    }
    setAbierto(false);
    router.push(aviso.enlace);
  };

  const manejarMarcarTodosLeidos = async () => {
    try {
      await marcarAvisosLeidosApi();
      setAvisos((prev) => prev.map((a) => ({ ...a, leido: true })));
      setNoLeidos(0);
    } catch {
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={botonRef}
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        aria-label={t("campana.etiqueta", { count: noLeidos })}
        className={cn(
          "relative rounded-lg p-2 text-tinta-suave hover:text-tinta hover:bg-borde-suave transition-colors",
          noLeidos > 0 && "text-primario-fuerte"
        )}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {noLeidos > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primario-fuerte px-1.5 text-[10px] font-bold text-blanco">
            {noLeidos > 9 ? "9+" : noLeidos}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border-2 border-borde bg-superficie shadow-lg overflow-hidden z-50 animate-in fade-in-0 zoom-in-95"
          role="listbox"
          aria-label={t("campana.lista")}
        >
          <div className="flex items-center justify-between border-b-2 border-borde px-4 py-3">
            <h3 className="font-titulo font-bold text-tinta">{t("campana.titulo")}</h3>
            {noLeidos > 0 && (
              <button
                onClick={manejarMarcarTodosLeidos}
                className="text-sm text-primario-fuerte hover:underline"
              >
                {t("campana.marcar_todos_leidos")}
              </button>
            )}
          </div>

          {cargando ? (
            <div className="px-4 py-8 text-center text-tinta-suave">{t("campana.cargando")}</div>
          ) : avisos.length === 0 ? (
            <div className="px-4 py-8 text-center text-tinta-suave">{t("campana.sin_avisos")}</div>
          ) : (
            <ul className="max-h-96 overflow-y-auto" role="list">
              {avisos.map((aviso) => (
                <li
                  key={aviso.id}
                  onClick={() => manejarClickAviso(aviso)}
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      manejarClickAviso(aviso);
                    }
                  }}
                  className={cn(
                    "px-4 py-3 hover:bg-borde-suave cursor-pointer transition-colors border-b border-borde-suave last:border-0",
                    !aviso.leido && "bg-resaltador-claro/50 font-medium"
                  )}
                >
                  <p className="text-sm text-tinta">{aviso.titulo}</p>
                  <p className="text-xs text-tinta-suave mt-0.5 truncate">{aviso.enlace}</p>
                  <p className="text-xs text-tinta-suave mt-1">
                    {new Date(aviso.creado_en).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  {!aviso.leido && <span className="inline-block mt-1.5 w-1.5 h-1.5 rounded-full bg-primario-fuerte" aria-hidden="true" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}