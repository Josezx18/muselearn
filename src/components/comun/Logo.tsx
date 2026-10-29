import { cn } from "@/components/ui";

/** Marca de MuseLearn: un cuadro de cuaderno con el visto bueno del docente. */
export function Logo({ className, conTexto = true }: { className?: string; conTexto?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <defs>
          {/* Colores del tema activo: lisos en "cuaderno" y "meta", degradado en "muse". */}
          <linearGradient id="logo-ia" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--ia-1)" />
            <stop offset=".55" stopColor="var(--ia-2)" />
            <stop offset="1" stopColor="var(--ia-3)" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="url(#logo-ia)" />
        <path d="M11 1.5v29M21 1.5v29M1.5 11h29M1.5 21h29" stroke="#ffffff" strokeOpacity=".18" strokeWidth="1" />
        <path d="M8.5 16.5l5 5 10-11" fill="none" stroke="var(--color-resaltador)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {conTexto && <span className="font-titulo text-xl font-extrabold tracking-tight text-tinta">MuseLearn</span>}
    </span>
  );
}
