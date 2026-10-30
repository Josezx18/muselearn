@echo off
rem Oleada B en modo automatico: T13 y T15 (Codex), T12 y T14 (OpenCode). No piden permiso en cada comando.
rem Codex: sin aprobaciones ni zona aislada. OpenCode: todo permitido excepto git push, git merge, reset --hard y rm -rf.
rem T12 y T14 empiezan cuando T09 y T11 esten en main.  Uso: doble clic (las cuatro) o  oleada-B-T12-T15.bat T13 T15
set "CODEX_FLAGS=--dangerously-bypass-approvals-and-sandbox"
set "OPENCODE_CONFIG_CONTENT={"$schema":"https://opencode.ai/config.json","permission":{"edit":"allow","webfetch":"allow","bash":{"*":"allow","git push*":"deny","git merge*":"deny","git reset --hard*":"deny","rm -rf*":"deny"}}}"
if "%~1"=="" (call "%~dp0arrancar-sesiones.bat" T12 T13 T14 T15) else (call "%~dp0arrancar-sesiones.bat" %*)
