# Validación local de T15

`node supabase/demo/generar.mjs` genera el SQL y los JSON desde los mocks y valida
los objetos con los contratos Zod. No se conecta a servicios.

La prueba de repetibilidad usa exclusivamente PostgreSQL en `127.0.0.1:55415`,
usuario `demo`, y crea una base nueva con nombre `muselearn_t15_<timestamp>`.
Nunca lee `.env.local`. No necesita Supabase ni sus claves.

Con PostgreSQL 18 disponible, inicializa un clúster temporal separado:

```powershell
$demoPg = Join-Path $env:TEMP 'muselearn-t15-postgres'
& 'C:/Program Files/PostgreSQL/18/bin/initdb.exe' -D $demoPg -U demo --auth=trust --encoding=UTF8 --locale=C
& 'C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe' -D $demoPg -l (Join-Path $demoPg 'servidor.log') -o '-p 55415 -h 127.0.0.1' start
node supabase/demo/probar-local.mjs 'C:/Program Files/PostgreSQL/18/bin/psql.exe'
& 'C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe' -D $demoPg stop
```

Usa una carpeta temporal nueva si ya existe el clúster. No apuntes estos comandos
a un clúster existente. La base se conserva para inspección.

La prueba reconstruye las tablas desde las migraciones, añade las columnas de
modalidad y crea un docente/clase centinela ficticios ajenos al dominio demo.
Ejecuta el SQL dos veces y compara todas las filas (excepto marcas de auditoría).
Comprueba ocho tareas, 24 inscripciones, tres informes de nivel global bajo y una
devolución. La prueba unitaria del panel comprueba cuatro estudiantes en
«Necesitan apoyo» (Camila también tiene un concepto bajo).
Luego provoca colisiones de cuenta y de clase: el SQL debe rechazar ambas sin
alterar ninguna fila. Esto verifica datos e idempotencia, no Auth ni RLS de Supabase.

Resultado del 29 de octubre: correcto en PostgreSQL 18 local. No se ejecutó ningún
seed contra Supabase ni producción.
