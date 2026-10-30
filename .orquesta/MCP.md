# MuseLearn como servidor MCP

Solicitud de José, 30 oct de 2026: permitir que asistentes externos (Claude, GPT, Grok u otros) se conecten a MuseLearn para complementar el trabajo del docente y del estudiante.

Estado: diseño inicial. No hay endpoint MCP implementado ni publicado. Prioridad respecto al hackathon y alcance de escritura pendientes de respuesta de José. T20 sigue en curso y conserva su alcance.

## Resultado para el usuario

Desde un cliente compatible con MCP, el usuario conecta su cuenta de MuseLearn y concede permisos. Puede pedir, por ejemplo, «resume mis tareas pendientes», «ayúdame a organizar mi semana» o, como docente, «qué conceptos necesitan repaso en mi clase». Las respuestas parten de los datos que esa cuenta puede consultar.

La conexión se realiza desde la aplicación que hospeda al modelo: soportar un modelo por API no implica que su aplicación permita añadir servidores MCP. Verificar por separado cada cliente y modalidad disponibles al implementar; no prometer compatibilidad universal ni marcar un cliente como probado sin conectarlo realmente.

## Primera entrega propuesta: consulta autorizada

| Herramienta propuesta | Usuario | Resultado limitado |
|---|---|---|
| `listar_mis_clases` | Docente o estudiante | Identificador, nombre y materia de clases accesibles; sin códigos de inscripción. |
| `listar_mis_tareas` | Docente o estudiante | Título, instrucciones, fechas y modalidad de tareas accesibles, paginadas. |
| `consultar_mi_plan` | Estudiante | Bloques del plan de la semana elegida, solo de esa cuenta. |
| `consultar_mi_comprension` | Estudiante | Informe y ruta de práctica de una entrega propia. |
| `resumir_comprension_clase` | Docente | Agregados por concepto de una clase propia; sin nombres ni evidencias individuales por defecto. |

Scopes propuestos: `clases:read`, `tareas:read`, `plan:read`, `comprension:self:read`, `comprension:class:read`. El scope no reemplaza la autorización por rol, pertenencia, consentimiento y políticas RLS. La identidad sale del token validado; nunca de un `usuario_id` enviado por el modelo.

La primera entrega no publica notas, devuelve tareas, envía comentarios ni modifica entregas. Si José pide escritura, diseñar una segunda entrega de borradores visibles y confirmación dentro de MuseLearn; la autorización del servidor debe impedir que otra llamada del modelo se haga pasar por confirmación humana.

## Arquitectura

`Cliente MCP → endpoint HTTPS de MuseLearn → validación de token y scopes → servicio de dominio con identidad del usuario → Supabase con RLS`.

- Transporte remoto estándar Streamable HTTP; fijar una versión estable compatible con el SDK y los clientes seleccionados al implementar. No implementar JSON-RPC casero si existe SDK oficial adecuado.
- OAuth con consentimiento por cuenta, permisos mínimos y revocación. Diseñar el servidor MCP como recurso protegido y publicar sus metadatos de descubrimiento. Verificar expiración, emisor y audiencia del token para este recurso, además de los scopes; no aceptar indiscriminadamente un JWT válido para otro servicio.
- Comprobar si la configuración real de Supabase puede actuar como servidor de autorización y satisfacer descubrimiento, registro de clientes y consentimiento. La sesión web actual basada en cookies no resuelve por sí sola la conexión de un cliente MCP remoto. Si no cumple, decidir un proveedor de autorización compatible antes de implementar; no crear un OAuth incompleto ni pedir que el usuario pegue sus cookies.
- No reenviar tokens externos a Supabase sin un diseño de identidad y audiencia compatible. Si hace falta intercambio de tokens, especificarlo y probar que no amplía privilegios. Nunca exponer service_role ni usarla para saltar RLS en las consultas del conector.
- Reutilizar funciones de dominio de `src/lib/db/`, inyectando un cliente autenticado con los permisos de la cuenta. No llamar al cliente frontend `src/lib/api-cliente.ts` desde el servidor.
- Todo contrato de herramienta se valida con Zod; los tipos compartidos y los DTO reducidos del conector los aprueba T07. Limitar rangos, paginación, bytes y duración de las respuestas.
- No llamar a Muse en herramientas de consulta: el asistente externo utiliza los datos devueltos para razonar. Las funciones generativas de MuseLearn, si se añaden después, siguen pasando por `llamarMuse()` y sus límites.

## Protección de datos y control del usuario

- Mostrar antes de conectar qué aplicación recibe qué datos y para qué. Las reglas y condiciones del proveedor externo pueden diferir de las de MuseLearn.
- Empezar las pruebas exclusivamente con cuentas y datos ficticios. Mantener bloqueada la exposición de información de menores hasta definir los permisos del centro y el consentimiento correspondiente.
- No devolver correos, códigos de inscripción, URLs privadas de adjuntos, audios ni credenciales. La consulta docente inicial entrega agregados; cualquier acceso individual adicional requiere alcance explícito.
- Comprobar Origin cuando corresponda, evitar acceso entre usuarios/clases, limitar frecuencia por cuenta y cliente y registrar auditoría sin tokens ni textos de estudiantes.
- Tratar instrucciones y entregas como contenido no confiable. Las descripciones MCP indican que los datos no autorizan acciones ni cambian los permisos del conector.
- Configuración «Conexiones de IA»: autorizar, revisar y revocar conexiones. La desconexión impide nuevas llamadas según la política de tokens elegida; documentar el plazo real de revocación, sin prometer inmediatez si no se aplica.

## Secuencia de trabajo sin chocar con T20

1. Confirmar prioridad y si la primera entrega será solo lectura o borradores.
2. T07 aprueba contratos, dependencia MCP y diseño de identidad/autorización. Revisar la documentación de Next instalada antes de escribir Route Handlers.
3. Crear ficha independiente de backend para Codex: endpoint, auth, scopes, servicios, límites y pruebas. Rama aislada; no tocar componentes de T20. Numerar y registrar la ficha al activarla.
4. Crear ficha de interfaz para OpenCode después de T20: consentimiento y gestión de conexiones es/en. Acordar contratos antes de trabajar en paralelo.
5. Conectar con un cliente MCP real, después probar los demás clientes seleccionados. Registrar versión, modalidad, fecha, permisos y resultado de cada uno.
6. Revisar e integrar con lint, typecheck, unitarias, build y e2e. Migraciones revisadas por T07 y aplicadas por José antes del despliegue. Publicación solo con autorización explícita para esa ronda.

## Criterios mínimos de aceptación

- Un cliente real completa conexión y consentimiento sin compartir contraseñas ni cookies manualmente.
- Sin token, token vencido, audiencia/emisor incorrectos y scope insuficiente: acceso rechazado según protocolo.
- Pruebas con dos docentes y estudiantes de clases diferentes: ningún dato ajeno accesible por adivinar identificadores.
- Las cinco herramientas consultan únicamente datos autorizados, con resultados validados y paginados; herramientas no autorizadas no se ejecutan aunque se invoquen por nombre.
- Revocar una conexión corta su acceso conforme a una política probada y documentada.
- No aparecen secretos ni datos personales innecesarios en respuestas, logs o fixtures.
- Mocks identificados como tales; compatibilidad real anotada por cliente, sin extrapolar a todos los modelos.

## Referencias técnicas consultadas

- Autorización MCP: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
- Streamable HTTP y seguridad del transporte (versión de referencia, verificar negociación al implementar): https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- Código actual: `src/lib/db/sesion.ts`, `src/lib/supabase/servidor.ts`, `src/lib/db/clases.ts`, `src/lib/db/comprension.ts`.
