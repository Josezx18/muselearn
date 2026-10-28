# ESTADO — Tablero de sesiones

Cada sesión actualiza SU fila al empezar y al terminar un bloque de trabajo.
Estados: ⬜ sin empezar · 🟦 trabajando · 🟨 bloqueado · 🟩 lista para integrar · ✅ integrada

| Ficha | Pieza | Plataforma | Nombre de sesión | Rama | Estado | Último avance |
|---|---|---|---|---|---|---|
| T00 | Esqueleto y contratos | Claude Code | `T00-esqueleto` | main | ✅ | 27 oct: listo; falta prueba con claves reales y push |
| T01 | Auth y clases | Claude Code | `T01-auth-claude` | t01-auth-clases | ✅ | 27 oct: integrada; falta seed con claves reales |
| T02 | Tareas y entregas | OpenCode | `T02-tareas-opencode` | t02-tareas | ✅ | 27 oct: integrada con correcciones de T07 (subida real a Storage, crear tarea, FormularioEntrega) |
| T03 | Motor IA | Claude Code | `T03-motor-claude` | t03-motor-ia | ✅ | 27 oct: integrada; falta medir costo con claves reales |
| T04 | Tutor y verificación | Codex | `T04-tutor-codex` | t04-tutor-verificacion | ⬜ | |
| T05 | Dashboard estudiante | Codex | `T05-dashboard-codex` | t05-dashboard | ⬜ | |
| T06 | Informes y panel docente | OpenCode | `T06-informes-opencode` | t06-informes | ⬜ | |
| T07 | Integrador | Claude (chat) | `T07-integrador` | main | 🟦 | 27 oct: integró T01 y T03 |
| T08 | Demo y entrega | José | — | — | ⬜ | |

## Orden de integración previsto
T00 → T01 → T03 → T02 → T05 → T04 → T06 → seed demo → e2e → despliegue
