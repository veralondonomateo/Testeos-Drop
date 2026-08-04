import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Id corto, ordenable por tiempo (prefijo base36 del timestamp). */
export function id(prefix = '') {
  const t = Date.now().toString(36);
  let r = '';
  for (const b of randomBytes(6)) r += ALPHABET[b % 36];
  return `${prefix}${prefix ? '_' : ''}${t}${r}`;
}

export const token = () => randomBytes(32).toString('hex');

export const nowISO = () => new Date().toISOString();

export function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(pw, salt, 64).toString('hex')}`;
}

export function verifyPassword(pw, stored) {
  const [salt, key] = String(stored).split(':');
  if (!salt || !key) return false;
  const a = Buffer.from(key, 'hex');
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function slugify(text) {
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'pagina';
}

/** Código legible para pedidos: DS-8F31 */
export function orderCode() {
  let s = '';
  for (const b of randomBytes(4)) s += '0123456789ABCDEFGHJKMNPQRSTUVWXYZ'[b % 33];
  return `DS-${s}`;
}

export const toInt = (v, fallback = 0) => {
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : fallback;
};

export const clean = (v, max = 500) => String(v ?? '').trim().slice(0, max);

/** Fecha YYYY-MM-DD en hora local del servidor. */
export function dayKey(d = new Date()) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

/** Devuelve [desdeISO, hastaISO] a partir de un rango tipo '7d' | '30d' | 'today'. */
export function rangeBounds(range = '30d') {
  const end = new Date();
  const start = new Date();
  const days = { today: 0, '7d': 6, '14d': 13, '30d': 29, '90d': 89, '365d': 364 };
  const n = days[range] ?? 29;
  start.setDate(start.getDate() - n);
  start.setHours(0, 0, 0, 0);
  return [start, end];
}

/** Lista de días YYYY-MM-DD entre dos fechas, inclusive. */
export function dayRange(start, end) {
  const out = [];
  const cur = new Date(start);
  cur.setHours(12, 0, 0, 0);
  const stop = new Date(end);
  while (cur <= stop) {
    out.push(dayKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function detectDevice(ua = '') {
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}
