# 5. Arquitectura del sistema

## Estilo y límites

MuseLearn es una aplicación web Next.js con App Router, páginas de servidor/cliente y Route Handlers. Supabase concentra autenticación, PostgreSQL y Storage. Los handlers/servicios validan permisos y coordinan IA externa. El navegador nunca debe recibir claves de proveedores ni `service_role`.

## Componentes

1. **Presentación web:** Next.js/React, TypeScript, Tailwind CSS, `next-intl`, interfaz ES/EN. Las vistas del estudiante incluyen Hoy, Semana, tarea, tutor, verificación e informe; las del docente, clases/tareas, comprensión, administración e integraciones.
2. **Capa de API:** `src/app/api/**/route.ts`. Valida sesión/rol/pertenencia; valida entradas con Zod; devuelve JSON o stream; aplica límites y errores HTTP.
3. **Servicios de dominio:** `src/lib/db/` para clases, tareas, entregas, avisos, calificaciones, privacidad y gestión; `src/lib/ia/` para análisis, plan, diálogo e informes.
4. **Persistencia:** Supabase Auth; PostgreSQL con RLS; Storage privado `adjuntos`. El esquema usa columnas JSON para varios objetos de plan, informes, historial y análisis.
5. **Adaptadores de IA:** `src/lib/ia/cliente.ts` es el punto de acceso de chat/visión; `crearTranscriptor` del mismo módulo hace la transcripción ASR de voz. Enrutamiento configurable por función.
6. **Modo mocks:** `NEXT_PUBLIC_USAR_MOCKS=true` usa fixtures de `src/lib/mocks/`; sirve para UI/pruebas, pero no representa llamadas reales a Meta/Google ni persistencia real.
7. **Integración Classroom:** OAuth Google opcional, token en cookie `httpOnly`; consulta cursos/estudiantes/tareas y crea/actualiza objetos de MuseLearn.

## Flujo de datos principal

```text
Docente ── crea tarea ──> Route Handler ──> Supabase
                                  │
                                  └─ análisis en segundo plano por estudiante
                                     └─ modelo abierto / Meta ──> análisis validado
                                        └─ algoritmo determinista ──> plan guardado

Estudiante ── tutor ──> Route Handler ──> historial + modelo Meta/open ──> stream
Estudiante ── entrega ──> Storage privado + DB
      └─ verificación texto/voz + visión opcional ──> preguntas/evaluación
             └─ informe validado + ruta práctica ──> DB
Docente ── panel ──> consultas de informes (sin IA para mapa)
```

## Estrategia de IA

Las funciones de `src/lib/ia/cliente.ts` incluyen `analizar`, `planificar`, `leer_cuaderno`, `tutor`, `verificar`, `evaluar`, `ruta` y `docente`.

- Análisis/planificación: orden preferido configurado `abierto → meta → nvidia` (modelo abierto de Meta a través del endpoint configurado; Meta API; respaldo opcional NVIDIA).
- Lectura de cuaderno: Meta API; no hay fallback enumerado en la ruta de esta función.
- Tutor/verificación/evaluación/ruta/ayuda docente: Meta primero y proveedor abierto como respaldo.
- El plan de bloques lo calcula un algoritmo determinista; la IA redacta avisos. La ruta de práctica tiene respaldo básico.
- Respuestas estructuradas se convierten a JSON, se validan contra Zod y pueden reintentarse; si proveedor/configuración falta, el sistema no debe presentarse como “IA real”.
- La transcripción usa `muse-voice-transcribe-1.0` por endpoint Meta ASR; WAV se envía en memoria. La voz de salida es `speechSynthesis` del navegador, no un modelo Meta TTS.

**Modelos y claims:** el README declara Muse Spark 1.3, Muse Voice Transcribe 1.0, Muse Spark Open y fallback Muse Glimmer 30B. La configuración no prueba qué proveedor atendió cada llamada; para una demo/entrega se deben usar logs/resultados reales del entorno y describirlos con exactitud.

## Seguridad arquitectónica

- `crearClienteServidor()` usa cookies de sesión Supabase y RLS.
- `crearClienteAdmin()` omite RLS; los handlers deben comprobar permiso antes de usarlo. Auditar cada nuevo flujo privilegiado.
- Las tablas principales tienen RLS; funciones auxiliares restringen ejecución anónima. `0011_proteger_identidad_entrega.sql` agrega protección para evitar cambiar la identidad de una entrega.
- Buckets privados; los adjuntos deben accederse con ruta autorizada/enlace temporal.
- No se guardan respuestas de audio; el almacenamiento de voz no debe confundirse con la tabla/bucket legado `audios`.

## Despliegue lógico

El README indica demo pública en Vercel. El frontend/Route Handlers se ejecutan en la plataforma; Supabase es un servicio administrado externo; IA y Google son terceros opcionales. No se encontró una definición de IaC, topología de red completa, SLA ni configuración de recuperación.

## Decisiones y cuestiones abiertas

- No hay cola de trabajos externa observada: análisis/importación usan trabajo en segundo plano de Next (`after()`), con `maxDuration` en handlers.
- Confirmar límites de ejecución y reintentos en el proveedor de hosting; los análisis de clase pueden acumular llamadas.
- Confirmar estado remoto de migraciones, políticas, variables por ambiente, OAuth Classroom y proveedores de IA.
- Revisar seguridad del flujo docente con servicio admin, retención de datos en terceros, backups y limpieza física de adjuntos.

## Referencias

`.orquesta/ARQUITECTURA.md`, `src/lib/ia/cliente.ts`, `src/lib/ia/analizador/servicio.ts`, `src/lib/ia/planificador/algoritmo.ts`, `src/lib/supabase/servidor.ts`, `src/lib/server/data.ts`, `src/app/api/` y migraciones Supabase.
