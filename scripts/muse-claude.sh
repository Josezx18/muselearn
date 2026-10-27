#!/usr/bin/env bash
# Abre Claude Code usando Muse Spark (Meta Model API) en lugar de los modelos de Anthropic.
# Requiere: export MODEL_API_KEY="tu-clave-de-meta"
# Uso:  bash scripts/muse-claude.sh   (o agrega la función a tu ~/.bashrc / ~/.zshrc)
# Fuente: guía "Use Model API with coding agents" (dev.meta.ai/docs/coding-agents). Confirmar el ID del modelo el día 1.
: "${MODEL_API_KEY:?Falta MODEL_API_KEY}"
MODELO="${MUSE_MODELO:-muse-spark-1.3}"

ANTHROPIC_BASE_URL="https://api.meta.ai" \
ANTHROPIC_AUTH_TOKEN="$MODEL_API_KEY" \
ANTHROPIC_MODEL="$MODELO" \
ANTHROPIC_DEFAULT_OPUS_MODEL="$MODELO" \
ANTHROPIC_DEFAULT_SONNET_MODEL="$MODELO" \
ANTHROPIC_DEFAULT_HAIKU_MODEL="$MODELO" \
CLAUDE_CODE_SUBAGENT_MODEL="$MODELO" \
ENABLE_TOOL_SEARCH="true" \
exec claude "$@"
