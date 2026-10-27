# Contratos de API (Route Handlers de Next.js)

Reglas comunes:
- Todo bajo `/api`. Respuestas JSON. Errores: `{ "error": { "codigo": string, "mensaje": string } }` con HTTP 4xx/5xx.
- Autenticación por cookie de Supabase. Cada handler verifica rol y pertenencia.
- Entradas y salidas se validan con los esquemas Zod de `src/types/contratos.ts`.
- Mientras un endpoint no existe, el cliente usa `src/lib/mocks/<modulo>.ts` (`NEXT_PUBLIC_USAR_MOCKS=true`).
- El cliente del frontend llama siempre a través de `src/lib/api-cliente.ts` (T00), nunca con `fetch` suelto.

## T01 — Auth y clases

| Método | Ruta | Rol | Entrada | Salida |
|---|---|---|---|---|
| POST | `/api/clases` | docente | `{ nombre, materia, grado }` | `Clase` |
| GET | `/api/clases` | ambos | — | `Clase[]` (las del docente o en las que está inscrito) |
| POST | `/api/clases/unirse` | estudiante | `{ codigo }` | `Clase` |
| GET | `/api/clases/:id/estudiantes` | docente | — | `Usuario[]` |

## T02 — Tareas y entregas

| Método | Ruta | Rol | Entrada | Salida |
|---|---|---|---|---|
| POST | `/api/tareas` | docente | `Omit<Tarea, id, creada_en>` | `Tarea` · luego dispara `POST /api/ia/analizar` para cada estudiante (en segundo plano) |
| GET | `/api/tareas?clase_id=` | ambos | — | `Tarea[]` |
| GET | `/api/tareas/:id` | ambos | — | `Tarea` |
| POST | `/api/tareas/:id/adjuntos` | docente | `multipart` | `Adjunto` |
| POST | `/api/entregas` | estudiante | `{ tarea_id, contenido_texto, adjuntos }` | `Entrega` (estado `entregada`) |
| GET | `/api/entregas?tarea_id=` | ambos | — | `Entrega[]` (docente: todas; estudiante: la suya) |

## T03 — Motor IA

| Método | Ruta | Rol | Entrada | Salida |
|---|---|---|---|---|
| POST | `/api/ia/analizar` | servidor/estudiante | `{ tarea_id, estudiante_id }` | `AnalisisTarea` (se guarda en `analisis_tareas`) |
| GET | `/api/ia/analisis?estudiante_id=` | estudiante | — | `AnalisisTarea[]` |
| POST | `/api/ia/plan` | estudiante | `{ semana_inicio? }` | `PlanSemanal` (recalcula y guarda) |
| GET | `/api/ia/plan?semana_inicio=` | estudiante | — | `PlanSemanal` |
| PATCH | `/api/ia/plan/bloques/:id` | estudiante | `{ estado }` | `BloquePlan` |
| PUT | `/api/preferencias` | estudiante | `PreferenciasEstudio` | `PreferenciasEstudio` |

Funciones de librería que T03 exporta (para otros módulos del servidor):
- `lib/ia/cliente.ts` → `llamarMuse({ sistema, mensajes, esquema?, esfuerzo })` — ÚNICO punto de acceso al modelo.
- `lib/ia/analizador` → `analizarTarea(tarea, estudiante): Promise<AnalisisTarea>`
- `lib/ia/planificador` → `planificarSemana(estudiante_id, semana_inicio): Promise<PlanSemanal>`

## T04 — Tutor y verificación

| Método | Ruta | Rol | Entrada | Salida |
|---|---|---|---|---|
| POST | `/api/tutor` | estudiante | `{ tarea_id, mensaje }` | **stream** de texto; guarda en `conversaciones_tutor` |
| GET | `/api/tutor?tarea_id=` | estudiante | — | `MensajeChat[]` |
| POST | `/api/verificacion/iniciar` | estudiante | `{ entrega_id }` | `SesionVerificacion` (con la 1ª pregunta) |
| POST | `/api/verificacion/responder` | estudiante | `{ sesion_id, pregunta_id, respuesta, via }` | `{ siguiente: PreguntaVerificacion } \| { informe: InformeComprension }` |
| POST | `/api/voz/transcribir` | estudiante | `multipart (audio)` | `{ texto }` |

Al completar la verificación, T04 guarda `informes.informe` y llama a `generarRuta()` de T06 (si existe; si no, mock).

## T06 — Informes, rutas y panel docente

| Método | Ruta | Rol | Entrada | Salida |
|---|---|---|---|---|
| GET | `/api/informes/:entrega_id` | ambos | — | `{ informe: InformeComprension, ruta: RutaPractica \| null }` |
| POST | `/api/informes/:entrega_id/ruta` | servidor | — | `RutaPractica` |
| GET | `/api/docente/comprension?clase_id=&tarea_id=` | docente | — | `MapaComprension` |

Función de librería: `lib/ia/informes` → `generarRuta(informe, tarea): Promise<RutaPractica>`
