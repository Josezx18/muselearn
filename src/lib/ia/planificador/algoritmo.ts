// Algoritmo determinista del plan semanal (T03): prioridad → franjas libres → bloques ≤ max_minutos.
// Sin IA y sin base de datos: mismas entradas, mismo plan. Las horas se interpretan en la zona
// horaria del centro, dada como desplazamiento fijo respecto a UTC (RD: -240, sin horario de verano).
import type { BloquePlan, PreferenciasEstudio } from "@/types/contratos";

const MIN = 60_000;
const DIA = 24 * 60 * MIN;
export const DESCANSO_MIN = 10;
const BLOQUE_MIN = 15;
const REDONDEO = 5 * MIN;

export interface TareaPlan {
  tarea_id: string;
  titulo: string;
  fecha_entrega: string;
  dificultad: number;
  minutos_estimados: number;
  prioridad: number;
  /** Minutos ya trabajados en bloques "hecho" (de todas las semanas). */
  minutos_hechos: number;
}

export interface EntradaPlan {
  semana_inicio: string; // lunes, yyyy-MM-dd
  tareas: TareaPlan[];
  preferencias: PreferenciasEstudio;
  /** Bloques del plan vigente de esta semana (pueden estar vacíos). */
  bloquesAnteriores: BloquePlan[];
  ahora: Date;
  /** Minutos respecto a UTC de la zona del centro. */
  offsetMin: number;
}

export interface TareaEnRiesgo {
  tarea_id: string;
  titulo: string;
  minutos_sin_ubicar: number;
}

export interface ResultadoPlan {
  bloques: BloquePlan[];
  en_riesgo: TareaEnRiesgo[];
}

interface Intervalo {
  ini: number;
  fin: number;
}

interface Colocado extends Intervalo {
  tarea_id: string;
  dificultad: number;
}

function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) throw new Error(`Hora inválida: ${hhmm}`);
  return h * 60 + m;
}

/** Instante UTC (ms) del lunes `semana_inicio` a las 00:00 locales. */
export function inicioSemanaMs(semana_inicio: string, offsetMin: number): number {
  const ms = Date.parse(`${semana_inicio}T00:00:00Z`);
  if (Number.isNaN(ms)) throw new Error(`semana_inicio inválida: ${semana_inicio}`);
  return ms - offsetMin * MIN;
}

/** Lunes (yyyy-MM-dd) de la semana local que contiene `fecha`. */
export function lunesDe(fecha: Date, offsetMin: number): string {
  const local = new Date(fecha.getTime() + offsetMin * MIN);
  const diasDesdeLunes = (local.getUTCDay() + 6) % 7;
  local.setUTCDate(local.getUTCDate() - diasDesdeLunes);
  return local.toISOString().slice(0, 10);
}

function restar(libres: Intervalo[], quitar: Intervalo): Intervalo[] {
  const salida: Intervalo[] = [];
  for (const l of libres) {
    if (quitar.fin <= l.ini || quitar.ini >= l.fin) {
      salida.push(l);
      continue;
    }
    if (quitar.ini > l.ini) salida.push({ ini: l.ini, fin: quitar.ini });
    if (quitar.fin < l.fin) salida.push({ ini: quitar.fin, fin: l.fin });
  }
  return salida;
}

function franjasDeLaSemana(e: EntradaPlan): Intervalo[] {
  const base = inicioSemanaMs(e.semana_inicio, e.offsetMin);
  const ahora = Math.ceil(e.ahora.getTime() / REDONDEO) * REDONDEO;
  const franjas: Intervalo[] = [];
  for (let i = 0; i < 7; i++) {
    const diaPref = (i + 1) % 7; // i = 0 es lunes; en preferencias 0 es domingo
    for (const h of e.preferencias.horas_disponibles) {
      if (h.dia !== diaPref) continue;
      const ini = Math.max(base + i * DIA + aMinutos(h.desde) * MIN, ahora);
      const fin = base + i * DIA + aMinutos(h.hasta) * MIN;
      if (fin - ini >= BLOQUE_MIN * MIN) franjas.push({ ini, fin });
    }
  }
  return franjas.sort((a, b) => a.ini - b.ini);
}

function idBloque(tarea_id: string, ini: number): string {
  return `${tarea_id.slice(0, 8)}-${Math.floor(ini / MIN)}`;
}

/** Tamaño de cada bloque: ≤ max, y sin dejar un resto absurdo (< 15 min) al final. */
function trozo(restante: number, max: number, hueco: number): number {
  let dur = Math.min(max, restante, hueco);
  const resto = restante - dur;
  if (resto > 0 && resto < BLOQUE_MIN && dur - (BLOQUE_MIN - resto) >= BLOQUE_MIN) dur -= BLOQUE_MIN - resto;
  return dur;
}

export function construirPlan(e: EntradaPlan): ResultadoPlan {
  const max = Math.max(BLOQUE_MIN, e.preferencias.max_minutos_bloque);
  const ahoraMs = e.ahora.getTime();
  const finSemana = inicioSemanaMs(e.semana_inicio, e.offsetMin) + 7 * DIA;
  let libres = franjasDeLaSemana(e);
  const colocados: Colocado[] = [];
  const fijos: BloquePlan[] = [];

  // Lo hecho no se mueve; lo omitido (o vencido sin hacer) queda registrado y su hueco no se reutiliza.
  for (const b of e.bloquesAnteriores) {
    const ini = Date.parse(b.inicio);
    const fin = Date.parse(b.fin);
    let estado = b.estado;
    if (estado === "planificado" && fin < ahoraMs) estado = "omitido";
    if (estado === "planificado") continue; // se vuelve a calcular
    fijos.push({ ...b, estado });
    const holgura = estado === "hecho" ? DESCANSO_MIN * MIN : 0;
    libres = restar(libres, { ini: ini - holgura, fin: fin + holgura });
  }

  const orden = [...e.tareas].sort(
    (a, b) => b.prioridad - a.prioridad || Date.parse(a.fecha_entrega) - Date.parse(b.fecha_entrega),
  );
  const nuevos = new Map<string, Colocado[]>();
  const en_riesgo: TareaEnRiesgo[] = [];

  for (const t of orden) {
    let restante = Math.max(0, t.minutos_estimados - t.minutos_hechos);
    if (restante === 0) continue;
    const entrega = Date.parse(t.fecha_entrega);
    const margen = entrega - DIA; // ideal: terminar un día antes
    const limites = margen > ahoraMs ? [margen, entrega] : [entrega];
    const dificil = t.dificultad >= 4;

    const choca = (ini: number, fin: number) =>
      dificil &&
      colocados.some(
        (c) =>
          c.dificultad >= 4 &&
          c.tarea_id !== t.tarea_id &&
          (Math.abs(ini - c.fin) <= DESCANSO_MIN * MIN || Math.abs(c.ini - fin) <= DESCANSO_MIN * MIN),
      );

    for (const limite of limites) {
      for (const evitarDificiles of [true, false]) {
        if (!dificil && !evitarDificiles) continue;
        while (restante > 0) {
          const i = libres.findIndex((l) => {
            const util = Math.min(l.fin, limite) - l.ini;
            if (util < Math.min(BLOQUE_MIN, restante) * MIN) return false;
            const dur = trozo(restante, max, util / MIN);
            return !(evitarDificiles && choca(l.ini, l.ini + dur * MIN));
          });
          if (i === -1) break;
          const l = libres[i];
          const dur = trozo(restante, max, (Math.min(l.fin, limite) - l.ini) / MIN);
          const bloque: Colocado = { ini: l.ini, fin: l.ini + dur * MIN, tarea_id: t.tarea_id, dificultad: t.dificultad };
          colocados.push(bloque);
          nuevos.set(t.tarea_id, [...(nuevos.get(t.tarea_id) ?? []), bloque]);
          libres = restar(libres, { ini: bloque.ini, fin: bloque.fin + DESCANSO_MIN * MIN });
          restante -= dur;
        }
        if (restante === 0) break;
      }
      if (restante === 0) break;
    }

    // Solo es riesgo si la entrega cae dentro de esta semana; si no, queda para la próxima.
    if (restante > 0 && entrega <= finSemana) {
      en_riesgo.push({ tarea_id: t.tarea_id, titulo: t.titulo, minutos_sin_ubicar: restante });
    }
  }

  const bloques: BloquePlan[] = [...fijos];
  for (const t of e.tareas) {
    const lista = (nuevos.get(t.tarea_id) ?? []).sort((a, b) => a.ini - b.ini);
    lista.forEach((c, n) => {
      bloques.push({
        id: idBloque(t.tarea_id, c.ini),
        tarea_id: t.tarea_id,
        titulo: lista.length > 1 ? `${t.titulo} (${n + 1}/${lista.length})` : t.titulo,
        inicio: new Date(c.ini).toISOString(),
        fin: new Date(c.fin).toISOString(),
        estado: "planificado",
      });
    });
  }
  bloques.sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  return { bloques, en_riesgo };
}
