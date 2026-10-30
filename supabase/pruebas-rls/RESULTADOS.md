# Ejecución del 29 de octubre de 2026

- Entorno: PostgreSQL 18.4, Windows, Node.js; clúster temporal nuevo en loopback.
- Diez migraciones completas, 0001–0010, sin modificaciones.
- `npm run rls`: **211/214 correctos, 3 fallos, código de salida 1**.
- Fallan únicamente los casos «no traslada entrega a tarea de clase ajena» de
  los estudiantes ficticios 3, 4 y 5: UPDATE se acepta cuando debería rechazarse.
- H01 y propuesta de migración documentados en
  [la ficha T18](../../.orquesta/tareas/T18-pruebas-rls.md).
- Los demás casos incluyen lecturas propias/ajenas, protección de rol y términos,
  permisos de comentarios y calificaciones, RPC restringida, avisos, datos privados,
  vínculos Classroom y anonimato. Clúster detenido al terminar.
- Controles del repositorio: lint y typecheck correctos; 228 pruebas unitarias
  correctas, 10 omitidas.

Los fallos se mantienen visibles. Esta batería no certifica todavía la seguridad
de las políticas; debe repetirse después de corregir H01 desde la integración.
