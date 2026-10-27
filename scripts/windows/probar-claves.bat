@echo off
chcp 65001 >nul
title MuseLearn - probar claves
pushd "%~dp0..\.."
echo Probando las claves de .env.local (no se muestran las claves) ...
echo.
(
  echo ===== npm run prueba:ia =====
  call npm run prueba:ia
  echo.
  echo ===== npm run seed:auth =====
  call npm run seed:auth
) > prueba-claves.log 2>&1
type prueba-claves.log
echo.
echo Resultado guardado en prueba-claves.log. Ya puedes cerrar esta ventana.
pause
popd
