"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Casilla obligatoria: "He leído y acepto los Términos de uso y la Política de privacidad". */
export function CasillaTerminos() {
  const t = useTranslations("legal.aceptar");
  const enlace = (href: "/terminos" | "/privacidad", texto: ReactNode) => (
    <Link
      href={href}
      target="_blank"
      className="font-bold text-primario-fuerte underline underline-offset-2"
    >
      {texto}
    </Link>
  );
  return (
    <div className="grid gap-2">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="acepto"
          value="si"
          required
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-primario)]"
        />
        <span>
          {t.rich("casilla", {
            terminos: (texto) => enlace("/terminos", texto),
            privacidad: (texto) => enlace("/privacidad", texto),
          })}
        </span>
      </label>
      <p className="pl-8 text-xs text-tinta-suave">{t("menor")}</p>
    </div>
  );
}
