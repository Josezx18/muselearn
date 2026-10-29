import { cn } from "@/components/ui";

export type ExpresionPagi = "hola" | "pensando" | "pista" | "lograste" | "escucho";

const TINTA = "var(--color-tinta)";
const ANCHO_TRAZO = 6;

/**
 * Pagi, la mascota de MuseLearn: una hojita de cuaderno con su lápiz.
 * Dibujo original en SVG (200×200). Es decorativa: por defecto se oculta a los lectores de pantalla;
 * pasa `etiqueta` si la imagen comunica algo que no está en el texto.
 */
export function Pagi({
  expresion = "hola",
  className,
  etiqueta,
  flota = false,
}: {
  expresion?: ExpresionPagi;
  className?: string;
  etiqueta?: string;
  /** Movimiento suave de arriba abajo (se desactiva con "reducir movimiento"). */
  flota?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("shrink-0", flota && "pagi-flota", className)}
      role={etiqueta ? "img" : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    >
      <ellipse cx="100" cy="190" rx="44" ry="6" fill="#1c2b33" opacity=".12" />
      <path d="M82 170v14M118 170v14" stroke={TINTA} strokeWidth={ANCHO_TRAZO} strokeLinecap="round" />
      {/* Brazos */}
      <path d="M50 124q-14 6-16 20" fill="none" stroke={TINTA} strokeWidth={ANCHO_TRAZO} strokeLinecap="round" />
      {expresion === "hola" ? (
        <path d="M150 116q20-6 24-30" fill="none" stroke={TINTA} strokeWidth={ANCHO_TRAZO} strokeLinecap="round" />
      ) : (
        <path d="M150 124q14 6 16 22" fill="none" stroke={TINTA} strokeWidth={ANCHO_TRAZO} strokeLinecap="round" />
      )}
      {/* Hoja cuadriculada con margen rojo y espiral */}
      <rect x="46" y="40" width="108" height="132" rx="14" fill="#fff" stroke={TINTA} strokeWidth={ANCHO_TRAZO} />
      {[58, 75, 92, 109, 126, 143].map((x) => (
        <path key={`v${x}`} d={`M${x} 52v116`} stroke="#dbe7f3" strokeWidth="1.5" />
      ))}
      {[62, 79, 96, 113, 130, 147, 164].map((y) => (
        <path key={`h${y}`} d={`M48 ${y}h104`} stroke="#dbe7f3" strokeWidth="1.5" />
      ))}
      <path d="M64 46v122" stroke="#e9a59b" strokeWidth="2.5" />
      {[62, 82, 102, 122, 142].map((x) => (
        <path key={`e${x}`} d={`M${x} 46v-14a6 6 0 0 1 12 0v6`} fill="none" stroke="#8a97a8" strokeWidth="4" strokeLinecap="round" />
      ))}
      {/* Mejillas */}
      <ellipse cx="69" cy="112" rx="7" ry="4.5" fill="#ff9aa8" opacity=".7" />
      <ellipse cx="131" cy="112" rx="7" ry="4.5" fill="#ff9aa8" opacity=".7" />
      <Cara expresion={expresion} />
      {/* Lápiz: toma el color del tema */}
      <g transform="translate(36 138) rotate(-35)">
        <rect x="-4" y="-34" width="10" height="40" rx="2" fill="var(--color-primario)" stroke={TINTA} strokeWidth="3" />
        <path d="M-4 6L1 18L6 6Z" fill="#f6d7a7" stroke={TINTA} strokeWidth="3" strokeLinejoin="round" />
        <rect x="-4" y="-40" width="10" height="7" rx="2" fill="#ff9aa8" stroke={TINTA} strokeWidth="3" />
      </g>
      <Accesorio expresion={expresion} />
    </svg>
  );
}

function Ojo({ x, tipo }: { x: number; tipo: "normal" | "arriba" | "grande" }) {
  const ry = tipo === "grande" ? 9.6 : 8;
  return (
    <>
      <ellipse cx={x} cy="100" rx={tipo === "grande" ? 7.6 : 6.4} ry={ry} fill={TINTA} />
      <circle cx={tipo === "arriba" ? x + 2 : x + 2.8} cy={tipo === "arriba" ? 95.6 : 96.8} r="2.6" fill="#fff" />
    </>
  );
}

const arcoOjo = (x: number) => `M${x - 8} 102.4Q${x} 90.4 ${x + 8} 102.4`;

function Cara({ expresion }: { expresion: ExpresionPagi }) {
  const trazo = { fill: "none", stroke: TINTA, strokeLinecap: "round" as const };
  switch (expresion) {
    case "pensando":
      return (
        <>
          <Ojo x={82} tipo="arriba" />
          <Ojo x={118} tipo="arriba" />
          <path d="M94 125q8.4 3 15-5" {...trazo} strokeWidth="3" />
        </>
      );
    case "pista":
      return (
        <>
          <Ojo x={82} tipo="normal" />
          <path d="M110 100Q118 92.8 126 100" {...trazo} strokeWidth="4.4" />
          <path d="M91 120q9 10.4 18 0" {...trazo} strokeWidth="3.1" />
        </>
      );
    case "lograste":
      return (
        <>
          <path d={arcoOjo(82)} {...trazo} strokeWidth="4.4" />
          <path d={arcoOjo(118)} {...trazo} strokeWidth="4.4" />
          <path d="M85 116Q100 138.5 115 116Z" fill={TINTA} />
          <path d="M93.4 125Q100 131 106.6 125" fill="#ff8a8a" />
        </>
      );
    case "escucho":
      return (
        <>
          <Ojo x={82} tipo="grande" />
          <Ojo x={118} tipo="grande" />
          <ellipse cx="100" cy="123" rx="5.7" ry="7.3" fill={TINTA} />
        </>
      );
    default:
      return (
        <>
          <Ojo x={82} tipo="normal" />
          <Ojo x={118} tipo="normal" />
          <path d="M91 120q9 10.4 18 0" {...trazo} strokeWidth="3.1" />
        </>
      );
  }
}

const estrella = "M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4Z";

function Accesorio({ expresion }: { expresion: ExpresionPagi }) {
  switch (expresion) {
    case "pensando":
      return (
        <text x="150" y="44" fontFamily="var(--font-titulo)" fontWeight="800" fontSize="34" fill="var(--color-primario)">
          ?
        </text>
      );
    case "pista":
      return (
        <g transform="translate(168 46)">
          <circle r="15" fill="#ffd84d" stroke={TINTA} strokeWidth="3.5" />
          <path d="M-6 17h12M-4 23h8" stroke={TINTA} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M-22-14l-6-5M22-14l6-5M0-24v-7" stroke="#f0a43a" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );
    case "lograste":
      return (
        <>
          {[
            [160, 36, 1],
            [196, 58, 0.7],
            [152, 76, 0.55],
          ].map(([x, y, s]) => (
            <path
              key={x}
              transform={`translate(${x} ${y}) scale(${s})`}
              d={estrella}
              fill="#ffd84d"
              stroke={TINTA}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          ))}
        </>
      );
    case "escucho":
      return (
        <g fill="none" stroke="var(--ia-2)" strokeWidth="4" strokeLinecap="round">
          <path d="M166 90q10 14 0 28" />
          <path d="M177 80q17 24 0 48" opacity=".6" />
        </g>
      );
    default:
      return null;
  }
}
