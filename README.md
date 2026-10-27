# MuseLearn — Kit de arranque para el hackathon

Este kit contiene **solo planificación y herramientas de coordinación**, no código del producto.
Sirve para que 5 sesiones de IA (Claude Code, Codex, OpenCode y Muse Code) construyan la app
al mismo tiempo sin chocar.

## Qué hay dentro
| Archivo | Para qué |
|---|---|
| `AGENTS.md` | Reglas que siguen todos los agentes (CLAUDE.md apunta aquí) |
| `META.md` | Qué significa "terminado" para el hackathon |
| `PROGRESO.md` | Bitácora compartida: hecho, pendiente, decisiones |
| `.orquesta/ARQUITECTURA.md` | El diseño completo: módulos, carpetas y dueños |
| `.orquesta/contratos/` | Las "bisagras": tipos (Zod), API y base de datos |
| `.orquesta/prompts/` | Los prompts de los agentes de la app (analizador, planificador, tutor, verificador, ruta) |
| `.orquesta/tareas/` | Una ficha por pieza (T00-T08) con criterios de aceptación |
| `.orquesta/ESTADO.md` | Tablero de sesiones |
| `.orquesta/PLAN-10-DIAS.md` | Calendario del 26 oct al 4 nov |
| `.orquesta/DEMO.md` | Guion del video |
| `.orquesta/RUBRICA-Y-PREMIOS.md` | Rúbrica oficial, premios extra y cómo apuntar a cada uno |
| `.orquesta/CONFIG-PLATAFORMAS.md` | Cómo poner Muse Spark en las 4 plataformas y presupuesto de créditos |
| `.agents/skills/` | Skills `muselearn-constructor` e `muselearn-integrador` |
| `.claude/settings.json` + `scripts/hooks/` | Hook que no deja a Claude Code detenerse con criterios pendientes |
| `scripts/` | Instalar el kit, crear worktrees, bucle autónomo, Claude Code con Muse |

## Antes del lunes 26
- [ ] Instalar: Git, Node.js LTS, Claude Code, Codex, OpenCode y Muse Code. En Windows, usar **WSL** o Git Bash para los scripts.
- [ ] Crear cuentas: GitHub (repo privado `muselearn`), Supabase (proyecto nuevo), Vercel.
- [ ] Copiar este kit a la carpeta `muselearn` y ejecutar `bash scripts/instalar-kit.sh`.
- [ ] Leer `.orquesta/ARQUITECTURA.md` y las fichas. Cambiar lo que no te convenza **ahora**, no a mitad del evento.

## Día 0 (lunes 26) — sin código
1. **12:00 PM:** ver el kickoff. Entrar al Discord y hacer las preguntas de `.orquesta/PLAN-10-DIAS.md`.
2. Pedir créditos de Modal y Baseten (cupos limitados). Reclamar los de Meta cuando salga el enlace, agregar tarjeta y límite de gasto.
3. Crear `MODEL_API_KEY`.

## Día 1 (martes 27) — empieza el periodo de construcción
1. Crear el repo **público** en GitHub. Copiar `.env.example` a `.env.local` y llenarlo (nunca se sube).
2. Abrir Claude Code en la carpeta principal y pegar:
   > Ejecuta la ficha T00 de `.orquesta/tareas/T00-esqueleto.md` siguiendo `AGENTS.md`. Trabaja de forma autónoma hasta que todos los criterios estén [x], haz commit y push a main.
3. Cuando T00 termine: `bash scripts/crear-worktrees.sh` → crea 5 carpetas, una por ficha.

## Arrancar cada sesión
En cada carpeta `../muselearn-T0x`, abre la plataforma de su ficha y pega el **prompt de arranque**:

> Usa la skill muselearn-constructor. Tu ficha está en `.ficha-actual`. Trabaja de forma autónoma
> hasta completar todos los criterios de tu ficha, sin preguntarme si continuar.

| Carpeta | Plataforma | Comando |
|---|---|---|
| `muselearn-T01` | Claude Code | `claude` (el hook la mantiene trabajando) |
| `muselearn-T02` | OpenCode | `opencode` |
| `muselearn-T03` | Claude Code | `claude` |
| `muselearn-T04` | Claude Code (o Muse Code) | `claude` |
| `muselearn-T05` | Codex | `codex` |
| `muselearn` (principal) | Claude Code | integrador: "Usa la skill muselearn-integrador y haz una ronda de integración." |

¿Una plataforma se detiene antes de tiempo? Ciérrala y usa el bucle sin interfaz desde esa carpeta:
`bash scripts/bucle-autonomo.sh codex` (o `opencode`, `muse`, `claude`).

## Tu rol como director
- 2-3 veces al día: mira `.orquesta/ESTADO.md` y las secciones "Bloqueos" y "Solicitudes" de cada ficha.
- Pide al integrador una ronda de integración.
- Prueba la app tú mismo como docente y como estudiante. Lo que no te guste, escríbelo en la ficha correspondiente como criterio nuevo `- [ ]`.
- Revisa el gasto de créditos cada noche.

## Reglas oficiales que afectan el plan
- **Trabajo nuevo:** solo cuenta lo construido del 27 oct al 4 nov, y los jueces deben poder identificarlo. El historial de git lo demuestra.
- **Repo público** y **video de 3 minutos**.
- **Anti-proyectos:** la guía descarta los chatbots educativos simples. Presenta MuseLearn como un sistema de agentes (ver ARQUITECTURA §1).

## Según lo que respondan en el Discord
- **No se permiten otras herramientas:** todas las fichas se hacen con Muse Code, en las mismas carpetas y con las mismas fichas.
- **No se permite "Muse" en el nombre:** cambiar `src/config/marca.ts` y los textos de `messages/`.
- **No se acepta planificación previa en el repo:** dejar `.orquesta/` fuera del repo público y declararlo en el README.
