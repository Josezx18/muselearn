# 3. Especificación de requisitos de software (SRS)

**Versión:** 0.1 as-built · **Sistema:** MuseLearn web · **Actores principales:** docente, estudiante, servicios externos.

## 1. Propósito y alcance

Especificar comportamientos y restricciones observables del producto a partir de `src/`, `supabase/migrations/`, contratos Zod y documentación. Es una SRS inicial: las reglas no explícitas o no confirmadas se anotan como supuestos/puntos abiertos, no se inventan.

## 2. Clases de prioridad

- **P0:** necesario para cerrar el flujo educativo principal.
- **P1:** capacidad del producto que acompaña la experiencia principal.
- **P2:** integración o mejora opcional.
- **Estado:** `implementado según código` no equivale a validado contra servicios productivos.

## 3. Requisitos funcionales

| ID | Prioridad | Requisito | Criterio verificable | Estado documental |
|---|---:|---|---|---|
| FR-01 | P0 | El sistema permitirá registrarse e iniciar/cerrar sesión como docente o estudiante. | Una sesión sin permiso no accede a rutas privadas; el rol determina su área. | Implementado según T01; configuración de autenticación remota no revalidada |
| FR-02 | P0 | El docente podrá crear, editar y eliminar clases, administrar código de inscripción y estudiantes. | Solo el docente propietario modifica su clase; el código tiene 6 caracteres. | Implementado según rutas y contratos |
| FR-03 | P0 | El estudiante podrá unirse a una clase con código válido. | Código inválido, rol docente o duplicado producen error controlado. | Implementado según handler de inscripción |
| FR-04 | P0 | El docente podrá crear tareas con instrucciones, competencia(s), fecha, nivel de ayuda, modalidad y adjuntos. | La clase debe pertenecer al docente; entrada validada; se limita uso diario configurado. | Implementado según handler y contrato |
| FR-05 | P0 | El sistema analizará tarea por estudiante inscrito y guardará dificultad, minutos, prioridad, conceptos y pasos sugeridos. | Salida valida esquema; tarea nueva dispara análisis en segundo plano; fallos no bloquean creación. | Implementado; proveedor real depende de configuración |
| FR-06 | P0 | El sistema generará o recalculará un plan semanal para el estudiante. | Bloques respetan disponibilidad, duración máxima, fechas y estados; el estudiante puede consultar por semana. | Algoritmo determinista presente; avisos se pueden redactar con IA |
| FR-07 | P0 | El estudiante podrá consultar tutor por texto y recibir guía alineada al nivel definido por el docente. | El tutor no entrega la solución final; se conserva conversación y hay límite diario. | Implementado en prompt/handler |
| FR-08 | P0 | El estudiante podrá enviar una entrega con texto, archivos y confirmación de entrega externa. | Solo estudiante inscrito; adjuntos corresponden a su carpeta y tarea; no se sustituye entrega en verificación. | Implementado según rutas/contratos |
| FR-09 | P0 | El estudiante podrá iniciar y completar verificación de comprensión sobre su entrega. | Preguntas secuenciales, respuesta por texto o voz; se requiere completar el flujo para informe. | Implementado; micrófono/ASR físico pendiente de revalidación |
| FR-10 | P0 | El informe mostrará nivel global y por concepto, evidencias, fortalezas, debilidades y resumen. | Evidencia textual debe localizarse en una respuesta; identidad/fecha las fija el servidor. | Implementado según verificador y contrato |
| FR-11 | P0 | El docente verá indicadores de entrega frente a comprensión y un mapa por estudiante/concepto. | Solo clases propias; nivel ausente se expresa como null; cálculo del panel no requiere IA. | Implementado según endpoint/cálculo |
| FR-12 | P1 | El sistema propondrá una ruta de práctica y permitirá consultar/reintentar su generación. | Ruta de 1–6 pasos; si IA falla, el flujo de verificación guarda ruta básica. | Implementado según contrato/código |
| FR-13 | P1 | El docente podrá generar una tarea propuesta, sugerencia de repaso o borrador de comentario mediante IA. | Salidas validadas; no se guardan ni envían automáticamente; el docente revisa. | Implementado según servicios/rutas |
| FR-14 | P1 | El docente podrá comentar, calificar opcionalmente y devolver una entrega para corrección. | Nota 0–100 opcional; motivo de devolución obligatorio; estudiante puede reentregar. | Implementado según contrato/rutas; persistencia externa no reejecutada |
| FR-15 | P1 | El sistema presentará avisos internos y permitirá exportar datos de clase a CSV. | Un usuario solo accede a avisos propios; CSV se produce para clase autorizada. | Implementado según rutas/tareas |
| FR-16 | P1 | El usuario podrá actualizar datos de perfil y solicitar exportación o eliminación de su cuenta. | Exportación JSON autenticada; eliminación requiere confirmación escrita. | Implementado; revisar riesgos de eliminación en documento 09 |
| FR-17 | P1 | La interfaz ofrecerá español e inglés. | Las rutas locales y traducciones están definidas para ambos idiomas. | Implementado según README y estructura `messages/` |
| FR-18 | P2 | El docente podrá conectar Google Classroom e importar cursos, alumnos y tareas pendientes. | OAuth, estado protegido, autorización de curso; importación limitada por cupo; sin envío de entregas a Google. | Implementado según rutas; cuenta real/prueba externa no confirmada |
| FR-19 | P2 | El estudiante podrá conversar con el tutor por voz con una compañera visual y preferencias de voz. | Voz de salida usa navegador; detección de turno y transcripción tienen alternativa de texto. | Implementado en cliente; audio físico requiere prueba |

## 4. Requisitos no funcionales

| ID | Requisito | Criterio/nota |
|---|---|---|
| NFR-01 | Seguridad por usuario/rol y clase | Autenticación Supabase, comprobación de propiedad en handlers y RLS. Validar despliegue con pruebas actuales. |
| NFR-02 | Privacidad por defecto | Buckets privados; audio no se persiste en MuseLearn; no usar tier Meta Contributor para datos estudiantiles según política del proyecto. Retención del proveedor externo debe confirmarse. |
| NFR-03 | Validación | Contratos Zod para datos de API/modelo; respuestas estructuradas de IA se validan y pueden reintentarse. |
| NFR-04 | Bilingüismo | Español/inglés en interfaz y prompts. |
| NFR-05 | Móvil/accesibilidad | README/meta fijan móvil; T14/T20 registran axe/Lighthouse y 360 px. Resultados no se volvieron a ejecutar. |
| NFR-06 | Disponibilidad/recuperación | Errores de IA deben dar alternativa o mensaje; tareas e informes almacenados en Supabase. No hay SLA ni RTO/RPO documentados. |
| NFR-07 | Rendimiento | T20 reporta Lighthouse móvil 92/93/88 y accesibilidad 100 en páginas seleccionadas, con mocks/build de producción; no equivale a garantía de tiempos de IA. |
| NFR-08 | Escalabilidad | Endpoints principales consultan Supabase; límites diarios protegen créditos. No hay volumen/concurrencia objetivo formal. |

## 5. Restricciones y supuestos

- Aplicación web Next.js App Router/TypeScript; frontend es/en; Supabase Auth/Postgres/Storage; despliegue previsto en Vercel.
- Navegador debe dar permisos si el usuario decide usar micrófono o cámara; existe ruta por texto.
- El servicio requiere configuración de proveedores externos para modo real. `NEXT_PUBLIC_USAR_MOCKS=true` presenta datos/respuestas simulados y no demuestra llamadas de IA ni persistencia remota.
- No existe administración institucional diferenciada ni OAuth/MCP para asistentes generales.
- El cumplimiento legal, autorizaciones para menores, región de datos y retención de cada proveedor requieren confirmación humana especializada.

## 6. Trazabilidad

FR-01–03: `src/app/api/clases/`, `src/lib/db/sesion.ts`, `src/lib/db/clases.ts`; FR-04–08: `src/app/api/tareas/`, `src/app/api/entregas/`, `src/lib/ia/`; FR-09–12: `src/app/api/verificacion/`, `src/app/api/informes/`, `src/lib/ia/informes/`; FR-13–19: `src/app/api/docente/`, `src/app/api/avisos/`, `src/app/api/perfil/`, `src/app/api/integraciones/classroom/`. Datos y validaciones en `src/types/contratos.ts`, permisos en `supabase/migrations/`.

## 7. Pendientes para cerrar la especificación

Confirmar plan de roles/consentimiento de centro y familias; proveedor y región por entorno; límites y retención de terceros; criterios del hackathon vigentes; restauración/backups; rendimiento con carga real; estado de migraciones remotas; qué funciones de Classroom se habilitan públicamente.
