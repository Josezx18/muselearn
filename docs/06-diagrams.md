# System diagrams

GitHub renders these Mermaid blocks. Names represent runtime responsibilities and database relationships; they do not imply separate deployed microservices.

## Application architecture

```mermaid
flowchart LR
  Student[Student browser] --> UI[Localized React interface]
  Teacher[Teacher browser] --> UI
  UI --> Client[API client facade]
  Client --> Routes[Next.js route handlers]
  Pages[Authenticated server pages] --> Session[Session-bound Supabase client]
  Routes --> Session
  Session --> DB[(Postgres and RLS)]
  Routes --> Admin[Authorized server admin operations]
  Admin --> DB
  Admin --> Storage[(Private Storage)]
  Routes --> Gateway[Central AI gateway]
  Gateway --> Meta[Meta models and transcription]
  Gateway --> Open[Configured open model endpoint]
  Gateway --> Nvidia[Optional NVIDIA fallback]
  Routes --> Google[Optional Google Classroom]
```

## Deployment and trust boundaries

```mermaid
flowchart TB
  Browser[Browser: ES or EN] -->|HTTPS and session cookies| Vercel[Vercel: Next.js server]
  Browser -->|Public configuration and user session| Auth[Supabase Auth]
  Vercel -->|Session client: RLS| PG[(Supabase Postgres)]
  Vercel -->|Server-only service role after authorization| PG
  Vercel -->|Upload or signed URLs| Files[(Private attachment bucket)]
  Browser -->|Expiring signed URL| Files
  Vercel -->|Server-only model credentials| Providers[Meta / open endpoint / NVIDIA]
  Vercel -->|OAuth access token| Classroom[Google Classroom]
  Env[Deployment secret environment] --> Vercel
```

## Submission -> verification -> report

```mermaid
sequenceDiagram
  actor S as Student
  participant API as Next.js API
  participant DB as Supabase
  participant AI as AI gateway
  S->>API: Submit own evidence
  API->>DB: Save submission and timestamp
  API-->>S: Submission accepted
  API->>DB: Notify teacher after response
  S->>API: Start verification
  API->>DB: Check owner, state and current session
  API->>AI: Read notebook images once
  API->>AI: Generate first question
  API->>DB: Save session, question and notebook reading
  loop Three answers in normal flow
    S->>API: Answer in text or transcribed voice
    API->>DB: Check session version and question order
    API->>DB: Save answer
    alt More questions
      API->>AI: Next question using cached notebook reading
      API-->>S: Next question
    else Final answer
      API->>AI: Evaluate with checkable answer evidence
      API->>AI: Generate practice route
      Note over API,AI: Use a basic route if practice generation fails
      API->>DB: Upsert report and route, complete session
      API-->>S: Understanding report
    end
  end
```

## Teacher review and correction

```mermaid
flowchart TD
  Task[Open task submissions] --> Saved[Load saved AI reviews]
  Saved --> Workspace[Choose student: work, image viewer, verification and report]
  Workspace --> One[Review with AI]
  Saved --> Batch[Review all: two workers]
  Batch --> Check{Submitted and no current review?}
  Check -->|Yes| One
  Check -->|No| Skip[Reuse saved review or skip pending]
  One --> Auth[Validate teacher ownership and image paths]
  Auth --> AI[Generate validated suggestions]
  AI --> Persist[Save review with submission timestamp]
  Persist --> Human[Teacher reviews suggestions]
  Human --> Feedback[Publish edited comment or chosen grade]
  Human --> Return[Return with reason]
  Return --> Pending[Submission pending]
  Pending --> Correct[Student corrects and resubmits]
  Correct --> Stale[Old AI review and verification session are stale]
  Stale --> New[Fresh verification and review]
```

## Entity relationships

```mermaid
erDiagram
  AUTH_USERS ||--|| PERFILES : identifies
  PERFILES ||--o{ CLASES : teaches
  PERFILES ||--o{ INSCRIPCIONES : enrolls
  CLASES ||--o{ INSCRIPCIONES : includes
  CLASES ||--o{ TAREAS : assigns
  CLASES ||--o| CLASES_VINCULADAS : links
  PERFILES ||--o{ CLASES_VINCULADAS : owns
  TAREAS ||--o| TAREAS_VINCULADAS : links
  CLASES ||--o{ TAREAS_VINCULADAS : contains
  TAREAS ||--o{ ENTREGAS : receives
  PERFILES ||--o{ ENTREGAS : submits
  TAREAS ||--o{ ANALISIS_TAREAS : analyzed
  PERFILES ||--o{ ANALISIS_TAREAS : receives
  PERFILES ||--o{ PLANES : schedules
  PERFILES ||--o| PREFERENCIAS_ESTUDIO : configures
  PERFILES ||--o{ CONVERSACIONES_TUTOR : chats
  TAREAS ||--o{ CONVERSACIONES_TUTOR : contextualizes
  ENTREGAS ||--o{ SESIONES_VERIFICACION : checks
  ENTREGAS ||--o| INFORMES : summarizes
  ENTREGAS ||--o| COMENTARIOS_ENTREGA : receives
  PERFILES ||--o{ COMENTARIOS_ENTREGA : writes
  ENTREGAS ||--o| CALIFICACIONES : grades
  PERFILES ||--o{ CALIFICACIONES : assigns
  ENTREGAS ||--o| REVISIONES_IA : reviews
  PERFILES ||--o{ AVISOS : receives
  PERFILES ||--o{ USO_IA_DOCENTE : consumes
```

All application foreign keys above cascade on deletion. JSON payload structure and per-table policies are detailed in the [data model](07-data-model.md).
