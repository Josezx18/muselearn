@echo off
rem Oleada B: T13 y T15 (Codex) primero; T12 y T14 (OpenCode) cuando T09 y T11 esten en main.
rem Uso: doble clic abre las cuatro; o  oleada-B-T12-T15.bat T13 T15
if "%~1"=="" (call "%~dp0arrancar-sesiones.bat" T12 T13 T14 T15) else (call "%~dp0arrancar-sesiones.bat" %*)
