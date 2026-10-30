"""Compatibilidad con el comando anterior; la fuente unica ahora son los mocks."""
from pathlib import Path
import subprocess

subprocess.run(["node", "supabase/demo/generar.mjs"], cwd=Path(__file__).resolve().parents[2], check=True)
