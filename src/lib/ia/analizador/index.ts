// Analizador de tareas (T03). Una llamada a Muse por (tarea, estudiante).
import { AnalisisTarea, type Idioma, type Tarea } from "@/types/contratos";
import { llamarMuse as llamarReal, type OpcionesLlamada, type ResultadoIA } from "../cliente";
import { PROMPT_ANALIZADOR, mensajeAnalizador } from "../prompts/analizador";

/** Lo que el modelo devuelve: el análisis sin los ids (los pone el servidor, nunca el modelo). */
export const SalidaAnalisis = AnalisisTarea.omit({ tarea_id: true, estudiante_id: true });

export interface HistorialMateria {
  titulo: string;
  materia: string;
  minutos_estimados: number;
  minutos_reales: number;
}

export interface EstudianteAnalisis {
  id: string;
  grado: string;
  idioma?: Idioma;
  /** Minutos reales vs. estimados en tareas anteriores (si existe). */
  historial?: HistorialMateria[];
}

export type Llamador = <T>(op: OpcionesLlamada<T>) => Promise<ResultadoIA<T>>;

export interface OpcionesAnalisis {
  llamar?: Llamador;
  ahora?: Date;
  /** Materia de la clase de la tarea (ayuda al modelo a contextualizar). */
  materia?: string;
}

export async function analizarTarea(
  tarea: Tarea,
  estudiante: EstudianteAnalisis,
  opciones: OpcionesAnalisis = {},
): Promise<AnalisisTarea> {
  const llamar = opciones.llamar ?? llamarReal;
  const idioma = estudiante.idioma ?? "es";
  const historial = (estudiante.historial ?? []).filter((h) => !opciones.materia || h.materia === opciones.materia);

  const r = await llamar({
    funcion: "analizar",
    sistema: PROMPT_ANALIZADOR,
    idioma,
    esquema: SalidaAnalisis,
    mensajes: [
      {
        role: "user",
        content: mensajeAnalizador({
          fecha: (opciones.ahora ?? new Date()).toISOString(),
          idioma,
          grado: estudiante.grado,
          historial,
          tarea: {
            titulo: tarea.titulo,
            materia: opciones.materia,
            instrucciones: tarea.instrucciones,
            competencias: tarea.competencias,
            fecha_entrega: tarea.fecha_entrega,
            adjuntos: tarea.adjuntos.map((a) => a.nombre),
            donde_se_entrega: tarea.modalidad,
          },
        }),
      },
    ],
  });

  // Los ids vienen de la tarea y del estudiante, y todo se vuelve a validar contra el contrato.
  return AnalisisTarea.parse({ ...r.datos, tarea_id: tarea.id, estudiante_id: estudiante.id });
}
