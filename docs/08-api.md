# API reference

Inventory of **61 exported HTTP methods across 46 route files**, read from `src/app/api/**/route.ts`. Dynamic `[id]` segments are literal template notation in this reference. They identify submissions for report routes, tasks for task routes, and classes for class routes.

## Common behavior

The API proxy applies an origin check to state-changing methods before route handlers; see [browser protections](09-security-privacy-ai.md#browser-request-protections). Ordinary endpoints authenticate with Supabase session cookies. Internal analysis additionally supports a server credential (see `src/app/api/ia/_util.ts`). RLS limits session-bound reads; admin operations require application authorization first. Typical JSON errors are `{ "error": { "codigo": "...", "mensaje": "..." } }` with 400, 401, 403, 404, 409, 429 or 5xx status. Specific handlers differ; redirect callbacks and tutor streaming are exceptions. API/model schemas live in `src/types/contratos.ts` with endpoint validators in `src/lib/db/` and `src/lib/ia/`. The validation column reports actual checks, rather than promising a UUID parser in every handler.

Browser features call through `src/lib/api-cliente.ts`; mock mode can simulate responses without these handlers. Login, registration, legal acceptance and password recovery also use authentication/server actions and are not additional exported `/api` route methods. My classes and teacher student-profile initial reads are server data functions, not separate API endpoints.

## Routes

| Method and path | Who can use it | What is validated | Result / behavior |
|---|---|---|---|
| `GET /api/archivos` | Authenticated user with access to the referenced attachment | Nonempty ruta and puedeVerArchivo checks task/submission access | 302 to signed private Storage URL valid for 300 seconds |
| `GET /api/auth/callback` | OAuth/recovery return; validated Supabase session | PKCE code exchange or token_hash with type=recovery; locale normalized; stored role preserved | Redirect to role home, reset-password page or error; create missing Google profile |
| `GET /api/avisos` | Authenticated, own notices | Session; database recipient filter | Notice list and unread count |
| `POST /api/avisos/leidos` | Authenticated, own notices | JSON ids optional array of UUIDs; own-recipient filter | Mark selected or all own notices read |
| `GET /api/clases` | Authenticated teacher/student | Session and RLS | Accessible Clase array |
| `POST /api/clases` | Teacher | NuevaClase: trimmed nombre 2-80, materia 2-60, grado 1-30 | 201 Clase with generated enrollment code |
| `DELETE /api/clases/[id]` | Owner teacher | Session, teacher role and class ownership lookup; no request body | 204; remove class/dependents and clean attachments |
| `GET /api/clases/[id]` | Owner teacher | Session, teacher role and class ownership lookup; no request body | Read own class |
| `PATCH /api/clases/[id]` | Owner teacher | Session, teacher role and class ownership lookup; full NuevaClase object | Update class |
| `POST /api/clases/[id]/codigo` | Owner teacher | Session, role and class ownership; no body | Replace enrollment code |
| `GET /api/clases/[id]/estudiantes` | Owner teacher | Session, role and class ownership in listarEstudiantes | Usuario array |
| `DELETE /api/clases/[id]/estudiantes/[estudianteId]` | Owner teacher or student leaving own membership | Both path IDs UUID; teacher ownership unless own student ID | 204 removal; preserves submitted work |
| `GET /api/clases/[id]/exportar` | Owner teacher | Class UUID; tipo enum entregas/comprension; datosComprension ownership | Private no-store UTF-8 BOM semicolon CSV; optional grades and formula neutralization |
| `POST /api/clases/unirse` | Student | EntradaUnirse: normalized valid six-character code; existing class and no duplicate enrollment | Clase; background pending analysis |
| `GET /api/docente/comprension` | Owner teacher | Required clase_id UUID; nullable tarea_id UUID; owned class/task | Calculated understanding map; no model call |
| `POST /api/docente/ia/comentario` | Task teacher, shared teacher quota | entrega_id UUID; owned task; reject pending submission | Validated BorradorComentario; not published |
| `POST /api/docente/ia/repaso` | Owner teacher, shared teacher quota | Class UUID and optional nullable task UUID; owner; at least one report | Validated concept-based SugerenciaRepaso; teacher chooses activity to assign separately |
| `GET /api/docente/ia/revision` | Task teacher under RLS | Required tarea_id UUID; RLS restricts review rows; each result safe-parsed as RevisionGuardada | Saved reviews; missing 0015 table returns empty array |
| `POST /api/docente/ia/revision` | Task teacher, shared teacher quota | PedidoRevisionEntrega strict; non-pending own-task submission; <=6 own-path JPEG/PNG/WebP images <=10 MiB each; RevisionEntrega output | Return review; upsert with reviewed timestamp; save failure logged but result still returned |
| `POST /api/docente/ia/tarea` | Owner teacher, shared teacher quota | PedidoPropuestaTarea: class UUID, tema 3-500, optional detalles <=1500; class owner | Validated PropuestaTarea draft; not saved as task |
| `GET /api/entregas` | Task teacher or student reading own work | QueryEntregas: required tarea_id UUID; teacher task ownership or own student filter | Entrega array |
| `POST /api/entregas` | Enrolled student | EntradaEntrega: tarea_id UUID, text at most 20000, at most eight metadata attachments, external boolean; own attachment paths; reject verifying/verified work | 201 submission; clear prior return flag without dropping grade; notify teacher after response |
| `GET /api/entregas/[id]` | Submission owner or task teacher under RLS | Path UUID; session; detalleEntrega access | Work, signed attachments, verification answers, report and comment |
| `GET /api/entregas/[id]/calificacion` | Submission owner or task teacher | Path UUID, session and submission permission | Calificacion or null |
| `PUT /api/entregas/[id]/calificacion` | Task teacher | Path UUID; EntradaCalificacion strict: nullable nota 0-100, increments of 0.01; task ownership | Saved grade; notification |
| `DELETE /api/entregas/[id]/comentario` | Task teacher | Path UUID and task ownership | Delete comment |
| `GET /api/entregas/[id]/comentario` | Submission owner or task teacher | Path UUID, session and RLS access | ComentarioDocente or null |
| `PUT /api/entregas/[id]/comentario` | Task teacher | Path UUID, ownership and bounded nonempty comment text (up to 4000) | Save teacher comment and notification |
| `POST /api/entregas/[id]/devolver` | Task teacher | Path UUID; EntradaDevolucion strict: trimmed motivo 1-1000; ownership | Atomic return RPC; pending submission and notice |
| `POST /api/entregas/adjuntos` | Enrolled student | Multipart tarea_id UUID and archivo; task membership, supported PDF/image MIME and size at most 10 MiB | 201 own task/student attachment metadata |
| `GET /api/ia/analisis` | Authenticated user; student workflow (helper does not check profile role) | Authenticated user session; requested estudiante_id must match current ID | Own AnalisisTarea array |
| `POST /api/ia/analizar` | Internal service or authorized student/task teacher | Entrada: tarea_id and estudiante_id UUIDs; internal-service credentials, teacher ownership or self plus enrollment | Analyze and store result; recalculate plan |
| `GET /api/ia/plan` | Authenticated user; student workflow (helper does not check profile role) | Optional semana_inicio: yyyy-MM-dd and parseable date | Stored weekly plan, calculated if absent |
| `POST /api/ia/plan` | Authenticated user; student workflow (helper does not check profile role) | JSON optional semana_inicio with same date validation | Recalculate and save PlanSemanal |
| `PATCH /api/ia/plan/bloques/[id]` | Authenticated user; student workflow (helper does not check profile role) | EstadoBloque enum planificado/hecho/omitido; block lookup in own plan (ID is not necessarily UUID) | Updated block; skip may replan |
| `GET /api/informes/[id]` | Submission owner or task teacher under RLS | Submission UUID; validate InformeConRuta and nested identity | InformeComprension, nullable route and optional tarea_id |
| `POST /api/informes/[id]/ruta` | Enrolled submission owner | contextoEntrega ownership and non-pending state; read validated report | Reuse route or generate/save one |
| `POST /api/informes/[id]/semana` | Enrolled submission owner | Submission UUID/context; validated saved report/route; availability and duplicate checks | Add saved practice steps without AI; blocks, unplaced count and already-added flag |
| `GET /api/integraciones/classroom/callback` | Teacher returning from OAuth | Session/role; matching state cookie and query state; code present; token exchange validated | Temporary HttpOnly Secure access-token cookie; redirect to integration page |
| `GET /api/integraciones/classroom/conectar` | Teacher | Session and role; configured OAuth client; locale normalized; generated random state cookie | Redirect to Google consent; HttpOnly Secure SameSite=Lax state valid 600 seconds |
| `GET /api/integraciones/classroom/cursos` | Teacher with connection token | Session/role and token cookie; provider response handling | Available courses |
| `POST /api/integraciones/classroom/desconectar` | Any caller; only clears browser cookie | No session/role check or body | 204; remove local connection token cookie; does not revoke Google consent |
| `POST /api/integraciones/classroom/importar` | Teacher authorized on selected Google course | curso_id length 1-64; token; Google course permission; duplicate links, due dates, task quota | Import class/students/upcoming tasks; background analysis and notices |
| `GET /api/perfil` | Authenticated, self | Session; PerfilUsuario output | Profile, email, appearance and accepted terms metadata |
| `PATCH /api/perfil` | Authenticated, self | CambioPerfil: at least one allowed name/language/theme/companion field; role excluded | Updated profile; compatibility fallback if appearance columns absent |
| `POST /api/perfil/contrasena` | Authenticated, self | actual 1-200 and nueva 8-200; different values; reauthenticate current password | Update Auth password |
| `GET /api/perfil/datos` | Authenticated, self | Session; own-ID filters with RLS, explicit exported table list | No-store JSON download; not every newer table is included |
| `POST /api/perfil/eliminar` | Authenticated, self | JSON confirmacion trimmed/uppercased to DELETE or ELIMINAR | Storage cleanup then Auth deletion/cascades and sign out |
| `GET /api/preferencias` | Authenticated user; student workflow (helper does not check profile role) | Authenticated user session | Saved or default PreferenciasEstudio |
| `PUT /api/preferencias` | Authenticated user; student workflow (helper does not check profile role) | PreferenciasEstudio; own estudiante_id; block length 15-180; valid HH:mm windows with desde < hasta | Saved preferences |
| `GET /api/tareas` | Authenticated, accessible classes | QueryTareas: optional clase_id UUID; RLS | Tarea array |
| `POST /api/tareas` | Owner teacher, within daily task quota | NuevaTarea derived from Tarea without id/creada_en; class ownership; mode, external link and origin contracts | 201 task; background notices, per-student analysis and plan |
| `DELETE /api/tareas/[id]` | Owner teacher | Session, role and task ownership; no body | 204; clean attachments/dependents and schedule replanning |
| `GET /api/tareas/[id]` | Authenticated class member/teacher under RLS | Session; task lookup under RLS (no separate UUID parser in this handler) | Tarea or 404 |
| `PATCH /api/tareas/[id]` | Owner teacher | EdicionTarea: nonempty set of allowed fields; bounded text, ISO deadline, enums and HTTP(S) external URL | Updated task; changed deadline schedules replanning |
| `POST /api/tareas/[id]/adjuntos` | Owner teacher | Multipart archivo; PDF/JPEG/PNG/WebP and size at most 10 MiB; task class ownership | 201 attachment metadata |
| `GET /api/tutor` | Enrolled student | Required tarea_id UUID and contextoTarea authorization | Own stored chat history |
| `POST /api/tutor` | Enrolled student, within tutor quota | EntradaTutor: tarea UUID, trimmed message 1-6000; membership; validated stored history | text/plain stream; save completed conversation |
| `POST /api/verificacion/iniciar` | Enrolled submission owner, within start quota | EntradaInicio: entrega_id UUID; submitted state; current session/version checks; reject verified work | Reuse current session or create first question and cache notebook reading |
| `POST /api/verificacion/responder` | Enrolled submission owner | EntradaRespuesta: session UUID, question ID 1-100, trimmed answer 1-10000, via voz/texto; current version/order; conditional update protects concurrency | Next question or report after third answer; recover interrupted completion |
| `POST /api/voz/transcribir` | Student; enrolled when valid task supplied | Multipart WAV audio: >44 and <=5760044 bytes; RIFF mono PCM16 at 16/24 kHz; optional task UUID safeParse | JSON texto; transcribe in memory; invalid/missing task ID uses general student context |

## Teacher batch review and persistence

There is no separate batch route. Review all queues individual POST /api/docente/ia/revision calls with two workers. The client skips pending submissions and saved reviews whose entregada_en matches the submission. A daily-limit response stops further scheduling; failures are reported and saved results reloaded. The GET route reads under teacher-only RLS and validates each saved row. A returned review is advisory; only separate comment/grade actions publish teacher decisions.

## Authorization implementation notes

The helper named `exigirEstudiante` currently checks for an authenticated user session, not a stored student role. Analysis listing, weekly-plan and preference routes using that helper therefore authenticate by user ID but do not explicitly reject a teacher account. Their intended UI is student-facing; do not infer a role guard from the helper name. Classroom disconnect simply clears the local cookie and has no session guard. These observations describe the current handlers rather than changing them.

## Compatibility and limits

Missing older appearance/terms/usage/review migrations have compatibility behavior in selected paths; this does not replace applying the complete migration set. Quotas default to 60 tutor messages, 10 verification starts, 20 created tasks and 40 teacher AI actions per user/day, configurable by environment. Teacher review shares the existing borrador_comentario usage category. File uploads accept PDF and supported images, but the AI review image branch does not extract PDF contents.

See [data/RLS definitions](07-data-model.md), [AI routing](05-architecture.md) and [operations](11-operations-deployment.md).
