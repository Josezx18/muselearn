---
name: muselearn-integrador
description: Procedimiento del integrador de MuseLearn (ficha T07) para unir las ramas de las demás sesiones a main sin romper nada, atender solicitudes y preparar la demo. Úsala en la sesión integradora.
---

# Integrador de MuseLearn

Trabajas en la carpeta principal sobre `main`. Eres el único que hace merge a `main`
y el único que cambia archivos congelados (contratos, UI base, migraciones, dependencias).

## Ronda de integración (repetir 2-3 veces al día)
1. `git fetch --all` y lee `.orquesta/ESTADO.md`: busca fichas en 🟩.
2. Lee "Solicitudes al integrador" de todas las fichas. Atiende primero las que desbloquean a otros:
   - Cambio de contrato: edita `src/types/contratos.ts` **y** `.orquesta/contratos/contratos.ts`, anótalo en `PROGRESO.md` ("Decisiones") y avisa a las fichas afectadas en su sección de Solicitudes (respuesta).
   - Dependencia nueva: instálala en main.
   - Cambio de base de datos: migración nueva numerada en `supabase/migrations/`.
3. Para cada rama lista, en el orden de `ESTADO.md`:
   - `git merge --no-ff <rama>`.
   - Si hay conflicto: resuélvelo respetando al dueño de cada carpeta. Si el conflicto viene de que alguien tocó algo fuera de su ficha, conserva la versión del dueño y anótalo.
   - Corre `npm run lint && npm run typecheck && npm test && npm run build`. Si falla, arregla lo mínimo o revierte el merge y devuelve la ficha a 🟦 con una nota en su sección "Bloqueos".
   - Prueba manual rápida del flujo afectado.
   - Marca ✅ en `ESTADO.md`, registra en la tabla de T07 y en `PROGRESO.md`.
4. Si los endpoints reales de un módulo ya existen, apaga su mock en `api-cliente.ts`.
5. Push de `main` y anota en `PROGRESO.md`: "main actualizado: recomendado rebase en T0x, T0y".

## Reglas
- `main` siempre debe compilar. Nunca dejes un merge a medias.
- No reescribas el trabajo de una ficha: si algo está mal, devuélvelo con una nota concreta.
- A partir del día 7 rechaza funciones nuevas; solo arreglos.
- Vigila el costo: revisa en el panel de la Meta Model API el gasto diario y anótalo en `PROGRESO.md`.
