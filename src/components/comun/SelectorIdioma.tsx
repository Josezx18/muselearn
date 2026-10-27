"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/components/ui";

export function SelectorIdioma({ className }: { className?: string }) {
  const t = useTranslations("comun.idioma");
  const actual = useLocale();
  const router = useRouter();
  const ruta = usePathname();
  const [pendiente, iniciar] = useTransition();

  return (
    <div role="group" aria-label={t("etiqueta")} className={cn("inline-flex rounded-lg border border-borde bg-superficie p-0.5", className)}>
      {routing.locales.map((l: Locale) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={actual === l}
          disabled={pendiente}
          onClick={() => iniciar(() => router.replace(ruta, { locale: l }))}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-bold uppercase",
            actual === l ? "bg-primario text-white" : "text-tinta-suave hover:text-tinta",
          )}
          title={t(l)}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
