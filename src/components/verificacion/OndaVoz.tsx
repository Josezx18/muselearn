"use client";

import { useState } from "react";

const BARRAS = 28;

/**
 * Onda de voz como en los asistentes de voz: cada barra es un instante reciente del nivel del micrófono y la
 * onda avanza de derecha a izquierda mientras se habla. `nivel` va de 0 a 1. No abre el micrófono: solo dibuja
 * el nivel que ya mide quien graba. Con movimiento reducido, las barras cambian de altura sin transición.
 */
export function OndaVoz({ nivel, etiqueta }: { nivel: number; etiqueta: string }) {
  const [historia, setHistoria] = useState<number[]>(() => Array(BARRAS).fill(0));
  const [ultimo, setUltimo] = useState(nivel);
  // Ajuste de estado durante el render (patrón recomendado por React) en lugar de un efecto.
  if (nivel !== ultimo) {
    setUltimo(nivel);
    setHistoria((h) => [...h.slice(1), Math.max(0, Math.min(1, nivel))]);
  }
  return (
    <div role="img" aria-label={etiqueta} className="flex h-16 w-full max-w-xs items-center justify-center gap-[3px]">
      {historia.map((n, i) => (
        <span
          key={i}
          aria-hidden
          className="w-1.5 rounded-full bg-primario motion-safe:transition-[height] motion-safe:duration-100"
          style={{ height: `${Math.round(6 + n * 58)}px`, opacity: 0.45 + 0.55 * (i / (BARRAS - 1)) }}
        />
      ))}
    </div>
  );
}
