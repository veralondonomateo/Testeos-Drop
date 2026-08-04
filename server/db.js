import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { DATA_DIR, DB_FILE } from './config.js';

mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_FILE);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

/**
 * Esquema. Todo el dinero se guarda en enteros (centavos/pesos sin decimales)
 * para evitar errores de coma flotante — COP no usa decimales en la práctica.
 */
db.exec(`
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

CREATE TABLE IF NOT EXISTS pages (
  id           TEXT PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  product_id   TEXT REFERENCES products(id) ON DELETE SET NULL,
  test_id      TEXT REFERENCES tests(id) ON DELETE SET NULL,
  variant      TEXT NOT NULL DEFAULT 'A',
  type         TEXT NOT NULL DEFAULT 'landing',
  status       TEXT NOT NULL DEFAULT 'draft',
  file         TEXT NOT NULL,
  notes        TEXT DEFAULT '',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id           TEXT PRIMARY KEY,
  phone        TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  email        TEXT DEFAULT '',
  department   TEXT DEFAULT '',
  city         TEXT DEFAULT '',
  address      TEXT DEFAULT '',
  orders_count INTEGER NOT NULL DEFAULT 0,
  total_spent  INTEGER NOT NULL DEFAULT 0,
  tags         TEXT DEFAULT '',
  created_at   TEXT NOT NULL,
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
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL,
  page_id    TEXT,
  product_id TEXT,
  test_id    TEXT,
  session_id TEXT NOT NULL,
  variant    TEXT DEFAULT 'A',
  device     TEXT DEFAULT '',
  utm_source TEXT DEFAULT '',
  utm_campaign TEXT DEFAULT '',
  value      INTEGER NOT NULL DEFAULT 0,
  is_demo    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
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

CREATE INDEX IF NOT EXISTS idx_orders_created  ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_test     ON orders(test_id);
CREATE INDEX IF NOT EXISTS idx_events_created  ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_type     ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_page     ON events(page_id);
CREATE INDEX IF NOT EXISTS idx_spend_date      ON ad_spend(date);
`);

/* ── Helpers de consulta ─────────────────────────────────────────────── */

export const all = (sql, params = []) => db.prepare(sql).all(...params);
export const one = (sql, params = []) => db.prepare(sql).get(...params) ?? null;
export const run = (sql, params = []) => db.prepare(sql).run(...params);

/** INSERT genérico a partir de un objeto plano. */
export function insert(table, data) {
  const keys = Object.keys(data);
  const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
  db.prepare(sql).run(...keys.map((k) => data[k]));
  return data;
}

/** UPDATE genérico por id, ignorando claves no permitidas. */
export function update(table, id, data, allowed) {
  const keys = Object.keys(data).filter((k) => allowed.includes(k));
  if (!keys.length) return 0;
  const sql = `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`;
  return db.prepare(sql).run(...keys.map((k) => data[k]), id).changes;
}

export function getSetting(key, fallback = null) {
  const row = one('SELECT value FROM settings WHERE key = ?', [key]);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

export function setSetting(key, value) {
  run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, JSON.stringify(value)]);
}
