# T01 — Auth, roles, clases e inscripción

| Campo | Valor |
|---|---|
| Plataforma | Claude Code |
| Rama / carpeta | `t01-auth-clases` / `../muselearn-T01` |
| Oleada | 1 |
| Depende de | T00 |
| Puedes tocar | `src/app/[locale]/(publico)/`, `src/app/api/clases/`, `src/lib/supabase/` (solo agregar), `src/lib/db/`, `src/components/auth/`, `src/components/clases/`, `src/lib/mocks/clases.ts`, `messages/*/auth.json`, `messages/*/clases.json`, `supabase/politicas/` (archivo nuevo con RLS, el integrador lo convierte en migración) |
| Contratos | `Usuario`, `Clase`; endpoints T01 de `api.md` |

## Objetivo
Registro e inicio de sesión con rol, creación de clase con código y unión con código.

## Criterios de aceptación
- [x] Registro con correo y contraseña, eligiendo rol (docente o estudiante) y nombre; crea fila en `perfiles`.
- [x] Inicio y cierre de sesión; redirección según rol a `/docente` o `/estudiante/hoy`.
- [x] Rutas protegidas por rol en el middleware.
- [x] Docente: formulario "Nueva clase" (nombre, materia, grado) → genera código único de 6 caracteres (sin O/0/I/1).
- [x] Docente: lista de sus clases con código copiable y número de estudiantes.
- [x] Estudiante: pantalla "Unirme a una clase" con el código; error claro si no existe.
- [x] Endpoints `POST/GET /api/clases`, `POST /api/clases/unirse`, `GET /api/clases/:id/estudiantes`.
- [x] Políticas RLS completas para `perfiles`, `clases`, `inscripciones` y lectura de `tareas` por inscritos, en `supabase/politicas/rls.sql`.
- [x] Usuarios de demo: `docente@demo.muselearn` y 3 estudiantes (datos ficticios) en `supabase/seed-auth.ts`.
- [x] Textos en es y en. Pruebas: generador de códigos y validación de unión.

## Decisiones
- El registro es una Server Action (`src/components/auth/acciones.ts`): crea el usuario con el cliente admin (correo ya confirmado, sin paso de verificación por correo) y guarda el rol en `app_metadata`, que el usuario no puede editar. Si falla el perfil, borra la cuenta.
- La protección de rutas está en dos capas: `src/proxy.ts` (+ `rutaDeRedireccion` en `src/lib/supabase/proxy.ts`) y `exigirRol()` en los layouts de docente y estudiante. Con `NEXT_PUBLIC_USAR_MOCKS=true` ambas se desactivan para poder ver la UI sin sesión.
- Toqué `src/proxy.ts` y los layouts de docente y estudiante (T00) porque sus comentarios delegan en T01 la protección por rol; también `docente/clases/page.tsx` (ARQUITECTURA §5: T01 crea la clase). T02 puede ampliar esa página.
- `GET /api/clases` devuelve `Clase[]` como dice el contrato; el número de estudiantes sale de `GET /api/clases/:id/estudiantes` (una llamada por clase).
- Unirse usa el cliente admin: el estudiante no puede leer la clase por RLS antes de inscribirse, y no hay política de insert en `inscripciones` para que nadie se inscriba sin código.
- Usuarios de demo: `docente@demo.muselearn`, `camila@`, `luis@` y `sofia@demo.muselearn`; contraseña `Demo-Muse-2026` (cambiable con `DEMO_CONTRASENA`). Clase de demo `MAT4KQ`.

## Verificación
- lint, typecheck, build y 45 pruebas OK. En producción con mocks desactivados: rutas privadas sin sesión → `/es/login`, `/api/clases` → 401.
- NO probado contra Supabase real: registro, login, endpoints con datos, `rls.sql` y `seed-auth.ts` (no los ejecuté en el proyecto remoto).

## Bloqueos
- 

## Solicitudes al integrador
- Convertir `supabase/politicas/rls.sql` en la migración `0003_rls.sql` (es idempotente) y aplicarla. Hasta entonces las tablas tienen RLS activo sin políticas.
- Añadir en `package.json` el script `"seed:auth": "node --env-file=.env.local --experimental-strip-types supabase/seed-auth.ts"` y ejecutarlo una vez con las claves reales.
- En `messages/*/comun.json` ya existe `nav.salir`; el botón "Salir" (`BotonSalir`) está en los layouts. Si prefieres ponerlo dentro de `Navegacion`, hay que moverlo.
