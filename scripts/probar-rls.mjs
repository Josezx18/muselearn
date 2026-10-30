// Solo clúster efímero en loopback. No lee .env ni acepta conexiones externas.
import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdtempSync, openSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { casos, datos } from '../supabase/pruebas-rls/casos.mjs';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const windows = process.platform === 'win32';
const bin = process.env.RLS_PG_BIN ?? (windows ? 'C:/Program Files/PostgreSQL/18/bin' : '');
const exe = (name) => bin ? join(bin, `${name}${windows ? '.exe' : ''}`) : name;
const carpeta = mkdtempSync(join(tmpdir(), 'muselearn-t18-'));
// Excluye PGHOST/PGSERVICE/PGOPTIONS y credenciales heredadas.
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^PG/i.test(k)));
env.PGCLIENTENCODING = 'UTF8';
function comando(name, args, input) {
  // En Windows el servidor hereda las tuberías de pg_ctl y bloquea spawnSync.
  if (name === 'pg_ctl') {
    const archivo = join(carpeta, 'pg-ctl.log');
    const fd = openSync(archivo, 'a');
    try {
      const r = spawnSync(exe(name), args, { stdio: ['ignore', fd, fd], env, timeout: 30000, windowsHide: true });
      if (r.error) throw r.error;
      return { ...r, stdout: readFileSync(archivo, 'utf8'), stderr: '' };
    } finally { closeSync(fd); }
  }
  const r = spawnSync(exe(name), args, { input, encoding: 'utf8', env, timeout: 120000, windowsHide: true });
  if (r.error) throw r.error;
  return r;
}
function exigir(r) {
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || `Proceso terminado: ${r.status}`);
  return r.stdout.trim();
}
const puerto = await new Promise((ok, fail) => {
  const server = createServer();
  server.once('error', fail);
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    server.close((error) => error ? fail(error) : ok(port));
  });
});
let iniciado = false;
let fallos = 0;
const sql = (input) => comando('psql', ['-X', '-h', '127.0.0.1', '-p', String(puerto), '-U', 'rls_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-Atq'], input);
try {
  exigir(comando('initdb', ['-D', carpeta, '-U', 'rls_admin', '--auth=trust', '--encoding=UTF8', '--locale=C']));
  iniciado = true;
  exigir(comando('pg_ctl', ['-D', carpeta, '-l', join(carpeta, 'servidor.log'), '-o', `-p ${puerto} -h 127.0.0.1`, '-w', 'start']));
  exigir(sql(readFileSync(resolve(raiz, 'supabase/pruebas-rls/preparar.sql'), 'utf8')));
  const migraciones = readdirSync(resolve(raiz, 'supabase/migrations')).filter((f) => /^00(0[1-9]|10)_.*\.sql$/.test(f)).sort();
  if (migraciones.length !== 10) throw new Error('Se esperan exactamente las migraciones 0001–0010');
  for (const archivo of migraciones) exigir(sql(readFileSync(resolve(raiz, 'supabase/migrations', archivo), 'utf8')));
  exigir(sql(datos));
  console.log(`PostgreSQL local: 10 migraciones completas; ${casos.length} casos aislados con ROLLBACK.`);
  const resultados = [];
  for (const caso of casos) {
    const r = sql(`BEGIN; SET LOCAL ROLE ${caso.rol ?? 'authenticated'}; SET LOCAL request.jwt.claim.sub = '${caso.usuario ?? ''}';\n${caso.sql}\nROLLBACK;`);
    // Solo 42501 (privilegios/RLS) cuenta como rechazo, nunca errores de sintaxis o constraints.
    const denegado = r.status !== 0 && /42501/.test(r.stderr);
    const correcto = caso.denegado ? denegado : r.status === 0 && r.stdout.trim() === String(caso.esperado);
    resultados.push({ resultado: correcto ? '✓' : '✗', caso: caso.nombre });
    if (!correcto) {
      fallos++;
      console.error(`${caso.nombre}: esperado ${caso.denegado ? 'SQLSTATE 42501' : caso.esperado}; recibido ${r.stdout.trim()} ${r.stderr.trim()}`);
    }
  }
  console.table(resultados);
  console.log(`${casos.length - fallos}/${casos.length} correctos; ${fallos} fallos.`);
  process.exitCode = fallos ? 1 : 0;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (iniciado) {
    const r = comando('pg_ctl', ['-D', carpeta, '-m', 'fast', '-w', 'stop']);
    if (r.status !== 0) { console.error(r.stderr); process.exitCode = 1; }
  }
  if (existsSync(carpeta)) console.log(`Clúster temporal detenido, conservado para inspección: ${carpeta}`);
}
