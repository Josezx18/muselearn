@echo off
rem Oleada D: T19 arreglos del ensayo (Codex) y T20 rendimiento movil (OpenCode), modo automatico.
set "CODEX_FLAGS=--dangerously-bypass-approvals-and-sandbox"
set "OPENCODE_CONFIG_CONTENT={"$schema":"https://opencode.ai/config.json","permission":{"edit":"allow","webfetch":"allow","bash":{"*":"allow","git push*":"deny","git merge*":"deny","git reset --hard*":"deny","rm -rf*":"deny"}}}"
if "%~1"=="" (call "%~dp0arrancar-sesiones.bat" T19 T20) else (call "%~dp0arrancar-sesiones.bat" %*)
