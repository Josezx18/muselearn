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
- [ ] Página de clase del docente con lista de tareas y botón "Nueva tarea".
- [ ] Formulario de tarea: título, instrucciones (texto enriquecido simple), fecha y hora de entrega, competencias (chips), nivel de ayuda del tutor con explicación de cada opción, adjuntos (PDF/imagen, máx. 10 MB).
- [ ] Adjuntos en Storage bucket `adjuntos`; para PDF se extrae el texto y se guarda para que la IA lo lea (en el campo de `Adjunto` o tabla auxiliar acordada con el integrador).
- [ ] Al crear una tarea: llama en segundo plano a `POST /api/ia/analizar` para cada estudiante inscrito (sin bloquear la respuesta al docente).
- [ ] Vista del docente por tarea: lista de estudiantes con estado (pendiente, entregada, verificando, verificada).
- [ ] Componente `FormularioEntrega` (texto + adjuntos) exportado desde `src/components/entregas/`, que T05 coloca en la página de la tarea.
- [ ] **Entrega por foto del cuaderno:** botón "Tomar foto" que abre la cámara en el celular (`<input type="file" accept="image/*" capture="environment">`), hasta 4 fotos, comprimidas en el navegador a máx. 1600 px antes de subir. Es una pieza clave de la demo.
- [ ] Endpoint de entrega cambia estado a `entregada` y devuelve la `Entrega` para que T04 inicie la verificación.
- [ ] Validación con Zod en todos los endpoints; un estudiante no puede entregar en una clase ajena.
- [ ] Textos en es y en. Pruebas de los endpoints con datos mock.

## Decisiones
- 

## Bloqueos
- 

## Solicitudes al integrador
- 
