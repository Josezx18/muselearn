// =====================================================================
// MuseLearn — CONTRATOS COMPARTIDOS
// Copia de referencia de src/types/contratos.ts (T00 la coloca allí el día 1).
// CONGELADO: ningún módulo lo edita. Cambios solo vía integrador (ver AGENTS.md).
// =====================================================================
import { z } from "zod";

/** Fecha y hora ISO 8601. Acepta "Z" y desfases como "+00:00" (así las devuelve Postgres/Supabase). */
export const FechaHora = z.iso.datetime({ offset: true });

// ---------- Básicos ----------
export const Rol = z.enum(["docente", "estudiante"]);
export const Idioma = z.enum(["es", "en"]);
export const NivelAyuda = z.enum(["pistas", "ejemplos", "explicacion"]);
export const NivelDominio = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
// 1 Inicial · 2 En proceso · 3 Logrado · 4 Destacado

export const Usuario = z.object({
  id: z.string().uuid(),
  rol: Rol,
  nombre: z.string(),
  idioma: Idioma.default("es"),
});

export const Clase = z.object({
  id: z.string().uuid(),
  docente_id: z.string().uuid(),
  nombre: z.string(),            // "Matemática 4to A"
  materia: z.string(),           // "Matemática"
  grado: z.string(),             // "4to"
  codigo_inscripcion: z.string().length(6),
  creada_en: FechaHora,
});

export const Adjunto = z.object({
  nombre: z.string(),
  ruta: z.string(),              // ruta en Supabase Storage
  tipo_mime: z.string(),
});

// ---------- Tareas (T02) ----------
export const Tarea = z.object({
  id: z.string().uuid(),
  clase_id: z.string().uuid(),
  titulo: z.string(),
  instrucciones: z.string(),
  adjuntos: z.array(Adjunto).default([]),
  fecha_entrega: FechaHora,
  competencias: z.array(z.string()).default([]),   // p. ej. "Resuelve problemas con ecuaciones lineales"
  nivel_ayuda: NivelAyuda.default("pistas"),
  creada_en: FechaHora,
});

export const EstadoEntrega = z.enum(["pendiente", "entregada", "verificando", "verificada"]);

export const Entrega = z.object({
  id: z.string().uuid(),
  tarea_id: z.string().uuid(),
  estudiante_id: z.string().uuid(),
  contenido_texto: z.string().default(""),
  adjuntos: z.array(Adjunto).default([]),
  estado: EstadoEntrega,
  entregada_en: FechaHora.nullable(),
});

// ---------- Motor IA: análisis y plan (T03) ----------
export const AnalisisTarea = z.object({
  tarea_id: z.string().uuid(),
  estudiante_id: z.string().uuid(),
  dificultad: z.number().int().min(1).max(5),
  minutos_estimados: z.number().int().min(5).max(600),
  prioridad: z.number().int().min(0).max(100),     // 100 = hacer ya
  conceptos: z.array(z.string()).min(1).max(8),
  pasos_sugeridos: z.array(z.string()).max(8),     // cómo dividir el trabajo (sin resolver)
  razon: z.string(),                                // explicación breve para el estudiante
});

export const EstadoBloque = z.enum(["planificado", "hecho", "omitido"]);

export const BloquePlan = z.object({
  id: z.string(),
  tarea_id: z.string().uuid(),
  titulo: z.string(),                               // "Química: ejercicios 1-5"
  inicio: FechaHora,
  fin: FechaHora,
  estado: EstadoBloque,
});

export const PlanSemanal = z.object({
  estudiante_id: z.string().uuid(),
  semana_inicio: z.string(),                        // fecha ISO del lunes
  bloques: z.array(BloquePlan),
  avisos: z.array(z.string()),                      // "Llegó Física para el jueves; moví Química al miércoles"
  generado_en: FechaHora,
});

/** Respuesta de "Agregar a mi semana": bloques de práctica creados (de esta semana o la siguiente). */
export const PracticaAgregada = z.object({
  bloques: z.array(BloquePlan),
  sin_ubicar: z.number().int().min(0),              // pasos que no cupieron en las horas libres
  ya_estaba: z.boolean(),                           // la ruta ya se había agregado antes
});

export const PreferenciasEstudio = z.object({
  estudiante_id: z.string().uuid(),
  horas_disponibles: z.array(z.object({             // franjas libres por día
    dia: z.number().int().min(0).max(6),            // 0 = domingo
    desde: z.string(),                              // "15:00"
    hasta: z.string(),                              // "18:00"
  })),
  max_minutos_bloque: z.number().int().default(45),
});

// ---------- Conversación: tutor y verificación (T04) ----------
export const MensajeChat = z.object({
  rol: z.enum(["estudiante", "agente"]),
  contenido: z.string(),
  creado_en: FechaHora,
});

export const PreguntaVerificacion = z.object({
  id: z.string(),
  texto: z.string(),
  concepto: z.string(),                             // concepto que evalúa
  respuesta: z.string().nullable(),                 // transcripción o texto del estudiante
  via: z.enum(["voz", "texto"]).nullable(),
});

export const SesionVerificacion = z.object({
  id: z.string().uuid(),
  entrega_id: z.string().uuid(),
  preguntas: z.array(PreguntaVerificacion).max(6),
  estado: z.enum(["en_curso", "completada"]),
});

// ---------- Informe y ruta (T06 consume; T04 produce el informe) ----------
export const EvaluacionConcepto = z.object({
  concepto: z.string(),
  competencia: z.string().nullable(),
  nivel: NivelDominio,
  evidencia: z.string(),                            // por qué ese nivel (cita breve de lo que dijo)
});

export const InformeComprension = z.object({
  entrega_id: z.string().uuid(),
  nivel_global: NivelDominio,
  por_concepto: z.array(EvaluacionConcepto).min(1),
  fortalezas: z.array(z.string()),
  debilidades: z.array(z.string()),
  resumen_estudiante: z.string(),                   // tono amable, segunda persona
  resumen_docente: z.string(),                      // tono profesional, breve
  generado_en: FechaHora,
});

export const PasoRuta = z.object({
  titulo: z.string(),
  tipo: z.enum(["repaso", "ejercicio", "pregunta", "recurso"]),
  descripcion: z.string(),
  concepto: z.string(),
  minutos: z.number().int().min(5).max(60),
});

export const RutaPractica = z.object({
  entrega_id: z.string().uuid(),
  pasos: z.array(PasoRuta).min(1).max(6),
});

// ---------- Panel docente (T06) ----------
export const CeldaMapaCalor = z.object({
  estudiante_id: z.string().uuid(),
  estudiante_nombre: z.string(),
  concepto: z.string(),
  nivel: NivelDominio.nullable(),                   // null = sin entrega / sin verificar
});

export const MapaComprension = z.object({
  clase_id: z.string().uuid(),
  tarea_id: z.string().uuid().nullable(),           // null = todas las tareas
  conceptos: z.array(z.string()),
  celdas: z.array(CeldaMapaCalor),
  conceptos_a_reforzar: z.array(z.string()),        // los de nivel promedio más bajo
});

// ---------- Perfil y configuración del usuario ----------
export const Tema = z.enum(["cuaderno", "meta", "muse"]);
export const Mascota = z.enum(["pagi", "chispa", "orbi"]);

export const PerfilUsuario = Usuario.extend({
  correo: z.string(),
  tema: Tema.default("muse"),
  mascota: Mascota.default("pagi"),
});

export const CambioPerfil = z
  .object({
    nombre: z.string().trim().min(2).max(80).optional(),
    idioma: Idioma.optional(),
    tema: Tema.optional(),
    mascota: Mascota.optional(),
  })
  .refine((c) => Object.values(c).some((v) => v !== undefined), "sin_cambios");

// ---------- Gestión del docente ----------
export const EdicionTarea = z
  .object({
    titulo: z.string().trim().min(2).max(160).optional(),
    instrucciones: z.string().trim().min(1).max(20000).optional(),
    fecha_entrega: FechaHora.optional(),
    competencias: z.array(z.string().trim().min(1).max(200)).max(12).optional(),
    nivel_ayuda: NivelAyuda.optional(),
  })
  .refine((c) => Object.values(c).some((v) => v !== undefined), "sin_cambios");

/** Lo que el docente ve al abrir una entrega: el trabajo, la verificación y el informe. */
export const DetalleEntrega = z.object({
  entrega: Entrega,
  estudiante: Usuario,
  adjuntos: z.array(Adjunto.extend({ url: z.string().nullable() })), // enlace temporal para ver el archivo
  preguntas: z.array(PreguntaVerificacion),
  informe: InformeComprension.nullable(),
  comentario: z.lazy(() => ComentarioDocente).nullable().default(null),
});

// ---------- IA para el docente ----------
/** Comentario del docente sobre una entrega: lo lee el estudiante. */
export const ComentarioDocente = z.object({
  entrega_id: z.string().uuid(),
  texto: z.string().trim().min(1).max(4000),
  actualizado_en: FechaHora,
});

/** Pedido del docente para que la IA proponga una tarea. */
export const PedidoPropuestaTarea = z.object({
  clase_id: z.string().uuid(),
  tema: z.string().trim().min(3).max(500),          // "ecuaciones de primer grado con fracciones"
  detalles: z.string().trim().max(1500).optional(), // "trabajo en el cuaderno, 5 ejercicios, nivel básico"
});

/** Tarea propuesta por la IA: el docente la revisa y la edita antes de guardarla. */
export const PropuestaTarea = z.object({
  titulo: z.string().trim().min(2).max(160),
  instrucciones: z.string().trim().min(1).max(6000),
  competencias: z.array(z.string().trim().min(1).max(200)).min(1).max(6),
  nivel_ayuda: NivelAyuda,
  minutos_estimados: z.number().int().min(5).max(600),
  razon: z.string().max(600),                       // por qué esa propuesta, para el docente
});

/** Plan de repaso que la IA sugiere a partir del mapa de comprensión de la clase. */
export const SugerenciaRepaso = z.object({
  resumen: z.string().max(800),
  actividades: z
    .array(
      z.object({
        concepto: z.string(),
        por_que: z.string().max(400),               // qué muestran los informes
        actividad: z.string().max(1200),            // qué hacer en clase
        minutos: z.number().int().min(5).max(90),
        agrupacion: z.enum(["toda_la_clase", "grupos", "individual"]),
      }),
    )
    .min(1)
    .max(5),
});

/** Borrador de comentario para una entrega (el docente lo edita antes de guardarlo). */
export const BorradorComentario = z.object({ texto: z.string().trim().min(1).max(2000) });

// ---------- Tipos TS derivados ----------
export type Usuario = z.infer<typeof Usuario>;
export type Clase = z.infer<typeof Clase>;
export type Tarea = z.infer<typeof Tarea>;
export type Entrega = z.infer<typeof Entrega>;
export type AnalisisTarea = z.infer<typeof AnalisisTarea>;
export type BloquePlan = z.infer<typeof BloquePlan>;
export type PlanSemanal = z.infer<typeof PlanSemanal>;
export type PracticaAgregada = z.infer<typeof PracticaAgregada>;
export type PreferenciasEstudio = z.infer<typeof PreferenciasEstudio>;
export type MensajeChat = z.infer<typeof MensajeChat>;
export type SesionVerificacion = z.infer<typeof SesionVerificacion>;
export type InformeComprension = z.infer<typeof InformeComprension>;
export type RutaPractica = z.infer<typeof RutaPractica>;
export type MapaComprension = z.infer<typeof MapaComprension>;
export type Rol = z.infer<typeof Rol>;
export type Idioma = z.infer<typeof Idioma>;
export type NivelAyuda = z.infer<typeof NivelAyuda>;
export type NivelDominio = z.infer<typeof NivelDominio>;
export type Adjunto = z.infer<typeof Adjunto>;
export type EstadoEntrega = z.infer<typeof EstadoEntrega>;
export type EstadoBloque = z.infer<typeof EstadoBloque>;
export type PreguntaVerificacion = z.infer<typeof PreguntaVerificacion>;
export type EvaluacionConcepto = z.infer<typeof EvaluacionConcepto>;
export type PasoRuta = z.infer<typeof PasoRuta>;
export type CeldaMapaCalor = z.infer<typeof CeldaMapaCalor>;
export type Tema = z.infer<typeof Tema>;
export type Mascota = z.infer<typeof Mascota>;
export type PerfilUsuario = z.infer<typeof PerfilUsuario>;
export type CambioPerfil = z.infer<typeof CambioPerfil>;
export type EdicionTarea = z.infer<typeof EdicionTarea>;
export type DetalleEntrega = z.infer<typeof DetalleEntrega>;
export type ComentarioDocente = z.infer<typeof ComentarioDocente>;
export type PedidoPropuestaTarea = z.infer<typeof PedidoPropuestaTarea>;
export type PropuestaTarea = z.infer<typeof PropuestaTarea>;
export type SugerenciaRepaso = z.infer<typeof SugerenciaRepaso>;
export type BorradorComentario = z.infer<typeof BorradorComentario>;
