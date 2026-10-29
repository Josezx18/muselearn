import { Accesorio, Cara, ESTRELLA_PEQUENA, Mejillas, TINTA, type Expresion } from "./partes";

/** Chispa: una chispa de resaltador (guiño a Muse Spark). Dibujo original de MuseLearn. */
export function Chispa({ expresion = "hola", className }: { expresion?: Expresion; className?: string }) {
  const acc = { hola: null, pensando: [150, 52], pista: [160, 50], lograste: [150, 40], escucho: [168, 100] }[expresion];
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <circle cx="100" cy="102" r="96" fill="url(#ml-halo)" />
      <ellipse cx="100" cy="186" rx="40" ry="6" fill="#1c2b33" opacity=".12" />
      <path
        d="M100 14C110 58 124 76 172 92C186 97 186 105 172 110C124 126 110 144 100 178C90 144 76 126 28 110C14 105 14 97 28 92C76 76 90 58 100 14Z"
        fill="url(#ml-chispa)"
        stroke={TINTA}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M86 44C92 62 96 70 104 76" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      <Mejillas cx={100} cy={108} sep={30} />
      <Cara expresion={expresion} cx={100} cy={96} sep={17} r={8} w={26} />
      {expresion === "hola" && (
        <path
          transform="translate(158 40) scale(.8)"
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
