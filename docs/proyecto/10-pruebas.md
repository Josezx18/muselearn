# 10. Plan y evidencia de pruebas

## Objetivo

Comprobar reglas de negocio, permisos, integridad de datos, accesibilidad, rendimiento y flujos completos, sin confundir mocks con servicios reales. Este documento registra evidencia del repositorio; no se ejecutaron pruebas durante su elaboración.

## Capas recomendadas

| Capa | Cobertura | Comando/ubicación |
|---|---|---|
| Unitarias | Planificador, esquemas, permisos, formatos, límites, prompts, fallos de proveedor | `npm test` · archivos `src/**/*.test.ts` |
| API/servicios | Autenticación/rol, Zod, autorización por clase, códigos HTTP, idempotencia, límites y fallback | Pruebas de `src/lib/db/**`, `src/lib/ia/**`; ampliar para cada handler crítico |
| RLS/PostgreSQL | Acceso entre estudiantes/docentes, propiedades, funciones y Storage | `npm run rls`; `supabase/pruebas-rls/` |
| E2E | Registro/login, clase-tarea-entrega-verificación-informe-panel, comentario/calificación, avisos, importaciones | `npm run e2e`; `e2e/*.spec.ts` |
| Accesibilidad | axe, teclado, foco, lector, contraste y target size | `e2e/accesibilidad.spec.ts` |
| Rendimiento | Lighthouse en build/start para vistas móviles seleccionadas | `e2e/rendimiento.spec.ts`, `playwright.lighthouse.config.ts` |
| Proveedor real | Meta, modelo abierto, voz/visión y respuesta estructurada con datos sintéticos | suites opt-in descritas en `.orquesta/ENSAYO.md`; usar cuenta/credenciales controladas |
| Dispositivo real | Cámara, manuscrito, micrófono, ruido de aula y navegadores móviles | Ensayo manual documentado; no reemplazar con audio o mocks sintéticos |

## Evidencia que el repositorio reporta

- `.orquesta/ENSAYO.md`: ejecución automatizada con Chrome local y mocks: 150 e2e correctas, 2 omitidas; guion escritorio/celular correcto. Reporta además pruebas separadas de proveedor real para tutor/evaluación 7/7 y analizador 12/12 con datos ficticios. Páginas públicas consultadas respondieron HTTP 200.
- T20 y `.orquesta/ESTADO.md`: 235 pruebas unitarias correctas y 10 omitidas (histórico); 64 casos axe, navegación semanal 6/6; Lighthouse con build/start y mocks: Hoy 92, Tarea 93, Comprensión 88; Accessibility 100 en las tres.
- `supabase/pruebas-rls/RESULTADOS.md`: prueba anterior sobre migraciones 0001–0010: 211/214 y tres reproducciones de transferencia de entrega (fallos esperados del test). `0011` agrega mitigación; `.orquesta/ESTADO.md` posterior indica 214/214 “según relevo”, pero el resultado detallado disponible no acredita esa repetición. No afirmar “RLS pasa 214/214” sin ejecutar de nuevo en el commit y migraciones objetivo.
- `supabase/demo/PRUEBAS.md`: seed de demo probado dos veces en PostgreSQL 18 local con datos ficticios; no prueba Auth, RLS ni Supabase remoto.

Estos resultados son declaraciones de archivos del repo, no pruebas realizadas en esta sesión ni garantía del entorno desplegado.

## Matriz mínima de aceptación por flujo

| ID | Prueba | Resultado esperado |
|---|---|---|
| T-01 | Estudiante intenta acceder a clase/entrega ajena | Rechazo 403/404 sin filtrar contenido. |
| T-02 | Docente crea tarea válida e inválida | 201 para válida; validación 400; análisis asíncrono no bloquea ni revierte tarea. |
| T-03 | Llega tarea nueva | Análisis guarda estructura Zod; plan respeta zona del centro, preferencia y vencimientos. |
| T-04 | Tutor recibe petición de solución / prompt injection | Conserva límite socrático; contenido del usuario no modifica rol/reglas. |
| T-05 | Adjunto grande, MIME o ruta ajena | Se rechaza y no queda vinculado a otro usuario. |
| T-06 | Verificación texto y voz | Tres preguntas normales; informe con citas comprobables; voz ofrece alternativa textual. |
| T-07 | Informe y mapa docente | Filtra por clase propia, niveles null para sin evidencia y métricas con denominador explicado. |
| T-08 | Devolución y nueva entrega | Conserva material previo, elimina estado de devolución al volver a entregar y no reutiliza intento obsoleto. |
| T-09 | Cuenta docente borrada | Efecto en datos de estudiantes se confirma explícitamente; no borrar inadvertidamente evidencia sin política aprobada. |
| T-10 | Classroom | Solo cursos del docente autorizado; importación deduplicada; ningún trabajo se declara enviado a Google desde MuseLearn. |
| T-11 | Responsive/a11y | Sin scroll a 360 px, teclado/foco correctos, etiquetas, contraste AA y axe sin serious/critical. |
| T-12 | Modo mocks vs IA real | UI identifica simulación; logs/resultado identifican proveedor real; no mezclar estadísticas ficticias con reales. |

## Criterios de salida para release

1. Lint, typecheck, unitarias, build y E2E pasan en el mismo commit que se desplegará.
2. RLS ejecuta contra migraciones actuales con cero fallos no aprobados.
3. Pruebas de IA usan datos sintéticos, registran proveedor/modelo y no exponen secretos.
4. Ensayo autenticado real en celular y PC completa el flujo; captura/evidencia no contiene datos personales.
5. Revisión de regresión y de idiomas, privacidad y accesibilidad finalizada.
6. Resultado y limitaciones adjuntados a la entrega/version.

## Riesgos de prueba

No ejecutar semillas en producción; `NEXT_PUBLIC_USAR_MOCKS=true` no cubre persistencia, RLS, OAuth ni proveedores. No incluir datos reales de estudiantes en fixtures. Para voz/visión se necesitan permisos, consentimiento y datos de prueba autorizados.
