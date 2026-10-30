# T17 — Mocks por entrega y deudas de integración (T09/T15)

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t17-deuda` / `../MuseLearn-T17` |
| Puedes tocar | `src/lib/api-cliente.ts` (solo las funciones de mocks citadas; no cambies firmas), `src/lib/mocks/**`, `src/types/contratos.ts` y `.orquesta/contratos/contratos.ts` (solo mover los esquemas de T09), `src/lib/db/calificaciones.ts` (solo importaciones), `src/app/api/verificacion/iniciar/route.ts`, `src/app/api/verificacion/responder/route.ts`, `src/lib/ia/conversacion/` (solo lo del criterio 3, + tests), `e2e/` (solo ajustar selectores rotos) |
| No toques | `src/components/avisos/`, `Navegacion.tsx` (T12), componentes de UI salvo que una prueba lo exija |

## Contexto
- T15 dejó datos de demo en `supabase/demo/objetos.json` y en `src/lib/mocks/`. En modo mocks, `obtenerDetalleEntrega` y `obtenerInforme` devuelven siempre el informe y las preguntas de Camila.
- T09 dejó `Nota`, `EntradaCalificacion`, `EntradaDevolucion` y `Calificacion` en `src/lib/db/calificaciones.ts` (provisionales).

## Criterios de aceptación
- [x] Modo mocks: `obtenerDetalleEntrega(id)` y `obtenerInforme(id)` devuelven el informe, las preguntas, el comentario y la calificación **de esa entrega** (de `src/lib/mocks/`, no de `supabase/demo/objetos.json`, para no meter ese JSON en el bundle). `comentariosMock` arranca con los comentarios de demo. El plan mock se elige por semana.
- [x] Los esquemas de T09 pasan a `src/types/contratos.ts` (y su copia en `.orquesta/contratos/`), con las importaciones actualizadas. Sin cambios de comportamiento.
- [x] Verificación tras una devolución: si el docente devolvió la entrega y el estudiante vuelve a entregar, `POST /api/verificacion/iniciar` crea una sesión nueva (no reutiliza una `en_curso` de antes de la devolución) y el informe nuevo reemplaza al anterior al terminar. Respuestas de una sesión vieja se rechazan con 409. Pruebas unitarias.
- [x] `npm test` y toda la suite e2e con `NEXT_PUBLIC_USAR_MOCKS=true` pasan.

## Reglas
- Lee `AGENTS.md`. Antes de cada commit: `npm run lint && npm run typecheck && npm test`. Prefijo `T17:`. Sin atribución de IA. Sin merge ni push.

## Decisiones
- Se conserva la reexportacion de los esquemas desde db/calificaciones para no modificar consumidores fuera de T17. El cliente y los mocks importan el contrato compartido.
- El mock devuelve 404 si la entrega no tiene informe; no inventa evidencia de otra entrega. Las semanas se desplazan conservando las horas locales.
- La regla especifica de T17 prevalece: sin push ni merge.

- Se distinguen intentos con entregada_en y creada_en, sin migraciones: una sesion anterior se rechaza antes de leer/recuperar informes; solo se recupera un informe generado desde la sesion vigente.
- Las pruebas e2e se ejecutan en el puerto 3001 con configuracion temporal; 3000 pertenece a T16. Selectores de comentarios ajustados a los datos demo ya precargados.

## Validacion final
- Lint y typecheck correctos; 235 pruebas unitarias pasan (10 omitidas preexistentes).
- Suite e2e completa con NEXT_PUBLIC_USAR_MOCKS=true: 82 correctas, 2 omitidas porque Google no esta activado. Escritorio 1280 px y movil 380 px; capturas revisadas sin desbordamiento.
- Dos commits locales; sin push ni merge.

## Bloqueos
- Ninguno.
