# T05 — Dashboard del estudiante: Hoy y Semana

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t05-dashboard` / `../muselearn-T05` |
| Oleada | 1 |
| Depende de | T00 (trabaja con mocks de T03 hasta que existan los endpoints) |
| Puedes tocar | `src/app/[locale]/estudiante/hoy/`, `src/app/[locale]/estudiante/semana/`, `src/app/[locale]/estudiante/tarea/[id]/page.tsx`, `src/app/[locale]/estudiante/layout.tsx`, `src/components/estudiante/`, `src/lib/mocks/estudiante.ts`, `messages/*/estudiante.json` |
| Contratos | `Tarea`, `AnalisisTarea`, `PlanSemanal`, `BloquePlan` (solo lectura) |

## Objetivo
La pantalla que el estudiante ve todos los días. Debe ser clara, bonita y verse muy bien en celular.

## Criterios de aceptación
- [x] **Hoy**: saludo, "lo próximo que te toca" destacado (tarea, bloque, minutos), lista de bloques del día con casilla de hecho/omitir, entregas próximas.
- [x] **Semana**: calendario de lunes a domingo con bloques de estudio y marcas de entrega; en celular, vista por día deslizable.
- [x] Tarjeta de tarea: materia, título, fecha, chip de dificultad (1-5), minutos estimados, prioridad y "por qué" (`razon`) al tocarla.
- [x] Banner de avisos del plan ("moví tu repaso de Química al miércoles") con botón de cerrar.
- [x] Botón "Reorganizar mi semana" → `POST /api/ia/plan`.
- [x] Página de tarea `/estudiante/tarea/[id]`: instrucciones, adjuntos, análisis, pasos sugeridos, botones "Pedir ayuda al tutor" (→ ruta de T04) y "Entregar" (usa `FormularioEntrega` de T02; si aún no existe, un placeholder).
- [x] Estados de carga (Skeleton) y vacíos ("No tienes tareas, ¡disfruta!").
- [ ] Funciona a 380 px sin scroll horizontal; accesible con teclado y lector de pantalla básico.
- [ ] Todo funciona con `NEXT_PUBLIC_USAR_MOCKS=true` y también con la API real.
- [x] Textos en es y en.

## Notas del integrador (27 oct)
- T03 ya integrada: `GET/POST /api/ia/plan`, `PATCH /api/ia/plan/bloques/:id`, `GET /api/ia/analisis` y `PUT /api/preferencias` funcionan con datos reales. Usa siempre `@/lib/api-cliente` (mocks o real según `NEXT_PUBLIC_USAR_MOCKS`).
- El layout del estudiante ya exige sesión y rol (T01) y tiene el botón Salir.

## Decisiones
- 2026-10-27: identidad obtenida en servidor mediante exigirRol; componentes cliente usan exclusivamente api-cliente. Semana local lunes-domingo, deslizable en celular; errores recuperables sin descartar el plan anterior.
- 2026-10-27: FormularioEntrega ausente: placeholder permitido por la ficha. Adjuntos privados muestran nombre sin inventar una URL publica.
- 

## Bloqueos
- 2026-10-27: no hay navegador disponible en cua_repl (getBrowser devuelve "No browser is available"); pendiente revision visual a 380 px y escritorio y comprobacion de teclado/lector en navegador. No se marca ese criterio.
- 2026-10-27: T02 aun no integrada: faltan endpoints de tareas/entregas para comprobar el flujo real completo. Se implementaron llamadas compartidas sin introducir fetch ni mocks en modo real. No se marca el criterio de funcionamiento real hasta verificarlo.
- 

## Solicitudes al integrador
- Integrar FormularioEntrega de T02 e indicar sus props; proveer URL firmada de descarga de adjuntos privados mediante api-cliente (actualmente solo existe la ruta de Storage).
- api-cliente devuelve siempre planSemanalMock en obtenerPlan/recalcularPlan aunque se solicite otra semana; adaptar el mock compartido a semana_inicio y persistir cambios de bloques entre navegaciones.
- 
