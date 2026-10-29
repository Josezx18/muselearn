"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui";
import { Mascota, type Expresion } from "./Mascota";

/**
 * Pone la mascota al lado del contenido en pantallas grandes (en el celular el contenido ocupa todo
 * y cada pantalla muestra una mascota pequeña arriba). La mascota está viva: parpadea, se mueve según
 * la expresión, mueve la boca cuando la voz habla y reacciona si la tocas.
 */
export function ConMascota({
  children,
  expresion = "hola",
  mensaje,
  hablando = false,
}: {
  children: ReactNode;
  expresion?: Expresion;
  mensaje?: string;
  hablando?: boolean;
}) {
  const t = useTranslations("mascota");
  const [animo, setAnimo] = useState<string | null>(null);
  const [toque, setToque] = useState(0);

  function tocar() {
    const frases = t.raw("animo") as string[];
    setAnimo(frases[Math.floor(Math.random() * frases.length)]);
    setToque((n) => n + 1);
  }

  const texto = animo ?? mensaje;
  return (
    <div className="w-full min-w-0 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start lg:gap-8">
      <div className="min-w-0">{children}</div>
      <aside className="sticky top-24 hidden flex-col items-center lg:flex" onMouseLeave={() => setAnimo(null)}>
        {texto && (
          <p
            key={texto}
            className="aparece relative mb-3 w-full rounded-2xl border-2 border-tinta bg-superficie px-4 py-3 text-center font-titulo text-lg font-bold leading-snug shadow-[4px_4px_0_0_var(--sombra-fuerte)]"
          >
            {texto}
            <span
              aria-hidden
              className="absolute -bottom-[9px] left-1/2 size-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-tinta bg-superficie"
            />
          </p>
        )}
        <button key={toque} type="button" onClick={tocar} aria-label={t("tocar")} className="rounded-full">
          <Mascota
            expresion={expresion}
            viva
            hablando={hablando}
            flota={expresion === "hola"}
            className={cn("size-56", toque > 0 && "mascota-toque")}
          />
        </button>
      </aside>
    </div>
  );
}
