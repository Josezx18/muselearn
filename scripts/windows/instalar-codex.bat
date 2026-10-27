@echo off
chcp 65001 >nul
title MuseLearn - instalar Codex en consola
echo Instalando Codex CLI (npm install -g @openai/codex) ...
call npm install -g @openai/codex
if errorlevel 1 (echo No se pudo instalar Codex CLI. & pause & exit /b 1)
echo.
call codex --version
echo.
echo Ahora inicia sesion con tu cuenta de ChatGPT (la misma de la app de Codex).
echo Se abrira el navegador: elige "Sign in with ChatGPT".
call codex login
echo.
call codex login status
echo.
echo Listo. Ya puedes ejecutar oleada-2.bat.
pause
