// IA para el docente: proponer una tarea, sugerir un repaso para la clase y escribir el borrador de un
// comentario a una entrega. Sin base de datos: reciben los datos ya cargados y el llamador (para probarlos).
import {
  BorradorComentario,
  PropuestaTarea,
  SugerenciaRepaso,
  type DetalleEntrega,
  type Idioma,
  type InformeComprension,
  type Tarea,
} from "@/types/contratos";
import {
  llamarMuse as llamarReal,
  type OpcionesLlamada,
  type ResultadoIA,
} from "../cliente";
import {
  PROMPT_BORRADOR_COMENTARIO,
  PROMPT_PROPONER_TAREA,
  PROMPT_SUGERIR_REPASO,
  mensajeComentario,
  mensajePropuesta,
  mensajeRepaso,
} from "../prompts/docente";

export type Llamador = <T>(op: OpcionesLlamada<T>) => Promise<ResultadoIA<T>>;

export interface ClaseIA {
  nombre: string;
  materia: string;
  grado: string;
}

interface Opciones {
  llamar?: Llamador;
  idioma?: Idioma;
  ahora?: Date;
}

export async function proponerTarea(
  clase: ClaseIA,
  pedido: { tema: string; detalles?: string },
  op: Opciones = {},
): Promise<PropuestaTarea> {
  const llamar = op.llamar ?? llamarReal;
  const r = await llamar({
    funcion: "docente",
    sistema: PROMPT_PROPONER_TAREA,
    idioma: op.idioma ?? "es",
    esquema: PropuestaTarea,
    maxTokens: 3000,
    mensajes: [
      {
        role: "user",
        content: mensajePropuesta({
          clase,
          pedido,
          fecha: (op.ahora ?? new Date()).toISOString(),
        }),
      },
    ],
  });
  return PropuestaTarea.parse(r.datos);
}

/** Resumen anónimo por concepto que se envía al modelo (sin nombres ni ids de estudiantes). */
export interface ResumenConcepto {
  concepto: string;
  /** Estudiantes en cada nivel: [Inicial, En proceso, Logrado, Destacado]. */
  niveles: [number, number, number, number];
  /** Hasta 3 evidencias breves de estudiantes en nivel 1-2. */
  dificultades: string[];
}

/**
 * Agrega los informes de la clase por concepto, usando el más reciente de cada estudiante y concepto
 * (como el mapa de calor). Devuelve primero los conceptos con más estudiantes en niveles 1-2.
 */
export function resumirComprension(
  informes: { estudiante_id: string; informe: InformeComprension }[],
): ResumenConcepto[] {
  const ultimo = new Map<string, { nivel: number; evidencia: string }>();
  const ordenados = [...informes].sort((a, b) =>
    a.informe.generado_en.localeCompare(b.informe.generado_en),
  );
  for (const f of ordenados) {
    for (const c of f.informe.por_concepto)
      ultimo.set(JSON.stringify([c.concepto, f.estudiante_id]), {
        nivel: c.nivel,
        evidencia: c.evidencia,
      });
  }
  const porConcepto = new Map<string, ResumenConcepto>();
  for (const [clave, v] of ultimo) {
    const [concepto] = JSON.parse(clave) as [string, string];
    const r = porConcepto.get(concepto) ?? {
      concepto,
      niveles: [0, 0, 0, 0] as [number, number, number, number],
      dificultades: [],
    };
    r.niveles[v.nivel - 1]++;
    if (v.nivel <= 2 && r.dificultades.length < 3 && v.evidencia.trim())
      r.dificultades.push(v.evidencia.trim().slice(0, 200));
    porConcepto.set(concepto, r);
  }
  const bajos = (r: ResumenConcepto) => r.niveles[0] + r.niveles[1];
  return [...porConcepto.values()].sort(
    (a, b) => bajos(b) - bajos(a) || a.concepto.localeCompare(b.concepto),
  );
}

export class SinDatosRepaso extends Error {
  constructor() {
    super("No hay informes de comprensión en esta clase todavía");
    this.name = "SinDatosRepaso";
  }
}

export async function sugerirRepaso(
  clase: ClaseIA,
  informes: { estudiante_id: string; informe: InformeComprension }[],
  op: Opciones & { tarea?: string } = {},
): Promise<SugerenciaRepaso> {
  const conceptos = resumirComprension(informes).slice(0, 10);
  if (!conceptos.length) throw new SinDatosRepaso();
  const llamar = op.llamar ?? llamarReal;
  const estudiantes = new Set(informes.map((f) => f.estudiante_id)).size;
  const r = await llamar({
    funcion: "docente",
    sistema: PROMPT_SUGERIR_REPASO,
    idioma: op.idioma ?? "es",
    esquema: SugerenciaRepaso,
    maxTokens: 3000,
    mensajes: [
      {
        role: "user",
        content: mensajeRepaso({
          clase,
          datos: {
            estudiantes_con_informe: estudiantes,
            tarea: op.tarea ?? "todas las tareas",
            conceptos,
          },
        }),
      },
    ],
  });
  return SugerenciaRepaso.parse(r.datos);
}

export async function borradorComentario(
  tarea: Pick<Tarea, "titulo" | "instrucciones" | "competencias">,
  detalle: DetalleEntrega,
  op: Opciones = {},
): Promise<BorradorComentario> {
  const llamar = op.llamar ?? llamarReal;
  const entrega = {
    texto: detalle.entrega.contenido_texto.slice(0, 6000),
    archivos: detalle.adjuntos.map((a) => a.nombre),
    verificacion: detalle.preguntas.map((p) => ({
      pregunta: p.texto,
      concepto: p.concepto,
      respuesta: p.respuesta,
    })),
    informe: detalle.informe
      ? {
          nivel_global: detalle.informe.nivel_global,
          por_concepto: detalle.informe.por_concepto.map((c) => ({
            concepto: c.concepto,
            nivel: c.nivel,
            evidencia: c.evidencia,
          })),
          fortalezas: detalle.informe.fortalezas,
          debilidades: detalle.informe.debilidades,
        }
      : null,
  };
  const r = await llamar({
    funcion: "docente",
    sistema: PROMPT_BORRADOR_COMENTARIO,
    idioma: op.idioma ?? detalle.estudiante.idioma ?? "es",
    esquema: BorradorComentario,
    maxTokens: 1500,
    mensajes: [
      {
        role: "user",
        content: mensajeComentario({
          tarea: {
            titulo: tarea.titulo,
            instrucciones: tarea.instrucciones.slice(0, 4000),
            competencias: tarea.competencias,
          },
          entrega,
        }),
      },
    ],
  });
  return BorradorComentario.parse(r.datos);
}
