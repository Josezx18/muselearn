# Revisión de integración T20

Integrador: T07. Rama revisada: `t20-rendimiento`, commits `33e1e1c` y `dbbee50`. Datos exclusivamente ficticios; sin migraciones nuevas ni cambios de políticas RLS.

## Correcciones durante la integración

- Carga SSR con sesión y RLS, validación Zod y propagación de errores de Supabase. Tarea inexistente responde 404; un plan ausente se calcula mediante el endpoint ya existente tras hidratar.
- El envío actualiza el estado de la entrega y bloquea un segundo envío. En mocks se recuperan devoluciones/correcciones guardadas en el navegador.
- Fechas y horas de Hoy, Semana y Tarea coherentes con el offset del centro; referencia inicial común entre servidor y cliente.
- El mapa se monta al seleccionar su pestaña. General y Por estudiante mantienen su estado; RepasoIA permanece dentro de General.
- `PLAYWRIGHT_PORT` permite comprobar un worktree sin reutilizar por accidente otro servidor. La integración se prueba en 3020, mientras el servidor ajeno de T20 en 3000 se conserva.

## Pruebas funcionales

La suite completa con mocks cubrió 166 casos: 156 correctos, ocho omitidos (dos por Google desactivado y seis Lighthouse que se miden con configuración dedicada) y dos fallos de la nueva prueba UTC al cambiar de idioma. Estos últimos detectaron la advertencia previa de React sobre el script de tema, no diferencias de fechas.

La prueba UTC se acotó a su objetivo: confirmar la hidratación abriendo la campana, sin navegar entre idiomas. Los dos casos corregidos pasaron por separado en escritorio y celular. La advertencia previa del script al cambiar de idioma sigue documentada en ENSAYO.md; no se filtraron mensajes de consola para ocultarla.

Después de diferir el mapa, se repitieron las 16 pruebas afectadas de panel, pestañas, mapa, accesibilidad a 360 px, guion completo, repaso y comentarios: todas correctas. La suite completa previa ya incluía las 64 pruebas de accesibilidad y seis de navegación semanal, correctas.

La carga de datos se prueba con dobles de Supabase para sesión ausente, rol incorrecto, errores de DB, JSON inválido, ausencia de plan y tarea inexistente; no acredita acceso autenticado real a producción. Cámara, micrófono físico, habla humana y ruido del aula siguen pendientes del ensayo de José.

## Lighthouse

Aceptación final: Hoy **93**, Tarea **90** y Comprensión **96** de mediana; accesibilidad **100 en todas las muestras**. Lint, typecheck, **245 pruebas unitarias** (10 omitidas) y build de producción correctos.

El [resumen con todas las muestras](lighthouse.json) distingue las corridas individuales de diagnóstico y las mediciones de aceptación. Se utiliza build+start local con mocks, Chrome instalado, móvil 360×640 y CPU ×4. La prueba no mide `next dev`.

La mediana de cinco muestras por página se compara con 85; todas las muestras de accesibilidad deben dar 100. Se mantienen las muestras por debajo del umbral. Metodología: [guía oficial de variabilidad de Lighthouse](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md). Los datos históricos T14 fueron medidos con otra ejecución y no constituyen un experimento controlado en la misma carga de CPU.

Reproducir sin otro build/dev activo en la carpeta principal:

```powershell
$env:CHROME_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
npm.cmd exec -- playwright test --config=playwright.lighthouse.config.ts
```

En esta máquina, SWC requiere una caché nativa segura; se usó `SWC_NATIVE_BINDING_CACHE=C:/Users/Josex/swc-cache`. No se cambian permisos globales ni se distribuye esa caché con la app.
