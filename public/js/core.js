/* ═══ Núcleo: DOM, formato, API, estado y notificaciones ═══════════════ */

/* ── DOM ─────────────────────────────────────────────────────────────── */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Crea un elemento. `props` acepta atributos, `on*` handlers, html/text y style. */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

export const frag = (...children) => {
  const f = document.createDocumentFragment();
  for (const c of children.flat(Infinity)) if (c != null && c !== false) f.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return f;
};

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); return node; };

/* ── Formato ─────────────────────────────────────────────────────────── */

const nfCOP = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

/** $1.234.500 */
export const money = (n) => `$${nfCOP.format(Math.round(Number(n) || 0))}`;

/** $1,2M · $340K · $9.800 — para ejes y tiles compactos */
export function moneyShort(n) {
  const v = Math.round(Number(n) || 0);
  const a = Math.abs(v);
  if (a >= 1_000_000) return `$${(v / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace('.', ',')}M`;
  if (a >= 10_000) return `$${Math.round(v / 1000)}K`;
  return `$${nfCOP.format(v)}`;
}

export const num = (n) => nfCOP.format(Math.round(Number(n) || 0));

export function numShort(n) {
  const v = Math.round(Number(n) || 0);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (Math.abs(v) >= 10_000) return `${Math.round(v / 1000)}K`;
  return nfCOP.format(v);
}

export const pct = (n, decimals = 1) =>
  `${(Number(n) || 0).toFixed(decimals).replace('.', ',')}%`;

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "12 ago" o "12 ago 2025" si es de otro año */
export function fmtDate(iso, withYear = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '—';
  const y = d.getFullYear() !== new Date().getFullYear() || withYear ? ` ${d.getFullYear()}` : '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${y}`;
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '—';
  return `${fmtDate(iso)}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "hace 4 h" */
export function fmtAgo(iso) {
  if (!iso) return '—';
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'ahora';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 604800) return `hace ${Math.floor(s / 86400)} d`;
  return fmtDate(iso);
}

/** Etiqueta corta de eje: "12 ago" */
export const axisDate = (ymd) => {
  const [, m, d] = String(ymd).split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
};

export const initials = (name) => String(name || '?')
  .trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';

export const parseMoney = (v) => Math.round(Number(String(v ?? '').replace(/[^\d-]/g, '')) || 0);

/* ── Cliente API ─────────────────────────────────────────────────────── */

export class ApiError extends Error {
  constructor(message, status, hint) {
    super(message);
    this.status = status;
    this.hint = hint;   // pista accionable del servidor (p. ej. "falta migrar")
  }
}

async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const isJSON = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJSON ? await res.json().catch(() => ({})) : {};
  if (!res.ok) throw new ApiError(data.error || `Error ${res.status}`, res.status, data.hint);
  return data;
}

const qs = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v != null && v !== '');
  return clean.length ? `?${new URLSearchParams(Object.fromEntries(clean))}` : '';
};

export const api = {
  get:    (path, params) => request('GET', path + qs(params)),
  post:   (path, body) => request('POST', path, body ?? {}),
  patch:  (path, body) => request('PATCH', path, body ?? {}),
  put:    (path, body) => request('PUT', path, body ?? {}),
  delete: (path) => request('DELETE', path),
  qs,
};

/* ── Estado global ───────────────────────────────────────────────────── */

export const state = {
  user: null,
  bootstrap: null,
  route: { name: 'dashboard', params: {} },
};

export const orderStatus = (key) => state.bootstrap?.order_status?.[key] ?? { label: key, tone: 'neutral', step: 0 };
export const testStatus = (key) => state.bootstrap?.test_status?.[key] ?? { label: key, tone: 'neutral' };
export const verdictOf = (key) => state.bootstrap?.verdicts?.[key || ''] ?? { label: '—', tone: 'neutral' };

/* ── Tema ────────────────────────────────────────────────────────────── */

const THEME_KEY = 'ds_theme';

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  window.dispatchEvent(new CustomEvent('ds:theme', { detail: next }));
  return next;
}

export const isDark = () => document.documentElement.dataset.theme === 'dark';

/** Lee un token del sistema de diseño resuelto (para pintar SVG). */
export const token = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();

/* ── Toasts ──────────────────────────────────────────────────────────── */

let toastHost = null;

export function toast(message, { title = '', type = 'ok', ms = 3600 } = {}) {
  if (!toastHost) {
    toastHost = el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastHost);
  }
  const icon = type === 'err'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.01"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>';

  const node = el('div', { class: `toast ${type}` },
    el('div', { class: 'ico', html: icon }),
    el('div', { class: 'msg' }, title ? el('b', { text: title }) : null, message));

  toastHost.append(node);
  setTimeout(() => {
    node.classList.add('out');
    setTimeout(() => node.remove(), 200);
  }, ms);
  return node;
}

export const toastError = (err) =>
  toast(err?.message || 'Algo salió mal', { title: 'Error', type: 'err', ms: 5000 });

/* ── Utilidades varias ───────────────────────────────────────────────── */

export function debounce(fn, ms = 260) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copiado al portapapeles');
  } catch {
    toast('No se pudo copiar', { type: 'err' });
  }
}

/** Paleta de series resuelta según el tema activo. */
export const seriesColors = () => [token('series-1'), token('series-2'), token('series-3'), token('series-4')];
