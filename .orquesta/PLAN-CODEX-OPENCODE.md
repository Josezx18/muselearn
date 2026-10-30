# Plan de trabajo con Codex y OpenCode (29 oct → 4 nov)

Quién hace qué: **Codex** programa lo que toca datos, API e IA; **OpenCode** la interfaz, pruebas, contenido y documentación.
Claude solo escribe fichas, revisa, integra en `main`, aplica migraciones y comprueba el despliegue (uso semanal limitado).
Regla para no chocar: dos fichas de la misma oleada nunca tocan los mismos archivos ("Puedes tocar" de cada ficha).

## Oleada A — 29-30 oct (en curso)
| Ficha | Herramienta | Qué |
|---|---|---|
| T09 | Codex | Calificar (0-100) y devolver para corregir. Migración 0009. |
| T10 | Codex | Exportar a CSV (entregas y comprensión) para Excel. |
| T11 | Codex | Ensayo de la demo: guion al día, prueba e2e del guion, capturas. |

## Oleada B — 30-31 oct
| Ficha | Herramienta | Qué |
|---|---|---|
| T12 | OpenCode | Avisos dentro de la app (campana): tarea nueva, entrega devuelta, comentario o nota del docente, bloque de estudio que empieza. Sin correo todavía. |
| T13 | Codex | Voz: elegir voz y velocidad del navegador, mejor detección de fin de turno con ruido de aula, reintento si falla la transcripción, prueba en celular. |
| T14 | OpenCode | Accesibilidad y rendimiento: revisión con Lighthouse/axe en las 8 pantallas del guion, contraste, foco, carga en celular lento; arreglos solo de UI. |
| T15 | Codex | Datos de demo ricos y ficticios en `supabase/seed-*`: 2 clases, 12 estudiantes, tareas en las 4 modalidades, informes variados para que el panel General luzca. |

## Oleada C — 1-2 nov (pulido para el video)
| Ficha | Herramienta | Qué |
|---|---|---|
| T16 | OpenCode | README y página "Cómo funciona" con las capturas nuevas; texto de la publicación en X. |
| T17 | Codex | Barrido de errores: leer registros de Vercel que José comparta, arreglar los fallos que salgan en el ensayo real. |

## 3 nov — congelar
Solo arreglos. José graba el video con el guion de T11. Claude publica la última versión con OK de José.

## 4 nov — entrega del hackathon

## Después del hackathon (no empezar antes)
- Classroom completo: devolver notas a Classroom (permiso de escritura, requiere verificación de Google).
- Rol coordinador del centro y consentimiento de familias.
- Moodle y Microsoft Teams.
- Correo propio (SMTP) para recuperación de contraseña y avisos.
- Publicar el proyecto de Google para iniciar sesión (sin Classroom) y salir del modo de prueba.

## Cómo arranca cada oleada
1. Claude escribe las fichas en `.orquesta/tareas/` y agrega sus ramas en `scripts/windows/arrancar-sesiones.bat`.
2. José ejecuta el `.bat` de la oleada; cada herramienta trabaja en su carpeta `MuseLearn-TXX`.
3. Al terminar, José escribe "revisa TXX"; Claude revisa, integra, aplica migraciones y pide OK para subir.
