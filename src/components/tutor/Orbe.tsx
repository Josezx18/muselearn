"use client";

/** Orbe decorativo: el estado accesible se anuncia una sola vez junto al control. */
export function Orbe({ estado, volumen, palabra }: { estado: string; volumen: number; palabra: number }) {
  return <span aria-hidden="true" className="orbe-marco relative grid size-56 place-items-center sm:size-72">
    <span className={`orbe size-44 rounded-full sm:size-56 ${estado}`} style={{ transform: `scale(${estado === "escuchando" ? 1 + Math.min(.2, volumen * 3) : 1 + (palabra % 2) * .025})` }} />
    <style jsx>{`
      .orbe { background: radial-gradient(circle at 30% 25%, #fff 0%, #a6eaff 20%, #688aff 48%, #784bda 76%, #20164d 100%); box-shadow: 0 0 48px #82aaff55, inset -12px -12px 30px #26155866; transition: transform 120ms ease; }
      .pensando { animation: pulso 2.4s ease-in-out infinite; }
      .hablando { animation: onda 1.1s ease-in-out infinite alternate; }
      @keyframes pulso { 50% { opacity: .7; scale: .94; } }
      @keyframes onda { to { border-radius: 44% 56% 53% 47%; scale: 1.04; } }
      @media (prefers-reduced-motion: reduce) { .orbe { animation: none; transition: none; transform: none !important; } }
    `}</style>
  </span>;
}
