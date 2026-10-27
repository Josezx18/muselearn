#!/usr/bin/env bash
# Bucle autónomo para cualquier plataforma (modo sin interfaz).
# Repite la instrucción hasta que la ficha no tenga criterios pendientes, haya un bloqueo o se llegue al límite.
# Usar SOLO dentro de una carpeta de worktree (nunca en main).
#
# Uso:  bash scripts/bucle-autonomo.sh claude|codex|opencode|muse [max_vueltas]
set -uo pipefail

plataforma="${1:?Indica la plataforma: claude, codex, opencode o muse}"
max="${2:-12}"
ficha="$(tr -d '[:space:]' < .ficha-actual)"
archivo="$(ls .orquesta/tareas/"$ficha"-*.md | head -n 1)"

PROMPT="Usa la skill muselearn-constructor. Tu ficha es $ficha ($archivo). \
Trabaja de forma autónoma: toma los criterios pendientes en orden, impleméntalos, pruébalos, \
márcalos [x], actualiza PROGRESO.md y haz commit de cada uno. No preguntes si continuar. \
Detente solo si todo está [x] o hay un bloqueo real anotado en la ficha."

# Comandos sin interfaz de cada CLI. Verifica las banderas con --help el día 1.
case "$plataforma" in
  claude)   cmd=(claude -p "$PROMPT" --permission-mode acceptEdits) ;;
  codex)    cmd=(codex exec --full-auto "$PROMPT") ;;
  opencode) cmd=(opencode run "$PROMPT") ;;
  muse)     cmd=(${MUSE_CMD:-muse -p} "$PROMPT") ;;   # VERIFICAR: modo sin interfaz de Muse Code
  *) echo "Plataforma desconocida: $plataforma"; exit 1 ;;
esac

for ((i = 1; i <= max; i++)); do
  pendientes="$(grep -c '^- \[ \]' "$archivo" || true)"
  bloqueos="$(awk '/^## Bloqueos/{s=1;next} /^## /{s=0} s && /^- *[^[:space:]]/' "$archivo" | wc -l | tr -d ' ')"
  if [ "$pendientes" -eq 0 ]; then echo "✅ $ficha: no quedan criterios pendientes."; exit 0; fi
  if [ "$bloqueos" -gt 0 ]; then echo "🟨 $ficha: hay un bloqueo anotado en la ficha. Revísalo."; exit 2; fi
  echo "=== Vuelta $i/$max — $ficha — $pendientes pendientes ==="
  "${cmd[@]}" || echo "La vuelta $i terminó con error; se reintenta."
done
echo "Se alcanzó el límite de $max vueltas. Revisa el avance de $ficha."
