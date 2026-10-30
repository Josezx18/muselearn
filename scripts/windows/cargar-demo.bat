@echo off
chcp 65001 >nul
title MuseLearn - cargar cuentas demo
rem Crea o actualiza SOLO las cuentas ficticias @muselearn.demo y la clase demo (usa .env.local).
rem Necesita DEMO_CONTRASENA (12+ caracteres) en .env.local. Despues: pegar supabase\seed-demo.sql en el SQL Editor.
pushd "%~dp0..\.."
findstr /b /c:"DEMO_CONTRASENA=" .env.local >nul || (echo Falta DEMO_CONTRASENA en .env.local & pause & popd & exit /b 1)
call npm run seed:auth
if errorlevel 1 (echo No se pudo cargar la demo. & pause & popd & exit /b 1)
echo.
echo Listo. Ahora abre Supabase - SQL Editor, pega supabase\seed-demo.sql y pulsa Run.
pause
popd
