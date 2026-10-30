# Plan de trabajo con Codex y OpenCode (actualizado 30 oct, 7:30 a. m.)

Quién hace qué: **Codex** programa lo que toca datos, API, IA y seguridad; **OpenCode** la interfaz, accesibilidad,
rendimiento visual y textos. **Integrador:** Claude mientras tenga uso semanal; si no, Codex con
`scripts\windows\codex-integrador.bat` (lee `.orquesta/RELEVO-CODEX.md`).
Regla para no chocar: dos fichas de la misma oleada nunca tocan los mismos archivos ("Puedes tocar").
Plan día a día hasta la entrega: **`.orquesta/CIERRE-HACKATHON.md`**.

## Hecho e integrado (publicado en `b4e5214`, migraciones 0001–0011 aplicadas)
| Oleada | Ficha | Herramienta | Resultado |
|---|---|---|---|
| A | T09 | Codex | Calificar (0-100) y devolver para corregir. Migración 0009. |
| A | T10 | Codex | Exportar entregas y comprensión a CSV para Excel. |
| A | T11 | Codex | Guion de demo al día, prueba e2e del guion y capturas. |
| B | T12 | OpenCode | Avisos con campana (tarea nueva, nota, comentario, devolución, Classroom). Migración 0010. |
| B | T13 | Codex | Voz configurable, pausas adaptables al ruido, reintento de transcripción. |
| B | T14 | OpenCode | Accesibilidad (axe 0 graves en 13 pantallas, contraste AA, foco). Lighthouse: Hoy 76, Tarea 92, Comprensión 84. |
| B | T15 | Codex | Datos de demo ficticios: 12 estudiantes, 4 modalidades, notas, devolución; seed idempotente. |
| C | T16 | Codex | Página pública "Cómo funciona", README y textos para X. |
| C | T17 | Codex | Mocks por entrega, contratos de T09, verificación nueva tras devolución. |
| C | T18 | Codex | Pruebas RLS reales (214/214). Encontró el hueco H01 → migración 0011 (cerrado). |

## Oleada D — 31 oct a 1 nov (siguiente)
Requisito: José hizo el ensayo real y anotó los fallos en `.orquesta/ENSAYO.md`; el integrador los copió a las fichas.
| Ficha | Herramienta | Qué |
|---|---|---|
| T19 | Codex | Arreglos del ensayo real (datos, API, IA, manejo de errores y tiempos). |
| T20 | OpenCode | Rendimiento móvil: `next/font`, Server Components y carga diferida para Lighthouse ≥ 85 en Hoy, Tarea y Comprensión; fallos visuales del ensayo. |
Lanzar: `scripts\windows\oleada-D-T19-T20.bat` (modo automático; OpenCode no puede hacer push, merge, reset --hard ni rm -rf).

## 2 nov — solo arreglos pequeños tras el segundo ensayo
Si aparece algo, el integrador escribe una ficha corta (T21, T22…) con un solo fallo cada una y la lanza con
`arrancar-sesiones.bat T21` (o con `codex-sin-preguntar.bat T21` para modo automático).

## 3 nov — congelar
Nada nuevo. José graba el video con `.orquesta/DEMO.md`. Solo errores graves, cada uno con OK de José para publicar.

## 4 nov — entrega del hackathon

## Después del hackathon (no empezar antes)
- Classroom completo: devolver notas a Classroom (permiso de escritura, verificación de Google).
- Rol coordinador del centro y consentimiento de familias.
- Moodle y Microsoft Teams.
- Correo propio (SMTP) para recuperación de contraseña y avisos por correo.
- Publicar el proyecto de Google para iniciar sesión (sin Classroom) y salir del modo de prueba.
- Proyecto de Supabase separado para demo/pruebas (hoy la demo vive en la base de producción).

## Cómo arranca cada oleada
1. El integrador escribe las fichas en `.orquesta/tareas/`, las registra en `scripts/windows/arrancar-sesiones.bat`
   (bloques `RAMA=` y `PLAT=`) y crea el `.bat` de la oleada.
2. José ejecuta el `.bat`; cada herramienta trabaja en su carpeta `D:\Desarrollo\MuseLearn-TXX`.
3. José escribe "TXX listo"; el integrador revisa, integra, corre lint/typecheck/test/build/e2e, pide a José
   aplicar migraciones si las hay, y pide OK para publicar con `subir-a-github.bat`.
