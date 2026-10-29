// Detecta el turno de habla en el modo conversación: cuándo el estudiante empezó a hablar y cuándo terminó.
// Sin dependencias del navegador para poder probarlo.

export interface EstadoTurno {
  inicio: number;
  ruido: number; // nivel de fondo medido al empezar
  muestrasRuido: number;
  hablo: boolean;
  ultimaVoz: number;
}

export type Decision = "seguir" | "termino" | "silencio" | "maximo";

export const AJUSTES_TURNO = {
  calibracionMs: 400, // primeros ms: se mide el ruido del salón
  pausaMs: 1300, // silencio después de hablar que cierra el turno
  esperaMs: 12000, // si no habla en este tiempo, se pausa
  maximoMs: 45000, // turno más largo
  umbralMinimo: 0.012,
  factorRuido: 2.5,
};

export function nuevoTurno(ahora: number): EstadoTurno {
  return { inicio: ahora, ruido: 0, muestrasRuido: 0, hablo: false, ultimaVoz: ahora };
}

/** Procesa un bloque de audio (su volumen RMS) y decide si el turno sigue o terminó. Muta el estado. */
export function procesarNivel(e: EstadoTurno, rms: number, ahora: number, a = AJUSTES_TURNO): Decision {
  const t = ahora - e.inicio;
  if (t < a.calibracionMs) {
    e.ruido = (e.ruido * e.muestrasRuido + rms) / (e.muestrasRuido + 1);
    e.muestrasRuido++;
    return "seguir";
  }
  const umbral = Math.max(a.umbralMinimo, e.ruido * a.factorRuido);
  if (rms > umbral) {
    e.hablo = true;
    e.ultimaVoz = ahora;
  }
  if (t > a.maximoMs) return "maximo";
  if (e.hablo && ahora - e.ultimaVoz > a.pausaMs) return "termino";
  if (!e.hablo && t > a.esperaMs) return "silencio";
  return "seguir";
}
