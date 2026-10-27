#!/usr/bin/env bash
# Hook "Stop" de Claude Code: si la ficha de esta carpeta todavía tiene criterios sin marcar,
# no deja que Claude termine y le pide continuar. Respeta bloqueos reales y tiene un límite
# para no girar sin fin.
set -uo pipefail

dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$dir" || exit 0
cat > /dev/null   # consumir la entrada JSON del hook

[ -f .ficha-actual ] || exit 0          # sin ficha (p. ej. integrador): no intervenir
ficha="$(tr -d '[:space:]' < .ficha-actual)"
archivo="$(ls .orquesta/tareas/"$ficha"-*.md 2>/dev/null | head -n 1)"
[ -n "$archivo" ] || exit 0

pendientes="$(grep -c '^- \[ \]' "$archivo" || true)"

# ¿Hay un bloqueo real anotado? (una viñeta con texto en la sección "## Bloqueos")
bloqueos="$(awk '/^## Bloqueos/{s=1;next} /^## /{s=0} s && /^- *[^[:space:]]/' "$archivo" | wc -l | tr -d ' ')"

limite=25
contador_f=".orquesta-stop-count"
n="$(cat "$contador_f" 2>/dev/null || echo 0)"

if [ "$pendientes" -gt 0 ] && [ "$bloqueos" -eq 0 ] && [ "$n" -lt "$limite" ]; then
  echo $((n + 1)) > "$contador_f"
  printf '{"decision":"block","reason":"Quedan %s criterios sin marcar en %s. Sigue el ciclo de la skill muselearn-constructor: toma el siguiente criterio, impleméntalo, pruébalo, márcalo y haz commit. Si algo te bloquea de verdad, descríbelo en la sección Bloqueos de la ficha."}\n' "$pendientes" "$archivo"
  exit 0
fi

rm -f "$contador_f"
exit 0
