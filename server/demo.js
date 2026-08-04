/**
 * `npm run demo` — levanta DropStudio en local sin configurar nada.
 *
 * Arranca un Postgres embebido en un puerto aparte, crea el esquema, siembra
 * datos de demostración y abre el servidor. Sirve para ver la plataforma
 * funcionando antes de tener Supabase.
 *
 * No toca el despliegue: en Vercel se usa DATABASE_URL y este archivo nunca
 * se ejecuta.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './config.js';

const PORT_PG = 55432;
const DATA_DIR = join(ROOT, '.demo-db');
const EMAIL = 'admin@dropstudio.co';
const PASSWORD = 'demo1234';

let EmbeddedPostgres;
try {
  ({ default: EmbeddedPostgres } = await import('embedded-postgres'));
} catch {
  console.error(`
  Falta la dependencia del Postgres de demostración.

    npm install --save-dev embedded-postgres

  (Sólo se usa en local; no entra en el despliegue.)
`);
  process.exit(1);
}

mkdirSync(DATA_DIR, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: 'postgres',
  password: 'postgres',
  port: PORT_PG,
  persistent: true,
});

const url = `postgresql://postgres:postgres@localhost:${PORT_PG}/dropstudio`;

console.log('→ Arrancando Postgres local…');
try {
  await pg.initialise();
} catch { /* ya estaba inicializado en una corrida anterior */ }
await pg.start();
await pg.createDatabase('dropstudio').catch(() => { /* ya existía */ });
console.log('  listo');

const env = {
  ...process.env,
  DATABASE_URL: url,
  ADMIN_EMAIL: EMAIL,
  ADMIN_PASSWORD: PASSWORD,
  SEED_DEMO: '1',
};

const runNode = (script) => new Promise((resolve, reject) => {
  const p = spawn(process.execPath, ['--no-warnings', join(ROOT, 'server', script)], { env, stdio: 'inherit' });
  p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${script} salió con código ${code}`))));
});

console.log('→ Preparando la base…');
await runNode('migrate.js');

console.log(`
  ╭──────────────────────────────────────────────────────────╮
  │  Modo demostración — todo corre en tu máquina            │
  ╰──────────────────────────────────────────────────────────╯

   Correo       ${EMAIL}
   Contraseña   ${PASSWORD}

   Ctrl+C para detener. Los datos quedan en .demo-db/
`);

const server = spawn(process.execPath, ['--no-warnings', join(ROOT, 'server', 'index.js')], { env, stdio: 'inherit' });

const shutdown = async () => {
  server.kill();
  await pg.stop().catch(() => {});
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
server.on('exit', shutdown);
