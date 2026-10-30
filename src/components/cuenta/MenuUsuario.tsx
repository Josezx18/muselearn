"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cerrarSesion } from "@/components/auth/acciones";
import { Mascota } from "@/components/comun/mascotas/Mascota";

/** Menú de la cuenta en la cabecera: nombre, Mi perfil, Configuración y Salir. */
export function MenuUsuario({ nombre, rol }: { nombre: string; rol: "docente" | "estudiante" }) {
  const t = useTranslations("cuenta.menu");
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const primerNombre = nombre.split(" ").find((p) => !/^prof\.?$/i.test(p)) ?? nombre;

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", cerrar);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", cerrar);
    };
  }, [abierto]);

  const opcion = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-bold hover:bg-fondo";
  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`${t("abrir")}: ${primerNombre}`}
        onClick={() => setAbierto((a) => !a)}
        className="flex items-center gap-1 rounded-full border border-borde bg-superficie py-1 pl-1 pr-1.5 hover:border-tinta-suave sm:gap-2 sm:pr-3"
      >
        <span
          aria-hidden
          data-inicial={primerNombre.charAt(0).toUpperCase()}
          className="grid size-8 place-items-center rounded-full fondo-ia font-titulo text-sm font-extrabold text-white before:content-[attr(data-inicial)]"
        />
        <span className="hidden max-w-28 truncate text-sm font-bold sm:block">{primerNombre}</span>
        <svg viewBox="0 0 24 24" className="size-4 text-tinta-suave" aria-hidden>
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-40 w-64 rounded-2xl border-2 border-tinta bg-superficie p-2 shadow-[4px_4px_0_0_var(--sombra-fuerte)]"
        >
          <div className="flex items-center gap-3 border-b-2 border-borde px-2 pb-3 pt-1">
            <Mascota expresion="hola" className="size-12" />
            <div className="min-w-0">
              <p className="truncate font-bold">{nombre}</p>
              <p className="text-xs text-tinta-suave">{t(rol)}</p>
            </div>
          </div>
          <div className="pt-2">
            <Link role="menuitem" href={`/${rol}/perfil`} className={opcion} onClick={() => setAbierto(false)}>
              <Icono d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0" />
              {t("perfil")}
            </Link>
            <Link role="menuitem" href={`/${rol}/configuracion`} className={opcion} onClick={() => setAbierto(false)}>
              <Icono d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              {t("configuracion")}
            </Link>
            <form action={cerrarSesion}>
              <button type="submit" role="menuitem" className={`${opcion} text-peligro`}>
                <Icono d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" />
                {t("salir")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Icono({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
