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
- [ ] `llamarMuse({ sistema, mensajes, esquema?, esfuerzo, stream? })`: usa SDK de OpenAI con `baseURL https://api.meta.ai/v1`, modelo de `MUSE_MODELO`, antepone las reglas comunes (prompt 00).
- [ ] Enrutamiento de modelos según ARQUITECTURA §3: `llamarMuse({ ..., funcion })` elige proveedor y modelo por función. Proveedores (todos compatibles con OpenAI): `meta` (api.meta.ai), `abierto` (**Baseten**, Muse Spark Open `meta-models/muse-spark-open-1026`, base `https://inference.baseten.co/v1` — confirmar en el Quickstart de Baseten; variables `MODELO_ABIERTO_URL`, `MODELO_ABIERTO_KEY`, `MODELO_ABIERTO_ID`). Si el proveedor principal falla, usa el respaldo y lo registra.
- [ ] Analizador y planificador corren en **Muse Spark Open o Glimmer** cuando hay proveedor abierto configurado. Registrar en Decisiones qué proveedor y modelo, con una prueba que lo demuestre (premio "Best Build on Meta Open Weight Models").
- [ ] Si se pasa `esquema` (Zod), pide salida estructurada, valida y reintenta 1 vez con el error si falla.
- [ ] Reintentos con espera ante 429/5xx (máx. 3), tiempo límite de 30 s, y registro del costo aproximado por llamada (tokens) en consola del servidor.
- [ ] `analizarTarea()` según prompt 01; guarda en `analisis_tareas`. Incluye historial del estudiante si existe.
- [ ] `planificarSemana()`: algoritmo determinista (prioridad → franjas libres → bloques ≤ max_minutos) + llamada a Muse solo para ajustes y `avisos` (prompt 02).
- [ ] El plan se recalcula al llegar un análisis nuevo, al omitir un bloque y con `POST /api/ia/plan`.
- [ ] Preferencias por defecto si el estudiante no configuró: lun-vie 15:00-18:00, sáb 9:00-12:00, bloques de 45 min.
- [ ] Endpoints T03 de `api.md` funcionando y validados.
- [ ] Pruebas: planificador determinista con casos (semana vacía, sobrecarga, tarea para mañana, bloque omitido); prueba del analizador con 3 tareas reales de distintas materias (guardar las salidas como fixtures).
- [ ] Documentar en Decisiones: ID de modelo usado, costo promedio por análisis y por plan.

## Decisiones
- 

## Bloqueos
- 

## Solicitudes al integrador
- 
