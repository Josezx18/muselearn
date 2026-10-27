# T06 — Informe de comprensión, ruta de práctica y panel docente

| Campo | Valor |
|---|---|
| Plataforma | OpenCode (segunda sesión, después de terminar T02) |
| Rama / carpeta | `t06-informes` / `../muselearn-T06` |
| Oleada | 2 (puede empezar con mocks cuando T02 esté hecha) |
| Depende de | T00; usa `InformeComprension` producido por T04 (mock mientras tanto) |
| Puedes tocar | `src/lib/ia/informes/`, `src/app/api/informes/`, `src/app/api/docente/comprension/`, `src/app/[locale]/estudiante/informe/`, `src/app/[locale]/docente/comprension/`, `src/components/informes/`, `src/components/docente/`, `src/lib/mocks/informes.ts`, `messages/*/informes.json`, `messages/*/docente.json` |
| Contratos | `InformeComprension`, `RutaPractica`, `MapaComprension`; prompt 05 |

## Objetivo
Cerrar el ciclo: el estudiante sabe qué mejorar y el docente sabe quién entendió.

## Criterios de aceptación
- [ ] `generarRuta(informe, tarea)` según prompt 05, validada con Zod; guarda en `informes.ruta`.
- [ ] Página `/estudiante/informe/[id]`: nivel global, nivel por concepto con evidencia, fortalezas, debilidades, resumen en tono amable y ruta de práctica como lista de pasos marcables.
- [ ] Los pasos de la ruta se pueden "Agregar a mi semana" (crea bloques; coordinar con T03 vía `POST /api/ia/plan`).
- [ ] Panel docente `/docente/comprension`: selector de clase y tarea, **mapa de calor** estudiante × concepto (colores por nivel 1-4, gris si no hay dato), lista "conceptos a reforzar" y detalle por estudiante con `resumen_docente`.
- [ ] Indicadores: % que entregó vs. % que demostró comprensión (nivel ≥ 3). Esta comparación es la frase clave del pitch.
- [ ] Endpoint `GET /api/docente/comprension` calcula el `MapaComprension` con consultas a la base (sin IA).
- [ ] Textos en es y en. Funciona en celular (el mapa de calor se desplaza dentro de su propio contenedor).

## Decisiones
- 

## Bloqueos
- 

## Solicitudes al integrador
- 
