// Resúmenes del panel de comprensión del docente: por concepto, por tarea, quién necesita apoyo y la ficha
// de cada estudiante. Puros (sin red) para poder probarlos; usan los datos que ya carga el panel.
import type {
  Entrega,
  InformeComprension,
  MapaComprension,
  NivelDominio,
  Tarea,
  Usuario,
} from "@/types/contratos";

export interface InformeDeEstudiante {
  estudiante: string;
  titulo: string;
  informe: InformeComprension;
}

export interface ResumenConceptoClase {
  concepto: string;
  /** Estudiantes en cada nivel 1-4 y sin dato. */
  niveles: Record<NivelDominio, number>;
  sinDato: number;
  promedio: number | null;
}

const vacio = (): Record<NivelDominio, number> => ({ 1: 0, 2: 0, 3: 0, 4: 0 });
const redondear = (n: number) => Math.round(n * 10) / 10;

export function resumenPorConcepto(
  mapa: MapaComprension,
): ResumenConceptoClase[] {
  return mapa.conceptos
    .map((concepto) => {
      const celdas = mapa.celdas.filter((c) => c.concepto === concepto);
      const niveles = vacio();
      let suma = 0;
      let con = 0;
      for (const c of celdas) {
        if (c.nivel === null) continue;
        niveles[c.nivel]++;
        suma += c.nivel;
        con++;
      }
      return {
        concepto,
        niveles,
        sinDato: celdas.length - con,
        promedio: con ? redondear(suma / con) : null,
      };
    })
    .sort(
      (a, b) =>
        (a.promedio ?? 9) - (b.promedio ?? 9) ||
        a.concepto.localeCompare(b.concepto),
    );
}

export interface ResumenTarea {
  tarea: Tarea;
  total: number;
  entregaron: number;
  verificaron: number;
  /** % de los que verificaron con nivel global 3 o 4. */
  comprendieron: number | null;
  promedio: number | null;
  vencida: boolean;
}

export function resumenPorTarea(
  tareas: Tarea[],
  estudiantes: Usuario[],
  entregas: Entrega[],
  informes: InformeDeEstudiante[],
  ahora = new Date(),
): ResumenTarea[] {
  const ids = new Set(estudiantes.map((e) => e.id));
  return tareas
    .map((tarea) => {
      const deTarea = entregas.filter(
        (e) => e.tarea_id === tarea.id && ids.has(e.estudiante_id),
      );
      const entregaron = deTarea.filter((e) => e.estado !== "pendiente").length;
      const idsEntregas = new Set(deTarea.map((e) => e.id));
      const niveles = informes
        .filter((f) => idsEntregas.has(f.informe.entrega_id))
        .map((f) => f.informe.nivel_global);
      return {
        tarea,
        total: estudiantes.length,
        entregaron,
        verificaron: niveles.length,
        comprendieron: niveles.length
          ? Math.round(
              (100 * niveles.filter((n) => n >= 3).length) / niveles.length,
            )
          : null,
        promedio: niveles.length
          ? redondear(niveles.reduce((s, n) => s + n, 0) / niveles.length)
          : null,
        vencida: Date.parse(tarea.fecha_entrega) < ahora.getTime(),
      };
    })
    .sort(
      (a, b) =>
        Date.parse(b.tarea.fecha_entrega) - Date.parse(a.tarea.fecha_entrega),
    );
}

export interface NecesitaApoyo {
  estudiante: Usuario;
  /** Conceptos en nivel 1 o 2 (el informe más reciente). */
  conceptosBajos: string[];
  /** Tareas vencidas que no entregó. */
  sinEntregar: number;
  promedio: number | null;
}

/** Estudiantes con conceptos en nivel 1-2 o tareas vencidas sin entregar, primero los que más lo necesitan. */
export function necesitanApoyo(
  estudiantes: Usuario[],
  mapa: MapaComprension,
  tareas: Tarea[],
  entregas: Entrega[],
  ahora = new Date(),
): NecesitaApoyo[] {
  const vencidas = tareas.filter(
    (t) => Date.parse(t.fecha_entrega) < ahora.getTime(),
  );
  return estudiantes
    .map((estudiante) => {
      const celdas = mapa.celdas.filter(
        (c) => c.estudiante_id === estudiante.id && c.nivel !== null,
      );
      const conceptosBajos = celdas
        .filter((c) => (c.nivel ?? 4) <= 2)
        .map((c) => c.concepto);
      const sinEntregar = vencidas.filter(
        (t) =>
          !entregas.some(
            (e) =>
              e.tarea_id === t.id &&
              e.estudiante_id === estudiante.id &&
              e.estado !== "pendiente",
          ),
      ).length;
      const promedio = celdas.length
        ? redondear(
            celdas.reduce((s, c) => s + (c.nivel ?? 0), 0) / celdas.length,
          )
        : null;
      return { estudiante, conceptosBajos, sinEntregar, promedio };
    })
    .filter((n) => n.conceptosBajos.length > 0 || n.sinEntregar > 0)
    .sort(
      (a, b) =>
        b.conceptosBajos.length +
          b.sinEntregar -
          (a.conceptosBajos.length + a.sinEntregar) ||
        (a.promedio ?? 9) - (b.promedio ?? 9),
    );
}

export interface FichaEstudiante {
  conceptos: { concepto: string; nivel: NivelDominio | null }[];
  tareas: {
    tarea: Tarea;
    entrega: Entrega | null;
    informe: InformeComprension | null;
  }[];
  promedio: number | null;
  entregadas: number;
}

export function fichaEstudiante(
  estudianteId: string,
  mapa: MapaComprension,
  tareas: Tarea[],
  entregas: Entrega[],
  informes: InformeDeEstudiante[],
): FichaEstudiante {
  const conceptos = mapa.conceptos.map((concepto) => ({
    concepto,
    nivel:
      mapa.celdas.find(
        (c) => c.estudiante_id === estudianteId && c.concepto === concepto,
      )?.nivel ?? null,
  }));
  const conDato = conceptos.filter((c) => c.nivel !== null);
  const filas = [...tareas]
    .sort((a, b) => Date.parse(b.fecha_entrega) - Date.parse(a.fecha_entrega))
    .map((tarea) => {
      const entrega =
        entregas.find(
          (e) => e.tarea_id === tarea.id && e.estudiante_id === estudianteId,
        ) ?? null;
      const informe = entrega
        ? (informes.find((f) => f.informe.entrega_id === entrega.id)?.informe ??
          null)
        : null;
      return { tarea, entrega, informe };
    });
  return {
    conceptos,
    tareas: filas,
    promedio: conDato.length
      ? redondear(
          conDato.reduce((s, c) => s + (c.nivel ?? 0), 0) / conDato.length,
        )
      : null,
    entregadas: filas.filter(
      (f) => f.entrega && f.entrega.estado !== "pendiente",
    ).length,
  };
}
