import { cn } from "@/components/ui";
import { Pagi } from "./Pagi";
import { Chispa } from "./Chispa";
import { Orbi } from "./Orbi";
import type { Expresion } from "./partes";

export type { Expresion } from "./partes";

/**
 * La mascota que eligió el usuario (Pagi, Chispa u Orbi). Se dibujan las tres y el CSS muestra solo la
 * elegida según `data-mascota` en <html>: funciona en componentes de servidor y no parpadea al cargar.
 * Es decorativa: se oculta a los lectores de pantalla salvo que se pase `etiqueta`.
 */
export function Mascota({
  expresion = "hola",
  className,
  flota = false,
  etiqueta,
}: {
  expresion?: Expresion;
  className?: string;
  flota?: boolean;
  etiqueta?: string;
}) {
  return (
    <span
      className={cn("mascota inline-block shrink-0", flota && "pagi-flota", className)}
      role={etiqueta ? "img" : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    >
      <Pagi expresion={expresion} className="mascota-pagi" />
      <Chispa expresion={expresion} className="mascota-chispa" />
      <Orbi expresion={expresion} className="mascota-orbi" />
    </span>
  );
}

/** Degradados que usan Chispa y Orbi. Va una sola vez en el layout (un SVG oculto con display:none no los pintaría). */
export function DefsMascotas() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <radialGradient id="ml-chispa" cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#fff3a6" />
          <stop offset=".55" stopColor="#ffd84d" />
          <stop offset="1" stopColor="#f6b92b" />
        </radialGradient>
        <radialGradient id="ml-halo" r=".5">
          <stop offset="0" stopColor="#6a4cf5" stopOpacity=".22" />
          <stop offset="1" stopColor="#6a4cf5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ml-orbi" cx=".32" cy=".28" r=".85">
          <stop offset="0" stopColor="#7fb4ff" />
          <stop offset=".35" stopColor="#0668e1" />
          <stop offset=".72" stopColor="#6a4cf5" />
          <stop offset="1" stopColor="#c44fb6" />
        </radialGradient>
        <radialGradient id="ml-orbi-halo" r=".5">
          <stop offset=".6" stopColor="#6a4cf5" stopOpacity=".25" />
          <stop offset="1" stopColor="#6a4cf5" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
