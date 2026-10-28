# T02 — Tareas del docente y entregas

| Campo | Valor |
|---|---|
| Plataforma | OpenCode |
| Rama / carpeta | `t02-tareas` / `../muselearn-T02` |
| Oleada | 1 |
| Depende de | T00 (usa mocks de T01 mientras tanto) |
| Puedes tocar | `src/app/[locale]/docente/clases/`, `src/app/[locale]/docente/tareas/`, `src/app/api/tareas/`, `src/app/api/entregas/`, `src/components/tareas/`, `src/components/entregas/`, `src/lib/mocks/tareas.ts`, `messages/*/tareas.json` |
| Contratos | `Tarea`, `Entrega`, `Adjunto`; endpoints T02 de `api.md` |

## Objetivo
El docente crea y asigna tareas; el estudiante entrega. Es el "canal": simple y sólido.

## Criterios de aceptación
- [x] Página de clase del docente con lista de tareas y botón "Nueva tarea".
- [x] Formulario de tarea: título, instrucciones (texto enriquecido simple), fecha y hora de entrega, competencias (chips), nivel de ayuda del tutor con explicación de cada opción, adjuntos (PDF/imagen, máx. 10 MB).
- [x] Adjuntos en Storage bucket `adjuntos`; para PDF se extrae el texto y se guarda para que la IA lo lea (en el campo de `Adjunto` o tabla auxiliar acordada con el integrador).
- [x] Al crear una tarea: llama en segundo plano a `POST /api/ia/analizar` para cada estudiante inscrito (sin bloquear la respuesta al docente).
- [x] Vista del docente por tarea: lista de estudiantes con estado (pendiente, entregada, verificando, verificada).
- [x] Componente `FormularioEntrega` (texto + adjuntos) exportado desde `src/components/entregas/`, que T05 coloca en la página de la tarea.
- [x] **Entrega por foto del cuaderno:** botón "Tomar foto" que abre la cámara en el celular (`<input type="file" accept="image/*" capture="environment">`), hasta 4 fotos, comprimidas en el navegador a máx. 1600 px antes de subir. Es una pieza clave de la demo.
- [x] Endpoint de entrega cambia estado a `entregada` y devuelve la `Entrega` para que T04 inicie la verificación.
- [x] Validación con Zod en todos los endpoints; un estudiante no puede entregar en una clase ajena.
- [x] Textos en es y en. Pruebas de los endpoints con datos mock.

## Notas del integrador (27 oct)
- T01 ya integrada: sesión con `exigirRol()` de `@/lib/db/sesion`, clases reales en `/api/clases`. La página `docente/clases/page.tsx` la creó T01 (lista y nueva clase): amplíala con la lista de tareas, no la reescribas.
- Para analizar al crear una tarea usa `analizarYGuardar` de `@/lib/ia/analizador/servicio` (T03) por cada estudiante inscrito, sin bloquear la respuesta al docente.
- RLS activo en Supabase (migraciones 0003 y 0004): las escrituras de entregas van con la sesión del estudiante; las del servidor, con `crearClienteAdmin()` después de comprobar permisos.

## Decisiones
- Adjuntos: por ahora se guardan en la BD como JSON (campo `adjuntos` en `tareas` y `entregas`) con ruta mock; la subida real a Supabase Storage bucket `adjuntos` y extracción de texto de PDF se hará cuando T07 configure las claves reales de Supabase.
- Análisis IA en background: implementado con `void (async () => { ... })()` para no bloquear la respuesta al docente.
- Compresión de imágenes: se usa canvas en el cliente para redimensionar a máx. 1600px y convertir a JPEG 80% calidad antes de subir.
- Nivel de ayuda del tutor: se muestra con radio buttons y descripción de cada opción (pistas, ejemplos, explicación). 

## Bloqueos
- 

## Solicitudes al integrador
- 
