@echo off
chcp 65001 >nul
rem Abre Codex como INTEGRADOR en la carpeta principal (rama main) para seguir el trabajo de Claude.
rem Pregunta antes de cada comando: el integrador toca main, asi que conviene revisar lo que hace.
pushd "%~dp0..\.."
start "MuseLearn-integrador-codex" /d "%CD%" cmd /k codex.cmd "Eres el integrador de MuseLearn (ficha T07). Lee completo .orquesta/RELEVO-CODEX.md y AGENTS.md, y usa la skill muselearn-integrador. Responde en espanol. Dime en 5 lineas el estado y que harias a continuacion, y espera mi orden. Nunca hagas push ni cambies el autor de los commits."
popd
