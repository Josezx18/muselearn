# T09 — Calificar y devolver entregas

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t09-calificar` / `../MuseLearn-T09` |
| Depende de | main en 3a6b88c (IA del docente, comentarios, flujo de escuela) |
| Puedes tocar | `supabase/migrations/0009_calificaciones.sql` (nuevo), `src/lib/db/calificaciones.ts` (+ test), `src/app/api/entregas/[id]/calificacion/`, `src/app/api/entregas/[id]/devolver/`, `src/components/gestion/DialogoEntrega.tsx`, `src/components/gestion/CalificacionEntrega.tsx` (nuevo), `src/components/estudiante/DetalleTarea.tsx`, `src/components/estudiante/ComentarioDocente.tsx`, `src/components/entregas/FormularioEntrega.tsx`, `src/components/tareas/DetalleTareaDocente.tsx`, `src/lib/api-cliente.ts` (solo agregar al final), `src/lib/mocks/`, `messages/*/gestion.json`, `messages/*/estudiante.json`, `messages/*/tareas.json`, `e2e/calificar.spec.ts` (nuevo) |
| Pide al integrador | Cambios en `src/types/contratos.ts` (anótalos en "Solicitudes"; mientras, define los esquemas en `src/lib/db/calificaciones.ts`) |

## Objetivo
El docente pone una nota (0-100, opcional) y puede **devolver** una entrega para que el estudiante la corrija y la vuelva a entregar. Hoy solo existe el comentario del docente (`comentarios_entrega`).

## Criterios de aceptación
- [ ] Migración `0009_calificaciones.sql`: tabla `calificaciones (entrega_id pk → entregas, docente_id, nota numeric(5,2) null check 0-100, devuelta boolean default false, motivo_devolucion text null ≤ 1000, actualizado_en)`, RLS igual que `comentarios_entrega` en `0007_ia_docente.sql` (lee el estudiante dueño y el docente de la tarea; escribe solo el docente de la tarea). **No la apliques**: la aplica el integrador.
- [ ] `PUT /api/entregas/[id]/calificacion { nota }` y `GET` (docente de la tarea; el estudiante solo lee la suya). Valida con Zod.
- [ ] `POST /api/entregas/[id]/devolver { motivo }`: solo el docente de la tarea. Guarda `devuelta=true` y el motivo, y pone la entrega en estado `pendiente` con el cliente admin (`crearClienteAdmin`) **después** de comprobar el permiso (el RLS de `entregas` solo deja editar al estudiante). Conserva texto y adjuntos para que el estudiante los corrija.
- [ ] Cuando el estudiante vuelve a entregar, `devuelta` pasa a `false` (en `POST /api/entregas`, con admin y solo si la entrega es suya).
- [ ] En `DialogoEntrega` (docente): campo de nota y botón "Devolver para corregir" con motivo, junto al comentario existente (`ComentarioEntrega.tsx`).
- [ ] Estudiante, en la página de la tarea: ve su nota y, si fue devuelta, un aviso "Tu docente te pidió corregir: …" y el formulario de entrega desbloqueado.
- [ ] Lista de entregas del docente (`DetalleTareaDocente`): muestra la nota o "Devuelta".
- [ ] Mocks para `NEXT_PUBLIC_USAR_MOCKS=true`, textos en es y en, 380 px sin scroll horizontal.
- [ ] Pruebas unitarias de la lógica y `e2e/calificar.spec.ts` (con mocks).

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Commits pequeños con prefijo `T09:`.
- **Sin atribución de IA** en commits; no cambies `user.name` ni `user.email`.
- No hagas merge a `main` ni push. Al terminar, escribe en "Bloqueos" lo que no pudiste probar.

## Solicitudes al integrador
## Decisiones
## Bloqueos
