// Detecta el turno de habla en el modo conversación: cuándo el estudiante empezó a hablar y cuándo terminó.
// Sin dependencias del navegador para poder probarlo.

export interface EstadoTurno {
  inicio: number;
  ruido: number; // nivel de fondo medido al empezar
  muestrasRuido: number;
  hablo: boolean;
  ultimaVoz: number;
  estables: number;
  nivelAnterior: number;
  cambiosVoz: number;
  vozConfirmada: boolean;
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
  return { inicio: ahora, ruido: 0, muestrasRuido: 0, hablo: false, ultimaVoz: ahora, estables: 0, nivelAnterior: 0, cambiosVoz: 0, vozConfirmada: false };
}

/** Procesa un bloque de audio (su volumen RMS) y decide si el turno sigue o terminó. Muta el estado. */
export function procesarNivel(e: EstadoTurno, rms: number, ahora: number, a = AJUSTES_TURNO): Decision {
  if (!Number.isFinite(rms) || rms < 0) return "seguir";
  const t = ahora - e.inicio;
  if (t < a.calibracionMs) {
    e.ruido = (e.ruido * e.muestrasRuido + rms) / (e.muestrasRuido + 1);
    e.muestrasRuido++;
    return "seguir";
  }
  // Un nivel sostenido y estable durante 850 ms es fondo, incluso si ha subido.
  // La voz fluctúa; no se incorpora al fondo mientras sigue variando.
  if (Math.abs(rms - e.nivelAnterior) < Math.max(0.002, rms * 0.08)) e.estables++;
  else e.estables = 0;
  e.nivelAnterior = rms;
  const umbral = Math.max(a.umbralMinimo, e.ruido * a.factorRuido);
  if (rms > umbral && !(e.estables >= 10 && rms < 0.06)) {
    if (e.estables === 0) e.cambiosVoz++;
    if (rms >= 0.06 || e.cambiosVoz >= 4) e.vozConfirmada = true;
    e.hablo = true;
    e.ultimaVoz = ahora;
  }
  if (e.estables >= 10 && rms < 0.06 && !e.vozConfirmada) e.hablo = false;
  if (rms <= umbral || (e.estables >= 10 && rms < 0.06)) e.ruido += (rms - e.ruido) * 0.08;
  if (t > a.maximoMs) return "maximo";
  if (e.hablo && ahora - e.ultimaVoz > a.pausaMs) return "termino";
  if (!e.hablo && t > a.esperaMs) return "silencio";
  return "seguir";
}
