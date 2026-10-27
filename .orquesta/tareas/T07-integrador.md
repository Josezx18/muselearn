# T07 — Integrador

| Campo | Valor |
|---|---|
| Plataforma | Claude Code (sesión fija, en la carpeta principal `muselearn/` sobre `main`) |
| Oleada | continuo desde el día 2 |
| Puedes tocar | todo, con cuidado; dueño de los archivos congelados |
| Skill | `muselearn-integrador` |

## Objetivo
Que `main` siempre compile y funcione, y que al final exista una demo desplegada y estable.

## Criterios de aceptación
- [ ] Cada rama terminada se integra a `main` una por una, con lint, typecheck, test y build pasando.
- [ ] Atender "Solicitudes al integrador" de todas las fichas al menos 2 veces al día.
- [x] Convertir `supabase/politicas/rls.sql` de T01 en migración y aplicarla.
- [ ] Al integrar, avisar a las demás ramas: anotar en `PROGRESO.md` "rebase desde main recomendado".
- [ ] Apagar mocks módulo por módulo a medida que existen los endpoints reales.
- [ ] Seed de demo `supabase/seed-demo.ts`: 1 docente, 1 clase, 5 estudiantes ficticios, 6 tareas de distintas materias (incluida Tecnología), entregas y 3 verificaciones completadas con niveles variados para que el mapa de calor se vea interesante.
- [ ] Prueba e2e Playwright del flujo de demo completo (docente crea tarea → estudiante ve plan → tutor → entrega → verificación por texto → informe → panel docente).
- [ ] Despliegue en Vercel con variables de entorno; URL pública funcionando.
- [ ] Revisión final de seguridad: RLS, secretos, tier de modelo, borrado de audios.
- [ ] Mantener `.orquesta/ESTADO.md` al día.

## Registro de integraciones
| Fecha | Rama | Resultado | Notas |
|---|---|---|---|
| 27 oct | t01-auth-clases | ✅ | sin conflictos; RLS → migración 0003 aplicada; script `seed:auth` agregado |
| 27 oct | t03-motor-ia | ✅ | conflicto solo en PROGRESO.md; `ZONA_OFFSET_MIN` en .env.example; 0004 quita EXECUTE de anon a funciones RLS |
