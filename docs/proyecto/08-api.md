# 8. Catálogo de API

**Base:** Route Handlers Next.js bajo `/api` (`src/app/api/**/route.ts`). La autenticación ordinaria usa cookie de sesión Supabase; cada handler valida sesión/rol/propiedad, y RLS actúa como defensa de datos. La entrada se valida con Zod cuando está implementado. Errores suelen tener `{error:{codigo,mensaje}}`; streaming del tutor devuelve texto plano.

La lista refleja los métodos exportados localizados en el repositorio, no una especificación OpenAPI generada. Los esquemas canónicos están en `src/types/contratos.ts` y validadores de entrada en `src/lib/db/`.

## Sesión y clases

| Método y ruta | Rol | Uso |
|---|---|---|
| `GET /api/auth/callback` | OAuth autenticado | Callback de autenticación Supabase/Google sign-in. |
| `GET /api/clases` | Docente/estudiante | Lista las clases accesibles bajo RLS. |
| `POST /api/clases` | Docente | Crea una clase. |
| `GET /api/clases/:id` | Propietario | Lee clase propia. |
| `PATCH /api/clases/:id` | Docente propietario | Edita clase. |
| `DELETE /api/clases/:id` | Docente propietario | Elimina clase y datos dependientes; archivos se limpian aparte. |
| `POST /api/clases/unirse` | Estudiante | Se inscribe por código de seis caracteres. |
| `GET /api/clases/:id/estudiantes` | Docente propietario | Lista estudiantes inscritos. |
| `DELETE /api/clases/:id/estudiantes/:estudianteId` | Docente propietario | Quita inscripción. |
| `POST /api/clases/:id/codigo` | Docente propietario | Cambia código de invitación. |
| `GET /api/clases/:id/exportar` | Docente propietario | Descarga CSV de clase. |

## Tareas, entregas y archivos

| Método y ruta | Rol | Uso |
|---|---|---|
| `GET /api/tareas?clase_id=` | Miembro de clase/docente | Lista tareas permitidas. |
| `POST /api/tareas` | Docente propietario | Crea tarea y dispara análisis/notificación en segundo plano. |
| `GET /api/tareas/:id` | Usuario autorizado | Lee tarea. |
| `PATCH /api/tareas/:id` | Docente propietario | Edita campos permitidos; cambio de fecha puede replanificar. |
| `DELETE /api/tareas/:id` | Docente propietario | Elimina tarea y dependencias. |
| `POST /api/tareas/:id/adjuntos` | Docente propietario | Sube adjunto de tarea (`multipart`). |
| `GET /api/entregas?tarea_id=` | Docente de tarea/estudiante propio | Lista todas las entregas de la tarea para docente o solo la propia para estudiante. |
| `POST /api/entregas` | Estudiante inscrito | Crea/actualiza evidencia de entrega propia. |
| `POST /api/entregas/adjuntos` | Estudiante inscrito | Sube archivo de entrega (`multipart`, PDF/imagen, hasta 10 MiB). |
| `GET /api/entregas/:id` | Docente de tarea/estudiante dueño | Lee detalle permitido. |
| `GET /api/entregas/:id/calificacion` | Docente/estudiante con acceso | Lee calificación. |
| `PUT /api/entregas/:id/calificacion` | Docente propietario | Guarda nota nullable de 0 a 100. |
| `POST /api/entregas/:id/devolver` | Docente propietario | Devuelve entrega con motivo para corrección. |
| `GET /api/entregas/:id/comentario` | Docente/estudiante con acceso | Lee comentario. |
| `PUT /api/entregas/:id/comentario` | Docente propietario | Crea/actualiza comentario. |
| `DELETE /api/entregas/:id/comentario` | Docente propietario | Elimina comentario. |
| `GET /api/archivos?ruta=` | Usuario autorizado | Obtiene enlace/archivo verificado; revisa RLS y propietario antes de acceso admin. |

## Plan, IA y aprendizaje

| Método y ruta | Rol | Uso |
|---|---|---|
| `POST /api/ia/analizar` | Servicio/estudiante/docente con autorización | Analiza tarea para estudiante permitido y almacena análisis. |
| `GET /api/ia/analisis?estudiante_id=` | Estudiante propio/docente autorizado | Consulta análisis disponibles. |
| `GET /api/ia/plan?semana_inicio=` | Estudiante | Lee plan de semana; calcula si no existe. |
| `POST /api/ia/plan` | Estudiante | Recalcula plan, semana opcional. |
| `PATCH /api/ia/plan/bloques/:id` | Estudiante propietario | Cambia estado de bloque. |
| `GET /api/preferencias` | Estudiante | Lee preferencias de estudio. |
| `PUT /api/preferencias` | Estudiante | Actualiza disponibilidad y longitud máxima de bloque. |
| `GET /api/tutor?tarea_id=` | Estudiante inscrito | Lee historial del tutor. |
| `POST /api/tutor` | Estudiante inscrito | Envía mensaje y recibe stream de texto. |
| `POST /api/verificacion/iniciar` | Estudiante propietario | Inicia/recupera sesión de verificación. |
| `POST /api/verificacion/responder` | Estudiante propietario | Responde pregunta; devuelve siguiente pregunta o informe final. |
| `POST /api/voz/transcribir` | Estudiante autenticado | Envía WAV multipart y recibe `{texto}`; audio no se almacena en MuseLearn. |
| `GET /api/informes/:entregaId` | Estudiante dueño/docente autorizado | Obtiene informe y ruta de práctica. |
| `POST /api/informes/:entregaId/ruta` | Propietario/autorizado según servicio | Genera/reutiliza ruta. |
| `POST /api/informes/:entregaId/semana` | Estudiante dueño | Agrega los pasos de práctica guardados a bloques del plan, sin IA; informa si algún paso no cabe. |
| `GET /api/docente/comprension?clase_id=&tarea_id=` | Docente propietario | Devuelve mapa e indicadores sin llamar a IA. |
| `POST /api/docente/ia/tarea` | Docente propietario, con cupo | Propone borrador de tarea. |
| `POST /api/docente/ia/repaso` | Docente propietario, con cupo | Sugiere plan de repaso desde datos agregados. |
| `POST /api/docente/ia/comentario` | Docente propietario, con cupo | Devuelve borrador de comentario sin guardarlo. |

## Avisos, perfil y privacidad

| Método y ruta | Rol | Uso |
|---|---|---|
| `GET /api/avisos` | Usuario autenticado | Lee avisos propios. |
| `POST /api/avisos/leidos` | Usuario autenticado | Marca avisos propios leídos. |
| `GET /api/perfil` | Usuario autenticado | Consulta perfil. |
| `PATCH /api/perfil` | Usuario autenticado | Cambia campos de perfil permitidos. |
| `POST /api/perfil/contrasena` | Usuario autenticado | Actualiza contraseña. |
| `GET /api/perfil/datos` | Usuario autenticado | Exporta JSON de datos accesibles. |
| `POST /api/perfil/eliminar` | Usuario autenticado | Elimina la cuenta tras confirmar `ELIMINAR`/`DELETE`. |

## Google Classroom opcional

| Método y ruta | Rol | Uso |
|---|---|---|
| `GET /api/integraciones/classroom/conectar?locale=` | Docente | Inicia OAuth de Google con estado aleatorio. |
| `GET /api/integraciones/classroom/callback` | OAuth docente | Canjea código y almacena token temporal en cookie HttpOnly. |
| `GET /api/integraciones/classroom/cursos` | Docente conectado | Lista cursos permitidos. |
| `POST /api/integraciones/classroom/importar` | Docente dueño del curso | Importa curso, alumnos y tareas próximas permitidas; análisis posterior. |
| `POST /api/integraciones/classroom/desconectar` | Docente | Borra conexión/cookie. |

## Contratos por completar

La API no se describe íntegramente en `.orquesta/contratos/api.md` (ese archivo es anterior a varios módulos). Antes de publicar un SDK o congelar una OpenAPI, extraer esquemas/códigos de error de cada handler, confirmar roles y límites, y probar contra el commit y entorno objetivo. No incluir en este catálogo ejemplos de tokens, cookies ni datos personales.
