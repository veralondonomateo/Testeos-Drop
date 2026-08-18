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

/**
 * Zona horaria del negocio. Todo lo que sea "un día" se calcula aquí, no en la
 * del servidor: en Vercel el proceso corre en UTC, así que un pedido de las 8pm
 * en Bogotá caía en el día siguiente y las cifras de "hoy" salían corridas cinco
 * horas. Se puede cambiar con STORE_TZ sin tocar código.
 */
export const STORE_TZ = process.env.STORE_TZ || 'America/Bogota';

/** Fecha YYYY-MM-DD en la zona del negocio. 'en-CA' ya da ese formato. */
export function dayKey(d = new Date(), tz = STORE_TZ) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(dt);
}

/** Minutos que la zona va por delante de UTC en ese instante (respeta DST). */
function tzOffsetMin(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date).reduce((a, x) => (a[x.type] = x.value, a), {});
  const hour = parts.hour === '24' ? 0 : Number(parts.hour);
  const local = Date.UTC(+parts.year, parts.month - 1, +parts.day, hour, +parts.minute, +parts.second);
  return (local - date.getTime()) / 60000;
}

/** Instante exacto en que empieza el día `YYYY-MM-DD` de la zona del negocio. */
export function startOfDay(key, tz = STORE_TZ) {
  const [y, m, d] = String(key).split('-').map(Number);
  const aprox = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  // Se resuelve dos veces porque el desplazamiento se mide sobre un instante y
  // el primero es una aproximación; con eso basta salvo en el salto de DST.
  const off1 = tzOffsetMin(new Date(aprox), tz);
  const off2 = tzOffsetMin(new Date(aprox - off1 * 60000), tz);
  return new Date(aprox - off2 * 60000);
}

/** Instante en que termina el día (el último milisegundo). */
export const endOfDay = (key, tz = STORE_TZ) =>
  new Date(startOfDay(key, tz).getTime() + 86400000 - 1);

/** Suma días a una clave YYYY-MM-DD sin salirse de la zona. */
export function addDays(key, n, tz = STORE_TZ) {
  return dayKey(new Date(startOfDay(key, tz).getTime() + n * 86400000 + 43200000), tz);
}

const RANGO_DIAS = { today: 0, yesterday: 0, '7d': 6, '14d': 13, '30d': 29, '90d': 89, '365d': 364 };

/**
 * Devuelve [desde, hasta] para un rango, en la zona del negocio.
 *
 * Acepta los atajos ('today', 'yesterday', '7d'…), un día suelto '2026-08-17'
 * y un intervalo '2026-08-01..2026-08-07'. Los dos últimos son los que permiten
 * mirar un día concreto en vez de sólo ventanas que terminan hoy.
 */
export function rangeBounds(range = '30d', tz = STORE_TZ) {
  const r = String(range || '30d').trim();

  const intervalo = r.match(/^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/);
  if (intervalo) {
    const [, a, b] = intervalo;
    const [ini, fin] = a <= b ? [a, b] : [b, a];
    return [startOfDay(ini, tz), endOfDay(fin, tz)];
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(r)) return [startOfDay(r, tz), endOfDay(r, tz)];

  const hoy = dayKey(new Date(), tz);
  if (r === 'yesterday') { const ayer = addDays(hoy, -1, tz); return [startOfDay(ayer, tz), endOfDay(ayer, tz)]; }

  const n = RANGO_DIAS[r] ?? 29;
  // El fin es "ahora" y no el final del día: sumar horas que aún no han pasado
  // haría que el periodo anterior de los deltas no fuese comparable.
  return [startOfDay(addDays(hoy, -n, tz), tz), new Date()];
}



/** Lista de días YYYY-MM-DD entre dos fechas, inclusive, en la zona del negocio. */
export function dayRange(start, end, tz = STORE_TZ) {
  const out = [];
  const fin = dayKey(end, tz);
  let cur = dayKey(start, tz);
  // Tope defensivo: un rango absurdo no debe colgar la petición.
  for (let i = 0; cur <= fin && i < 800; i++) {
    out.push(cur);
    cur = addDays(cur, 1, tz);
  }
  return out;
}

export function detectDevice(ua = '') {
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}
