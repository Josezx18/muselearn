# T07 — Integrador

| Campo | Valor |
|---|---|
| Plataforma | Claude Code (sesión fija, en la carpeta principal `muselearn/` sobre `main`) |
| Oleada | continuo desde el día 2 |
| Puedes tocar | todo, con cuidado; dueño de los archivos congelados |
| Skill | `muselearn-integrador` |

## Objetivo
Que `main` siempre compile y funcione, y que al final exista una demo desplegada y estable.

## Criterios de aceptación
- [ ] Cada rama terminada se integra a `main` una por una, con lint, typecheck, test y build pasando.
- [ ] Atender "Solicitudes al integrador" de todas las fichas al menos 2 veces al día.
- [x] Convertir `supabase/politicas/rls.sql` de T01 en migración y aplicarla.
- [ ] Al integrar, avisar a las demás ramas: anotar en `PROGRESO.md` "rebase desde main recomendado".
- [ ] Apagar mocks módulo por módulo a medida que existen los endpoints reales.
- [ ] Seed de demo `supabase/seed-demo.ts`: 1 docente, 1 clase, 5 estudiantes ficticios, 6 tareas de distintas materias (incluida Tecnología), entregas y 3 verificaciones completadas con niveles variados para que el mapa de calor se vea interesante.
- [ ] Prueba e2e Playwright del flujo de demo completo (docente crea tarea → estudiante ve plan → tutor → entrega → verificación por texto → informe → panel docente).
- [ ] Despliegue en Vercel con variables de entorno; URL pública funcionando.
- [ ] Revisión final de seguridad: RLS, secretos, tier de modelo, borrado de audios.
- [x] Mantener `.orquesta/ESTADO.md` al día.

## Registro de integraciones
| Fecha | Rama | Resultado | Notas |
|---|---|---|---|
| 27 oct | t01-auth-clases | ✅ | sin conflictos; RLS → migración 0003 aplicada; script `seed:auth` agregado |
| 27 oct | t03-motor-ia | ✅ | conflicto solo en PROGRESO.md; `ZONA_OFFSET_MIN` en .env.example; 0004 quita EXECUTE de anon a funciones RLS |
| 30 oct | t20-rendimiento | ✅ | Integración local con validación SSR, entrega reactiva, fechas coherentes y mapa diferido; Lighthouse mediana 93/90/96, A11y 100; 245 unitarias y flujos afectados correctos; sin push. |

## Relevo del 30 oct — Codex
- Ensayo posterior solicitado por José: 150 e2e correctas y 2 omitidas; guion de demo en escritorio/celular, tutor/evaluación reales (7 casos) y analizador real (3 casos en vivo) correctos. ENSAYO.md contiene el detalle y los límites; no se marca completo el ensayo físico ni el recorrido autenticado de producción.
- Ficha T07 asignada expresamente por José; no existe `.ficha-actual` en la carpeta principal. No se altera la asignación de los worktrees.
- Todas las ramas T01–T18 aparecen en `git branch --merged main`; no queda ninguna de ellas por integrar. Se actualizó el tablero, que conservaba estados previos a esas integraciones.
- T19 requiere observaciones reales de José: se creó una plantilla en `.orquesta/ENSAYO.md` y se aclaró que su mera existencia no habilita la ficha. T20 conserva su alcance para OpenCode; no se abrió una sesión ni se modificó su código.
- Las solicitudes antiguas se contrastaron con el relevo y el plan: contratos T09, reentrega, mocks T15 y H01 ya figuran resueltos; mejoras transaccionales, CSV y práctica en Semana no se amplían durante esta preparación del cierre.
- Orden vigente de José: nunca hacer push ni cambiar el autor de los commits.
- Verificación del relevo: lint, typecheck, 235 pruebas (10 omitidas) y build correctos. Se restauraron dependencias ya declaradas; manifiesto y lockfile sin cambios. No se repitieron e2e ni RLS en esta revisión documental; sus resultados históricos siguen identificados como datos del relevo.
