# T19 — Arreglos del ensayo real

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t19-ensayo` / `../MuseLearn-T19` |
| Empieza | cuando `.orquesta/ENSAYO.md` tenga los fallos y el integrador los haya copiado abajo |
| Puedes tocar | lo necesario para cada fallo **excepto** `supabase/migrations/` (si hace falta una, escríbela como `00XX_*.sql` y anótala en Solicitudes: la aplica José), `src/components/ui/` y estilos globales (eso es de T20) |
| No toques | datos reales; nunca pruebes contra producción con cuentas reales |

## Objetivo
Que el recorrido de `.orquesta/DEMO.md` funcione sin tropiezos con IA real, en celular y en PC.

## Fallos del ensayo (los copia el integrador desde `.orquesta/ENSAYO.md`)
- [ ] (pendiente)

## Criterios generales
- [ ] Cada fallo tiene su arreglo y, si se puede, una prueba que lo reproduce (unitaria o e2e con mocks).
- [ ] Si un fallo depende de la IA (respuesta lenta, JSON inválido, transcripción), mejora el manejo: mensajes
      claros, reintento, tiempo de espera; nunca dejes al usuario sin saber qué pasó.
- [ ] `npm run lint && npm run typecheck && npm test` y `npm run e2e` (con `NEXT_PUBLIC_USAR_MOCKS=true`) pasan.

## Reglas
- Lee `AGENTS.md`. Prefijo `T19:`. Sin atribución de IA. Sin merge ni push.

## Solicitudes al integrador
## Decisiones
## Bloqueos
- 2026-10-30 [T07, actualización]: ensayo automatizado completado (150 e2e correctas/2 omitidas; tutor/evaluación y analizador con IA real correctos), sin fallos funcionales confirmados. ENSAYO.md ya contiene resultados; siguen pendientes cámara/micrófono físicos y persistencia autenticada. No hay criterios de reparación concretos que implementar todavía.
- 2026-10-30 [T07]: pendiente el ensayo real de José. `.orquesta/ENSAYO.md` contiene solo una plantilla; no hay fallos observados que convertir en criterios. Su mera existencia no habilita el inicio de T19.
