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
- [ ] **Hoy**: saludo, "lo próximo que te toca" destacado (tarea, bloque, minutos), lista de bloques del día con casilla de hecho/omitir, entregas próximas.
- [ ] **Semana**: calendario de lunes a domingo con bloques de estudio y marcas de entrega; en celular, vista por día deslizable.
- [ ] Tarjeta de tarea: materia, título, fecha, chip de dificultad (1-5), minutos estimados, prioridad y "por qué" (`razon`) al tocarla.
- [ ] Banner de avisos del plan ("moví tu repaso de Química al miércoles") con botón de cerrar.
- [ ] Botón "Reorganizar mi semana" → `POST /api/ia/plan`.
- [ ] Página de tarea `/estudiante/tarea/[id]`: instrucciones, adjuntos, análisis, pasos sugeridos, botones "Pedir ayuda al tutor" (→ ruta de T04) y "Entregar" (usa `FormularioEntrega` de T02; si aún no existe, un placeholder).
- [ ] Estados de carga (Skeleton) y vacíos ("No tienes tareas, ¡disfruta!").
- [ ] Funciona a 380 px sin scroll horizontal; accesible con teclado y lector de pantalla básico.
- [ ] Todo funciona con `NEXT_PUBLIC_USAR_MOCKS=true` y también con la API real.
- [ ] Textos en es y en.

## Decisiones
- 

## Bloqueos
- 

## Solicitudes al integrador
- 
