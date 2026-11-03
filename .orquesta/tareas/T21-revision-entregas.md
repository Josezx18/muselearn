# T21 — Revisar entregas como en Classroom + corrección con IA

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t21-revision` / `../MuseLearn-T21` |
| Puedes tocar | `src/components/tareas/DetalleTareaDocente.tsx`, `src/components/gestion/DialogoEntrega.tsx`, `src/components/gestion/CalificacionEntrega.tsx`, `src/components/gestion/ComentarioEntrega.tsx`, componentes nuevos en `src/components/gestion/revision/`, `src/lib/ia/docente/` (agregar función), `src/lib/ia/prompts/docente.ts` (agregar prompt), ruta nueva `src/app/api/docente/ia/revision/route.ts`, `src/lib/api-cliente.ts` (solo agregar funciones y su mock), `src/lib/mocks/` (solo agregar), `messages/{es,en}/gestion.json`, `messages/{es,en}/tareas.json`, `e2e/revision.spec.ts` (nuevo) |
| Contratos | Puedes **agregar** al final de `src/types/contratos.ts` (y su copia `.orquesta/contratos/contratos.ts`) una sección `// ---------- Revisión con IA (T21) ----------`. No cambies lo existente. |
| No toques | migraciones, `src/components/ui/`, `package.json`, Navegación, páginas del estudiante |

## Contexto (ensayo de José, 3 nov)
- El docente abre "Ver entrega" y sale un diálogo pequeño y centrado (`max-w-2xl`). La foto se abre en otra pestaña.
- Corrige de uno en uno: cierra, abre el siguiente. Quiere algo como Classroom: lista de estudiantes a un lado y
  pasar al siguiente con un clic.
- Si un estudiante entrega mientras el docente tiene la tarea abierta, la lista no se actualiza (sale "Sin entregar").
- Quiere que la IA analice la entrega y diga si se cumplió lo que pedía la tarea (sugerencia + reporte).

## Criterios de aceptación
- [ ] **Vista de revisión amplia.** En escritorio (≥ 1024 px) la entrega ocupa casi todo el ancho: a la izquierda la
      lista de estudiantes de la tarea (nombre + estado: sin entregar / entregada / verificada / calificada /
      devuelta), a la derecha la entrega completa (texto, adjuntos, verificación e informe de comprensión,
      comentario y calificación). En celular sigue funcionando como pantalla completa con la lista arriba o en un
      selector. Puede ser un diálogo grande (`max-w-6xl` o pantalla completa) o una vista en la misma página; elige
      lo que mejor encaje con el código y anótalo en Decisiones.
- [ ] **Anterior / Siguiente** (botones y teclas ← →) para recorrer las entregas sin cerrar; "Siguiente sin
      calificar" salta a la próxima entregada que no tenga nota. La lista marca cuál está abierta.
- [ ] **Imágenes dentro de la misma ventana:** al tocar una foto se abre un visor grande en la página (no pestaña
      nueva), con cerrar (Esc), y zoom al menos al tocar/clic (ajustar ↔ tamaño real). PDF: se puede mostrar
      embebido o seguir abriendo aparte.
- [ ] **La lista se actualiza sola:** recargar entregas al volver a la pestaña (`visibilitychange`/`focus`) y cada
      30 s mientras la página está visible, sin parpadeo ni perder la entrega abierta. Botón "Actualizar" manual.
- [ ] **Corrección con IA.** Botón "Revisar con IA" en la entrega: llama a `POST /api/docente/ia/revision`
      (`{ entrega_id }`), que con `llamarMuse()` y la función de IA docente compara las instrucciones y
      competencias de la tarea con lo entregado (texto + imágenes, igual que el analizador de fotos) y devuelve un
      esquema Zod nuevo, p. ej. `RevisionEntrega = { cumple: "si"|"parcial"|"no"|"no_se_puede", resumen,
      criterios: [{ criterio, cumple, evidencia }], sugerencias_para_estudiante: string[], nota_sugerida: number|null
      (0-100) , confianza: "alta"|"media"|"baja" }`. Reutiliza `docenteConCupo`/`errorIADocente` de
      `app/api/docente/ia/_comun.ts` (límite diario y registro de uso). Solo el docente de la clase; nunca el tier
      Contributor. La respuesta se muestra como reporte en la entrega con el aviso "Es una sugerencia: revísala".
      Botones para **usar la nota sugerida** (rellena el campo, no guarda sola) y **pasar sugerencias al comentario**
      (rellena el borrador, no lo envía). Si la tarea no se puede evaluar (p. ej. práctica física), `no_se_puede`.
      No se guarda en la base (no hay migración): se pide de nuevo si se necesita.
- [ ] Mock en `api-cliente` para `NEXT_PUBLIC_USAR_MOCKS=true` y prueba unitaria del esquema / del prompt.
- [ ] `e2e/revision.spec.ts` (mocks): abrir revisión, ir a Siguiente, abrir imagen en visor y cerrar con Esc,
      pedir revisión con IA y usar la nota sugerida. Escritorio y celular. Sin scroll horizontal a 360 px.
- [ ] `npm run lint && npm run typecheck && npm test` y las e2e existentes de calificar/ia-docente siguen pasando.

## Reglas
- Lee `AGENTS.md`. Prefijo `T21:`. Sin atribución de IA. Sin merge ni push. Sin dependencias nuevas.

## Solicitudes al integrador
## Decisiones
## Bloqueos
