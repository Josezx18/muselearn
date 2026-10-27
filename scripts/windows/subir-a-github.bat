@echo off
chcp 65001 >nul
title MuseLearn - subir a GitHub
pushd "%~dp0..\.."
echo Subiendo MuseLearn a GitHub (josezx18/muselearn) ...
git remote set-url origin https://github.com/josezx18/muselearn.git
git push -u origin main
if errorlevel 1 (
  echo.
  echo No se pudo subir. Revisa que el repo exista en GitHub, vacio y publico.
  pause
  popd
  exit /b 1
)
echo.
echo Listo: https://github.com/josezx18/muselearn
pause
popd
