import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { SelectorIdioma } from "@/components/comun/SelectorIdioma";
import { SelectorTema } from "@/components/comun/SelectorTema";
import { marca } from "@/config/marca";
import { Logo } from "@/components/comun/Logo";
import { EnlacesLegales } from "@/components/legal/EnlacesLegales";

// Pantallas públicas: login, registro y unirse a una clase (contenido: T01).
export default function LayoutPublico({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" aria-label={marca.nombre} className="rounded-lg">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <SelectorTema />
          <SelectorIdioma />
        </div>
      </div>
      <main className="flex-1 [&>*]:rounded-2xl">{children}</main>
      <footer className="mt-8 text-sm text-tinta-suave">
        <EnlacesLegales className="justify-center" />
      </footer>
    </div>
  );
}
