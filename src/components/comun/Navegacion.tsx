"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/components/ui";
import { SelectorIdioma } from "./SelectorIdioma";

export interface ItemNav {
  href: string;
  /** Clave dentro de comun.nav */
  clave: "hoy" | "semana" | "clases" | "tareas" | "comprension" | "inicio";
}

/** Barra superior + barra inferior en celular. Recibe los enlaces según el rol. */
export function Navegacion({ items }: { items: ItemNav[] }) {
  const t = useTranslations("comun");
  const ruta = usePathname();
  const activo = (href: string) => ruta === href || ruta.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-borde bg-fondo/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="text-lg font-extrabold tracking-tight text-primario">
            {t("app.nombre")}
          </Link>
          <nav className="hidden gap-1 sm:flex" aria-label={t("nav.menu")}>
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                aria-current={activo(i.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold",
                  activo(i.href) ? "bg-primario-claro text-primario-fuerte" : "text-tinta-suave hover:text-tinta",
                )}
              >
                {t(`nav.${i.clave}`)}
              </Link>
            ))}
          </nav>
          <SelectorIdioma />
        </div>
      </header>

      <nav
        aria-label={t("nav.menu")}
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-borde bg-superficie pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={activo(i.href) ? "page" : undefined}
            className={cn("flex-1 py-3 text-center text-xs font-semibold", activo(i.href) ? "text-primario" : "text-tinta-suave")}
          >
            {t(`nav.${i.clave}`)}
          </Link>
        ))}
      </nav>
    </>
  );
}
