@echo off
rem Oleada C (Codex, automatico): T16 como funciona y README, T17 mocks y deudas, T18 pruebas RLS.
set "CODEX_FLAGS=--dangerously-bypass-approvals-and-sandbox"
if "%~1"=="" (call "%~dp0arrancar-sesiones.bat" T16 T17 T18) else (call "%~dp0arrancar-sesiones.bat" %*)
