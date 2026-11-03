# Paquete de documentación de MuseLearn

**Versión documental:** borrador 0.1 · **Base examinada:** repositorio local `D:\desarrollo\MuseLearn` · **Fecha de revisión:** 30 de octubre de 2026.

Esta carpeta reúne doce documentos elaborados a partir del código, las migraciones, los contratos y la documentación existente del repositorio. Describe el sistema tal como está diseñado/implementado; no sustituye una auditoría, pruebas nuevas ni revisión legal.

## Índice

1. [Visión y requisitos de producto (PRD)](01-vision-prd.md)
2. [Alcance del MVP](02-mvp.md)
3. [Especificación de requisitos de software (SRS)](03-srs.md)
4. [Casos de uso e historias de usuario](04-casos-de-uso.md)
5. [Arquitectura del sistema](05-arquitectura.md)
6. [Diagramas, incluidos nodos y despliegue](06-diagramas.md)
7. [Modelo y diccionario de datos](07-modelo-de-datos.md)
8. [Catálogo de API](08-api.md)
9. [Seguridad, privacidad y uso de IA](09-seguridad-privacidad-ia.md)
10. [Plan y evidencia de pruebas](10-pruebas.md)
11. [Instalación, configuración, despliegue y operación](11-operacion-despliegue.md)
12. [Guía de uso](12-guia-usuario.md)

## Cómo interpretar el estado

- **Implementado según el código**: se encontró una ruta, componente o servicio correspondiente; no implica que se probara en producción.
- **Evidencia documentada**: un archivo del repositorio registra un resultado de prueba; esta sesión no volvió a ejecutar la prueba.
- **Pendiente/no confirmado**: la documentación o el código señalan una comprobación externa pendiente o el estado del proveedor remoto no puede deducirse leyendo el repositorio.
- Los requisitos futuros y métricas objetivo se marcan como propuesta, no como comportamiento existente.

## Fuentes principales

`README.md`, `META.md`, `PROGRESO.md`, `AGENTS.md`, `.orquesta/ARQUITECTURA.md`, `.orquesta/contratos/{api.md,contratos.ts,esquema.sql}`, `.orquesta/ESTADO.md`, `.orquesta/ENSAYO.md`, `.orquesta/DEMO.md`, `.orquesta/tareas/`, `src/types/contratos.ts`, `src/app/api/`, `src/lib/`, `supabase/migrations/` y pruebas `src/**/*.test.ts` / `e2e/`.

## Límites y mantenimiento

La lectura fue estática: no se ejecutaron build, tests, migraciones, seeds, llamadas a proveedores ni despliegues. No se leyeron `.env.local` ni otros archivos de credenciales. Antes de usar estos documentos como evidencia de entrega, confirmar el commit de referencia, resolver el estado Git, ejecutar las comprobaciones correspondientes y verificar el Supabase/Vercel/Google configurados. Mantener la SRS, el catálogo de API, los diagramas y el diccionario alineados con cambios posteriores.
