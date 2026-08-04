/**
 * `npm run set-password` — crea o restablece el acceso al panel.
 *
 * Se conecta a la base indicada en DATABASE_URL y fija la contraseña del
 * usuario dado. Si el usuario no existe, lo crea como propietario.
 *
 * Existe porque `migrate` sólo siembra el usuario la primera vez: una vez
 * creado, volver a migrar con otra contraseña no la cambia. Y hasta ahora no
 * había forma de recuperarla desde el panel.
 *
 *   npm run set-password -- tu@correo.com  TuContraseñaNueva
 */
import { all, one, run, closePool, hasConnectionString } from './db.js';
import { id, nowISO, hashPassword } from './lib/util.js';

const [, , emailArg, passArg] = process.argv;

const fail = (msg) => { console.error(`\n✗ ${msg}\n`); process.exit(1); };

if (!hasConnectionString()) {
  fail('Falta DATABASE_URL. Ponla en .env o pásala en el entorno:\n'
    + '  DATABASE_URL="postgresql://…" npm run set-password -- tu@correo.com MiClave');
}

const email = (emailArg || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = passArg || process.env.ADMIN_PASSWORD || '';

if (!email || !password) {
  fail('Uso:  npm run set-password -- tu@correo.com  TuContraseña');
}
if (password.length < 8) {
  fail('La contraseña debe tener al menos 8 caracteres.');
}

try {
  const existing = await one('SELECT id, email FROM users WHERE email = ?', [email]);

  if (existing) {
    await run('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(password), existing.id]);
    // Las sesiones abiertas dejan de valer: si la contraseña se cambia por
    // sospecha de filtración, dejarlas vivas anularía el propósito.
    await run('DELETE FROM sessions WHERE user_id = ?', [existing.id]);
    console.log(`\n✓ Contraseña actualizada para ${email}`);
    console.log('  Las sesiones abiertas se cerraron.');
  } else {
    await run('INSERT INTO users (id,email,name,role,password_hash,created_at) VALUES (?,?,?,?,?,?)',
      [id('usr'), email, email.split('@')[0], 'owner', hashPassword(password), nowISO()]);
    console.log(`\n✓ Usuario creado: ${email}`);
  }

  const users = await all('SELECT email, role FROM users ORDER BY created_at');
  console.log('\n  Usuarios en la base:');
  for (const u of users) console.log(`    ${u.email}  (${u.role})`);
  console.log();
} catch (err) {
  fail(`${err.message}${err.hint ? `\n  ${err.hint}` : ''}`);
} finally {
  await closePool().catch(() => {});
}
