@echo off
rem Abre Codex en las fichas indicadas sin pedir permiso para cada comando.
rem Puede trabajar y ejecutar comandos dentro de su carpeta MuseLearn-TXX; no hace merge ni push (lo prohiben las fichas).
rem Uso: doble clic (T09 T10 T11)  o  codex-sin-preguntar.bat T13 T15
set "CODEX_FLAGS=--dangerously-bypass-approvals-and-sandbox"
if "%~1"=="" (call "%~dp0arrancar-sesiones.bat" T09 T10 T11) else (call "%~dp0arrancar-sesiones.bat" %*)
