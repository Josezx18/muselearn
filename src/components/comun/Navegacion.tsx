"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/components/ui";
import { SelectorIdioma } from "./SelectorIdioma";
import { Logo } from "./Logo";
import { IconoNav } from "./IconoNav";

export interface ItemNav {
  href: string;
  /** Clave dentro de comun.nav */
  clave: "hoy" | "semana" | "clases" | "tareas" | "comprension" | "inicio";
}

/** Barra superior + barra inferior en celular. Recibe los enlaces según el rol. */
export function Navegacion({ items, accion }: { items: ItemNav[]; accion?: ReactNode }) {
  const t = useTranslations("comun");
  const ruta = usePathname();
  const activo = (href: string) => ruta === href || ruta.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-30 border-b-2 border-borde bg-fondo/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          {/* Con sesión, el logo lleva al inicio del usuario (no a la portada pública). */}
          <Link href={items[0]?.href ?? "/"} aria-label={t("app.nombre")} className="rounded-lg">
            <Logo />
          </Link>
          <nav className="hidden gap-1 sm:flex" aria-label={t("nav.menu")}>
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                aria-current={activo(i.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 font-titulo text-base font-bold",
                  activo(i.href) ? "text-tinta" : "text-tinta-suave hover:text-tinta",
                )}
              >
                <span className={cn(activo(i.href) && "resaltado")}>{t(`nav.${i.clave}`)}</span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <SelectorIdioma />
            {accion}
          </div>
        </div>
      </header>

      <nav
        aria-label={t("nav.menu")}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t-2 border-borde bg-superficie pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={activo(i.href) ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 pb-2 pt-2.5 text-center text-xs font-bold",
              activo(i.href) ? "text-primario-fuerte" : "text-tinta-suave",
            )}
          >
            <span className={cn("rounded-full px-4 py-0.5", activo(i.href) && "bg-resaltador-claro")}>
              <IconoNav clave={i.clave} />
            </span>
            {t(`nav.${i.clave}`)}
          </Link>
        ))}
      </nav>
    </>
  );
}
