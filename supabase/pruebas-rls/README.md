# Pruebas RLS locales

Ejecutar `npm run rls` con Node.js 22+ y los binarios de PostgreSQL instalados.
En Windows se busca por defecto `C:/Program Files/PostgreSQL/18/bin`;
en otros sistemas se usa PATH. Para otra instalación configurar `RLS_PG_BIN`
con la carpeta que contiene `initdb`, `pg_ctl` y `psql` (sin comillas internas).
En Unix, ejecutar como usuario normal: PostgreSQL no permite `initdb` como root.

No requiere dependencias npm nuevas, Docker, Supabase ni claves. No carga archivos
de entorno, elimina variables PG heredadas y no acepta URLs ni bases existentes.
Crea un clúster nuevo en la carpeta temporal del sistema y elige un puerto libre
en `127.0.0.1`. La autenticación trust se limita a este clúster de prueba local.
No usar en una máquina compartida con usuarios no confiables.

`preparar.sql` reproduce únicamente auth.uid(), roles, grants base y las tablas
mínimas de Storage requeridas por las migraciones. Las diez migraciones se aplican
íntegras, sin extraer fragmentos ni cambiar políticas. Los grants por defecto se
establecen antes de migrar, para respetar los REVOKE y permisos de columnas.

`casos.mjs` crea dos docentes, tres estudiantes y dos clases. Dos estudiantes
comparten clase para detectar filtraciones entre compañeros; el tercero está
en la otra clase. Los casos usan `SET LOCAL ROLE` y `request.jwt.claim.sub`
dentro de transacciones revertidas. Los controles positivos comprueban que
las tablas no estén simplemente vacías o completamente inaccesibles.
Solo SQLSTATE 42501 cuenta como rechazo esperado; otros errores hacen fallar el caso.
La salida muestra ✓/✗ y devuelve código 1 si falla un caso o la infraestructura.

Al terminar se detiene el servidor incluso si hay errores. Los archivos del clúster
se conservan en la ruta impresa para inspección. Solo contienen datos ficticios.
Esto prueba permisos SQL/RLS, no tokens JWT reales, endpoints ni el servicio Storage.
