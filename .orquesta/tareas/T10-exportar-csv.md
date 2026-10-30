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
- [x] `GET /api/clases/[id]/exportar?tipo=entregas|comprension` solo para el docente dueño (usa la sesión y RLS, como `src/lib/db/comprension.ts`).
- [x] `tipo=entregas`: una fila por estudiante × tarea: estudiante, correo (si se puede leer; si no, vacío), tarea, fecha de entrega, estado, entregada en, entregada fuera (sí/no), nivel global de comprensión, nota (si existe la tabla `calificaciones`; si no, columna vacía sin fallar).
- [x] `tipo=comprension`: una fila por estudiante, una columna por concepto con el nivel 1-4 (vacío si no hay dato), y el promedio.
- [x] CSV para Excel en español: separador `;`, BOM UTF-8, comillas escapadas, fechas en `aaaa-mm-dd hh:mm` en la zona `ZONA_OFFSET_MIN`. Nombre de archivo `muselearn-<clase>-<tipo>-<fecha>.csv` sin caracteres raros.
- [x] Protección contra inyección de fórmulas: si una celda empieza con `= + - @`, anteponer `'`.
- [x] Botones "Descargar entregas (CSV)" en la gestión de la clase y "Descargar comprensión (CSV)" en el panel de comprensión. En modo mocks se genera desde los datos de ejemplo.
- [x] Pruebas unitarias del generador (escape, BOM, fórmulas, columnas) y una e2e que comprueba que el botón descarga un archivo.

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T10:`. Sin atribución de IA. Sin merge ni push.

## Solicitudes al integrador
- Incorporar descarga binaria en `src/lib/api-cliente.ts` (fuera del alcance T10) para mostrar errores del endpoint dentro de la página. Mientras, la descarga real usa navegación nativa con cookies y Content-Disposition; no se introduce fetch en componentes.
## Decisiones
- Rebase sobre main 921316d antes de implementar. T09 y `calificaciones` aún no están integradas: se consulta entrega_id/nota con RLS; solo ausencia de tabla (42P01/PGRST205) permite columna vacía. Otros errores se propagan.
- Correo vacío: Usuario y perfiles accesibles no exponen correos; no se usa cliente admin para leer auth.users.
- «Entregada fuera» es entregada_externamente, no retraso. Comprensión exporta la clase completa con el último nivel por concepto, igual que el panel; promedia solo conceptos conocidos.
- CSV en español y botones es/en. Fechas y nombre usan ZONA_OFFSET_MIN (por defecto -240); mocks usan -240.
- Generador, botón y pruebas en src/lib/exportar para respetar propiedad. Contratos compartidos validan tareas, usuarios, entregas e informes; parámetros y tabla opcional usan Zod local sin modificar contratos congelados.
- Verificado: lint/typecheck OK, 199 pruebas pasan (10 omitidas), 4 e2e de descarga OK a 380/1280 px con mocks y capturas revisadas. Endpoint probado para 401/403, clase ajena 404, parámetros inválidos, BOM, cabeceras privadas y tabla opcional. Sin datos reales de estudiantes.
## Bloqueos
- Ninguno. Sin push ni merge según las reglas específicas de la ficha.
