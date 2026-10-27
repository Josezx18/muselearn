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
- [ ] Registro con correo y contraseña, eligiendo rol (docente o estudiante) y nombre; crea fila en `perfiles`.
- [ ] Inicio y cierre de sesión; redirección según rol a `/docente` o `/estudiante/hoy`.
- [ ] Rutas protegidas por rol en el middleware.
- [ ] Docente: formulario "Nueva clase" (nombre, materia, grado) → genera código único de 6 caracteres (sin O/0/I/1).
- [ ] Docente: lista de sus clases con código copiable y número de estudiantes.
- [ ] Estudiante: pantalla "Unirme a una clase" con el código; error claro si no existe.
- [ ] Endpoints `POST/GET /api/clases`, `POST /api/clases/unirse`, `GET /api/clases/:id/estudiantes`.
- [ ] Políticas RLS completas para `perfiles`, `clases`, `inscripciones` y lectura de `tareas` por inscritos, en `supabase/politicas/rls.sql`.
- [ ] Usuarios de demo: `docente@demo.muselearn` y 3 estudiantes (datos ficticios) en `supabase/seed-auth.ts`.
- [ ] Textos en es y en. Pruebas: generador de códigos y validación de unión.

## Decisiones
- 

## Bloqueos
- 

## Solicitudes al integrador
- 
