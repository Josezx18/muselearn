import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { SelectorIdioma } from "@/components/comun/SelectorIdioma";
import { marca } from "@/config/marca";
import { Logo } from "@/components/comun/Logo";

// Páginas legales públicas (privacidad y términos): más anchas que login/registro, para leer cómodo.
export default function LayoutLegal({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" aria-label={marca.nombre} className="rounded-lg">
          <Logo />
        </Link>
        <SelectorIdioma />
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
