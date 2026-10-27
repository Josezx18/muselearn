# T03 — Motor IA: cliente Muse, analizador y planificador

| Campo | Valor |
|---|---|
| Plataforma | Claude Code |
| Rama / carpeta | `t03-motor-ia` / `../muselearn-T03` |
| Oleada | 1 |
| Depende de | T00 |
| Puedes tocar | `src/lib/ia/cliente.ts`, `src/lib/ia/analizador/`, `src/lib/ia/planificador/`, `src/lib/ia/prompts/`, `src/app/api/ia/`, `src/app/api/preferencias/`, `src/lib/mocks/ia.ts` |
| Contratos | `AnalisisTarea`, `PlanSemanal`, `BloquePlan`, `PreferenciasEstudio`; prompts 00, 01 y 02 |

## Objetivo
El cerebro del organizador y el único punto de acceso al modelo de Meta para todo el proyecto.

## Criterios de aceptación
- [x] `llamarMuse({ sistema, mensajes, esquema?, esfuerzo, stream? })`: usa SDK de OpenAI con `baseURL https://api.meta.ai/v1`, modelo de `MUSE_MODELO`, antepone las reglas comunes (prompt 00).
- [x] Enrutamiento de modelos según ARQUITECTURA §3: `llamarMuse({ ..., funcion })` elige proveedor y modelo por función. Proveedores (todos compatibles con OpenAI): `meta` (api.meta.ai), `abierto` (**Baseten**, Muse Spark Open `meta-models/muse-spark-open-1026`, base `https://inference.baseten.co/v1` — confirmar en el Quickstart de Baseten; variables `MODELO_ABIERTO_URL`, `MODELO_ABIERTO_KEY`, `MODELO_ABIERTO_ID`). Si el proveedor principal falla, usa el respaldo y lo registra.
- [x] Analizador y planificador corren en **Muse Spark Open o Glimmer** cuando hay proveedor abierto configurado. Registrar en Decisiones qué proveedor y modelo, con una prueba que lo demuestre (premio "Best Build on Meta Open Weight Models").
- [x] Si se pasa `esquema` (Zod), pide salida estructurada, valida y reintenta 1 vez con el error si falla.
- [x] Reintentos con espera ante 429/5xx (máx. 3), tiempo límite de 30 s, y registro del costo aproximado por llamada (tokens) en consola del servidor.
- [x] `analizarTarea()` según prompt 01; guarda en `analisis_tareas`. Incluye historial del estudiante si existe.
- [x] `planificarSemana()`: algoritmo determinista (prioridad → franjas libres → bloques ≤ max_minutos) + llamada a Muse solo para ajustes y `avisos` (prompt 02).
- [x] El plan se recalcula al llegar un análisis nuevo, al omitir un bloque y con `POST /api/ia/plan`.
- [x] Preferencias por defecto si el estudiante no configuró: lun-vie 15:00-18:00, sáb 9:00-12:00, bloques de 45 min.
- [x] Endpoints T03 de `api.md` funcionando y validados. (compilan y validan con Zod; sin probar contra Supabase real, ver Bloqueos)
- [x] Pruebas: planificador determinista con casos (semana vacía, sobrecarga, tarea para mañana, bloque omitido); prueba del analizador con 3 tareas reales de distintas materias (guardar las salidas como fixtures). (planificador: 14+6 pruebas; analizador: pruebas con 3 tareas de materias distintas — las salidas de `fixtures/tareas.json` son SIMULADAS, ver Bloqueos)
- [ ] Documentar en Decisiones: ID de modelo usado, costo promedio por análisis y por plan.

## Decisiones
- `llamarMuse` y el enrutamiento por función ya los dejó T00 en `cliente.ts`; T03 añadió `llamarMuseStream` (texto plano, respaldo solo antes del primer trozo) para el tutor de T04. Reintentos 429/5xx (3) y límite de 30 s los hace el SDK de OpenAI; el costo se registra como tokens de entrada/salida por llamada en consola (sin precio en dinero: depende de la tarifa de Meta/Baseten).
- **Proveedor/modelo de analizar y planificar:** `abierto` = Muse Spark Open en Baseten (`meta-models/muse-spark-open-1026`, variables `MODELO_ABIERTO_*`); respaldo `meta` (`muse-spark-1.3`) y luego NVIDIA. Lo demuestran las pruebas "corre en Muse Spark Open (Baseten)…" en `analizador.test.ts` y el enrutamiento de `cliente.test.ts` (con SDK simulado; la confirmación contra Baseten real falta por no haber claves).
- **Planificador:** el plan lo calcula SIEMPRE `algoritmo.ts` (determinista, prioridad → franjas → bloques ≤ max, 10 min de descanso, termina 1 día antes si cabe, evita dos tareas de dificultad ≥4 seguidas). Muse solo redacta `avisos` (1-3); si falla, avisos de respaldo sin IA. Así el plan no depende del modelo.
- **Zona horaria:** las franjas se interpretan con un desplazamiento fijo (`ZONA_OFFSET_MIN`, por defecto -240 = Rep. Dominicana) porque Vercel corre en UTC.
- **Bloques:** id estable `<tarea8>-<minuto epoch>`. Un bloque `planificado` ya vencido pasa a `omitido`; un bloque omitido no reutiliza su hueco; lo `hecho` no se mueve y se descuenta (en todas las semanas).
- **Permisos de `/api/ia/analizar`:** servidor a servidor con `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` (T02 lo usa al crear tarea), el propio estudiante inscrito, o el docente dueño de la clase. El resto de endpoints solo para el estudiante en sesión sobre sus datos. Tras guardar un análisis se recalcula el plan de la semana actual.
- Del adjunto solo se envía el nombre al analizador (no hay extracción de texto de PDFs en T03).
- Historial del analizador: minutos de bloques `hecho` vs. `minutos_estimados`, por materia (no existe tabla de tiempo real).

## Bloqueos
- No hay claves reales en `.env.local` (`MODEL_API_KEY`, `MODELO_ABIERTO_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Por eso quedan pendientes, y sin marcar en Decisiones, estos dos criterios que exigen medir con el modelo real:
  - Salidas **reales** del analizador para 3 tareas (hoy `fixtures/tareas.json` trae salidas simuladas, claramente rotuladas). Regenerar con `IA_EN_VIVO=1 npx vitest run analizador`.
  - **Costo promedio por análisis y por plan** (tokens reales × tarifa). Los logs `[ia] … entrada=N salida=M` dan el dato.
  - Tampoco se probaron los endpoints contra Supabase real (solo lógica con almacén en memoria).

## Solicitudes al integrador
- T02: al crear una tarea, llamar `POST /api/ia/analizar` con cabecera `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` por cada estudiante inscrito (o importar `analizarYGuardar` de `@/lib/ia/analizador/servicio`).
- Variable de entorno nueva y opcional `ZONA_OFFSET_MIN` (por defecto -240); añadirla a `.env.example` (congelado para mí).
- Las claves de IA y service_role faltan en `.env.local`; hace falta `npm run prueba:ia` antes de la demo.
