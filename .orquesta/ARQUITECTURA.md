# MuseLearn — Arquitectura

> Nombre de trabajo. Si las reglas del hackathon no permiten "Muse" en el nombre,
> se cambia en `src/config/marca.ts` y en los textos de `messages/` (un solo lugar).

## 1. Tesis

**En la era de la IA, entregar una tarea ya no prueba que aprendiste.**

MuseLearn es un compañero de estudio que:
1. **Organiza** la semana del estudiante a partir de sus tareas (dificultad, tiempo, prioridad).
2. **Enseña sin hacer la tarea** (tutor socrático, el docente decide el nivel de ayuda).
3. **Verifica la comprensión**: después de entregar, el estudiante explica su propio trabajo (voz o texto).
4. **Propone una ruta de mejora** según las debilidades detectadas.
5. Le muestra al **docente quién entendió**, no solo quién entregó.

Ciclo: **organizar → aprender → entregar → demostrar → mejorar**.

### Por qué NO es un "chatbot educativo"
La guía del hackathon descarta los *simple "AI for Education" chatbots*. MuseLearn debe verse y presentarse como
un **sistema de agentes con flujo de trabajo**, no como un chat:
- **El agente actúa sin que el estudiante pregunte:** analiza cada tarea al llegar y reorganiza el plan solo.
- **Es multimodal:** lee PDFs de las tareas, lee la **foto del cuaderno** que entrega el estudiante y escucha su voz (Muse Voice Transcribe).
  La verificación pregunta sobre lo que el estudiante escribió a mano: "En la línea 3 de tu cuaderno pasaste el 5 restando, ¿por qué?".
- **Es verificable:** la verificación produce evidencia estructurada por concepto (JSON validado), no texto libre.
- **Cierra un ciclo con dos usuarios:** lo que hace el estudiante cambia lo que ve el docente.
- El chat del tutor es **una sola pieza de cinco**. En la demo no ocupa más de 30 segundos.

La parte de clases y tareas es solo el **canal** (mínimo y funcional). El valor está en el agente.
A futuro el agente puede conectarse a Classroom, Moodle o Teams.

## 2. Usuarios y flujos principales

### Docente
1. Se registra → crea una clase → comparte el **código de inscripción**.
2. Crea una tarea (escrita o con archivo adjunto): instrucciones, fecha, competencias, **nivel de ayuda del tutor**.
3. Ve el **panel de comprensión**: quién entregó, nivel de dominio por concepto, mapa de calor de la clase.

### Estudiante
1. Se registra → se une a una clase con el código.
2. Al llegar una tarea, el agente la **analiza** (dificultad 1-5, minutos estimados, prioridad, conceptos).
3. Ve su plan en **Hoy** y **Semana**; si llega una tarea nueva, el plan se **reorganiza** y se le avisa.
4. Trabaja la tarea con el **tutor** (pistas, preguntas, nunca la respuesta).
5. **Entrega** → inicia la **verificación** ("Explícamelo"): 3 a 5 preguntas sobre SU trabajo, por voz o texto.
6. Recibe su **informe de comprensión** (nivel por concepto, fortalezas, debilidades) y una **ruta de práctica**.

## 3. Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Estilos | Tailwind CSS + componentes propios en `src/components/ui` |
| i18n | `next-intl` — español por defecto, inglés como segunda lengua |
| Auth, DB, archivos | Supabase (Auth, Postgres con RLS, Storage para adjuntos y audios) |
| IA | **Meta Model API** (Muse Spark) vía SDK de OpenAI con `baseURL = https://api.meta.ai/v1` |
| Voz | **Muse Voice Transcribe** (Meta Model API); respaldo: Web Speech API del navegador |
| Visión | **Muse Spark** lee fotos del cuaderno (trabajo escrito a mano) en entregas y verificación |
| Modelo abierto | **Muse Spark Open en Baseten** (`meta-models/muse-spark-open-1026`, créditos de $100 confirmados) para análisis y plan en lote. Respaldo: Muse Spark en Meta Model API; segundo respaldo opcional: Muse Glimmer en NVIDIA. Apunta al premio "Best Build on Meta Open Weight Models". |

**Enrutamiento de modelos** (en `src/lib/ia/cliente.ts`, configurable por variable de entorno):

| Función | Modelo principal | Respaldo |
|---|---|---|
| Analizar tarea, planificar semana | Muse Spark Open (proveedor abierto) | Muse Spark (Meta API) |
| Leer foto del cuaderno | Muse Spark (Meta API) | — |
| Tutor, verificación, informe, ruta | Muse Spark (Meta API) | Muse Spark Open |
| Transcribir voz | Muse Voice Transcribe | Web Speech API |
| Despliegue | Vercel |
| Pruebas | Vitest (unidad) + Playwright (un flujo e2e de demo) |

**Reglas de IA:**
- Modelo por defecto: `muse-spark-1.3` (confirmar ID exacto el día 1 en dev.meta.ai/docs/models).
- **Nunca** usar el tier *Contributor* para datos de estudiantes (Meta puede entrenar con ellos).
- `reasoning_effort` por función: bajo para analizar/planificar, alto para tutor y verificación.
- Todas las salidas estructuradas usan **JSON validado con Zod** (esquemas en `src/types/contratos.ts`).
- El contenido del estudiante es **dato**, nunca instrucción (protección contra prompt injection).

## 4. Módulos y dueños

| ID | Módulo | Plataforma | Oleada |
|---|---|---|---|
| T00 | Esqueleto, contratos, mocks, UI base | Claude Code | 0 (día 1) |
| T01 | Auth, roles, clases, inscripción | Claude Code | 1 |
| T02 | Tareas del docente y entregas | OpenCode | 1 |
| T03 | Motor IA: cliente Muse, analizador, planificador | Claude Code | 1 |
| T04 | Tutor socrático + verificación de comprensión (voz) | Claude Code | 1 |
| T05 | Dashboard del estudiante: Hoy / Semana | Codex | 1 |
| T06 | Informe, ruta de práctica y panel docente | OpenCode | 2 |
| T07 | Integración continua, datos demo, despliegue | Claude Code (integrador) | continuo |
| T08 | Demo, video, README, revisión i18n | José + Claude | final |

Extras (solo si sobra tiempo): E1 foto de pizarra → tarea, E2 vista mensual, E3 generar tarea con IA según currículo.

## 5. Estructura de carpetas y propiedad

Cada carpeta tiene **un solo dueño**. Nadie edita fuera de lo suyo.

```
muselearn/
├── AGENTS.md  CLAUDE.md(→AGENTS.md)  META.md  PROGRESO.md
├── .orquesta/                      ← planificación (solo integrador edita ARQUITECTURA y contratos)
├── .agents/skills/                 ← skills compartidas por las 4 plataformas
├── supabase/migrations/            ← T00 crea; cambios solo vía integrador
├── messages/{es,en}/
│   ├── comun.json                  ← T00 (congelado)
│   ├── auth.json  clases.json      ← T01
│   ├── tareas.json                 ← T02
│   ├── estudiante.json             ← T05
│   ├── tutor.json  verificacion.json ← T04
│   └── informes.json  docente.json ← T06
└── src/
    ├── config/marca.ts             ← T00 (nombre, colores)
    ├── types/contratos.ts          ← T00 — CONGELADO, cambios solo vía integrador
    ├── components/ui/              ← T00 — CONGELADO
    ├── components/<modulo>/        ← dueño del módulo
    ├── lib/supabase/  lib/db/      ← T01
    ├── lib/ia/cliente.ts  lib/ia/analizador/  lib/ia/planificador/  lib/ia/prompts/ ← T03
    ├── lib/ia/conversacion/        ← T04 (tutor, verificador, voz)
    ├── lib/ia/informes/            ← T06
    ├── lib/mocks/<modulo>.ts       ← cada módulo su propio archivo
    └── app/[locale]/
        ├── (publico)/login  registro  unirse        ← T01
        ├── docente/clases/  docente/tareas/          ← T02 (y T01 para crear clase)
        ├── docente/comprension/                       ← T06
        ├── estudiante/hoy/  estudiante/semana/        ← T05
        ├── estudiante/tarea/[id]/page.tsx             ← T05
        ├── estudiante/tarea/[id]/tutor/  .../verificar/ ← T04
        └── estudiante/informe/[id]/                   ← T06
    └── app/api/
        ├── clases/                 ← T01
        ├── tareas/  entregas/      ← T02
        ├── ia/analizar/  ia/plan/  ← T03
        ├── tutor/  verificacion/  voz/ ← T04
        └── informes/  docente/comprension/ ← T06
```

## 6. Cómo se conectan las piezas (las "bisagras")

```
Docente crea Tarea (T02)
   └─► evento "tarea_creada" ─► T03 analizar(tarea, estudiante) ─► AnalisisTarea
                                └─► T03 planificar(estudiante) ─► PlanSemanal ─► T05 muestra Hoy/Semana
Estudiante abre tarea (T05) ─► Tutor (T04) usa Tarea.nivel_ayuda
Estudiante entrega (T02) ─► Verificación (T04) ─► InformeComprension
                                                   └─► T06 ruta de práctica + panel docente
```

Toda comunicación entre módulos pasa por:
1. Los **tipos** de `src/types/contratos.ts`.
2. Los **endpoints** de `.orquesta/contratos/api.md`.
3. Las **tablas** de `supabase/migrations/` (copia en `.orquesta/contratos/esquema.sql`).

Mientras una pieza no existe, se usan los **mocks** (`NEXT_PUBLIC_USAR_MOCKS=true`).

## 7. Modelo de dominio (niveles)

- **Dificultad**: 1 (muy fácil) a 5 (muy difícil).
- **Nivel de dominio** por concepto (alineado a evaluación por competencias MINERD):
  1 Inicial · 2 En proceso · 3 Logrado · 4 Destacado.
- **Nivel de ayuda del tutor** (lo decide el docente por tarea):
  - `pistas`: solo preguntas guía y pistas.
  - `ejemplos`: pistas + ejemplos parecidos resueltos (nunca el ejercicio de la tarea).
  - `explicacion`: explica el concepto completo, pero no resuelve la tarea.

## 8. Privacidad y seguridad

- Estudiantes menores de edad: datos mínimos (nombre visible y correo), sin datos sensibles.
- RLS en todas las tablas: el estudiante ve solo lo suyo; el docente solo sus clases.
- Audios de verificación: se transcriben y el audio se borra después (o se guarda máx. 7 días).
- Datos de demo **ficticios**. Prueba con estudiantes reales solo con permiso del centro.
- Claves de API solo en el servidor (`MODEL_API_KEY` nunca con prefijo `NEXT_PUBLIC_`).
