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
- [x] En la pestaña Estudiantes de la clase, cada nombre lleva a `/docente/clases/[id]/estudiantes/[estudianteId]`.
- [x] La página (Server Component, datos con `crearClienteServidor` y RLS, como `src/lib/server/data.ts`; con mocks
      vía `usarMocks()`) muestra para **esa clase**:
      - Encabezado: nombre, clase, botón volver.
      - Resumen: tareas entregadas / total, a tiempo vs tarde, promedio de notas, % de tareas con comprensión
        demostrada (nivel 3-4), última actividad.
      - Comprensión por concepto (niveles 1-4 con `NivelDominio`), del informe más reciente de cada tarea.
      - Historial de tareas (más recientes primero): estado de entrega, fecha, nota, nivel de comprensión, si fue
        devuelta, comentario del docente; cada fila abre la tarea del docente (`/docente/tareas/[id]`).
      - Estados vacíos claros (sin entregas aún).
- [x] Solo el docente de la clase puede verla: si el estudiante no está inscrito o la clase no es suya → 404.
      Las políticas RLS actuales ya lo cubren; no uses `service_role`.
- [x] Textos en `messages/{es,en}/docente.json` bajo `perfil`. Móvil primero, sin scroll horizontal a 360 px,
      accesible (encabezados, tabla o lista con etiquetas).
- [x] `e2e/perfil-estudiante.spec.ts` con mocks: entrar desde la clase al estudiante y ver resumen e historial.
- [x] `npm run lint && npm run typecheck && npm test` pasan.

## Reglas
- Lee `AGENTS.md`. Prefijo `T22:`. Sin atribución de IA. Sin merge ni push. Sin dependencias nuevas.

## Solicitudes al integrador
## Decisiones
- Perfil servidor con sesión normal/RLS: primero propiedad de clase e inscripción; después consultas restringidas a sus tareas y entregas. Los errores de BD se propagan; no se disfrazan de estados vacíos.
- Comprensión demostrada: tareas con informe global 3-4 / total de tareas de esta clase. Promedio solo de notas no nulas; una nota cero cuenta. Entregas actuales pendientes (incluidas devoluciones) no cuentan como entregadas.
- Historial ordenado por creación de tarea descendente; los pendientes también aparecen. Fechas de visualización en Santo Domingo; comparación de puntualidad por instante UTC.
- La última actividad resume fechas de entregas e informes. El modelo guarda un informe vigente por entrega (PK entrega_id), usado en conceptos e historial.
- La base conserva el estado actual de devolución, no una auditoría de devoluciones anteriores. La interfaz lo identifica como devolución actual.
- Mocks coherentes con listarEstudiantes: todos los estudiantes ficticios están inscritos en ambas clases existentes; identificadores desconocidos devuelven 404.
- Sin push: prevalece la instrucción específica de T22 sobre el cierre genérico de la skill.
## Bloqueos

## Verificación
- 2026-11-03: lint y typecheck correctos; npm test: 247 correctas, 10 omitidas (36 archivos correctos, uno omitido).
- Playwright T22: 6/6 correctas (Chrome, escritorio y celular); entrada desde lista, resumen 3/4 y 25 %, nota 88, conceptos, enlaces, devolución de Elian, clase sin informes, inglés y rutas desconocidas.
- axe en main: cero violaciones serious/critical; ancho 360 px sin scroll horizontal. Capturas test-results/perfil-360.png y perfil-1280.png revisadas visualmente.
- Primeras corridas corregidas: caché nativa SWC del entorno, codificación de tildes en archivos nuevos y selector de devolución que incluye el motivo. Corrida final completa correcta.
- Sin acceso a datos reales ni verificación RLS remota: protección implementada con sesión, propiedad, inscripción y cliente servidor existente; sin service_role. Revisión visual con fuentes de respaldo por fallo de descarga de Google Fonts.
