import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { SelectorIdioma } from "@/components/comun/SelectorIdioma";
import { marca } from "@/config/marca";

// Pantallas públicas: login, registro y unirse a una clase (contenido: T01).
export default function LayoutPublico({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-primario">
          {marca.nombre}
        </Link>
        <SelectorIdioma />
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
