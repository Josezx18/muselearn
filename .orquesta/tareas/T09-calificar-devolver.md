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
- [x] Migración `0009_calificaciones.sql`: tabla `calificaciones (entrega_id pk → entregas, docente_id, nota numeric(5,2) null check 0-100, devuelta boolean default false, motivo_devolucion text null ≤ 1000, actualizado_en)`, RLS igual que `comentarios_entrega` en `0007_ia_docente.sql` (lee el estudiante dueño y el docente de la tarea; escribe solo el docente de la tarea). **No la apliques**: la aplica el integrador.
- [x] `PUT /api/entregas/[id]/calificacion { nota }` y `GET` (docente de la tarea; el estudiante solo lee la suya). Valida con Zod.
- [x] `POST /api/entregas/[id]/devolver { motivo }`: solo el docente de la tarea. Guarda `devuelta=true` y el motivo, y pone la entrega en estado `pendiente` con el cliente admin (`crearClienteAdmin`) **después** de comprobar el permiso (el RLS de `entregas` solo deja editar al estudiante). Conserva texto y adjuntos para que el estudiante los corrija.
- [ ] Cuando el estudiante vuelve a entregar, `devuelta` pasa a `false` (en `POST /api/entregas`, con admin y solo si la entrega es suya).
- [x] En `DialogoEntrega` (docente): campo de nota y botón "Devolver para corregir" con motivo, junto al comentario existente (`ComentarioEntrega.tsx`).
- [x] Estudiante, en la página de la tarea: ve su nota y, si fue devuelta, un aviso "Tu docente te pidió corregir: …" y el formulario de entrega desbloqueado.
- [x] Lista de entregas del docente (`DetalleTareaDocente`): muestra la nota o "Devuelta".
- [x] Mocks para `NEXT_PUBLIC_USAR_MOCKS=true`, textos en es y en, 380 px sin scroll horizontal.
- [x] Pruebas unitarias de la lógica y `e2e/calificar.spec.ts` (con mocks).

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Commits pequeños con prefijo `T09:`.
- **Sin atribución de IA** en commits; no cambies `user.name` ni `user.email`.
- No hagas merge a `main` ni push. Al terminar, escribe en "Bloqueos" lo que no pudiste probar.

## Solicitudes al integrador
- Trasladar `Nota`, `EntradaCalificacion`, `EntradaDevolucion` y `Calificacion` de `src/lib/db/calificaciones.ts` a `src/types/contratos.ts` y actualizar sus importaciones. Se mantienen provisionales en el archivo autorizado por la ficha.
- El criterio de reentrega requiere editar `src/app/api/entregas/route.ts`, que no figura en «Puedes tocar». Conectar, después de `crearEntrega`, `await limpiarDevolucionPropia(crearClienteAdmin(), entrega.id, actual.usuario.id)`. La función ya está implementada y probada: comprueba dueño y estado `entregada` antes de limpiar `devuelta` y el motivo, conservando la nota. Hasta integrar esta llamada, la reentrega real deja el aviso de devolución activo; el flujo mock sí lo limpia.
- Aplicar `0009_calificaciones.sql` desde la sesión integradora y verificar RLS con dos estudiantes, el docente dueño y otro docente. La función SQL `devolver_entrega` solo permite ejecución a `service_role`; el endpoint comprueba pertenencia antes de crear el cliente admin y la función vuelve a comprobar al dueño de la clase.
- Revisar el ciclo de verificación tras corregir: `POST /api/verificacion/iniciar` reutiliza sesiones `en_curso` y quedan informes anteriores asociados al mismo `entrega_id`. Coordinar invalidación/versionado del intento previo y protección frente a respuestas en vuelo antes de reabrir una verificación. Estos endpoints y contratos pertenecen a otra ficha.
## Decisiones
- 2026-10-29: rebase sobre main hasta `921316d` antes de implementar; sin merge a main ni push, como ordena esta ficha (prevalece sobre el paso final genérico de la skill).
- Devolución atómica mediante RPC SQL con bloqueo de la entrega: marca calificación devuelta y estado pendiente en una transacción; conserva nota, texto, adjuntos y fecha de entrega anterior. La migración solo se preparó, no se aplicó.
- Nota opcional anulable con centésimas de 0 a 100. Guardar nota no cambia la devolución; devolver requiere un motivo no vacío de hasta 1000 caracteres y no guarda una nota todavía sin enviar.
- Cliente compartido ampliado únicamente al final con funciones T09. Mocks de calificaciones y correcciones persistidos en localStorage para revisar ambos roles y recargar. El formulario conserva adjuntos, permite quitarlos y cuenta los conservados para los límites de fotos/archivos.
- Textos nuevos en `gestion.json` es/en dentro del componente de calificación reutilizado para docente, estudiante y resumen de lista. La nota y el comentario siguen visibles también cuando la entrega está pendiente de corrección.
- Validación: lint y typecheck correctos; 191 pruebas unitarias correctas, 10 omitidas existentes; 4 e2e T09 correctos en Chrome (1280 px y 380 px, es/en). Capturas revisadas de docente y estudiante. El e2e cubre límites, motivo obligatorio, nota nula/cero, devolución, conservación de texto/adjunto, reentrega y persistencia al recargar.
## Bloqueos
- Pendiente el cuarto criterio: conectar limpieza de devolución en `POST /api/entregas`, fuera de las rutas autorizadas. La skill exige «Implementa solo dentro de las carpetas de **"Puedes tocar"**» y remite los cambios de otra pieza al integrador. Se entrega la función probada y el mock operativo; no se modifica la ruta ajena ni se marca este criterio como completado.
- No se probó SQL/RLS en Supabase real porque la ficha prohíbe aplicar la migración. Endpoints comprobados con dobles de sesión/DB, UI con mocks; la integración real requiere aplicar 0009 y conectar la llamada anterior.
