# Cierre del hackathon (30 oct → 4 nov 2026): qué hace José y qué hace Codex

Integrador: Claude mientras tenga uso; si no, **Codex** con `scripts\windows\codex-integrador.bat`
(lee `.orquesta/RELEVO-CODEX.md`). Programación: **Codex** (datos, API, IA) y **OpenCode** (UI, textos).
Reglas de siempre: autor José, sin atribución de IA, secretos solo en `.env.local`/Vercel, OK de José antes de cada push.

## Calendario
| Día | José | Codex / OpenCode |
|---|---|---|
| 30 oct | Cargar la demo (paso 1) y hacer el ensayo real (paso 2). Escribir los fallos en `.orquesta/ENSAYO.md`. | — |
| 31 oct | Lanzar `oleada-D-T19-T20.bat`. | T19 arregla lo del ensayo; T20 rendimiento móvil. |
| 1 nov | "T19 listo" / "T20 listo" al integrador. Configurar Google (paso 4, opcional). | Integrador revisa, integra y pide OK para publicar. |
| 2 nov | Segundo ensayo corto en la app publicada. | Solo arreglos pequeños. |
| 3 nov | **Congelar.** Grabar el video (paso 3). | Nada nuevo; solo errores graves. |
| 4 nov | Entregar (paso 5). | — |

## Paso 1 — Cargar los datos de demo (José, 10 min)
Los datos son ficticios (`@muselearn.demo`) y el seed solo crea o actualiza esas cuentas; no toca a usuarios reales.
Como solo tenemos un proyecto de Supabase, la demo vive en la misma base que la app publicada: es una decisión
tuya (las cuentas demo ya existen ahí desde el 28 oct).
1. En `.env.local` agrega `DEMO_CONTRASENA=` con una clave de 12+ caracteres que solo tú sepas (no la compartas).
2. Doble clic en `scripts\windows\cargar-demo.bat` → crea/actualiza las cuentas y la clase demo.
3. Supabase → SQL Editor → pega el contenido de `supabase/seed-demo.sql` → Run.
4. Entra a https://muselearn-five.vercel.app como el docente demo y como Camila (correos en
   `supabase/demo/cuentas.json`, contraseña la tuya) y comprueba que se ve la clase con 12 estudiantes.

## Paso 2 — Ensayo real (José, 30-45 min, en el celular y en la PC)
Sigue `.orquesta/DEMO.md` de principio a fin con IA real. Anota en `.orquesta/ENSAYO.md` (crea el archivo)
cada problema con: pantalla, qué hiciste, qué esperabas, qué pasó, captura si puedes. Revisa en especial:
- Foto de un cuaderno real → ¿Muse lee los pasos? Verificación por voz → ¿transcribe bien en el aula?
- Conversación por voz con la mascota; voz elegida en Configuración.
- Docente: crear tarea con IA, devolver con nota, borrador de comentario, sugerir repaso, CSV.
- Campana de avisos; tarea "se entrega en Classroom" con evidencia.
- Tiempos: ¿algo tarda más de 10 s? (anótalo).

## Paso 3 — Video (José, 3 nov)
- Guion: `.orquesta/DEMO.md` (≈ 3 min, español con subtítulos en inglés o al revés).
- Graba en la app publicada con las cuentas demo. Celular para la parte del estudiante, PC para el docente.
- Frase clave: "entregó vs. demostró comprensión". Cierra con privacidad (sin Contributor, datos ficticios).

## Paso 4 — Configuración opcional (José)
- Google: Supabase → Authentication → Providers → Google (Client ID/Secret); URI de Google Cloud
  `https://bxlqcrzmzgkixjbudris.supabase.co/auth/v1/callback`; Supabase → URL Configuration: Site URL
  `https://muselearn-five.vercel.app` y Redirect `https://muselearn-five.vercel.app/api/auth/callback**`;
  Vercel: `NEXT_PUBLIC_ENTRAR_CON_GOOGLE=true` y Redeploy.
- Textos legales: que alguien del liceo revise `/privacidad` y `/terminos`.

## Paso 5 — Entrega (4 nov)
Formulario del hackathon: enlace a la app, repo público https://github.com/Josezx18/muselearn, video,
publicación en X (`docs/PUBLICACION-X.md`), modelos de Meta usados (tabla del README).

## Para Codex integrador (si Claude no está)
1. Cuando exista `.orquesta/ENSAYO.md`, copia cada fallo como criterio `- [ ]` en
   `.orquesta/tareas/T19-arreglos-ensayo.md` (sección "Fallos del ensayo"), separando los de UI (anótalos para
   OpenCode en T20 si son visuales) de los de datos/API/IA (T19). Commit, y dile a José que lance
   `scripts\windows\oleada-D-T19-T20.bat`.
2. Revisa e integra como dice `RELEVO-CODEX.md` §4. Antes de publicar: lint, typecheck, test, build y
   `npm run e2e` con `NEXT_PUBLIC_USAR_MOCKS=true`. Si hay migración nueva, José la aplica en SQL Editor primero.
3. Desde el 3 nov solo arreglos de errores graves, cada uno en un commit pequeño, con OK de José para publicar.
4. Anota todo en la bitácora de `RELEVO-CODEX.md` §7.
