/**
 * Migración: crea el esquema y siembra el estado inicial.
 *
 * Se corre UNA vez contra Supabase (`npm run migrate`), nunca en caliente:
 * en serverless ejecutar DDL en cada arranque en frío es un desperdicio y una
 * fuente de condiciones de carrera entre invocaciones concurrentes.
 */
import { createSchema, closePool } from './db.js';
import { ensureSeed } from './seed.js';

const run = async () => {
  console.log('→ Creando esquema…');
  await createSchema();
  console.log('  esquema listo');

  console.log('→ Sembrando estado inicial…');
  const seeded = await ensureSeed();
  console.log(seeded ? '  datos iniciales creados' : '  ya había datos, no se tocó nada');

  await closePool();
  console.log('\n✓ Migración completa.');
};

run().catch(async (err) => {
  console.error('\n✗ Falló la migración:', err.message);
  await closePool().catch(() => {});
  process.exit(1);
});
