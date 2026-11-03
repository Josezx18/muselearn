# 11. Instalación, configuración, despliegue y operación

**Requisitos referenciados:** Node.js 22+ (`README.md`), npm y acceso a un proyecto Supabase para modo persistente. Este texto no se ejecutó; confirmar versiones reales del equipo y del proveedor antes de utilizarlo.

## Instalación local

1. Clonar el repositorio y cambiar al directorio del proyecto.
2. Instalar dependencias con `npm install`.
3. Copiar `.env.example` como `.env.local` y completar valores en el entorno local. No compartir ni subir `.env.local`.
4. Para interfaz sin credenciales, mantener `NEXT_PUBLIC_USAR_MOCKS=true`. Mocks no llaman modelos ni prueban persistencia.
5. Ejecutar `npm run dev`; abrir `http://localhost:3000`.

## Variables identificadas

| Variable | Uso | Clasificación |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase | Pública/configuración |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase con RLS | Pública, siempre sujeta a RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Operaciones servidor que omiten RLS | Secreto crítico, solo server-side |
| `MODEL_API_KEY`, `META_API_URL`, `MUSE_MODELO` | Meta Model API | Clave secreta / endpoint / ID |
| `MUSE_VOZ_MODELO` | Modelo de transcripción ASR | Configuración |
| `MODELO_ABIERTO_URL`, `MODELO_ABIERTO_KEY`, `MODELO_ABIERTO_ID` | Endpoint y modelo open-weight | Clave secreta / configuración |
| `NVIDIA_API_KEY`, `NVIDIA_API_URL`, `NVIDIA_MODELO` | Fallback NVIDIA opcional | Clave secreta / configuración |
| `ZONA_OFFSET_MIN` | Offset de zona horaria para el plan | Configuración; default documentado −240 min |
| `NEXT_PUBLIC_USAR_MOCKS` | Activar fixtures | Configuración pública |
| `LIMITE_TUTOR_DIA`, `LIMITE_VERIFICACIONES_DIA`, `LIMITE_TAREAS_DIA`, `LIMITE_IA_DOCENTE_DIA` | Cuotas diarias | Configuración operativa |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_ENTRAR_CON_GOOGLE` | Autenticación/integración Google, según proveedor | Client secret confidencial; flag pública |

No poner claves de servidor en variables `NEXT_PUBLIC_*`. Los valores reales nunca se deben incluir en estos documentos.

## Base de datos y datos demo

- Migraciones SQL ordenadas en `supabase/migrations/` desde `0001` a `0011` en la copia examinada. Aplicación remota y orden efectivo deben confirmarse antes de operar.
- Auth, políticas RLS, tablas, buckets privados y funciones RPC dependen de migraciones. No omitir pasos ni aplicar SQL a una base compartida sin revisión.
- Seeds se diseñaron para cuentas ficticias. El README recomienda usar proyecto Supabase dedicado para pruebas/seeds; no ejecutar `seed:auth` o `seed-demo.sql` contra producción ni entorno compartido sin autorización y procedimiento aprobado.
- Si se necesitan pruebas de RLS, `npm run rls` crea un PostgreSQL temporal local; requisitos y límites en `supabase/pruebas-rls/README.md`.

## Build y validaciones

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
npm run rls
```

`npm run prueba:ia` llama proveedores reales y requiere `.env.local`; ejecutar solo con crédito/consumo aprobados y datos ficticios. La revisión de documentación no corrió estos comandos.

## Despliegue previsto

El README declara demo pública en Vercel. Flujo operativo sugerido: conectar repo/branch autorizada, instalar dependencias, definir variables secretas por ambiente, aplicar migraciones revisadas a la base correcta, configurar URLs de auth/OAuth y redirect, desplegar build y verificar smoke tests públicos y autenticados.

No se encontró en el repositorio una política completa de pipeline, rollback, snapshots, retención de logs, rotación de claves o procedimiento de restauración. Antes de un release real, nombrar responsable y documentar esos procedimientos en el proveedor; no asumirlos de la existencia de Vercel/Supabase.

## Operación y respuesta

- Vigilar errores HTTP, límites, fallos de proveedor y duración de procesos asíncronos.
- Revisar consumo/tokens de IA sin registrar texto sensible; el código registra cantidades de tokens y errores de proveedor.
- Probar expiración/desconexión OAuth; confirmar procedimiento de revocación del permiso Google.
- Mantener respaldo y prueba de recuperación de DB/Storage; la eliminación de cuentas/clases puede cascadar datos.
- Para incidentes: revocar claves/tokens desde sus paneles, limitar acceso, preservar logs mínimos, evaluar datos afectados y notificar según política legal/centro. No existe actualmente un runbook específico en el repo.

## Fuentes

`README.md` (Run it locally/Demo), `.env.example`, `package.json`, `.orquesta/CIERRE-HACKATHON.md`, `supabase/migrations/`, `supabase/pruebas-rls/README.md`, `supabase/demo/PRUEBAS.md`.
