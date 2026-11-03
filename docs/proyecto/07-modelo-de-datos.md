# 7. Modelo y diccionario de datos

**Fuentes:** `supabase/migrations/0001_inicial.sql`–`0011_proteger_identidad_entrega.sql`, `.orquesta/contratos/esquema.sql`, `src/types/contratos.ts`. Este diccionario es funcional; la definición SQL vigente por entorno es la secuencia de migraciones.

## Entidades principales

| Tabla | Clave/relación | Contenido y observaciones |
|---|---|---|
| `auth.users` | PK `id` | Identidad y credenciales administradas por Supabase Auth. |
| `perfiles` | PK `id` → `auth.users.id` | `rol` (docente/estudiante), nombre, idioma, apariencia (tema/mascota), aceptación/versión de términos y fecha. Rol limitado por RLS. |
| `clases` | PK UUID; FK `docente_id` → perfiles | Nombre, materia, grado, `codigo_inscripcion` único de 6 caracteres, fecha creación. |
| `inscripciones` | PK compuesta (`clase_id`, `estudiante_id`) | Relación muchos-a-muchos clase/estudiante y fecha de inscripción. Alta se valida en endpoint con código. |
| `tareas` | PK UUID; FK `clase_id` → clases | Título, instrucciones, `adjuntos` JSONB, vencimiento, competencias text[], nivel de ayuda, modalidad, enlace externo y fecha de creación. |
| `entregas` | PK UUID; FK tarea y estudiante; UNIQUE (`tarea_id`,`estudiante_id`) | Texto, adjuntos JSONB, estado, fecha entregada y flag de confirmación externa. `0011` protege inmutabilidad de tarea/estudiante para usuarios de sesión. |
| `analisis_tareas` | PK compuesta (`tarea_id`,`estudiante_id`) | JSONB `datos` con dificultad, minutos, prioridad, conceptos, pasos y razón. |
| `planes` | PK compuesta (`estudiante_id`,`semana_inicio`) | JSONB `datos` con bloques, avisos y fecha de generación. |
| `preferencias_estudio` | PK `estudiante_id` | JSONB de disponibilidad semanal y máximo de minutos por bloque. |
| `conversaciones_tutor` | PK UUID; FK tarea/estudiante | JSONB `mensajes` e instante de actualización. RLS limita al propio estudiante. |
| `sesiones_verificacion` | PK UUID; FK `entrega_id` | JSONB `preguntas`, estado en_curso/completada y fecha de creación. |
| `informes` | PK/FK `entrega_id` | JSONB `informe` y JSONB nullable `ruta`; un registro por entrega, actualizado al reemplazar informe. |
| `comentarios_entrega` | PK/FK `entrega_id` | `docente_id`, texto y fecha; docente propietario escribe; estudiante dueño puede leer. |
| `uso_ia_docente` | PK identity | `docente_id`, función y fecha. Registro interno para límites/cuotas, sin lectura directa por usuarios. |
| `calificaciones` | PK/FK `entrega_id` | `docente_id`, nota decimal nullable 0–100, estado devuelta, motivo y fecha. RPC de devolución cambia la calificación y entrega. |
| `avisos` | PK UUID; FK `usuario_id` | Tipo, título, enlace interno, leído y fecha. Usuario solo lee/actualiza sus propios avisos. |
| `clases_vinculadas` | PK `clase_id` | Relación de clase local con proveedor/curso externo; evita importar dos veces. |
| `tareas_vinculadas` | PK `tarea_id`; UNIQUE clase/proveedor/external_id | Relación de tarea local con tarea externa para deduplicación. |

## Objetos JSON relevantes

- `Adjunto`: nombre, ruta de Storage y MIME.
- `AnalisisTarea`: dificultad 1–5, minutos 5–600, prioridad 0–100, 1–8 conceptos, pasos sugeridos y razón.
- `PlanSemanal`: estudiante, lunes inicial de semana, bloques, avisos y fecha.
- `InformeComprension`: nivel global 1–4, evaluaciones por concepto, evidencias, fortalezas/debilidades y resúmenes para estudiante/docente.
- `RutaPractica`: 1–6 pasos tipados por concepto y duración.
- `DetalleEntrega`: entrega, estudiante, URLs temporales de adjuntos, preguntas, informe y comentario.

Los esquemas canónicos de TypeScript se definen en `src/types/contratos.ts`; los campos JSONB deben validarse en entrada/salida. Revisar migraciones para su forma SQL y constraints.

## Integridad y borrado

- La mayoría de relaciones usa `ON DELETE CASCADE`. El borrado de una clase/tarea elimina filas relacionadas; Storage se borra aparte en lógica de aplicación con best effort.
- El perfil del docente elimina en cascada sus clases y, potencialmente, tareas/entregas e informes de estudiantes de esas clases. Este efecto debe acordarse como política de propiedad/retención antes de uso con datos reales.
- Los archivos de adjuntos son privados, límite configurado de 10 MiB por objeto en migración de Storage; el código también valida 10 MB.
- El audio del usuario no se guarda por el endpoint actual. Aunque existe bucket `audios`, no asumir que el flujo lo usa.

## Acceso/RLS resumido

- Estudiante: filas propias; clases/tareas de las clases donde está inscrito; entrega y progreso propios.
- Docente: clases propias y entregas/informes de sus clases.
- Comentarios y notas: docente propietario escribe; estudiante dueño lee su información.
- Avisos: solo destinatario.
- Funciones de RLS auxiliares restringidas a roles autenticados/servicio; service role puede saltarse RLS y debe usarse tras autorización explícita.
- `0011` instala trigger que bloquea cambiar `tarea_id`/`estudiante_id` de entregas y una política de inscripción. La existencia del archivo no prueba que esté aplicado en cada base.

## Índices, volumen y versionado

Las migraciones contienen índices puntuales (por ejemplo avisos por usuario/fecha), pero no se encontró un plan de capacidad, política de partición ni estrategia explícita para versionar JSON de planes/informes. Los historiales de conversación se guardan como JSONB; deben controlarse tamaño, exportación y borrado.

## Referencias

`supabase/migrations/0001_inicial.sql`, `0003_rls.sql`, `0005_apariencia_perfil.sql`, `0006_clases_vinculadas.sql`, `0007_ia_docente.sql`, `0008_modalidad_terminos.sql`, `0009_calificaciones.sql`, `0010_avisos.sql`, `0011_proteger_identidad_entrega.sql`; `src/types/contratos.ts`; `src/lib/db/cuenta.ts`.
