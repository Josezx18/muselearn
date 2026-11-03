# T23 — "Mis clases" para el estudiante

| Campo | Valor |
|---|---|
| Plataforma | OpenCode |
| Rama / carpeta | `t23-clases-estudiante` / `../MuseLearn-T23` |
| Puedes tocar | `src/components/comun/Navegacion.tsx` (solo agregar el enlace del estudiante), páginas nuevas `src/app/[locale]/estudiante/clases/page.tsx` y `src/app/[locale]/estudiante/clases/[id]/page.tsx` (y `loading.tsx`), componentes nuevos `src/components/estudiante/clases/`, `src/lib/server/data.ts` (solo **agregar** funciones al final), `messages/{es,en}/estudiante.json` (o el archivo del dashboard del estudiante; solo agregar la clave `clases`), `e2e/clases-estudiante.spec.ts` (nuevo) |
| No toques | API, migraciones, contratos, `src/components/ui/`, Dashboard/Hoy/Semana, verificación, informes |

## Contexto (ensayo de José, 3 nov)
El estudiante tiene Hoy y Semana, pero no puede ver sus tareas por asignatura ni quién es el docente de cada una.

## Criterios de aceptación
- [ ] Nuevo enlace "Clases" en la navegación del estudiante (escritorio y celular), junto a Hoy y Semana.
- [ ] `/estudiante/clases`: tarjetas con cada clase inscrita: nombre, materia, grado, **nombre del docente**
      (la política `perfiles_leer_docente_de_mis_clases` ya lo permite), cuántas tareas pendientes y la próxima fecha.
- [ ] `/estudiante/clases/[id]`: encabezado con clase y docente; tareas de esa clase agrupadas en Pendientes,
      Entregadas y Vencidas, con fecha, modalidad y estado; cada una abre `/estudiante/tarea/[id]`. 404 si no está
      inscrito.
- [ ] Datos en servidor con `crearClienteServidor` (RLS), como `src/lib/server/data.ts`; con mocks vía `usarMocks()`.
      No uses `service_role` ni `fetch("/api/...")` desde el servidor.
- [ ] Textos en `messages/{es,en}`. Móvil primero, sin scroll horizontal a 360 px, objetivos táctiles ≥ 44 px,
      `e2e/accesibilidad.spec.ts` sigue pasando.
- [ ] `e2e/clases-estudiante.spec.ts` con mocks: abrir Clases, entrar a Matemática y abrir una tarea.
- [ ] `npm run lint && npm run typecheck && npm test` pasan.

## Reglas
- Lee `AGENTS.md`. Prefijo `T23:`. Sin atribución de IA. Sin merge ni push. Sin dependencias nuevas.

## Solicitudes al integrador
## Decisiones
## Bloqueos
