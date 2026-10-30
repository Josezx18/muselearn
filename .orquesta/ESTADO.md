# ESTADO — Tablero de sesiones

Actualizado por T07 el 30 oct de 2026. Las ramas T01–T18 figuran integradas en `main`, comprobado con `git branch --merged main`. Publicación y migraciones según el relevo; no se ha consultado producción.

Estados: ⬜ sin empezar · 🟦 trabajando · 🟨 bloqueado · ✅ integrada

| Ficha | Pieza | Plataforma | Rama | Estado | Último avance / siguiente paso |
|---|---|---|---|---|---|
| T00 | Esqueleto y contratos | Claude Code | main | ✅ | Base integrada. |
| T01 | Auth y clases | Claude Code | t01-auth-clases | ✅ | Google y revisión legal pendientes de configuración por José. |
| T02 | Tareas y entregas | OpenCode | t02-tareas | ✅ | Subida real y formulario de entrega conectados por T07. |
| T03 | Motor IA | Claude Code | t03-motor-ia | ✅ | Comprobar IA y tiempos en ensayo real. |
| T04 | Tutor y verificación | Codex | t04-tutor-verificacion | ✅ | Fotos y micrófono reales pendientes del ensayo. |
| T05 | Dashboard estudiante | Codex | t05-dashboard | ✅ | Hoy, Semana y entrega conectadas. |
| T06 | Informes y panel docente | Codex | t06-informes | ✅ | Agregar práctica a la semana sigue como mejora. |
| T07 | Integrador | Codex (relevo) | main | 🟦 | Ensayo automatizado: 150 e2e correctas, 2 omitidas; tutor/evaluación y analizador reales correctos. |
| T08 | Demo y entrega | José | — | ⬜ | Ensayo real, video y entrega del hackathon. |
| T09 | Calificar y devolver | Codex | t09-calificar | ✅ | Reentrega conectada, 0009 aplicada según relevo y ciclo renovado por T17. |
| T10 | Exportación CSV | Codex | t10-csv | ✅ | CSV integrado. |
| T11 | Guion de demo | Codex | t11-demo | ✅ | Ensayar con IA real y cuentas ficticias. |
| T12 | Avisos | OpenCode | t12-avisos | ✅ | 0010 aplicada según relevo; comprobar en ensayo real. |
| T13 | Voz | Codex | t13-voz | ✅ | Pendiente ensayo con micrófono físico. |
| T14 | Accesibilidad | OpenCode | t14-a11y | ✅ | Rendimiento pendiente en T20. |
| T15 | Datos demo | Codex | t15-demo-datos | ✅ | Mocks completados por T17; carga remota de demo a cargo de José. |
| T16 | Cómo funciona y publicaciones | Codex | t16-como-funciona | ✅ | Página pública, README y publicaciones integrados. |
| T17 | Mocks y deudas | Codex | t17-deuda | ✅ | Mocks por entrega y nueva verificación tras corregir. |
| T18 | Pruebas RLS | Codex | t18-rls | ✅ | H01 corregido con 0011; 214/214 RLS según relevo. |
| T19 | Arreglos del ensayo | Codex | t19-ensayo | 🟨 | Sin fallos funcionales confirmados en el ensayo automatizado; falta ensayo físico y persistencia autenticada. |
| T20 | Rendimiento móvil | OpenCode | t20-rendimiento | 🟦 | Revisión de 33e1e1c: devuelta para corregir carga real en servidor, navegación semanal y regresiones de accesibilidad; no integrada. |

## Cierre del hackathon

Sigue `.orquesta/CIERRE-HACKATHON.md`: ensayo real → criterios concretos en T19/T20 → revisión e integración → segundo ensayo → congelar el 3 nov → entregar el 4 nov.

`.orquesta/ENSAYO.md` contiene resultados automatizados y pruebas separadas de IA real; no acredita un recorrido completo con dispositivos físicos ni con cuentas autenticadas en producción. El integrador copia únicamente fallos observados a las fichas y evita solapar archivos entre T19 y T20.

No hacer push desde esta sesión. Mantener la autoría de los commits del dueño del repositorio.
