@echo off
rem Oleada F: T25 registro del uso de la IA por proveedor (Codex), modo automatico.
set "CODEX_FLAGS=--dangerously-bypass-approvals-and-sandbox"
if "%~1"=="" (call "%~dp0arrancar-sesiones.bat" T25) else (call "%~dp0arrancar-sesiones.bat" %*)
