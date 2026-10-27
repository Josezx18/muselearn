---
name: muselearn-constructor
description: Cómo trabajar una ficha de MuseLearn (T01-T06) de forma autónoma sin chocar con otras sesiones. Úsala al iniciar o retomar trabajo en cualquier ficha que no sea la T07 integrador.
---

# Constructor de MuseLearn

Eres una sesión que construye UNA pieza del proyecto. Otras sesiones (otras plataformas de IA)
construyen las demás piezas al mismo tiempo, en otras carpetas y ramas.

## Al empezar o retomar
1. Lee `.ficha-actual` → ficha asignada (p. ej. `T05`).
2. Lee, en este orden: `AGENTS.md`, tu ficha `.orquesta/tareas/<ficha>*.md`, `.orquesta/ARQUITECTURA.md`,
   `.orquesta/contratos/` (tipos, API, esquema) y los prompts que tu ficha mencione.
3. Lee `PROGRESO.md` y tu fila en `.orquesta/ESTADO.md`. Pon tu estado en 🟦 trabajando.
4. Ejecuta `git log --oneline -15` para ver qué se hizo antes en tu rama.
5. Si `main` tiene integraciones nuevas, haz `git rebase main` (o merge de main) antes de seguir.

## Ciclo de trabajo
Repite hasta que todos los criterios de tu ficha estén en `[x]`:
1. Elige el primer criterio `[ ]` que no dependa de algo inexistente.
   Si depende de otra pieza, usa el mock de `src/lib/mocks/` y sigue.
2. Implementa solo dentro de las carpetas de **"Puedes tocar"**.
3. Prueba: `npm run lint && npm run typecheck && npm test`. Para la UI, abre la página y revísala a 380 px y en escritorio.
4. Marca el criterio `[x]` en tu ficha.
5. Agrega una línea a la bitácora de `PROGRESO.md`: `- fecha [Txx] qué hiciste`.
6. Commit: `Txx: descripción corta`.

## Cuando algo no está en tus manos
- Falta algo de un archivo congelado o de otra pieza → anótalo en "Solicitudes al integrador" de tu ficha, usa un mock y continúa.
- Duda que no bloquea → decide lo más razonable y anótalo en "Decisiones".
- Bloqueo real (no puedes avanzar en ningún criterio) → descríbelo en "Bloqueos", pon tu estado en 🟨 y termina.

## Al terminar la ficha
1. Todos los criterios `[x]` y las pruebas pasando.
2. Revisa tu trabajo como un usuario exigente: anota hasta 3 mejoras en "Mejoras propuestas" de `PROGRESO.md` (no las implementes si salen de tu alcance).
3. Pon tu estado en 🟩 lista para integrar en `ESTADO.md`.
4. Último commit y `git push` de tu rama. No hagas merge a main.
