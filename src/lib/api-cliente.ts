// =====================================================================
// MuseLearn — cliente de API para el FRONTEND (T00, congelado).
// Una función por endpoint de .orquesta/contratos/api.md. Cada respuesta se valida con Zod.
// Con NEXT_PUBLIC_USAR_MOCKS=true devuelve los datos de src/lib/mocks sin llamar al servidor.
// =====================================================================
import { z } from "zod";
import {
  Adjunto,
  AnalisisTarea,
  BloquePlan,
  BorradorComentario,
  Clase,
  ComentarioDocente,
  DetalleEntrega,
  Entrega,
  EstadoBloque,
  InformeComprension,
  MapaComprension,
  MensajeChat,
  PerfilUsuario,
  PlanSemanal,
  PracticaAgregada,
  PreferenciasEstudio,
  PreguntaVerificacion,
  PropuestaTarea,
  RutaPractica,
  SugerenciaRepaso,
  SesionVerificacion,
  Tarea,
  Usuario,
} from "@/types/contratos";
import { ESTUDIANTE_ACTUAL } from "./mocks/base";
import type { CambioPerfil, EdicionTarea, PedidoPropuestaTarea } from "@/types/contratos";
import { clasesMock, usuariosMock } from "./mocks/clases";
import { entregasMock, tareasMock } from "./mocks/tareas";
import { analisisMock, planSemanalMock } from "./mocks/ia";
import { mensajesTutorMock, sesionVerificacionMock } from "./mocks/conversacion";
import { informeMock, mapaComprensionMock, rutaMock } from "./mocks/informes";

export const usarMocks = () => process.env.NEXT_PUBLIC_USAR_MOCKS === "true";

export class ErrorApi extends Error {
  constructor(
    public readonly estado: number,
    public readonly codigo: string,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function mock<T>(valor: T, ms = 300): Promise<T> {
  await esperar(ms);
  return structuredClone(valor);
}

async function pedir<T>(ruta: string, esquema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const r = await fetch(ruta, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  const cuerpo = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) {
    const e = (cuerpo as { error?: { codigo?: string; mensaje?: string } } | null)?.error;
    throw new ErrorApi(r.status, e?.codigo ?? "error", e?.mensaje ?? `Error ${r.status}`);
  }
  return esquema.parse(cuerpo);
}

const json = (datos: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(datos) });

// ---------------- T01 — clases ----------------
export const crearClase = (datos: { nombre: string; materia: string; grado: string }) =>
  usarMocks() ? mock({ ...clasesMock[0], ...datos }) : pedir("/api/clases", Clase, json(datos));

export const listarClases = () => (usarMocks() ? mock(clasesMock) : pedir("/api/clases", z.array(Clase)));

export const unirseAClase = (codigo: string) =>
  usarMocks()
    ? mock(clasesMock.find((c) => c.codigo_inscripcion === codigo.toUpperCase()) ?? clasesMock[0])
    : pedir("/api/clases/unirse", Clase, json({ codigo }));

export const listarEstudiantes = (claseId: string) =>
  usarMocks() ? mock(usuariosMock.filter((u) => u.rol === "estudiante")) : pedir(`/api/clases/${claseId}/estudiantes`, z.array(Usuario));

// ---------------- T02 — tareas y entregas ----------------
export type NuevaTarea = Omit<Tarea, "id" | "creada_en">;

export const crearTarea = (datos: NuevaTarea) =>
  usarMocks()
    ? mock({ ...datos, id: crypto.randomUUID(), creada_en: new Date().toISOString() } as Tarea)
    : pedir("/api/tareas", Tarea, json(datos));

export const listarTareas = (claseId?: string) =>
  usarMocks()
    ? mock(claseId ? tareasMock.filter((t) => t.clase_id === claseId) : tareasMock)
    : pedir(`/api/tareas${claseId ? `?clase_id=${encodeURIComponent(claseId)}` : ""}`, z.array(Tarea));

export const obtenerTarea = (id: string) =>
  usarMocks() ? mock(tareasMock.find((t) => t.id === id) ?? tareasMock[0]) : pedir(`/api/tareas/${id}`, Tarea);

export const subirAdjuntoTarea = (tareaId: string, archivo: File) => {
  if (usarMocks()) return mock({ nombre: archivo.name, ruta: `mock/${archivo.name}`, tipo_mime: archivo.type });
  const datos = new FormData();
  datos.append("archivo", archivo);
  return pedir(`/api/tareas/${tareaId}/adjuntos`, Adjunto, { method: "POST", body: datos });
};

/** El estudiante sube una foto del cuaderno o un archivo antes de entregar. Devuelve el Adjunto para `entregar`. */
export const subirAdjuntoEntrega = (tareaId: string, archivo: File) => {
  if (usarMocks())
    return mock({ nombre: archivo.name, ruta: `entregas/${tareaId}/${ESTUDIANTE_ACTUAL}/${archivo.name}`, tipo_mime: archivo.type });
  const datos = new FormData();
  datos.append("tarea_id", tareaId);
  datos.append("archivo", archivo);
  return pedir("/api/entregas/adjuntos", Adjunto, { method: "POST", body: datos });
};

export const entregar = (datos: { tarea_id: string; contenido_texto: string; adjuntos: Adjunto[] }) =>
  usarMocks()
    ? mock({
        id: crypto.randomUUID(),
        estudiante_id: ESTUDIANTE_ACTUAL,
        estado: "entregada",
        entregada_en: new Date().toISOString(),
        ...datos,
      } as Entrega)
    : pedir("/api/entregas", Entrega, json(datos));

export const listarEntregas = (tareaId: string) =>
  usarMocks()
    ? mock(entregasMock.filter((e) => e.tarea_id === tareaId))
    : pedir(`/api/entregas?tarea_id=${encodeURIComponent(tareaId)}`, z.array(Entrega));

// ---------------- T03 — análisis y plan ----------------
export const analizarTarea = (tarea_id: string, estudiante_id: string) =>
  usarMocks()
    ? mock(analisisMock.find((a) => a.tarea_id === tarea_id) ?? analisisMock[0], 900)
    : pedir("/api/ia/analizar", AnalisisTarea, json({ tarea_id, estudiante_id }));

export const listarAnalisis = (estudianteId: string) =>
  usarMocks() ? mock(analisisMock) : pedir(`/api/ia/analisis?estudiante_id=${encodeURIComponent(estudianteId)}`, z.array(AnalisisTarea));

export const obtenerPlan = (semana_inicio?: string) =>
  usarMocks() ? mock(planSemanalMock) : pedir(`/api/ia/plan${semana_inicio ? `?semana_inicio=${semana_inicio}` : ""}`, PlanSemanal);

export const recalcularPlan = (semana_inicio?: string) =>
  usarMocks() ? mock(planSemanalMock, 1200) : pedir("/api/ia/plan", PlanSemanal, json({ semana_inicio }));

export const actualizarBloque = (id: string, estado: EstadoBloque) =>
  usarMocks()
    ? mock({ ...(planSemanalMock.bloques.find((b) => b.id === id) ?? planSemanalMock.bloques[0]), estado })
    : pedir(`/api/ia/plan/bloques/${id}`, BloquePlan, { method: "PATCH", body: JSON.stringify({ estado }) });

export const guardarPreferencias = (p: PreferenciasEstudio) =>
  usarMocks() ? mock(p) : pedir("/api/preferencias", PreferenciasEstudio, { method: "PUT", body: JSON.stringify(p) });

// ---------------- T04 — tutor y verificación ----------------
/** Envía un mensaje al tutor y devuelve la respuesta en partes (stream de texto). */
export async function* enviarAlTutor(tarea_id: string, mensaje: string): AsyncGenerator<string> {
  if (usarMocks()) {
    const respuesta = "Buena pregunta. Antes de seguir: ¿qué operación está haciendo el número que acompaña a la x?";
    for (const palabra of respuesta.split(" ")) {
      await esperar(60);
      yield `${palabra} `;
    }
    return;
  }
  const r = await fetch("/api/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tarea_id, mensaje }),
  });
  if (!r.ok || !r.body) {
    const e = (await r.json().catch(() => null)) as { error?: { codigo?: string } } | null;
    throw new ErrorApi(r.status, e?.error?.codigo ?? "tutor", `Error ${r.status}`);
  }
  const lector = r.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { value, done } = await lector.read();
    if (done) return;
    if (value) yield value;
  }
}

export const historialTutor = (tarea_id: string) =>
  usarMocks() ? mock(mensajesTutorMock) : pedir(`/api/tutor?tarea_id=${encodeURIComponent(tarea_id)}`, z.array(MensajeChat));

export const iniciarVerificacion = (entrega_id: string) =>
  usarMocks()
    ? mock(
        {
          ...sesionVerificacionMock,
          entrega_id,
          estado: "en_curso",
          preguntas: [{ ...sesionVerificacionMock.preguntas[0], respuesta: null, via: null }],
        } as SesionVerificacion,
        900,
      )
    : pedir("/api/verificacion/iniciar", SesionVerificacion, json({ entrega_id }));

export const RespuestaVerificacion = z.union([z.object({ siguiente: PreguntaVerificacion }), z.object({ informe: InformeComprension })]);
export type RespuestaVerificacion = z.infer<typeof RespuestaVerificacion>;

export const responderVerificacion = (datos: { sesion_id: string; pregunta_id: string; respuesta: string; via: "voz" | "texto" }) => {
  if (usarMocks()) {
    const i = sesionVerificacionMock.preguntas.findIndex((p) => p.id === datos.pregunta_id);
    const siguiente = sesionVerificacionMock.preguntas[i + 1];
    return mock<RespuestaVerificacion>(
      siguiente ? { siguiente: { ...siguiente, respuesta: null, via: null } } : { informe: informeMock },
      900,
    );
  }
  return pedir("/api/verificacion/responder", RespuestaVerificacion, json(datos));
};

/** Audio WAV (mono, 16 bits, 24 kHz) → texto. Con tareaId, el servidor usa los conceptos de la tarea como palabras clave. */
export const transcribirVoz = (audio: Blob, tareaId?: string) => {
  if (usarMocks()) return mock({ texto: "Porque está sumando, entonces resto en los dos lados." }, 700);
  const datos = new FormData();
  datos.append("audio", audio, "respuesta.wav");
  if (tareaId) datos.append("tarea_id", tareaId);
  return pedir("/api/voz/transcribir", z.object({ texto: z.string() }), { method: "POST", body: datos });
};

// ---------------- T06 — informes y panel docente ----------------
export const InformeConRuta = z.object({
  informe: InformeComprension,
  ruta: RutaPractica.nullable(),
  tarea_id: z.string().uuid().optional(),
});

export const obtenerInforme = (entrega_id: string) =>
  usarMocks()
    ? mock({ informe: informeMock, ruta: rutaMock, tarea_id: tareasMock[0].id })
    : pedir(`/api/informes/${entrega_id}`, InformeConRuta);

/** "Agregar a mi semana": coloca los pasos de la ruta de práctica en el plan del estudiante. */
export const agregarRutaASemana = (entrega_id: string) =>
  usarMocks() ? mock(practicaMock(entrega_id), 800) : pedir(`/api/informes/${entrega_id}/semana`, PracticaAgregada, { method: "POST" });

function practicaMock(entrega_id: string): PracticaAgregada {
  const dia = new Date();
  dia.setHours(17, 0, 0, 0);
  const bloques = rutaMock.pasos.map((p, i) => {
    const inicio = new Date(dia.getTime() + (i + 1) * 86_400_000);
    return {
      id: `practica-${entrega_id}-${i}`,
      tarea_id: tareasMock[0].id,
      titulo: `Práctica: ${p.titulo}`,
      inicio: inicio.toISOString(),
      fin: new Date(inicio.getTime() + p.minutos * 60_000).toISOString(),
      estado: "planificado" as const,
    };
  });
  return { bloques, sin_ubicar: 0, ya_estaba: false };
}

export const obtenerMapaComprension = (clase_id: string, tarea_id?: string) =>
  usarMocks()
    ? mock(mapaComprensionMock)
    : pedir(
        `/api/docente/comprension?clase_id=${encodeURIComponent(clase_id)}${tarea_id ? `&tarea_id=${encodeURIComponent(tarea_id)}` : ""}`,
        MapaComprension,
      );

// T06: composición de endpoints existentes para indicadores y resúmenes docentes.
export async function cargarComprension(claseId: string, tareaId?: string) {
  if (usarMocks()) {
    const { panelComprensionMock } = await import("./mocks/informes");
    return mock(panelComprensionMock(claseId, tareaId));
  }
  const [tareas, estudiantes, mapa] = await Promise.all([
    listarTareas(claseId),
    listarEstudiantes(claseId),
    obtenerMapaComprension(claseId, tareaId),
  ]);
  const entregas = (await Promise.all(tareas.filter((t) => !tareaId || t.id === tareaId).map((t) => listarEntregas(t.id)))).flat();
  const informes = await Promise.all(
    entregas
      .filter((e) => e.estado === "verificada")
      .map(async (e) => ({
        estudiante: e.estudiante_id,
        titulo: tareas.find((t) => t.id === e.tarea_id)?.titulo ?? "",
        informe: (await obtenerInforme(e.id)).informe,
      })),
  );
  return { tareas, estudiantes, mapa, entregas, informes };
}

// ---------------- Perfil y configuración ----------------
function perfilMock(): PerfilUsuario {
  const docente = typeof window !== "undefined" && window.location.pathname.includes("/docente");
  const u = usuariosMock.find((x) => x.rol === (docente ? "docente" : "estudiante")) ?? usuariosMock[0];
  return { ...u, correo: docente ? "docente@muselearn.demo" : "camila@muselearn.demo", tema: "muse", mascota: "pagi" };
}

export const obtenerPerfil = () => (usarMocks() ? mock(perfilMock()) : pedir("/api/perfil", PerfilUsuario));

export const actualizarPerfil = (cambio: CambioPerfil) =>
  usarMocks()
    ? mock({ ...perfilMock(), ...cambio })
    : pedir("/api/perfil", PerfilUsuario, { method: "PATCH", body: JSON.stringify(cambio) });

export const cambiarContrasena = (actual: string, nueva: string) =>
  usarMocks() ? mock({ ok: true }) : pedir("/api/perfil/contrasena", z.object({ ok: z.boolean() }), json({ actual, nueva }));

export const obtenerPreferencias = () =>
  usarMocks()
    ? mock({
        estudiante_id: ESTUDIANTE_ACTUAL,
        horas_disponibles: [1, 2, 3, 4, 5].map((dia) => ({ dia, desde: "15:00", hasta: "18:00" })),
        max_minutos_bloque: 45,
      })
    : pedir("/api/preferencias", PreferenciasEstudio);

/** El estudiante sale de una clase. */
export const salirDeClase = (claseId: string, estudianteId: string) =>
  usarMocks() ? mock(null) : pedir(`/api/clases/${claseId}/estudiantes/${estudianteId}`, z.null(), { method: "DELETE" });

// ---------------- Gestión del docente ----------------
export const obtenerClase = (id: string) =>
  usarMocks() ? mock(clasesMock.find((c) => c.id === id) ?? clasesMock[0]) : pedir(`/api/clases/${id}`, Clase);

export const editarClase = (id: string, datos: { nombre: string; materia: string; grado: string }) =>
  usarMocks()
    ? mock({ ...(clasesMock.find((c) => c.id === id) ?? clasesMock[0]), ...datos })
    : pedir(`/api/clases/${id}`, Clase, { method: "PATCH", body: JSON.stringify(datos) });

export const borrarClase = (id: string) => (usarMocks() ? mock(null) : pedir(`/api/clases/${id}`, z.null(), { method: "DELETE" }));

export const cambiarCodigoClase = (id: string) =>
  usarMocks()
    ? mock({ ...(clasesMock.find((c) => c.id === id) ?? clasesMock[0]), codigo_inscripcion: "NUEV42" })
    : pedir(`/api/clases/${id}/codigo`, Clase, { method: "POST" });

export const quitarEstudiante = (claseId: string, estudianteId: string) =>
  usarMocks() ? mock(null) : pedir(`/api/clases/${claseId}/estudiantes/${estudianteId}`, z.null(), { method: "DELETE" });

export const editarTarea = (id: string, cambio: EdicionTarea) =>
  usarMocks()
    ? mock({ ...(tareasMock.find((t) => t.id === id) ?? tareasMock[0]), ...cambio } as Tarea)
    : pedir(`/api/tareas/${id}`, Tarea, { method: "PATCH", body: JSON.stringify(cambio) });

export const borrarTarea = (id: string) => (usarMocks() ? mock(null) : pedir(`/api/tareas/${id}`, z.null(), { method: "DELETE" }));

export const obtenerDetalleEntrega = (id: string) => {
  if (!usarMocks()) return pedir(`/api/entregas/${id}`, DetalleEntrega);
  const entrega = entregasMock.find((e) => e.id === id) ?? entregasMock[0];
  const estudiante = usuariosMock.find((u) => u.id === entrega.estudiante_id) ?? usuariosMock[0];
  return mock<DetalleEntrega>({
    entrega,
    estudiante,
    adjuntos: entrega.adjuntos.map((a) => ({ ...a, url: null })),
    preguntas: sesionVerificacionMock.preguntas,
    informe: entrega.estado === "verificada" ? informeMock : null,
    comentario: comentarioMock(entrega.id),
  });
};

// ---------------- IA para el docente ----------------
const comentariosMock = new Map<string, ComentarioDocente>();
const comentarioMock = (entregaId: string) => comentariosMock.get(entregaId) ?? null;

/** La IA propone una tarea (no se guarda: el docente la revisa en el formulario). */
export const proponerTareaIA = (pedido: PedidoPropuestaTarea) =>
  usarMocks()
    ? mock<PropuestaTarea>(
        {
          titulo: `Práctica: ${pedido.tema}`.slice(0, 160),
          instrucciones: `1. Lee con atención cada ejercicio sobre ${pedido.tema}.\n2. Resuelve en tu cuaderno mostrando todos los pasos.\n3. Toma una foto clara de tu cuaderno y súbela.\n4. Escribe en una frase qué paso te costó más y por qué.`,
          competencias: [`Aplica ${pedido.tema} en situaciones nuevas`, "Explica su razonamiento paso a paso"],
          nivel_ayuda: "pistas",
          minutos_estimados: 40,
          razon: "Ejercicios graduados para practicar lo visto en clase y explicar el razonamiento.",
        },
        900,
      )
    : pedir("/api/docente/ia/tarea", PropuestaTarea, json(pedido));

/** Plan de repaso para la clase a partir de los informes de comprensión. */
export const sugerirRepasoIA = (clase_id: string, tarea_id?: string) =>
  usarMocks()
    ? mock<SugerenciaRepaso>(
        {
          resumen: "La clase entiende el procedimiento, pero varios estudiantes no justifican por qué la igualdad se mantiene. Conviene un repaso corto y en grupos.",
          actividades: [
            {
              concepto: mapaComprensionMock.conceptos_a_reforzar[0] ?? "Despejar x",
              por_que: "La mitad de la clase quedó en Inicial o En proceso: aplican el paso sin explicarlo.",
              actividad: "En parejas, uno resuelve 3x + 5 = 20 en voz alta y el otro pregunta \"¿por qué haces eso en los dos lados?\" en cada paso. Luego cambian.",
              minutos: 15,
              agrupacion: "grupos",
            },
          ],
        },
        900,
      )
    : pedir("/api/docente/ia/repaso", SugerenciaRepaso, json({ clase_id, tarea_id: tarea_id ?? null }));

/** Borrador del comentario para una entrega (no se guarda hasta que el docente lo envía). */
export const borradorComentarioIA = (entrega_id: string) =>
  usarMocks()
    ? mock<BorradorComentario>(
        { texto: "Explicaste muy bien por qué restaste 5 en los dos lados. Revisa el último paso: ¿cómo puedes comprobar que tu resultado cumple la ecuación?" },
        900,
      )
    : pedir("/api/docente/ia/comentario", BorradorComentario, json({ entrega_id }));

export const obtenerComentario = (entregaId: string) =>
  usarMocks() ? mock(comentarioMock(entregaId)) : pedir(`/api/entregas/${entregaId}/comentario`, ComentarioDocente.nullable());

export const guardarComentario = (entregaId: string, texto: string) => {
  if (!usarMocks()) return pedir(`/api/entregas/${entregaId}/comentario`, ComentarioDocente, { method: "PUT", body: JSON.stringify({ texto }) });
  const c = { entrega_id: entregaId, texto, actualizado_en: new Date().toISOString() };
  comentariosMock.set(entregaId, c);
  return mock(c);
};

export const borrarComentario = (entregaId: string) => {
  if (!usarMocks()) return pedir(`/api/entregas/${entregaId}/comentario`, z.null(), { method: "DELETE" });
  comentariosMock.delete(entregaId);
  return mock(null);
};

// ---------------- Integraciones: Google Classroom (modo de prueba) ----------------
export const CursoClassroom = z.object({
  id: z.string(),
  nombre: z.string(),
  seccion: z.string().nullable(),
  clase_id: z.string().uuid().nullable(),
});
export const ResultadoImportacion = z.object({
  clase: Clase,
  nueva: z.boolean(),
  inscritos: z.array(z.string()),
  yaEstaban: z.number().int(),
  sinCuenta: z.array(z.object({ nombre: z.string(), correo: z.string().nullable() })),
});

export const listarCursosClassroom = () =>
  usarMocks()
    ? mock([
        { id: "c1", nombre: "Tecnología 4to A", seccion: "Atkins", clase_id: null },
        { id: "c2", nombre: "Tecnología 4to B", seccion: "Martínez", clase_id: clasesMock[0].id },
      ])
    : pedir("/api/integraciones/classroom/cursos", z.array(CursoClassroom));

export const importarCursoClassroom = (curso_id: string) =>
  usarMocks()
    ? mock(
        {
          clase: { ...clasesMock[0], nombre: "Tecnología 4to A" },
          nueva: true,
          inscritos: ["Camila Pérez", "Luis Martínez"],
          yaEstaban: 0,
          sinCuenta: [{ nombre: "Ana Torres", correo: "ana.torres@ejemplo.do" }],
        },
        900,
      )
    : pedir("/api/integraciones/classroom/importar", ResultadoImportacion, json({ curso_id }));

export const desconectarClassroom = () =>
  usarMocks() ? mock(null) : pedir("/api/integraciones/classroom/desconectar", z.null(), { method: "POST" });
