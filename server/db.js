import pg from 'pg';

/**
 * Capa de datos — Postgres (Supabase).
 *
 * Los helpers conservan la firma que tenían con SQLite (`all` / `one` / `run` /
 * `insert` / `update`) para que los módulos de API no cambien de forma; lo único
 * que cambia es que ahora devuelven promesas.
 *
 * Dos decisiones que reducen la superficie de la migración:
 *
 *  1. Los marcadores siguen siendo `?`. `toPg()` los traduce a `$1, $2, …`
 *     antes de enviar la consulta, así que ninguna llamada tuvo que reescribirse.
 *  2. Las fechas se guardan como TEXT en ISO 8601. Ordenan y comparan
 *     lexicográficamente igual que cronológicamente, así que los `substr()`,
 *     los `BETWEEN` y los `GROUP BY` de analítica siguen funcionando idénticos.
 */

const { Pool } = pg;

/**
 * Por defecto node-postgres devuelve bigint (COUNT) y numeric (SUM) como
 * strings para no perder precisión. Aquí todos los valores son enteros de
 * pesos y conteos muy por debajo del entero seguro de JS, así que se parsean
 * a número: sin esto, cualquier `a + b` sobre un SUM concatenaría texto.
 */
pg.types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));    // int8 / bigint
pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));    // numeric

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'Falta DATABASE_URL. Cópiala desde Supabase → Project Settings → Database → '
    + 'Connection string → Transaction pooler (puerto 6543) y ponla en .env o en '
    + 'las variables de entorno de Vercel.'
  );
}

/**
 * En serverless cada invocación puede levantar su propia instancia, así que el
 * pool se mantiene mínimo y se reutiliza entre invocaciones vía globalThis.
 * Con el pooler de Supabase (6543, modo transaction) esto evita agotar
 * conexiones cuando Vercel escala.
 */
export const pool = globalThis.__dsPool ?? new Pool({
  connectionString,
  max: process.env.VERCEL ? 1 : 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});
globalThis.__dsPool = pool;

/** Traduce los `?` de SQLite a los `$n` que espera Postgres. */
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/* ── Helpers de consulta ─────────────────────────────────────────────── */

export async function all(sql, params = []) {
  const res = await pool.query(toPg(sql), params);
  return res.rows;
}

export async function one(sql, params = []) {
  const res = await pool.query(toPg(sql), params);
  return res.rows[0] ?? null;
}

/** Devuelve `{ changes }` para conservar la interfaz que tenía SQLite. */
export async function run(sql, params = []) {
  const res = await pool.query(toPg(sql), params);
  return { changes: res.rowCount ?? 0 };
}

/** INSERT genérico a partir de un objeto plano. */
export async function insert(table, data) {
  const keys = Object.keys(data);
  const cols = keys.join(', ');
  const marks = keys.map((_, i) => `$${i + 1}`).join(', ');
  await pool.query(`INSERT INTO ${table} (${cols}) VALUES (${marks})`, keys.map((k) => data[k]));
  return data;
}

/** UPDATE genérico por id, ignorando claves no permitidas. */
export async function update(table, id, data, allowed) {
  const keys = Object.keys(data).filter((k) => allowed.includes(k));
  if (!keys.length) return 0;
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const res = await pool.query(
    `UPDATE ${table} SET ${sets} WHERE id = $${keys.length + 1}`,
    [...keys.map((k) => data[k]), id]
  );
  return res.rowCount ?? 0;
}

/** Ejecuta varias sentencias dentro de una transacción. */
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/* ── Ajustes ─────────────────────────────────────────────────────────── */

export async function getSetting(key, fallback = null) {
  const row = await one('SELECT value FROM settings WHERE key = ?', [key]);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

export async function setSetting(key, value) {
  await run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, JSON.stringify(value)]
  );
}

/* ── Esquema ─────────────────────────────────────────────────────────── */

/**
 * Crea el esquema si no existe. Se ejecuta desde `npm run migrate`, nunca en
 * caliente: en serverless correr DDL en cada arranque en frío es un desperdicio
 * y una fuente de condiciones de carrera.
 */
export async function createSchema() {
  await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'owner',
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  tagline       TEXT DEFAULT '',
  category      TEXT DEFAULT '',
  supplier      TEXT DEFAULT '',
  supplier_url  TEXT DEFAULT '',
  description   TEXT DEFAULT '',
  image         TEXT DEFAULT '',
  cost          INTEGER NOT NULL DEFAULT 0,
  price         INTEGER NOT NULL DEFAULT 0,
  compare_price INTEGER NOT NULL DEFAULT 0,
  ship_cost     INTEGER NOT NULL DEFAULT 0,
  stock         INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'draft',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS offers (
  id            TEXT PRIMARY KEY,
  product_id    TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  qty           INTEGER NOT NULL DEFAULT 1,
  price         INTEGER NOT NULL DEFAULT 0,
  compare_price INTEGER NOT NULL DEFAULT 0,
  is_default    INTEGER NOT NULL DEFAULT 0,
  sort          INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tests (
  id          TEXT PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  product_id  TEXT REFERENCES products(id) ON DELETE SET NULL,
  hypothesis  TEXT DEFAULT '',
  channel     TEXT DEFAULT 'meta',
  status      TEXT NOT NULL DEFAULT 'planned',
  budget      INTEGER NOT NULL DEFAULT 0,
  target_cpa  INTEGER NOT NULL DEFAULT 0,
  start_date  TEXT,
  end_date    TEXT,
  verdict     TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- El HTML vive en la base, no en disco: en serverless el sistema de
-- archivos es de solo lectura y no se comparte entre invocaciones.
CREATE TABLE IF NOT EXISTS pages (
  id           TEXT PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  product_id   TEXT REFERENCES products(id) ON DELETE SET NULL,
  test_id      TEXT REFERENCES tests(id) ON DELETE SET NULL,
  variant      TEXT NOT NULL DEFAULT 'A',
  type         TEXT NOT NULL DEFAULT 'landing',
  status       TEXT NOT NULL DEFAULT 'draft',
  html         TEXT NOT NULL DEFAULT '',
  notes        TEXT DEFAULT '',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id            TEXT PRIMARY KEY,
  phone         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  email         TEXT DEFAULT '',
  department    TEXT DEFAULT '',
  city          TEXT DEFAULT '',
  address       TEXT DEFAULT '',
  orders_count  INTEGER NOT NULL DEFAULT 0,
  total_spent   INTEGER NOT NULL DEFAULT 0,
  tags          TEXT DEFAULT '',
  created_at    TEXT NOT NULL,
  last_order_at TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id             TEXT PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  product_id     TEXT REFERENCES products(id) ON DELETE SET NULL,
  page_id        TEXT REFERENCES pages(id) ON DELETE SET NULL,
  test_id        TEXT REFERENCES tests(id) ON DELETE SET NULL,
  customer_id    TEXT REFERENCES customers(id) ON DELETE SET NULL,
  offer_name     TEXT DEFAULT '',
  customer_name  TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT DEFAULT '',
  department     TEXT DEFAULT '',
  city           TEXT DEFAULT '',
  address        TEXT DEFAULT '',
  notes          TEXT DEFAULT '',
  qty            INTEGER NOT NULL DEFAULT 1,
  subtotal       INTEGER NOT NULL DEFAULT 0,
  shipping       INTEGER NOT NULL DEFAULT 0,
  total          INTEGER NOT NULL DEFAULT 0,
  cost_total     INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  status         TEXT NOT NULL DEFAULT 'pending',
  courier        TEXT DEFAULT '',
  tracking       TEXT DEFAULT '',
  variant        TEXT DEFAULT 'A',
  utm_source     TEXT DEFAULT '',
  utm_medium     TEXT DEFAULT '',
  utm_campaign   TEXT DEFAULT '',
  utm_content    TEXT DEFAULT '',
  device         TEXT DEFAULT '',
  session_id     TEXT DEFAULT '',
  is_demo        INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_events (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  message    TEXT DEFAULT '',
  actor      TEXT DEFAULT 'sistema',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  page_id      TEXT,
  product_id   TEXT,
  test_id      TEXT,
  session_id   TEXT NOT NULL,
  variant      TEXT DEFAULT 'A',
  device       TEXT DEFAULT '',
  utm_source   TEXT DEFAULT '',
  utm_campaign TEXT DEFAULT '',
  value        INTEGER NOT NULL DEFAULT 0,
  is_demo      INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ad_spend (
  id          TEXT PRIMARY KEY,
  test_id     TEXT REFERENCES tests(id) ON DELETE CASCADE,
  product_id  TEXT,
  date        TEXT NOT NULL,
  channel     TEXT NOT NULL DEFAULT 'meta',
  spend       INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks      INTEGER NOT NULL DEFAULT 0,
  is_demo     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_test    ON orders(test_id);
CREATE INDEX IF NOT EXISTS idx_orders_page    ON orders(page_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_type    ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_page    ON events(page_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_spend_date     ON ad_spend(date);
CREATE INDEX IF NOT EXISTS idx_sessions_user  ON sessions(user_id);
`);
}
