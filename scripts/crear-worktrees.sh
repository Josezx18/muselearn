#!/usr/bin/env bash
# Crea una carpeta de trabajo (git worktree) y una rama por ficha, al lado del repo principal.
# Ejecutar DESPUÉS de que T00 esté terminada y subida a main.
# Uso:  bash scripts/crear-worktrees.sh            (oleada 1: T01 T02 T03 T04 T05)
#       bash scripts/crear-worktrees.sh T06        (fichas concretas)
set -euo pipefail

raiz="$(git rev-parse --show-toplevel)"
cd "$raiz"
padre="$(dirname "$raiz")"   # las carpetas de cada ficha quedan al lado del repo
nombre_repo="$(basename "$raiz")"

# ficha|rama|plataforma
declare -A RAMA=(
  [T01]="t01-auth-clases"     [T02]="t02-tareas"
  [T03]="t03-motor-ia"        [T04]="t04-tutor-verificacion"
  [T05]="t05-dashboard"       [T06]="t06-informes"
)
declare -A PLATAFORMA=(
  [T01]="claude"   [T02]="opencode"
  [T03]="claude"   [T04]="codex"
  [T05]="codex"    [T06]="opencode"
)

if [ "$#" -gt 0 ]; then fichas=("$@"); else fichas=(T01 T02 T03 T04 T05); fi

for f in "${fichas[@]}"; do
  rama="${RAMA[$f]:-}"
  if [ -z "$rama" ]; then echo "Ficha desconocida: $f"; continue; fi
  dir="$padre/${nombre_repo}-$f"

  if [ -d "$dir" ]; then
    echo "Ya existe $dir (se deja igual)."
  elif git show-ref --verify --quiet "refs/heads/$rama"; then
    git worktree add "$dir" "$rama"
  else
    git worktree add -b "$rama" "$dir" main
  fi

  echo "$f" > "$dir/.ficha-actual"
  [ -f "$raiz/.env.local" ] && cp "$raiz/.env.local" "$dir/.env.local"

  echo "----------------------------------------------------------------"
  echo "$f  →  $dir"
  echo "    rama: $rama   plataforma: ${PLATAFORMA[$f]}"
  echo "    cd \"$dir\" && npm install"
done

echo
echo "Abre una terminal por carpeta, nómbrala como la ficha (p. ej. T03-motor-muse)"
echo "y pega el prompt de .orquesta/PROMPT-SESION.txt."
