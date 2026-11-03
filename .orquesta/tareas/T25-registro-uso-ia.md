# T25 — Registro del uso de la IA por proveedor (Baseten, Meta, NVIDIA)

| Campo | Valor |
|---|---|
| Plataforma | Codex |
| Rama / carpeta | `t25-uso-ia` / `../MuseLearn-T25` |
| Puedes tocar | `src/lib/ia/cliente.ts` (solo para registrar, sin cambiar rutas ni prompts), `src/lib/ia/cliente.test.ts`, `src/lib/ia/registro-uso.ts` (nuevo), `src/lib/ia/precios.ts` (nuevo), `src/lib/db/uso-ia.ts` (nuevo), `supabase/migrations/0016_uso_ia.sql` (nuevo), página nueva `src/app/[locale]/docente/uso-ia/page.tsx` y sus componentes en `src/components/uso-ia/`, `messages/{es,en}/uso-ia.json` (nuevo; regístralo en `src/i18n/espacios.ts`), `src/components/cuenta/MenuUsuario.tsx` (solo el enlace para admin), `.env.example` (solo las variables nuevas), `README.md` (solo una sección "Uso de la IA") |
| No toques | prompts, `RUTAS`, `ESFUERZO_POR_DEFECTO`, contratos existentes, otras migraciones (la 0015 ya existe: `revisiones_ia`), `package.json` |

## Contexto
José recibió una clave de Baseten de otra persona: no puede ver el panel de uso ni el saldo de los $100. Hoy la app
solo escribe en los registros de Vercel (`console.info("[ia] ...")`), que duran muy poco. Necesita saber, sin depender
de nadie, cuánto ha gastado en cada proveedor y si la app de verdad está usando Baseten o está cayendo en Meta.

## Criterios de aceptación
- [ ] **Migración `0016_uso_ia.sql`**: tabla `uso_ia` con `id`, `creado_en`, `funcion` (las de `FuncionIA` + `voz`),
      `proveedor` (`meta` | `abierto` | `nvidia`), `modelo`, `tokens_entrada`, `tokens_salida` (pueden ser null),
      `audio_ms` (solo voz), `stream` (bool), `ok` (bool), `error` (texto corto, máx. 300 caracteres, null si ok),
      `usuario_id` (null permitido). Índice por `creado_en` y por `(proveedor, creado_en)`. RLS activado y
      `revoke all ... from anon, authenticated` (igual que `uso_ia_docente`): solo el cliente admin la lee y escribe.
      Idempotente (`if not exists`). **No la apliques**: la aplica el integrador.
- [ ] **Registro** en `cliente.ts` para cada intento: éxito y fallo, en `llamarMuse`, `llamarMuseStream` y en la
      transcripción de voz. El registro **nunca** bloquea ni hace fallar la respuesta: se hace sin `await` (o con
      `after()` donde haya petición) y con `catch`; si la tabla no existe (`42P01` / `PGRST205`) solo se avisa una vez
      en el registro, como en `limites.ts`. Inyectable para pruebas (como `fabrica`), sin tocar Supabase en los tests.
- [ ] **Tokens en streaming**: pedir `stream_options: { include_usage: true }` y leer el `usage` del último trozo.
      Si el proveedor no lo devuelve, guardar null (no inventar cifras).
- [ ] Quien llama puede pasar `usuarioId` opcional en `OpcionesLlamada`; donde ya se conoce el usuario (tutor,
      verificación, IA del docente) pásalo. Donde no, queda null.
- [ ] **Precios** en `src/lib/ia/precios.ts`: costo por millón de tokens de entrada y de salida por proveedor, leídos
      de variables de entorno (`PRECIO_META_ENTRADA`, `PRECIO_META_SALIDA`, `PRECIO_ABIERTO_ENTRADA`,
      `PRECIO_ABIERTO_SALIDA`, `PRECIO_NVIDIA_ENTRADA`, `PRECIO_NVIDIA_SALIDA`). Sin precio configurado se muestran
      solo los tokens y "costo no configurado", nunca un número inventado. Agrégalas comentadas a `.env.example`.
- [ ] **Página `/docente/uso-ia`** visible solo para correos en `ADMIN_CORREOS` (lista separada por comas; si no
      está, la página da 404). Muestra, con filtro Hoy / 7 días / 30 días / Todo:
      - Tarjetas por proveedor: llamadas, llamadas fallidas, tokens de entrada y salida, costo estimado.
      - Para Baseten: "Créditos usados ≈ $X de $Y" con `CREDITO_ABIERTO_USD` (por defecto 100) y una barra.
      - Tabla por función (analizar, planificar, tutor, verificar…) y proveedor.
      - Gráfico de barras simple por día (sin dependencias nuevas; SVG o CSS).
      - Últimos 20 fallos con proveedor, función, hora y error, para ver si Baseten está fallando y la app cae en Meta.
      - Aviso claro: "Es una estimación hecha por MuseLearn; el saldo real lo ve el dueño de la clave."
      Enlace a la página en el menú de usuario solo si el correo es admin. Español e inglés.
- [ ] Pruebas: `cliente.test.ts` comprueba que se registra éxito, fallo con respaldo (fallo en `abierto` + éxito en
      `meta` = 2 registros), stream con y sin `usage`, y que un error al registrar no rompe la llamada. Prueba del
      cálculo de costo con y sin precios. Las pruebas existentes de `cliente.test.ts` siguen pasando.
- [ ] README: sección corta "Uso de la IA" con cómo activar la página (`ADMIN_CORREOS`, precios, crédito) y una
      consulta SQL de respaldo para ver el gasto desde el editor de Supabase.
- [ ] `npm run lint && npm run typecheck && npm test` pasan.

## Reglas
- Lee `AGENTS.md`. Prefijo `T25:`. Sin atribución de IA. Sin merge ni push. Sin dependencias nuevas.
- No guardes nunca el contenido de los mensajes, prompts ni respuestas en `uso_ia`: solo cifras y metadatos.

## Solicitudes al integrador
- Aplicar `0016_uso_ia.sql` en Supabase.
- En Vercel: `ADMIN_CORREOS` con el correo de José y, si los tiene, los precios por proveedor.

## Decisiones
## Bloqueos
