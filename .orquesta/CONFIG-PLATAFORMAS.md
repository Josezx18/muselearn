# Configurar las 4 plataformas con Muse Spark

> Hacer el día 1 **solo si las reglas permiten** usar Claude Code, Codex y OpenCode.
> Datos de la guía oficial de Meta "Use Model API with coding agents" (dev.meta.ai/docs/coding-agents).
> Confirmar el ID del modelo vigente en dev.meta.ai/docs/models.

Clave en la terminal (no en archivos del repo):
```bash
export MODEL_API_KEY="tu-clave-de-meta"
export MUSE_MODELO="muse-spark-1.3"
```

## Reclamar créditos (guía oficial)
- **Meta ($150):** formulario "Model API Credit Claims" (enlace en la sección 5 de la guía). Los créditos llegan por tandas; revisar la página **Billing**.
  Para hacer llamadas **hay que agregar una tarjeta**; aparece un cargo temporal de preautorización que se libera solo en unos días hábiles.
  Configurar un **Spend Limit** de $150 en Billing para no pasarte.
  Plazo para reclamar: 4 nov, 9:00 PM ET.
- **Modal ($100):** hasta 1,000 equipos elegidos por caso de uso (no por orden de llegada). Requiere cuenta gratis en modal.com antes de llenar el formulario.
- **Baseten ($100 + 2M TPM): ✅ CONCEDIDOS (26 oct).** Modelo `meta-models/muse-spark-open-1026` (no el de la documentación). Crear la clave en el panel de Baseten. Es el proveedor del modelo abierto de la app. Reservar ~$30 para el juzgamiento (5-8 nov).
- **Fireworks ($25):** lista corta de equipos.
- Los enlaces de los formularios están en la guía del participante (sección 6).

## Presupuesto de créditos ($150)
| Uso | Reserva |
|---|---|
| La app (análisis, plan, tutor, verificación) + pruebas + demo | **$60 intocables** |
| Programar con Muse Code / Muse en otras plataformas | $90 |

- Revisar el gasto cada noche en el panel de la Model API y anotarlo en `PROGRESO.md`.
- Si el gasto de programación va rápido, usa Claude Code, Codex y OpenCode con tus suscripciones normales
  y deja Muse Code como la plataforma principal con Muse.
- **Nunca** el tier Contributor para la app (datos de estudiantes). Para programar con datos ficticios es aceptable
  si los créditos se agotan, pero tiene límite de 100 solicitudes por minuto.

## Respuestas oficiales del Discord (26 oct)
- Se permite **cualquier herramienta de programación** (OpenCode, Claude Code, Codex…), sin necesidad de declararla. Muse Code es opcional.
- Los modelos de Meta deben ser **parte real de lo que la app ejecuta** (se puntúa y se revisa en la etapa 1).
- Los modelos abiertos de Meta (incluido Llama) cuentan como modelos de Meta.

## Facturación de Muse Code
- **Pago por uso** con una clave de la Model API, o **suscripción mensual**, que solo funciona dentro del CLI de Muse Code:
  Everyday $5 (10-50 prompts cada 5 h) · High $15 (5x) · Power $50 (20x) · Maximum $200 (80x).
- La suscripción usa el modo **Contributor** por defecto (Meta entrena con el contenido). Para código con datos ficticios es aceptable.
- **Recomendación:** suscripción High ($15) para programar con Muse Code, y los $150 de créditos solo para la app.
  Confirmar en Billing si el pago por uso de Muse Code se descuenta de los créditos del hackathon.

## Muse Code (T03, T04)
```bash
curl -fsSL https://dev.meta.ai/install.sh | sh
cd ../muselearn-T03
muse --model muse-spark-1.3
```
Lee `AGENTS.md`, `CLAUDE.md` y las skills de `.claude/skills` automáticamente (al confiar en la carpeta).

## Claude Code con Muse (T01, T07) — opcional
```bash
bash scripts/muse-claude.sh
```
- URL sin `/v1` y `ANTHROPIC_AUTH_TOKEN` (no `ANTHROPIC_API_KEY`).
- Para usar Claude normal, simplemente ejecuta `claude`.

## Codex con Muse (T05) — opcional
`~/.codex/config.toml` (o en un `CODEX_HOME` aparte para no tocar tu configuración normal):
```toml
model = "muse-spark-1.3"
model_provider = "meta"
model_reasoning_effort = "high"
model_context_window = 1048576

[model_providers.meta]
name = "Meta Model API"
base_url = "https://api.meta.ai/v1"
env_key = "MODEL_API_KEY"
wire_api = "responses"
```
Si iniciaste sesión con OpenAI, ejecuta `/logout` dentro de Codex primero.

## OpenCode con Muse (T02, T06)
Opción rápida: dentro de OpenCode, `/connect` → Meta → pegar la clave → elegir Muse Spark.
Opción manual en `opencode.json` (usa el adaptador `@ai-sdk/openai`, que conserva el razonamiento entre turnos):
```json
{
  "provider": {
    "meta": {
      "name": "Meta Model API",
      "npm": "@ai-sdk/openai",
      "options": { "baseURL": "https://api.meta.ai/v1" },
      "models": {
        "muse-spark-1.3": {
          "name": "muse-spark-1.3",
          "reasoning": true,
          "options": {
            "reasoningEffort": "high",
            "include": ["reasoning.encrypted_content"]
          }
        }
      }
    }
  }
}
```

## Que la IA no aparezca como contribuidora en el repo público
Tres capas (las instala `scripts/instalar-kit.sh`):
1. **Claude Code:** `.claude/settings.json` tiene `"attribution": { "commit": "", "pr": "" }`.
2. **Todas las herramientas:** el hook de git `scripts/git-hooks/commit-msg` borra `Co-Authored-By` de IA, "Generated with…" y enlaces de sesión de cada commit, en todos los worktrees (`git config core.hooksPath scripts/git-hooks`).
3. **AGENTS.md** les prohíbe agregar esas líneas y cambiar la identidad de git.

Comprobar tras el primer commit: `git log -1 --format=%B` no debe mostrar co-autores, y en GitHub → Insights → Contributors solo debes aparecer tú.
Si una herramienta hace push por su cuenta con otra identidad, revisa `git log --format='%an <%ae>'`.

## Nombrar las sesiones
Cada terminal o pestaña lleva el nombre de su fila en `ESTADO.md` (`T03-motor-muse`, `T05-dashboard-codex`…).
Así sabes de un vistazo quién es quién, y el nombre coincide con la ficha y la rama.
