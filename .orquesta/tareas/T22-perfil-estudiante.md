# T22 — Ficha del estudiante para el docente (historial completo)

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t22-perfil-estudiante` / `../MuseLearn-T22` |
| Puedes tocar | `src/components/gestion/GestionClase.tsx` (solo la lista de estudiantes: volverla enlace), página nueva `src/app/[locale]/docente/clases/[id]/estudiantes/[estudianteId]/page.tsx` (y `loading.tsx`), componentes nuevos `src/components/docente/perfil/`, `src/lib/server/data.ts` (solo **agregar** funciones al final), `messages/{es,en}/docente.json` (solo agregar la clave `perfil`), `e2e/perfil-estudiante.spec.ts` (nuevo) |
| No toques | migraciones, contratos existentes, `src/components/ui/`, `DialogoEntrega`/`DetalleTareaDocente` (los cambia T21), `package.json` |

## Contexto (ensayo de José, 3 nov)
Dentro de una clase (p. ej. Matemática) el docente ve tareas y la lista de estudiantes, pero no puede entrar a un
estudiante para ver todos sus datos. Quiere un "dashboard" del estudiante dentro de la clase.

## Criterios de aceptación
- [ ] En la pestaña Estudiantes de la clase, cada nombre lleva a `/docente/clases/[id]/estudiantes/[estudianteId]`.
- [ ] La página (Server Component, datos con `crearClienteServidor` y RLS, como `src/lib/server/data.ts`; con mocks
      vía `usarMocks()`) muestra para **esa clase**:
      - Encabezado: nombre, clase, botón volver.
      - Resumen: tareas entregadas / total, a tiempo vs tarde, promedio de notas, % de tareas con comprensión
        demostrada (nivel 3-4), última actividad.
      - Comprensión por concepto (niveles 1-4 con `NivelDominio`), del informe más reciente de cada tarea.
      - Historial de tareas (más recientes primero): estado de entrega, fecha, nota, nivel de comprensión, si fue
        devuelta, comentario del docente; cada fila abre la tarea del docente (`/docente/tareas/[id]`).
      - Estados vacíos claros (sin entregas aún).
- [ ] Solo el docente de la clase puede verla: si el estudiante no está inscrito o la clase no es suya → 404.
      Las políticas RLS actuales ya lo cubren; no uses `service_role`.
- [ ] Textos en `messages/{es,en}/docente.json` bajo `perfil`. Móvil primero, sin scroll horizontal a 360 px,
      accesible (encabezados, tabla o lista con etiquetas).
- [ ] `e2e/perfil-estudiante.spec.ts` con mocks: entrar desde la clase al estudiante y ver resumen e historial.
- [ ] `npm run lint && npm run typecheck && npm test` pasan.

## Reglas
- Lee `AGENTS.md`. Prefijo `T22:`. Sin atribución de IA. Sin merge ni push. Sin dependencias nuevas.

## Solicitudes al integrador
## Decisiones
## Bloqueos
