# 6. Diagramas de arquitectura y nodos

Los diagramas son una vista documental de los componentes encontrados; no constituyen infraestructura como código. Los proveedores externos son dependencias. La instalación real debe verificarse en sus paneles.

## 6.1 Contexto (C4 nivel 1)

```mermaid
flowchart LR
  estudiante[Estudiante]
  docente[Docente]
  app[MuseLearn]
  supa[(Supabase Auth, PostgreSQL y Storage)]
  meta[Meta Model API\nMuse Spark / Voice Transcribe]
  abierto[Proveedor de modelo abierto\nconfigurado para Muse Spark Open]
  nvidia[NVIDIA opcional\nGlimmer fallback]
  google[Google Classroom opcional]
  vercel[Vercel hosting]
  estudiante -->|tareas, respuestas, voz/texto| app
  docente -->|clases, tareas, informes| app
  app -->|sesión, datos y archivos| supa
  app -->|texto, contexto e imágenes autorizados| meta
  app -.->|funciones configuradas| abierto
  app -.->|respaldo opcional| nvidia
  app <-->|OAuth / importación; no envío de entregas| google
  app -. ejecuta en .-> vercel
```

## 6.2 Contenedores y confianza (C4 nivel 2)

```mermaid
flowchart TB
  subgraph usuario[Dispositivo del usuario: navegador]
    ui[UI Next.js / React\nES-EN, mocks o API]
    cam[Entrada opcional de cámara/micrófono]
  end
  subgraph host[Hosting de aplicación - Vercel según README]
    pages[Next.js Server Components]
    api[Route Handlers /api]
    dbsvc[Servicios dominio src/lib/db]
    ia[Servicios IA src/lib/ia]
    planner[Planificador determinista]
    classroom[Adaptador Google Classroom]
  end
  subgraph cloud[Servicios externos]
    auth[Supabase Auth]
    pg[(Supabase PostgreSQL + RLS)]
    storage[(Supabase Storage privado: adjuntos)]
    mapi[Meta Model API / ASR]
    open[Endpoint open-weight]
    nv[NVIDIA opcional]
    g[Google Classroom API]
  end
  ui --> pages
  ui --> api
  cam --> ui
  api --> dbsvc
  api --> ia
  api --> planner
  api --> classroom
  pages --> auth
  dbsvc --> auth
  dbsvc --> pg
  dbsvc --> storage
  ia --> mapi
  ia -. fallback .-> open
  ia -. fallback opcional .-> nv
  classroom <-->|OAuth/API| g
```

## 6.3 Diagrama de nodos/despliegue (C4 nivel 3)

```mermaid
flowchart LR
  subgraph n1[«device» teléfono o computadora]
    browser[«browser» navegador moderno\nUI, MediaDevices, Web Speech/speechSynthesis]
  end
  subgraph n2[«node» plataforma de hosting web]
    next[«execution environment» Next.js\npáginas SSR y API handlers]
    secrets[Variables privadas de entorno\nserver-only]
  end
  subgraph n3[«node» Supabase administrado]
    sbAuth[Auth y sesiones/cookies]
    postgres[(PostgreSQL + RLS/migraciones)]
    bucket[(Storage privado adjuntos)]
  end
  subgraph n4[«external node» Meta]
    muse[Model API: generación/visión]
    asr[Voice Transcribe ASR]
  end
  subgraph n5[«external node» proveedor open-weight]
    inference[Endpoint OpenAI-compatible]
  end
  subgraph n6[«external node» Google]
    classroom[Classroom API]
  end
  browser -->|HTTPS| next
  next -->|HTTPS sesión| sbAuth
  next -->|HTTPS consultas bajo RLS| postgres
  next -->|HTTPS archivos/rutas autorizadas| bucket
  next -->|HTTPS, clave solo servidor| muse
  next -->|HTTPS WAV, clave solo servidor| asr
  next -.->|HTTPS, solo si configurado| inference
  next <-->|OAuth/API, opcional| classroom
  secrets -. se leen por .-> next
```

## 6.4 Modelo entidad-relación resumido

```mermaid
erDiagram
  AUTH_USERS ||--|| PERFILES : tiene
  PERFILES ||--o{ CLASES : docente_propietario
  PERFILES ||--o{ INSCRIPCIONES : estudiante
  CLASES ||--o{ INSCRIPCIONES : incluye
  CLASES ||--o{ TAREAS : contiene
  TAREAS ||--o{ ENTREGAS : recibe
  PERFILES ||--o{ ENTREGAS : entrega
  TAREAS ||--o{ ANALISIS_TAREAS : analiza
  PERFILES ||--o{ ANALISIS_TAREAS : estudiante
  PERFILES ||--o{ PLANES : organiza
  PERFILES ||--o| PREFERENCIAS_ESTUDIO : configura
  TAREAS ||--o{ CONVERSACIONES_TUTOR : tutor
  PERFILES ||--o{ CONVERSACIONES_TUTOR : conversa
  ENTREGAS ||--o{ SESIONES_VERIFICACION : verifica
  ENTREGAS ||--o| INFORMES : informa
  ENTREGAS ||--o| CALIFICACIONES : califica
  ENTREGAS ||--o| COMENTARIOS_ENTREGA : comenta
  PERFILES ||--o{ AVISOS : recibe
  CLASES ||--o| CLASES_VINCULADAS : classroom
  TAREAS ||--o| TAREAS_VINCULADAS : classroom
```

El detalle de campos, cardinalidades y columnas JSON está en `07-modelo-de-datos.md` y en `supabase/migrations/`.

## 6.5 Secuencia de tarea → plan

```mermaid
sequenceDiagram
  actor D as Docente
  participant A as API Next.js
  participant DB as Supabase
  participant IA as Proveedor IA
  participant P as Algoritmo de plan
  actor S as Estudiante
  D->>A: POST tarea
  A->>DB: valida propiedad y guarda
  A-->>D: 201 tarea
  A->>DB: consulta inscritos
  loop Por estudiante
    A->>IA: analizar con salida estructurada
    IA-->>A: JSON
    A->>A: valida Zod
    A->>DB: guarda análisis
    A->>P: disponibilidad + prioridades + historial
    P-->>A: bloques deterministas
    A->>IA: redactar avisos (si configurado)
    A->>DB: guarda plan
  end
  S->>A: GET Hoy/Semana
  A->>DB: carga datos propios (RLS)
  A-->>S: plan y tareas
```

## 6.6 Secuencia de entrega → verificación

```mermaid
sequenceDiagram
  actor S as Estudiante
  participant UI as UI/Browser
  participant API as Next.js API
  participant ST as Supabase Storage/DB
  participant M as Meta Vision/ASR/LLM
  S->>UI: entrega texto/archivo/fotos
  UI->>API: POST adjuntos + POST entrega
  API->>ST: guarda en Storage privado / entrega
  S->>API: POST verificacion/iniciar
  API->>ST: comprueba pertenencia, carga contexto/fotos
  opt Hay fotos de cuaderno
    API->>M: lectura/transcripción visual autorizada
    M-->>API: transcripción, pasos, incertidumbres
  end
  API->>M: genera pregunta
  M-->>API: pregunta validada
  loop Preguntas secuenciales (normalmente 3)
    S->>API: POST respuesta (texto o transcripción)
    API->>M: siguiente pregunta o evaluación
    M-->>API: resultado estructurado
  end
  API->>API: valida citas contra respuestas
  API->>ST: guarda informe/ruta/estado
  API-->>S: informe de comprensión
```

## Supuestos que requieren confirmar

La región de cada servicio, red, certificados, backups, escalado y configuración concreta de Vercel/Supabase no se deducen solo del repositorio. Google Classroom es opcional. El servicio `audios` aparece en migraciones iniciales, pero el handler actual procesa voz sin guardarla.
