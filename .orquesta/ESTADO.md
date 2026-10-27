# ESTADO — Tablero de sesiones

Cada sesión actualiza SU fila al empezar y al terminar un bloque de trabajo.
Estados: ⬜ sin empezar · 🟦 trabajando · 🟨 bloqueado · 🟩 lista para integrar · ✅ integrada

| Ficha | Pieza | Plataforma | Nombre de sesión | Rama | Estado | Último avance |
|---|---|---|---|---|---|---|
| T00 | Esqueleto y contratos | Claude Code | `T00-esqueleto` | main | ✅ | 27 oct: listo; falta prueba con claves reales y push |
| T01 | Auth y clases | Claude Code | `T01-auth-claude` | t01-auth-clases | 🟩 | 27 oct: criterios completos; RLS y seed por aplicar |
| T02 | Tareas y entregas | OpenCode | `T02-tareas-opencode` | t02-tareas | ⬜ | |
| T03 | Motor IA | Claude Code | `T03-motor-claude` | t03-motor-ia | ⬜ | |
| T04 | Tutor y verificación | Claude Code | `T04-tutor-claude` | t04-tutor-verificacion | ⬜ | |
| T05 | Dashboard estudiante | Codex | `T05-dashboard-codex` | t05-dashboard | ⬜ | |
| T06 | Informes y panel docente | OpenCode | `T06-informes-opencode` | t06-informes | ⬜ | |
| T07 | Integrador | Claude Code | `T07-integrador` | main | ⬜ | |
| T08 | Demo y entrega | José | — | — | ⬜ | |

## Orden de integración previsto
T00 → T01 → T03 → T02 → T05 → T04 → T06 → seed demo → e2e → despliegue
