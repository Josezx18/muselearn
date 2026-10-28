// Acceso a datos del motor IA (T03). Corre en el servidor con service_role: los endpoints
// comprueban el permiso del usuario ANTES de llamar aquí.
import { AnalisisTarea, PlanSemanal, PreferenciasEstudio, type Idioma } from "@/types/contratos";
import { crearClienteAdmin } from "@/lib/supabase/servidor";
import type { HistorialMateria } from "../analizador";
import type { TareaPlan } from "./algoritmo";
import { esPractica } from "@/lib/practica";

export interface Almacen {
  /** Tareas con análisis, no entregadas, con los minutos ya hechos. */
  cargarTareasPlanificables(estudiante_id: string): Promise<TareaPlan[]>;
  cargarPreferencias(estudiante_id: string): Promise<PreferenciasEstudio | null>;
  guardarPreferencias(p: PreferenciasEstudio): Promise<void>;
  cargarPlan(estudiante_id: string, semana_inicio: string): Promise<PlanSemanal | null>;
  guardarPlan(plan: PlanSemanal): Promise<void>;
  /** Plan (cualquier semana) que contiene el bloque. */
  buscarPlanDeBloque(estudiante_id: string, bloque_id: string): Promise<PlanSemanal | null>;
  cargarAnalisis(estudiante_id: string): Promise<AnalisisTarea[]>;
  guardarAnalisis(a: AnalisisTarea): Promise<void>;
  cargarIdioma(estudiante_id: string): Promise<Idioma>;
  cargarHistorial(estudiante_id: string): Promise<HistorialMateria[]>;
}

function minutosDe(b: { inicio: string; fin: string }): number {
  return (Date.parse(b.fin) - Date.parse(b.inicio)) / 60_000;
}

export function crearAlmacenSupabase(): Almacen {
  const db = crearClienteAdmin();

  async function planesDe(estudiante_id: string): Promise<PlanSemanal[]> {
    const { data, error } = await db.from("planes").select("datos").eq("estudiante_id", estudiante_id);
    if (error) throw new Error(`planes: ${error.message}`);
    return (data ?? []).map((f) => PlanSemanal.parse(f.datos));
  }

  async function minutosHechos(estudiante_id: string): Promise<Map<string, number>> {
    const mapa = new Map<string, number>();
    for (const plan of await planesDe(estudiante_id)) {
      for (const b of plan.bloques) {
        if (b.estado === "hecho" && !esPractica(b.id)) mapa.set(b.tarea_id, (mapa.get(b.tarea_id) ?? 0) + minutosDe(b));
      }
    }
    return mapa;
  }

  return {
    async cargarTareasPlanificables(estudiante_id) {
      const analisis = await this.cargarAnalisis(estudiante_id);
      if (analisis.length === 0) return [];
      const ids = analisis.map((a) => a.tarea_id);
      const [tareas, entregas, hechos] = await Promise.all([
        db.from("tareas").select("id, titulo, fecha_entrega").in("id", ids),
        db.from("entregas").select("tarea_id, estado").eq("estudiante_id", estudiante_id).in("tarea_id", ids),
        minutosHechos(estudiante_id),
      ]);
      if (tareas.error) throw new Error(`tareas: ${tareas.error.message}`);
      if (entregas.error) throw new Error(`entregas: ${entregas.error.message}`);
      const entregadas = new Set((entregas.data ?? []).filter((e) => e.estado !== "pendiente").map((e) => e.tarea_id));
      const porId = new Map((tareas.data ?? []).map((t) => [t.id as string, t]));
      const salida: TareaPlan[] = [];
      for (const a of analisis) {
        const t = porId.get(a.tarea_id);
        if (!t || entregadas.has(a.tarea_id)) continue;
        salida.push({
          tarea_id: a.tarea_id,
          titulo: t.titulo as string,
          fecha_entrega: new Date(t.fecha_entrega as string).toISOString(),
          dificultad: a.dificultad,
          minutos_estimados: a.minutos_estimados,
          prioridad: a.prioridad,
          minutos_hechos: hechos.get(a.tarea_id) ?? 0,
        });
      }
      return salida;
    },

    async cargarPreferencias(estudiante_id) {
      const { data, error } = await db.from("preferencias_estudio").select("datos").eq("estudiante_id", estudiante_id).maybeSingle();
      if (error) throw new Error(`preferencias: ${error.message}`);
      return data ? PreferenciasEstudio.parse(data.datos) : null;
    },

    async guardarPreferencias(p) {
      const { error } = await db.from("preferencias_estudio").upsert({ estudiante_id: p.estudiante_id, datos: p });
      if (error) throw new Error(`preferencias: ${error.message}`);
    },

    async cargarPlan(estudiante_id, semana_inicio) {
      const { data, error } = await db
        .from("planes")
        .select("datos")
        .eq("estudiante_id", estudiante_id)
        .eq("semana_inicio", semana_inicio)
        .maybeSingle();
      if (error) throw new Error(`plan: ${error.message}`);
      return data ? PlanSemanal.parse(data.datos) : null;
    },

    async guardarPlan(plan) {
      const { error } = await db
        .from("planes")
        .upsert({ estudiante_id: plan.estudiante_id, semana_inicio: plan.semana_inicio, datos: plan, actualizado_en: new Date().toISOString() });
      if (error) throw new Error(`plan: ${error.message}`);
    },

    async buscarPlanDeBloque(estudiante_id, bloque_id) {
      return (await planesDe(estudiante_id)).find((p) => p.bloques.some((b) => b.id === bloque_id)) ?? null;
    },

    async cargarAnalisis(estudiante_id) {
      const { data, error } = await db.from("analisis_tareas").select("datos").eq("estudiante_id", estudiante_id);
      if (error) throw new Error(`análisis: ${error.message}`);
      return (data ?? []).map((f) => AnalisisTarea.parse(f.datos));
    },

    async guardarAnalisis(a) {
      const { error } = await db.from("analisis_tareas").upsert({ tarea_id: a.tarea_id, estudiante_id: a.estudiante_id, datos: a });
      if (error) throw new Error(`análisis: ${error.message}`);
    },

    async cargarIdioma(estudiante_id) {
      const { data } = await db.from("perfiles").select("idioma").eq("id", estudiante_id).maybeSingle();
      return data?.idioma === "en" ? "en" : "es";
    },

    // Minutos reales (bloques hechos) vs. estimados en tareas anteriores, con su materia. Si algo falla, sin historial.
    async cargarHistorial(estudiante_id) {
      try {
        const [analisis, hechos] = await Promise.all([this.cargarAnalisis(estudiante_id), minutosHechos(estudiante_id)]);
        const conTrabajo = analisis.filter((a) => (hechos.get(a.tarea_id) ?? 0) > 0);
        if (conTrabajo.length === 0) return [];
        const { data } = await db
          .from("tareas")
          .select("id, titulo, clases(materia)")
          .in("id", conTrabajo.map((a) => a.tarea_id));
        const info = new Map((data ?? []).map((t) => [t.id as string, t]));
        return conTrabajo.flatMap((a) => {
          const t = info.get(a.tarea_id);
          // La relación puede venir como objeto o como lista según el esquema inferido.
          const clase = t?.clases as { materia?: string } | { materia?: string }[] | null | undefined;
          const materia = (Array.isArray(clase) ? clase[0]?.materia : clase?.materia) ?? "";
          return t
            ? [{ titulo: t.titulo as string, materia, minutos_estimados: a.minutos_estimados, minutos_reales: hechos.get(a.tarea_id) ?? 0 }]
            : [];
        });
      } catch (e) {
        console.warn(`[ia] historial no disponible: ${(e as Error).message}`);
        return [];
      }
    },
  };
}
