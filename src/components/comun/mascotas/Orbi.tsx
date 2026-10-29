import { Accesorio, Cara, ESTRELLA_PEQUENA, Mejillas, TINTA, type Expresion } from "./partes";

/** Orbi: un orbe de luz con el degradado de Muse. Hace ondas cuando escucha. Dibujo original de MuseLearn. */
export function Orbi({ expresion = "hola", className }: { expresion?: Expresion; className?: string }) {
  const acc = { hola: null, pensando: [148, 46], pista: [162, 44], lograste: [156, 36], escucho: null }[expresion];
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <circle cx="100" cy="100" r="98" fill="url(#ml-orbi-halo)" />
      {expresion === "escucho" && (
        <>
          <circle cx="100" cy="100" r="80" fill="none" stroke="#6a4cf5" strokeWidth="3" opacity=".35" />
          <circle cx="100" cy="100" r="94" fill="none" stroke="#c44fb6" strokeWidth="2.5" opacity=".2" />
        </>
      )}
      <ellipse cx="100" cy="186" rx="36" ry="6" fill="#1c2b33" opacity=".12" />
      <circle cx="100" cy="100" r="64" fill="url(#ml-orbi)" />
      <ellipse cx="78" cy="66" rx="20" ry="11" fill="#fff" opacity=".35" transform="rotate(-25 78 66)" />
      <Mejillas cx={100} cy={112} sep={33} color="#ffb3d9" />
      <Cara expresion={expresion} cx={100} cy={98} sep={18} r={9} w={26} color="#fff" brillo="#6a4cf5" />
      {expresion === "hola" && (
        <path
          transform="translate(150 40) scale(.8)"
          d={ESTRELLA_PEQUENA}
          fill="#ffd84d"
          stroke={TINTA}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}
      {acc && <Accesorio expresion={expresion} x={acc[0]} y={acc[1]} />}
    </svg>
  );
}
