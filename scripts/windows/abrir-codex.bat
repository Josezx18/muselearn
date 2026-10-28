@echo off
rem Abre solo las sesiones de Codex (T04 y T05). No toca T02.
call "%~dp0arrancar-sesiones.bat" T04 T05
