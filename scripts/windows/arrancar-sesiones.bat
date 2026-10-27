@echo off
chcp 65001 >nul
setlocal
title MuseLearn - preparar sesiones
rem Prepara las carpetas de las fichas y abre Claude Code en cada una.
rem Uso: doble clic, o:  scripts\windows\arrancar-sesiones.bat T01 T03
set "RAIZ=%~dp0..\.."
pushd "%RAIZ%" || goto :error
set "RAIZ=%CD%"
set "PROMPT_FICHA=Usa la skill muselearn-constructor. Tu ficha esta en .ficha-actual. Trabaja de forma autonoma hasta completar todos los criterios de tu ficha, sin preguntarme si continuar."

echo.
echo === 1/5 Comprobando herramientas ===
where git >nul 2>nul
if errorlevel 1 (echo Falta Git for Windows: instalalo desde https://git-scm.com y vuelve a ejecutar. & goto :error)
where npm >nul 2>nul
if errorlevel 1 (echo Falta Node.js LTS: instalalo desde https://nodejs.org y vuelve a ejecutar. & goto :error)
where claude >nul 2>nul
if errorlevel 1 (
  echo Claude Code no esta instalado. Instalando desde claude.ai ...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://claude.ai/install.ps1 | iex"
)
set "PATH=%USERPROFILE%\.local\bin;%PATH%"
where claude >nul 2>nul
if errorlevel 1 (echo No se encontro claude despues de instalar. Cierra esta ventana, abre una nueva y repite. & goto :error)

echo.
echo === 2/5 npm install en el proyecto principal ===
call npm install --no-audit --no-fund
if errorlevel 1 goto :error

set "FICHAS=%*"
if "%FICHAS%"=="" set "FICHAS=T01 T03"

echo.
echo === 3/5 y 4/5 Carpetas de trabajo: %FICHAS% ===
for %%F in (%FICHAS%) do call :ficha %%F
if errorlevel 1 goto :error

echo.
echo === 5/5 Abriendo Claude Code en cada carpeta ===
for %%F in (%FICHAS%) do call :abrir %%F

echo.
echo Listo. En cada ventana nueva: inicia sesion si lo pide y acepta "confiar en esta carpeta".
echo Cuando pida permiso para npm o git, elige "permitir siempre".
pause
popd
exit /b 0

:ficha
set "F=%~1"
set "RAMA="
if /i "%F%"=="T01" set "RAMA=t01-auth-clases"
if /i "%F%"=="T02" set "RAMA=t02-tareas"
if /i "%F%"=="T03" set "RAMA=t03-motor-ia"
if /i "%F%"=="T04" set "RAMA=t04-tutor-verificacion"
if /i "%F%"=="T05" set "RAMA=t05-dashboard"
if /i "%F%"=="T06" set "RAMA=t06-informes"
if "%RAMA%"=="" (echo Ficha desconocida: %F% & exit /b 1)
set "DIR=%RAIZ%-%F%"
if exist "%DIR%" (
  echo %F%: la carpeta ya existe, se reutiliza.
) else (
  git show-ref --verify --quiet refs/heads/%RAMA%
  if errorlevel 1 (git worktree add -b %RAMA% "%DIR%" main) else (git worktree add "%DIR%" %RAMA%)
  if errorlevel 1 exit /b 1
)
>"%DIR%\.ficha-actual" echo %F%
if exist "%RAIZ%\.env.local" copy /y "%RAIZ%\.env.local" "%DIR%\.env.local" >nul
echo %F%: npm install en %DIR% ...
pushd "%DIR%"
call npm install --no-audit --no-fund
set "ERR=%errorlevel%"
popd
exit /b %ERR%

:abrir
set "F=%~1"
set "DIR=%RAIZ%-%F%"
set "TITULO=%F%-claude"
if /i "%F%"=="T01" set "TITULO=T01-auth-claude"
if /i "%F%"=="T03" set "TITULO=T03-motor-claude"
if /i "%F%"=="T04" set "TITULO=T04-tutor-claude"
start "%TITULO%" /d "%DIR%" cmd /k claude --permission-mode acceptEdits "%PROMPT_FICHA%"
exit /b 0

:error
echo.
echo *** Algo fallo. Lee el mensaje de arriba y avisa a Claude. ***
pause
popd
exit /b 1
