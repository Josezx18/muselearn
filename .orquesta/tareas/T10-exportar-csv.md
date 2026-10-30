# T10 — Exportar la clase a CSV

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t10-csv` / `../MuseLearn-T10` |
| Depende de | main en 3a6b88c. Si T09 ya está en main, incluye la nota. |
| Puedes tocar | `src/lib/exportar/` (nuevo, + tests), `src/app/api/clases/[id]/exportar/route.ts` (nuevo), `src/components/gestion/GestionClase.tsx`, `src/components/docente/Comprension.tsx` (solo agregar el botón), `messages/*/gestion.json`, `messages/*/docente.json`, `e2e/exportar.spec.ts` (nuevo) |

## Objetivo
El docente descarga un CSV que abre bien en Excel con el avance de su clase, para pasarlo a su registro oficial (no tocamos el registro oficial).

## Criterios de aceptación
- [ ] `GET /api/clases/[id]/exportar?tipo=entregas|comprension` solo para el docente dueño (usa la sesión y RLS, como `src/lib/db/comprension.ts`).
- [ ] `tipo=entregas`: una fila por estudiante × tarea: estudiante, correo (si se puede leer; si no, vacío), tarea, fecha de entrega, estado, entregada en, entregada fuera (sí/no), nivel global de comprensión, nota (si existe la tabla `calificaciones`; si no, columna vacía sin fallar).
- [ ] `tipo=comprension`: una fila por estudiante, una columna por concepto con el nivel 1-4 (vacío si no hay dato), y el promedio.
- [ ] CSV para Excel en español: separador `;`, BOM UTF-8, comillas escapadas, fechas en `aaaa-mm-dd hh:mm` en la zona `ZONA_OFFSET_MIN`. Nombre de archivo `muselearn-<clase>-<tipo>-<fecha>.csv` sin caracteres raros.
- [ ] Protección contra inyección de fórmulas: si una celda empieza con `= + - @`, anteponer `'`.
- [ ] Botones "Descargar entregas (CSV)" en la gestión de la clase y "Descargar comprensión (CSV)" en el panel de comprensión. En modo mocks se genera desde los datos de ejemplo.
- [ ] Pruebas unitarias del generador (escape, BOM, fórmulas, columnas) y una e2e que comprueba que el botón descarga un archivo.

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T10:`. Sin atribución de IA. Sin merge ni push.

## Solicitudes al integrador
## Decisiones
## Bloqueos
