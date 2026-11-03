# Architecture

MuseLearn is a Next.js App Router application with React, strict TypeScript, Tailwind CSS and next-intl. Supabase provides Auth, Postgres with row-level security (RLS) and private Storage. Vercel is the deployment target. This describes repository behavior, not a fresh audit of the hosted environment.

## Runtime boundaries

| Layer | Responsibility | Source |
|---|---|---|
| Localized pages | Public auth/legal pages; teacher and student areas | `src/app/[locale]/` |
| Interactive client | Forms, scheduling controls, tutoring/voice, review workspace | `src/components/` |
| Browser API facade | Real requests or simulated responses selected by mock mode | `src/lib/api-cliente.ts` |
| Server page reads | Initial authenticated data using session-bound database client and RLS | `src/lib/server/data.ts` |
| Route handlers | Input validation, session/role/ownership checks and mutations | `src/app/api/` |
| Domain services | Classes, submissions, notifications, limits, reports and account operations | `src/lib/db/` |
| AI gateway | Configured provider routing, structured validation, retries, streaming and transcription | `src/lib/ia/cliente.ts` |
| Contracts | Zod schemas and inferred TypeScript domain types | `src/types/contratos.ts` |
| Persistence | Tables, constraints, policies, trigger and return RPC | `supabase/migrations/` |

`src/proxy.ts` handles request interception in this Next.js version, including origin checks for mutating API requests. Session cookies are server-managed and HttpOnly; `next.config.ts` defines response security headers. Dynamic request APIs and route parameters are asynchronous. `cacheComponents` is disabled. Teacher/student pages use authentication and server reads where implemented; interactive calls use the API facade. Locale-aware navigation uses the next-intl navigation wrapper.

## Learning pipeline

Task creation, joining a class and Classroom imports schedule pending analysis with Next.js `after()`. Analysis is stored per student and task. Scheduling is deterministic: availability, priorities, deadlines and block length determine the plan; AI may phrase explanatory notices. This is not an LLM directly choosing every calendar block.

A submission stores text and attachment metadata. Verification reads notebook images through the vision function, stores that reading in `sesiones_verificacion.cuaderno` and reuses it for the session. The normal flow asks three questions. Structured evaluation checks answer evidence and supplies concept levels; server code fixes report identity and time. Report and practice route are stored by submission. If AI practice generation fails, a basic route preserves completion. Adding practice to Week does not call AI.

The teacher dashboard computes aggregates from stored reports without a model call. The teacher profile view joins class-specific submission history, grades, comments and concept evidence. My classes uses enrolled membership and class-specific task/submission data.

## AI provider order and effort

The following is copied semantically from `RUTAS` and `ESFUERZO_POR_DEFECTO`, not inferred from the product UI. Only configured providers participate.

| Function | Provider preference | Default reasoning effort |
|---|---|---|
| `analizar` | Open endpoint -> Meta -> NVIDIA | low |
| `planificar` | Open endpoint -> Meta -> NVIDIA | low |
| `leer_cuaderno` | Meta only | medium |
| `tutor` | Meta -> Open endpoint | high |
| `verificar` | Meta -> Open endpoint | medium |
| `evaluar` | Meta -> Open endpoint | high |
| `ruta` | Meta -> Open endpoint | medium |
| `docente` | Meta -> Open endpoint | medium |

Meta defaults to `https://api.meta.ai/v1` and `muse-spark-1.3`. The open provider requires URL, key and model ID together; the example environment uses Baseten and `meta-models/muse-spark-open-1026`. NVIDIA defaults to `https://integrate.api.nvidia.com/v1` and `meta/muse-glimmer-30b`. These are source defaults/configuration examples, not claims about current provider availability.

The OpenAI SDK is used as a compatible transport to these endpoints. Meta requests support `reasoning_effort` and JSON schema; other configured endpoints receive JSON-object mode. Structured responses are parsed and Zod-validated, with one correction attempt per provider for malformed/schema-invalid JSON. Failures proceed to the next configured provider. The SDK also has transport retries and a 30-second timeout. Streaming fallback is possible only before the first emitted text chunk.

Transcription uses the same server gateway but a separate Meta `/asr/transcribe` request and defaults to `muse-voice-transcribe-1.0`. Audio is held in memory and is not persisted by MuseLearn. Browser speech features provide playback and supported fallback behavior; browser capabilities vary.

## Teacher review pipeline

The teacher review endpoint authorizes task ownership before downloading the student's stored images with the admin Storage client. It accepts up to six JPEG/PNG/WebP images, each at most 10 MiB. A validated review is returned and upserted in `revisiones_ia` with the reviewed `entregada_en`. Photo-based reviews use `leer_cuaderno` (Meta only); text-only reviews use `docente` (Meta then the configured open endpoint). The UI considers a review current only when its timestamp matches the current submission.

Review all is a client queue with two workers calling the individual endpoint. It skips pending submissions and current saved reviews, respects the shared teacher quota, reloads saved results and reports partial failure. It does not automatically publish feedback or grades. Review calls currently use the `borrador_comentario` quota category because the usage-table CHECK has no separate review category.

See [diagrams](06-diagrams.md), [data model](07-data-model.md), [API](08-api.md) and [security](09-security-privacy-ai.md).
