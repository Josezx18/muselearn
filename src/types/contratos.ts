// =====================================================================
// MuseLearn — CONTRATOS COMPARTIDOS (fuente: .orquesta/contratos/contratos.ts)
// CONGELADO: ningún módulo lo edita. Cambios solo vía integrador (ver AGENTS.md).
// =====================================================================
import { z } from "zod";

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
  creada_en: z.string().datetime(),
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
  fecha_entrega: z.string().datetime(),
  competencias: z.array(z.string()).default([]),   // p. ej. "Resuelve problemas con ecuaciones lineales"
  nivel_ayuda: NivelAyuda.default("pistas"),
  creada_en: z.string().datetime(),
});

export const EstadoEntrega = z.enum(["pendiente", "entregada", "verificando", "verificada"]);

export const Entrega = z.object({
  id: z.string().uuid(),
  tarea_id: z.string().uuid(),
  estudiante_id: z.string().uuid(),
  contenido_texto: z.string().default(""),
  adjuntos: z.array(Adjunto).default([]),
  estado: EstadoEntrega,
  entregada_en: z.string().datetime().nullable(),
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
  inicio: z.string().datetime(),
  fin: z.string().datetime(),
  estado: EstadoBloque,
});

export const PlanSemanal = z.object({
  estudiante_id: z.string().uuid(),
  semana_inicio: z.string(),                        // fecha ISO del lunes
  bloques: z.array(BloquePlan),
  avisos: z.array(z.string()),                      // "Llegó Física para el jueves; moví Química al miércoles"
  generado_en: z.string().datetime(),
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
  creado_en: z.string().datetime(),
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
  generado_en: z.string().datetime(),
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

// ---------- Tipos TS derivados ----------
export type Usuario = z.infer<typeof Usuario>;
export type Clase = z.infer<typeof Clase>;
export type Tarea = z.infer<typeof Tarea>;
export type Entrega = z.infer<typeof Entrega>;
export type AnalisisTarea = z.infer<typeof AnalisisTarea>;
export type BloquePlan = z.infer<typeof BloquePlan>;
export type PlanSemanal = z.infer<typeof PlanSemanal>;
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
