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

  // Una fecha suelta —"2026-08-26"— es un día del negocio, no un instante.
  // `new Date()` la lee como medianoche UTC, y al pintarla en Bogotá (−5) se
  // iba al día anterior: el panel llevaba todo un mes mostrando cada fecha
  // corrida un día, desde la cabecera del rango hasta la tabla diaria y el eje
  // de inversión. Se parte a mano y no se mueve.
  const solo = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (solo) {
    const [, a, m, d] = solo;
    const y = Number(a) !== new Date().getFullYear() || withYear ? ` ${a}` : '';
    return `${Number(d)} ${MONTHS[Number(m) - 1]}${y}`;
  }

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

/**
 * Las rutas que NO se filtran por marca.
 *
 * Todo lo demás sí: la marca es la lente por la que se mira el panel, y que
 * cada vista tenga que acordarse de pasarla es garantía de que alguna no lo
 * haga y enseñe cifras de las dos marcas mezcladas sin avisar.
 */
const SIN_MARCA = ['/api/auth', '/api/settings', '/api/tiendas', '/api/bootstrap'];

export const api = {
  get: (path, params) => {
    const global = SIN_MARCA.some((r) => path.startsWith(r)) ? {} : marcaActiva();
    return request('GET', path + qs({ ...global, ...(params || {}) }));
  },
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
  /** La marca que se está mirando. null = todas. */
  marca: null,
  tiendas: [],
};

const MARCA_KEY = 'vera_marca';

/** El filtro que se añade a cada llamada, o nada si se miran todas. */
function marcaActiva() {
  return state.marca ? { tienda_id: state.marca } : {};
}

/** Recupera la marca elegida la última vez. */
export function cargarMarca() {
  try { state.marca = localStorage.getItem(MARCA_KEY) || null; } catch (e) { state.marca = null; }
  return state.marca;
}

/**
 * Cambia la marca y recarga la vista.
 *
 * Se recarga entera en vez de refrescar por partes: media docena de vistas
 * guardan datos en su propio estado, y refrescar sólo lo visible dejaría cifras
 * de la marca anterior en las que no se están mirando.
 */
export function ponerMarca(id) {
  state.marca = id || null;
  try { if (id) localStorage.setItem(MARCA_KEY, id); else localStorage.removeItem(MARCA_KEY); } catch (e) {}
  window.dispatchEvent(new CustomEvent('marca'));
}

export const orderStatus = (key) => state.bootstrap?.order_status?.[key] ?? { label: key, tone: 'neutral', step: 0 };
export const testStatus = (key) => state.bootstrap?.test_status?.[key] ?? { label: key, tone: 'neutral' };
export const verdictOf = (key) => state.bootstrap?.verdicts?.[key || ''] ?? { label: '—', tone: 'neutral' };

/* ── Tema ────────────────────────────────────────────────────────────── */

const THEME_KEY = 'ds_theme';

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved || 'light';   // el blanco de la marca por defecto
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

/**
 * Qué cifras no se pueden sostener con los datos que hay.
 *
 * Cada entrada dice qué falta, a qué métrica deja sin base y qué hay que hacer
 * para arreglarlo. El panel las usa dos veces: para tapar la cifra afectada y
 * para explicarlo arriba, antes de que nadie tome una decisión con ella.
 */
export function huecos(cob) {
  if (!cob) return [];
  const out = [];

  // La pauta es la que más engaña: sin ella el ROAS y el CPA salen preciosos.
  if (cob.dias_con_pauta < cob.dias_periodo) {
    const faltan = cob.dias_periodo - cob.dias_con_pauta;
    out.push({
      clave: 'pauta',
      titulo: cob.dias_con_pauta === 0
        ? 'No hay inversión publicitaria cargada en este periodo.'
        : `La inversión sólo cubre ${num(cob.dias_con_pauta)} de ${num(cob.dias_periodo)} días.`,
      detalle: (cob.ultimo_dia_con_pauta
        ? `El último día con gasto es el ${fmtDate(cob.ultimo_dia_con_pauta)}; faltan ${num(faltan)} ${faltan === 1 ? 'día' : 'días'}. `
        : '')
        + 'Sin el gasto completo, el CPA y el ROAS salen mucho mejores de lo que son.',
      arreglo: 'La sincronización con Meta necesita el token de la cuenta de anuncios (META_ADS_TOKEN).',
    });
  }

  // El coste de producto: sin él la "utilidad" es sólo la facturación.
  if (cob.pedidos > 0 && cob.pedidos_con_costo < cob.pedidos) {
    out.push({
      clave: 'costo',
      titulo: cob.pedidos_con_costo === 0
        ? 'Ningún pedido tiene cargado el coste de producto.'
        : `Sólo ${num(cob.pedidos_con_costo)} de ${num(cob.pedidos)} pedidos tienen coste.`,
      detalle: 'La utilidad neta se calcula restando producto y flete. Sin esos costes '
        + 'no es utilidad: es lo mismo que se cobró.',
      arreglo: 'Poner el coste unitario en la ficha de cada producto.',
    });
  }

  // Un solo estado significa que nadie actualiza la entrega.
  if (cob.pedidos > 0 && cob.estados_distintos <= 1) {
    out.push({
      clave: 'entrega',
      titulo: 'Todos los pedidos comparten el mismo estado.',
      detalle: 'La tasa de entrega compara entregados contra el total. Con un único '
        + 'estado da siempre 100% y no dice nada de la operación.',
      arreglo: 'Traer el estado real desde Mastershop o marcarlo al cerrar cada guía.',
    });
  }
  return out;
}

/** Una cifra que no se puede sostener se muestra tapada, no bonita. */
export const TAPADO = '—';
