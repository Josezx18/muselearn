#!/usr/bin/env bash
# Prepara la carpeta del proyecto MuseLearn con el kit de planificación.
# Uso: desde la carpeta raíz del repo (donde está este kit copiado):  bash scripts/instalar-kit.sh
set -euo pipefail

raiz="$(cd "$(dirname "$0")/.." && pwd)"
cd "$raiz"

# 1. Repositorio git
if [ ! -d .git ]; then
  git init -b main
  echo "Repositorio git creado."
fi

es_windows=false
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) es_windows=true ;; esac

# 2. CLAUDE.md importa AGENTS.md (Claude Code lee CLAUDE.md; los demás leen AGENTS.md).
#    Se usa un import en vez de un enlace para que funcione igual en Windows.
if [ ! -e CLAUDE.md ]; then
  printf '@AGENTS.md\n' > CLAUDE.md
  echo "CLAUDE.md -> importa AGENTS.md"
fi

# 3. Skills visibles para Claude Code (.claude/skills) y Codex/OpenCode/Muse (.agents/skills)
mkdir -p .claude
if [ ! -e .claude/skills ]; then
  if $es_windows; then
    cp -r .agents/skills .claude/skills
    echo ".claude/skills copiado de .agents/skills (en Windows: si editas una skill, edítala en ambas carpetas)"
  else
    ln -s ../.agents/skills .claude/skills
    echo ".claude/skills -> ../.agents/skills"
  fi
fi

# 4. Hooks ejecutables
chmod +x scripts/*.sh scripts/hooks/*.sh scripts/git-hooks/*

# 5. Hook de git que quita los co-autores de IA de cada commit (vale para todos los worktrees)
git config core.hooksPath scripts/git-hooks
echo "Hook commit-msg activo: los commits no tendrán co-autores de IA."

# 6. Tu identidad de git: tú eres el autor de todos los commits
if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
  echo "⚠️  Configura tu identidad (usa el correo de tu cuenta de GitHub):"
  echo '    git config --global user.name "José Enrique Ulloa"'
  echo '    git config --global user.email "tu-correo-de-github"'
else
  echo "Autor de los commits: $(git config user.name) <$(git config user.email)>"
fi

# 7. .gitignore mínimo
touch .gitignore
for linea in ".env*" "!.env.example" ".ficha-actual" ".orquesta-stop-count" "node_modules/" ".next/"; do
  grep -qxF "$linea" .gitignore || echo "$linea" >> .gitignore
done

git add -A
git commit -m "Kit de planificación MuseLearn" >/dev/null 2>&1 || true
echo "Listo. Kit instalado y primer commit hecho en main."
