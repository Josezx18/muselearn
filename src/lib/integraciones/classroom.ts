// Google Classroom (modo de prueba): OAuth web del docente y lectura de sus cursos y estudiantes.
// Solo lectura. El token de Google vive en una cookie httpOnly de corta duración; no se guarda en la base.
import { z } from "zod";

export const ALCANCES_CLASSROOM = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.profile.emails",
  // Leer las tareas (coursework) de los cursos donde el usuario es docente.
  "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
];

export const COOKIE_ESTADO = "ml_gc_estado";
export const COOKIE_TOKEN = "ml_gc_token";
export const RUTA_COOKIES = "/api/integraciones/classroom";
const API = "https://classroom.googleapis.com/v1";

export function configClassroom(env: NodeJS.ProcessEnv = process.env) {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export const uriRedireccion = (origen: string) => `${origen.replace(/\/$/, "")}/api/integraciones/classroom/callback`;

export function urlAutorizacion(op: { clientId: string; redirectUri: string; estado: string }) {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", op.clientId);
  u.searchParams.set("redirect_uri", op.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", ALCANCES_CLASSROOM.join(" "));
  u.searchParams.set("access_type", "online"); // solo para importar ahora: no pedimos acceso permanente
  u.searchParams.set("include_granted_scopes", "true");
  u.searchParams.set("prompt", "select_account");
  u.searchParams.set("state", op.estado);
  return u.toString();
}

const RespuestaToken = z.object({ access_token: z.string().min(10), expires_in: z.number().int().positive() });

export async function canjearCodigo(
  op: { codigo: string; clientId: string; clientSecret: string; redirectUri: string },
  hacerFetch: typeof fetch = fetch,
) {
  const r = await hacerFetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: op.codigo,
      client_id: op.clientId,
      client_secret: op.clientSecret,
      redirect_uri: op.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!r.ok) throw new ErrorClassroom(r.status, `token: ${(await r.text().catch(() => "")).slice(0, 200)}`);
  return RespuestaToken.parse(await r.json());
}

export class ErrorClassroom extends Error {
  constructor(
    public estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

async function pedirGoogle<T>(token: string, ruta: string, esquema: z.ZodType<T>, hacerFetch: typeof fetch): Promise<T> {
  const r = await hacerFetch(`${API}${ruta}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new ErrorClassroom(r.status, `${ruta}: ${(await r.text().catch(() => "")).slice(0, 200)}`);
  return esquema.parse(await r.json());
}

const Curso = z.object({
  id: z.string(),
  name: z.string(),
  section: z.string().optional(),
  descriptionHeading: z.string().optional(),
  courseState: z.string().optional(),
});
export type CursoClassroom = z.infer<typeof Curso>;

/** Cursos activos en los que el usuario es docente. */
export async function listarCursos(token: string, hacerFetch: typeof fetch = fetch): Promise<CursoClassroom[]> {
  const Pagina = z.object({ courses: z.array(Curso).optional(), nextPageToken: z.string().optional() });
  const cursos: CursoClassroom[] = [];
  let pagina: string | undefined;
  for (let i = 0; i < 10; i++) {
    const q = new URLSearchParams({ teacherId: "me", courseStates: "ACTIVE", pageSize: "100" });
    if (pagina) q.set("pageToken", pagina);
    const p = await pedirGoogle(token, `/courses?${q}`, Pagina, hacerFetch);
    cursos.push(...(p.courses ?? []));
    if (!p.nextPageToken) break;
    pagina = p.nextPageToken;
  }
  return cursos;
}

/** ¿El usuario es docente de este curso? (Google responde 404/403 si no.) */
export async function esDocenteDelCurso(token: string, cursoId: string, hacerFetch: typeof fetch = fetch) {
  try {
    await pedirGoogle(token, `/courses/${encodeURIComponent(cursoId)}/teachers/me`, z.object({}).passthrough(), hacerFetch);
    return true;
  } catch (e) {
    if (e instanceof ErrorClassroom && (e.estado === 403 || e.estado === 404)) return false;
    throw e;
  }
}

export async function obtenerCurso(token: string, cursoId: string, hacerFetch: typeof fetch = fetch) {
  return pedirGoogle(token, `/courses/${encodeURIComponent(cursoId)}`, Curso, hacerFetch);
}

export interface AlumnoClassroom {
  nombre: string;
  correo: string | null;
}

export async function listarAlumnos(token: string, cursoId: string, hacerFetch: typeof fetch = fetch): Promise<AlumnoClassroom[]> {
  const Pagina = z.object({
    students: z
      .array(
        z.object({
          profile: z
            .object({ name: z.object({ fullName: z.string().optional() }).optional(), emailAddress: z.string().optional() })
            .optional(),
        }),
      )
      .optional(),
    nextPageToken: z.string().optional(),
  });
  const alumnos: AlumnoClassroom[] = [];
  let pagina: string | undefined;
  for (let i = 0; i < 20; i++) {
    const q = new URLSearchParams({ pageSize: "100" });
    if (pagina) q.set("pageToken", pagina);
    const p = await pedirGoogle(token, `/courses/${encodeURIComponent(cursoId)}/students?${q}`, Pagina, hacerFetch);
    for (const s of p.students ?? []) {
      alumnos.push({
        nombre: s.profile?.name?.fullName ?? s.profile?.emailAddress ?? "—",
        correo: s.profile?.emailAddress?.toLowerCase() ?? null,
      });
    }
    if (!p.nextPageToken) break;
    pagina = p.nextPageToken;
  }
  return alumnos;
}

/** Datos de la clase de MuseLearn a partir del curso (el docente puede editarlos después). */
export function claseDesdeCurso(c: CursoClassroom) {
  const recortar = (s: string, n: number) => s.trim().slice(0, n);
  const nombre = recortar(c.name || "Clase de Classroom", 80);
  return {
    nombre: nombre.length >= 2 ? nombre : "Clase de Classroom",
    materia: recortar(c.descriptionHeading && c.descriptionHeading !== c.name ? c.descriptionHeading : c.name || "Classroom", 60).padEnd(
      2,
      "·",
    ),
    grado: recortar(c.section || "—", 30) || "—",
  };
}

// ---------------- Tareas (coursework) ----------------
const Fecha = z.object({ year: z.number().int(), month: z.number().int(), day: z.number().int() });
const Hora = z.object({ hours: z.number().int().optional(), minutes: z.number().int().optional() });
const TareaGoogle = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  state: z.string().optional(),
  alternateLink: z.string().optional(),
  dueDate: Fecha.optional(),
  dueTime: Hora.optional(),
  workType: z.string().optional(),
  materials: z
    .array(
      z.object({
        link: z.object({ url: z.string(), title: z.string().optional() }).optional(),
        driveFile: z.object({ driveFile: z.object({ title: z.string().optional(), alternateLink: z.string().optional() }).optional() }).optional(),
        youtubeVideo: z.object({ title: z.string().optional(), alternateLink: z.string().optional() }).optional(),
        form: z.object({ title: z.string().optional(), formUrl: z.string().optional() }).optional(),
      }),
    )
    .optional(),
});
export type TareaClassroom = z.infer<typeof TareaGoogle>;

/** Tareas publicadas del curso (las más recientes primero, como las devuelve Google). */
export async function listarTareasCurso(token: string, cursoId: string, hacerFetch: typeof fetch = fetch): Promise<TareaClassroom[]> {
  const Pagina = z.object({ courseWork: z.array(TareaGoogle).optional(), nextPageToken: z.string().optional() });
  const tareas: TareaClassroom[] = [];
  let pagina: string | undefined;
  for (let i = 0; i < 5; i++) {
    const q = new URLSearchParams({ courseWorkStates: "PUBLISHED", pageSize: "50", orderBy: "dueDate desc" });
    if (pagina) q.set("pageToken", pagina);
    const p = await pedirGoogle(token, `/courses/${encodeURIComponent(cursoId)}/courseWork?${q}`, Pagina, hacerFetch);
    tareas.push(...(p.courseWork ?? []));
    if (!p.nextPageToken) break;
    pagina = p.nextPageToken;
  }
  return tareas;
}

/**
 * Fecha de entrega en ISO. Google da fecha y hora en UTC; si no hay hora, se toma las 23:59 de ese día en la
 * zona del centro (offsetMin, RD = -240). Sin fecha de entrega: dentro de 7 días a las 23:59 locales.
 */
export function fechaEntregaClassroom(t: Pick<TareaClassroom, "dueDate" | "dueTime">, ahora: Date, offsetMin = -240): string {
  if (t.dueDate) {
    const { year, month, day } = t.dueDate;
    if (t.dueTime && (t.dueTime.hours !== undefined || t.dueTime.minutes !== undefined)) {
      return new Date(Date.UTC(year, month - 1, day, t.dueTime.hours ?? 0, t.dueTime.minutes ?? 0)).toISOString();
    }
    return new Date(Date.UTC(year, month - 1, day, 23, 59) - offsetMin * 60_000).toISOString();
  }
  const local = new Date(ahora.getTime() + offsetMin * 60_000 + 7 * 86_400_000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 23, 59) - offsetMin * 60_000).toISOString();
}

const enlaceSeguro = (u: string | undefined) => (u && /^https:\/\//i.test(u) && u.length <= 500 ? u : null);

/**
 * Datos de la tarea de MuseLearn a partir de la de Classroom, o null si ya venció (no se importan tareas pasadas).
 * Se entrega en Classroom: la tarea guarda el enlace y el estudiante sube aquí su evidencia.
 */
export function tareaDesdeClassroom(t: TareaClassroom, claseId: string, ahora: Date, offsetMin = -240) {
  const fecha_entrega = fechaEntregaClassroom(t, ahora, offsetMin);
  if (Date.parse(fecha_entrega) <= ahora.getTime()) return null;
  const materiales = (t.materials ?? [])
    .map((m) => {
      if (m.link) return `${m.link.title ?? m.link.url}: ${m.link.url}`;
      const d = m.driveFile?.driveFile;
      if (d) return `${d.title ?? "Archivo de Drive"}${d.alternateLink ? `: ${d.alternateLink}` : ""}`;
      if (m.youtubeVideo) return `${m.youtubeVideo.title ?? "Video"}${m.youtubeVideo.alternateLink ? `: ${m.youtubeVideo.alternateLink}` : ""}`;
      if (m.form) return `${m.form.title ?? "Formulario"}${m.form.formUrl ? `: ${m.form.formUrl}` : ""}`;
      return null;
    })
    .filter((x): x is string => !!x)
    .slice(0, 10);
  const descripcion = (t.description ?? "").trim();
  const instrucciones = [descripcion || "Ver las instrucciones en Google Classroom.", materiales.length ? `Materiales:\n- ${materiales.join("\n- ")}` : ""]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 20000);
  const titulo = (t.title ?? "").trim().slice(0, 160);
  return {
    clase_id: claseId,
    titulo: titulo.length >= 2 ? titulo : "Tarea de Classroom",
    instrucciones,
    fecha_entrega,
    competencias: [] as string[],
    nivel_ayuda: "pistas" as const,
    modalidad: "classroom" as const,
    enlace_externo: enlaceSeguro(t.alternateLink),
    adjuntos: [],
  };
}
