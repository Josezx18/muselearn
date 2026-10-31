"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/components/ui";
import { Mascota, type Expresion } from "./Mascota";

/**
 * Sidebar con la mascota para escritorio. No envuelve el contenido principal.
 * Se usa con dynamic import ssr:false para no bloquear el renderizado inicial.
 */
export function MascotaSidebar({
  expresion = "hola",
  mensaje,
  hrefConversar,
  alTocar,
}: {
  expresion?: Expresion;
  mensaje?: string;
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
    <aside className="sticky top-24 flex flex-col items-center" onMouseLeave={() => setAnimo(null)}>
      {texto && (
        <p
          key={texto}
          className="aparece relative mb-3 w-full max-w-xs rounded-2xl border-2 border-tinta bg-superficie px-4 py-3 text-center font-titulo text-lg font-bold leading-snug shadow-[4px_4px_0_0_var(--sombra-fuerte)]"
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
          hablando={false}
          flota={expresion === "hola"}
          className={cn("size-56", toque > 0 && "mascota-toque")}
        />
      </button>
      {accionable && (
        <p className="mt-2 rounded-full bg-primario-claro px-3 py-1 text-sm font-bold text-primario-fuerte">🎙 {t("hablar")}</p>
      )}
    </aside>
  );
}