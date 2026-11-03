@echo off
rem Oleada E: T21 revision de entregas y T22 ficha del estudiante (Codex); T23 Mis clases y T24 voz y cierre (OpenCode). Modo automatico.
set "CODEX_FLAGS=--dangerously-bypass-approvals-and-sandbox"
set "OPENCODE_CONFIG_CONTENT={"$schema":"https://opencode.ai/config.json","permission":{"edit":"allow","webfetch":"allow","bash":{"*":"allow","git push*":"deny","git merge*":"deny","git reset --hard*":"deny","rm -rf*":"deny"}}}"
if "%~1"=="" (call "%~dp0arrancar-sesiones.bat" T21 T22 T23 T24) else (call "%~dp0arrancar-sesiones.bat" %*)
