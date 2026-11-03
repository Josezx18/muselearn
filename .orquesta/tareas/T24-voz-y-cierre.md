# T24 — Onda de voz y botón "Terminar" al final de la verificación

| Campo | Valor |
|---|---|
| Plataforma | OpenCode |
| Rama / carpeta | `t24-voz-cierre` / `../MuseLearn-T24` |
| Puedes tocar | `src/components/verificacion/voz.tsx`, `src/components/tutor/ModoConversacion.tsx` (solo la visualización del micrófono), componente nuevo `src/components/verificacion/OndaVoz.tsx`, `src/components/informes/Informe.tsx`, `messages/{es,en}/verificacion.json`, `messages/{es,en}/informes.json`, `messages/{es,en}/tutor.json`, `e2e/voz.spec.ts`, `e2e/cierre-verificacion.spec.ts` (nuevo) |
| No toques | API, IA, migraciones, contratos, `src/components/ui/`, `package.json` |

## Contexto (ensayo de José, 3 nov)
- Al grabar, el nivel del micrófono sale como porcentaje y una barra `<meter>`. Quiere una **onda** que se mueva con
  la voz, como en ChatGPT o Claude.
- Al terminar la verificación el informe muestra fortalezas, ruta de práctica y "Agregar a mi agenda", pero no hay
  un botón para **terminar** y salir de la tarea sin agregar práctica.

## Criterios de aceptación
- [ ] `OndaVoz`: barras animadas (p. ej. 24-40 barras redondeadas) que siguen la intensidad del micrófono con el
      `AnalyserNode` que ya existe en `voz.tsx` (`requestAnimationFrame` o canvas), colores de la marca, suave.
      Se quita el porcentaje visible; se conserva un texto accesible (`aria-live` discreto o `aria-label` del estado:
      "Grabando…", "No se oye nada, habla más cerca"). Respeta `prefers-reduced-motion` (barras estáticas que solo
      cambian de altura sin animación continua o un indicador simple).
- [ ] La misma onda en el modo conversación del tutor si allí se muestra el nivel del micrófono.
- [ ] En el informe del estudiante, junto a "Agregar a mi agenda", un botón **"Terminar"** (primario si ya agregó o
      no hay ruta; secundario si hay ruta sin agregar) que lleva a `/estudiante/hoy` con un aviso "¡Tarea
      completada!". No borra nada ni agrega práctica.
- [ ] `e2e/voz.spec.ts` ajustado (ya no busca el porcentaje) y `e2e/cierre-verificacion.spec.ts` (mocks): terminar
      la verificación y volver a Hoy. Escritorio y celular. `e2e/accesibilidad.spec.ts` sigue pasando.
- [ ] `npm run lint && npm run typecheck && npm test` pasan.

## Reglas
- Lee `AGENTS.md`. Prefijo `T24:`. Sin atribución de IA. Sin merge ni push. Sin dependencias nuevas.

## Solicitudes al integrador
## Decisiones
## Bloqueos
