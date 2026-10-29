// Piezas compartidas de las caras de Chispa y Orbi (lienzo de 200×200).
export type Expresion = "hola" | "pensando" | "pista" | "lograste" | "escucho";

export const TINTA = "var(--color-tinta)";

type Ojo = "normal" | "felices" | "guino" | "arriba" | "grandes";

export function Ojos({
  tipo,
  cx,
  cy,
  sep,
  r,
  color = TINTA,
  brillo = "#fff",
}: {
  tipo: Ojo;
  cx: number;
  cy: number;
  sep: number;
  r: number;
  color?: string;
  brillo?: string;
}) {
  const xs = [cx - sep, cx + sep];
  const arco = (x: number, alto: number) => (
    <path
      key={`a${x}`}
      d={`M${x - r} ${cy + r * 0.3}Q${x} ${cy - r * alto} ${x + r} ${cy + r * 0.3}`}
      fill="none"
      stroke={color}
      strokeWidth={r * 0.55}
      strokeLinecap="round"
    />
  );
  const lleno = (x: number, escala = 1, arriba = false) => (
    <g key={`o${x}`}>
      <ellipse cx={x} cy={cy} rx={r * 0.8 * escala} ry={r * escala} fill={color} />
      <circle cx={x + r * (arriba ? 0.25 : 0.35)} cy={cy - r * (arriba ? 0.55 : 0.4)} r={r * 0.32} fill={brillo} />
    </g>
  );
  if (tipo === "felices") return <>{xs.map((x) => arco(x, 1.2))}</>;
  if (tipo === "guino") return <>{[lleno(xs[0]), arco(xs[1], 0.9)]}</>;
  if (tipo === "arriba") return <>{xs.map((x) => lleno(x, 1, true))}</>;
  if (tipo === "grandes") return <>{xs.map((x) => lleno(x, 1.2))}</>;
  return <>{xs.map((x) => lleno(x))}</>;
}

export function Boca({
  tipo,
  cx,
  cy,
  w,
  color = TINTA,
}: {
  tipo: "sonrisa" | "o" | "grande" | "lado";
  cx: number;
  cy: number;
  w: number;
  color?: string;
}) {
  if (tipo === "o") return <ellipse cx={cx} cy={cy + 2} rx={w * 0.22} ry={w * 0.28} fill={color} />;
  if (tipo === "grande")
    return (
      <>
        <path d={`M${cx - w * 0.5} ${cy - 2}Q${cx} ${cy + w * 0.75} ${cx + w * 0.5} ${cy - 2}Z`} fill={color} />
        <path d={`M${cx - w * 0.22} ${cy + w * 0.3}Q${cx} ${cy + w * 0.5} ${cx + w * 0.22} ${cy + w * 0.3}`} fill="#ff8a8a" />
      </>
    );
  if (tipo === "lado")
    return (
      <path
        d={`M${cx - w * 0.25} ${cy + 3}Q${cx + w * 0.1} ${cy + 6} ${cx + w * 0.35} ${cy - 2}`}
        fill="none"
        stroke={color}
        strokeWidth={w * 0.12}
        strokeLinecap="round"
      />
    );
  return (
    <path
      d={`M${cx - w * 0.35} ${cy}Q${cx} ${cy + w * 0.4} ${cx + w * 0.35} ${cy}`}
      fill="none"
      stroke={color}
      strokeWidth={w * 0.12}
      strokeLinecap="round"
    />
  );
}

export function Mejillas({ cx, cy, sep, color = "#ff9aa8" }: { cx: number; cy: number; sep: number; color?: string }) {
  return (
    <>
      <ellipse cx={cx - sep} cy={cy} rx="7" ry="4.5" fill={color} opacity=".7" />
      <ellipse cx={cx + sep} cy={cy} rx="7" ry="4.5" fill={color} opacity=".7" />
    </>
  );
}

/** Cara completa según la expresión. */
export function Cara({
  expresion,
  cx,
  cy,
  sep,
  r,
  w,
  color,
  brillo,
}: {
  expresion: Expresion;
  cx: number;
  cy: number;
  sep: number;
  r: number;
  w: number;
  color?: string;
  brillo?: string;
}) {
  const ojo: Record<Expresion, Ojo> = { hola: "normal", pensando: "arriba", pista: "guino", lograste: "felices", escucho: "grandes" };
  const boca = {
    hola: "sonrisa",
    pensando: "lado",
    pista: "sonrisa",
    lograste: color === "#fff" ? "sonrisa" : "grande",
    escucho: "o",
  } as const;
  const dy = { hola: 18, pensando: 20, pista: 18, lograste: 16, escucho: 19 }[expresion];
  return (
    <>
      <g className={expresion === "lograste" ? undefined : "mascota-ojos"}>
        <Ojos tipo={ojo[expresion]} cx={cx} cy={cy} sep={sep} r={r} color={color} brillo={brillo} />
      </g>
      <g className="mascota-boca">
        <Boca tipo={boca[expresion]} cx={cx} cy={cy + dy} w={expresion === "lograste" && color === "#fff" ? w * 1.3 : w} color={color} />
      </g>
    </>
  );
}

const ESTRELLA = "M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4Z";

/** Accesorio de cada expresión ("?", bombillo, estrellas, ondas) en la posición (x, y). */
export function Accesorio({ expresion, x, y }: { expresion: Expresion; x: number; y: number }) {
  switch (expresion) {
    case "pensando":
      return (
        <text x={x} y={y} fontFamily="var(--font-titulo)" fontWeight="800" fontSize="34" fill="var(--color-primario)">
          ?
        </text>
      );
    case "pista":
      return (
        <g transform={`translate(${x} ${y})`}>
          <circle r="15" fill="#ffd84d" stroke={TINTA} strokeWidth="3.5" />
          <path d="M-6 17h12M-4 23h8" stroke={TINTA} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M-22-14l-6-5M22-14l6-5M0-24v-7" stroke="#f0a43a" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      );
    case "lograste":
      return (
        <>
          {[
            [0, 0, 1],
            [36, 22, 0.7],
            [-8, 40, 0.55],
          ].map(([dx, dy, s]) => (
            <path
              key={dx}
              transform={`translate(${x + dx} ${y + dy}) scale(${s})`}
              d={ESTRELLA}
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
          <path d={`M${x} ${y - 14}q10 14 0 28`} />
          <path d={`M${x + 11} ${y - 24}q17 24 0 48`} opacity=".6" />
        </g>
      );
    default:
      return null;
  }
}

export const ESTRELLA_PEQUENA = ESTRELLA;
