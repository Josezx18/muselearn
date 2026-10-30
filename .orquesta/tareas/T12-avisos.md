# T12 — Avisos dentro de la app (campana)

| Campo | Valor |
|---|---|
| Plataforma | OpenCode |
| Rama / carpeta | `t12-avisos` / `../MuseLearn-T12` |
| Empieza | cuando T09 (calificar y devolver) esté en main |
| Puedes tocar | `supabase/migrations/0010_avisos.sql` (nuevo), `src/lib/db/avisos.ts` (+ test), `src/app/api/avisos/` (nuevo), `src/components/avisos/` (nuevo), `src/components/comun/Navegacion.tsx` (solo agregar la campana junto a `accion`), `src/app/[locale]/docente/layout.tsx` y `src/app/[locale]/estudiante/layout.tsx` (solo pasar la campana), y **una línea** que llame a `crearAviso(...)` en: `src/app/api/tareas/route.ts`, `src/app/api/entregas/[id]/comentario/route.ts`, `src/app/api/entregas/[id]/calificacion/` y `src/app/api/entregas/[id]/devolver/` (de T09), `src/app/api/integraciones/classroom/importar/route.ts`; `src/lib/api-cliente.ts` (solo al final), `src/lib/mocks/avisos.ts` (nuevo), `messages/*/avisos.json` (nuevo) y `src/i18n/espacios.ts` (agregar "avisos"), `e2e/avisos.spec.ts` (nuevo) |
| No toques | estilos globales, otras pantallas, la lógica de IA |

## Objetivo
Que el estudiante y el docente se enteren de lo importante sin buscarlo. Sin correo ni notificaciones push (después del hackathon).

## Criterios de aceptación
- [ ] Migración `0010_avisos.sql`: tabla `avisos (id, usuario_id → perfiles, tipo text check in ('tarea_nueva','entrega_devuelta','comentario','nota','tareas_importadas'), titulo text, enlace text (ruta interna que empieza con "/"), leido boolean default false, creado_en)`. RLS: cada usuario lee y marca como leídos solo los suyos (`update` solo de la columna `leido`); crear solo el servidor (service_role). **No la apliques**: la aplica el integrador.
- [ ] `crearAviso(admin, { usuarioIds, tipo, titulo, enlace })` en `src/lib/db/avisos.ts`. Nunca rompe la acción que lo llama: si falla, solo registra con `console.warn` (y funciona aunque la tabla aún no exista).
- [ ] Avisos que se crean: tarea nueva → estudiantes de la clase; comentario del docente, nota y entrega devuelta → el estudiante; tareas importadas de Classroom → estudiantes de la clase (un solo aviso por importación).
- [ ] `GET /api/avisos` (últimos 30 del usuario y cuántos sin leer) y `POST /api/avisos/leidos` (`{ ids }` o todos).
- [ ] Campana en la barra superior con el número de sin leer; al tocarla se abre una lista accesible (teclado, `aria-expanded`, Escape cierra). Tocar un aviso lo marca leído y lleva a su enlace. Se actualiza al abrir y cada 60 s solo si la pestaña está visible.
- [ ] Textos en es y en; 380 px sin scroll horizontal; mocks para `NEXT_PUBLIC_USAR_MOCKS=true`.
- [ ] Pruebas unitarias (`crearAviso` con tabla ausente, enlaces solo internos) y `e2e/avisos.spec.ts`.

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T12:`. Sin atribución de IA; no cambies `user.name`/`user.email`. Sin merge ni push.

## Solicitudes al integrador
## Decisiones
## Bloqueos
