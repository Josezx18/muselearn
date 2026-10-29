"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
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
  hrefConversar,
  alTocar,
}: {
  children: ReactNode;
  expresion?: Expresion;
  mensaje?: string;
  hablando?: boolean;
  /** Al tocar la mascota se abre la conversación por voz con ella. */
  hrefConversar?: string;
  /** O hace algo en la misma pantalla (p. ej. leer la pregunta en voz alta). */
  alTocar?: () => void;
}) {
  const t = useTranslations("mascota");
  const router = useRouter();
  const [animo, setAnimo] = useState<string | null>(null);
  const [toque, setToque] = useState(0);
  const accionable = Boolean(hrefConversar || alTocar);

  function tocar() {
    setToque((n) => n + 1);
    if (hrefConversar) return router.push(hrefConversar);
    if (alTocar) return alTocar();
    const frases = t.raw("animo") as string[];
    setAnimo(frases[Math.floor(Math.random() * frases.length)]);
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
        <button key={toque} type="button" onClick={tocar} aria-label={accionable ? t("hablar") : t("tocar")} className="rounded-full">
          <Mascota
            expresion={expresion}
            viva
            hablando={hablando}
            flota={expresion === "hola"}
            className={cn("size-56", toque > 0 && "mascota-toque")}
          />
        </button>
        {accionable && (
          <p className="mt-2 rounded-full bg-primario-claro px-3 py-1 text-sm font-bold text-primario-fuerte">🎙 {t("hablar")}</p>
        )}
      </aside>
    </div>
  );
}

/** La mascota pequeña de las pantallas en el celular, tocable: abre la conversación o hace la acción dada. */
export function MascotaBoton({
  hrefConversar,
  alTocar,
  className,
  ...mascota
}: React.ComponentProps<typeof Mascota> & { hrefConversar?: string; alTocar?: () => void }) {
  const t = useTranslations("mascota");
  const router = useRouter();
  const [toque, setToque] = useState(0);
  if (!hrefConversar && !alTocar) return <Mascota {...mascota} className={className} />;
  return (
    <button
      key={toque}
      type="button"
      aria-label={t("hablar")}
      className="shrink-0 rounded-full"
      onClick={() => {
        setToque((n) => n + 1);
        if (hrefConversar) router.push(hrefConversar);
        else alTocar?.();
      }}
    >
      <Mascota {...mascota} className={cn(className, toque > 0 && "mascota-toque")} />
    </button>
  );
}
