import type { ItemNav } from "./Navegacion";

/** Íconos de trazo para la barra inferior en celular (24 px, heredan el color del texto). */
export function IconoNav({ clave }: { clave: ItemNav["clave"] }) {
  const comun = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      {clave === "hoy" && (
        <>
          <circle cx="12" cy="12" r="4" {...comun} />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" {...comun} />
        </>
      )}
      {clave === "semana" && (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" {...comun} />
          <path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2" {...comun} />
        </>
      )}
      {clave === "clases" && (
        <>
          <path d="M4 19.5V6a2 2 0 0 1 2-2h12v15.5H6a2 2 0 0 0-2 2z" {...comun} />
          <path d="M8 8h6M8 11.5h4" {...comun} />
        </>
      )}
      {clave === "tareas" && (
        <>
          <rect x="5" y="4" width="14" height="17" rx="2.5" {...comun} />
          <path d="M9 4.5V3h6v1.5M8.5 11l2 2 4-4M8.5 17h7" {...comun} />
        </>
      )}
      {clave === "comprension" && (
        <>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" {...comun} />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" {...comun} />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" {...comun} />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" fill="currentColor" stroke="currentColor" strokeWidth="2" />
        </>
      )}
      {clave === "inicio" && <path d="M4 11l8-6.5 8 6.5V20H4z M9.5 20v-5h5v5" {...comun} />}
    </svg>
  );
}
