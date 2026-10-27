# PROGRESO.md — Bitácora compartida

Cada sesión agrega líneas al final de su sección. No borres lo de otros.
Formato: `- AAAA-MM-DD HH:MM [Txx] qué se hizo / qué falta / decisión tomada`

## Hecho
- 2026-10-27 T00 — esqueleto, contratos, Supabase, cliente IA, mocks, UI base y rutas. Build, lint, typecheck y 25 pruebas OK.

## Pendiente (en orden)
1. José: claves en `.env.local` + `npm run prueba:ia`; crear repo público y hacer push
2. Oleada 1 en paralelo: T01, T02, T03, T04, T05
3. Oleada 2: T06
4. T07 integración continua + despliegue
5. T08 demo y entregables

## Mejoras propuestas (por los agentes; el integrador decide)
- (vacío)

## Decisiones tomadas
- 2026-10-24 Stack: Next.js + Supabase + Meta Model API. Interfaz español + inglés. Nombre de trabajo: MuseLearn.
- 2026-10-26 Herramientas: Claude Code (T00, T01, T03, T04, T07), Codex (T05), OpenCode (T02, T06). Los $150 de Meta API solo para la app.
- 2026-10-26 Modelo abierto: Muse Spark Open en Baseten ($100 concedidos). NVIDIA Glimmer como respaldo opcional.
- 2026-10-26 Discord: se permite cualquier herramienta de programación sin declararla; Muse Code es opcional.

## Bitácora
- 2026-10-27 [T00] Proyecto creado (Next 16.4). Supabase `muselearn` con migraciones 0001 y 0002. Pendiente de José: claves reales y push a GitHub.
