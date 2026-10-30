# ESTADO — Tablero de sesiones

Cada sesión actualiza SU fila al empezar y al terminar un bloque de trabajo.
Estados: ⬜ sin empezar · 🟦 trabajando · 🟨 bloqueado · 🟩 lista para integrar · ✅ integrada

| Ficha | Pieza | Plataforma | Nombre de sesión | Rama | Estado | Último avance |
|---|---|---|---|---|---|---|
| T00 | Esqueleto y contratos | Claude Code | `T00-esqueleto` | main | ✅ | 27 oct: listo; falta prueba con claves reales y push |
| T01 | Auth y clases | Claude Code | `T01-auth-claude` | t01-auth-clases | ✅ | 27 oct: integrada; falta seed con claves reales |
| T02 | Tareas y entregas | OpenCode | `T02-tareas-opencode` | t02-tareas | ✅ | 27 oct: integrada con correcciones de T07 (subida real a Storage, crear tarea, FormularioEntrega) |
| T03 | Motor IA | Claude Code | `T03-motor-claude` | t03-motor-ia | ✅ | 27 oct: integrada; falta medir costo con claves reales |
| T04 | Tutor y verificación | Codex | `T04-tutor-codex` | t04-tutor-verificacion | ✅ | 27 oct: integrada; voz conectada por T07; faltan 3 fotos reales de cuaderno para la prueba |
| T05 | Dashboard estudiante | Codex | `T05-dashboard-codex` | t05-dashboard | ✅ | 27 oct: integrada; entrega real de T02 conectada; 380 px verificado |
| T06 | Informes y panel docente | Codex | `T06-informes-codex` | t06-informes | ✅ | 28 oct: integrada con ruta de respaldo; "Agregar a mi semana" queda como mejora |
| T07 | Integrador | Claude (chat) | `T07-integrador` | main | 🟦 | 27 oct: integró T01 y T03 |
| T10 | Exportación CSV | Codex | `T10-csv` | t10-csv | 🟩 | 29 oct: completa; lint/typecheck, 199 pruebas y 4 e2e OK; sin push |
| T13 | Voz | Codex | `T13-voz` | t13-voz | 🟩 | 29 oct: completa; lint/typecheck, 216 pruebas y seis e2e OK; falta ensayo con micrófono real |
| T15 | Datos demo | Codex | `T15-demo` | t15-demo-datos | 🟨 | 29 oct: 6/7; SQL idempotente probado localmente; falta conectar detalles/comentarios/semana en api-cliente |
| T17 | Mocks y deudas | Codex | `T17-deuda` | t17-deuda | 🟩 | 29 oct: completa; lint/typecheck, 235 unitarias y 82 e2e OK; sin push ni merge |
| T08 | Demo y entrega | José | — | — | ⬜ | |
| T09 | Calificar y devolver | Codex | `T09-calificar` | t09-calificar | 🟨 | 29 oct: 8/9 criterios, 191 unitarias y 4 e2e OK; conectar limpieza en POST /api/entregas; 0009 sin aplicar |

## Orden de integración previsto
T00 → T01 → T03 → T02 → T05 → T04 → T06 → seed demo → e2e → despliegue
