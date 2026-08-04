import { all, one } from '../db.js';
import { rangeBounds, dayRange, dayKey } from '../lib/util.js';

/**
 * Todas las métricas de analítica se calculan sobre un rango de fechas.
 * `previous` es el mismo número de días inmediatamente anterior, para los deltas.
 */
function bounds(range) {
  const [start, end] = rangeBounds(range);
  const days = dayRange(start, end);
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(start.getTime() - (end - start));
  return { start, end, days, prevStart, prevEnd };
}

const iso = (d) => d.toISOString();

function orderStats(from, to, filters = {}) {
  const where = ['o.created_at >= ?', 'o.created_at <= ?'];
  const params = [iso(from), iso(to)];
  if (filters.product_id) { where.push('o.product_id = ?'); params.push(filters.product_id); }
  if (filters.test_id) { where.push('o.test_id = ?'); params.push(filters.test_id); }
  const w = where.join(' AND ');
  const total = one(`SELECT COUNT(*) orders, COALESCE(SUM(o.total),0) gross FROM orders o WHERE ${w} AND o.status != 'cancelled'`, params);
  const del = one(`SELECT COUNT(*) delivered, COALESCE(SUM(o.total),0) revenue, COALESCE(SUM(o.cost_total),0) cogs FROM orders o WHERE ${w} AND o.status = 'delivered'`, params);
  return { ...total, ...del };
}

function eventCount(type, from, to, filters = {}) {
  const where = ['type = ?', 'created_at >= ?', 'created_at <= ?'];
  const params = [type, iso(from), iso(to)];
  if (filters.product_id) { where.push('product_id = ?'); params.push(filters.product_id); }
  if (filters.test_id) { where.push('test_id = ?'); params.push(filters.test_id); }
  return one(`SELECT COUNT(DISTINCT session_id) n FROM events WHERE ${where.join(' AND ')}`, params).n;
}

function spendTotal(from, to, filters = {}) {
  const where = ['date >= ?', 'date <= ?'];
  const params = [dayKey(from), dayKey(to)];
  if (filters.product_id) { where.push('product_id = ?'); params.push(filters.product_id); }
  if (filters.test_id) { where.push('test_id = ?'); params.push(filters.test_id); }
  const r = one(`SELECT COALESCE(SUM(spend),0) spend, COALESCE(SUM(clicks),0) clicks, COALESCE(SUM(impressions),0) impressions FROM ad_spend WHERE ${where.join(' AND ')}`, params);
  return r;
}

/**
 * Variación porcentual contra el periodo anterior.
 * Devuelve null cuando no hay base de comparación: un "+3.681%" contra un
 * periodo vacío no informa nada, y el panel prefiere no mostrar el chip.
 */
const pct = (now, before) => (before > 0 ? +(((now - before) / before) * 100).toFixed(1) : null);

export function overview(range = '30d', filters = {}) {
  const { start, end, days, prevStart, prevEnd } = bounds(range);

  const cur = orderStats(start, end, filters);
  const prev = orderStats(prevStart, prevEnd, filters);
  const views = eventCount('pageview', start, end, filters);
  const prevViews = eventCount('pageview', prevStart, prevEnd, filters);
  const checkouts = eventCount('checkout_open', start, end, filters);
  const spend = spendTotal(start, end, filters);
  const prevSpend = spendTotal(prevStart, prevEnd, filters);

  const profit = cur.revenue - cur.cogs - spend.spend;
  const prevProfit = prev.revenue - prev.cogs - prevSpend.spend;

  const kpis = {
    revenue:   { value: cur.revenue,  delta: pct(cur.revenue, prev.revenue) },
    orders:    { value: cur.orders,   delta: pct(cur.orders, prev.orders) },
    profit:    { value: profit,       delta: pct(profit, prevProfit) },
    spend:     { value: spend.spend,  delta: pct(spend.spend, prevSpend.spend) },
    views:     { value: views,        delta: pct(views, prevViews) },
    cr:        { value: views ? +(cur.orders / views * 100).toFixed(2) : 0,
                 delta: pct(views ? cur.orders / views : 0, prevViews ? prev.orders / prevViews : 0) },
    cpa:       { value: cur.orders ? Math.round(spend.spend / cur.orders) : 0,
                 delta: pct(cur.orders ? spend.spend / cur.orders : 0, prev.orders ? prevSpend.spend / prev.orders : 0) },
    roas:      { value: spend.spend ? +(cur.revenue / spend.spend).toFixed(2) : 0,
                 delta: pct(spend.spend ? cur.revenue / spend.spend : 0, prevSpend.spend ? prev.revenue / prevSpend.spend : 0) },
    aov:       { value: cur.orders ? Math.round(cur.gross / cur.orders) : 0,
                 delta: pct(cur.orders ? cur.gross / cur.orders : 0, prev.orders ? prev.gross / prev.orders : 0) },
    delivery:  { value: cur.orders ? +(cur.delivered / cur.orders * 100).toFixed(1) : 0, delta: 0 },
  };

  return {
    range, from: dayKey(start), to: dayKey(end),
    kpis,
    series: dailySeries(days, filters),
    funnel: funnel(start, end, filters, checkouts, views, cur.orders),
    by_status: statusBreakdown(start, end, filters),
    top_products: topProducts(start, end),
    top_pages: topPages(start, end),
    by_city: byCity(start, end, filters),
    by_source: bySource(start, end, filters),
    by_device: byDevice(start, end, filters),
  };
}

/** Serie diaria: visitas, pedidos, ingresos e inversión — una fila por día. */
export function dailySeries(days, filters = {}) {
  const fp = [];
  const fw = [];
  if (filters.product_id) { fw.push('product_id = ?'); fp.push(filters.product_id); }
  if (filters.test_id) { fw.push('test_id = ?'); fp.push(filters.test_id); }
  const extra = fw.length ? ' AND ' + fw.join(' AND ') : '';

  const viewsRows = all(`SELECT substr(created_at,1,10) d, COUNT(DISTINCT session_id) n
                         FROM events WHERE type = 'pageview'${extra} GROUP BY d`, fp);
  const orderRows = all(`SELECT substr(created_at,1,10) d, COUNT(*) n, COALESCE(SUM(total),0) gross
                         FROM orders WHERE status != 'cancelled'${extra} GROUP BY d`, fp);
  const revRows = all(`SELECT substr(created_at,1,10) d, COALESCE(SUM(total),0) rev
                       FROM orders WHERE status = 'delivered'${extra} GROUP BY d`, fp);
  const spendRows = all(`SELECT date d, COALESCE(SUM(spend),0) s FROM ad_spend WHERE 1=1${extra} GROUP BY d`, fp);

  const map = (rows, key) => Object.fromEntries(rows.map((r) => [r.d, r[key]]));
  const V = map(viewsRows, 'n'), O = map(orderRows, 'n'), G = map(orderRows, 'gross'),
        R = map(revRows, 'rev'), S = map(spendRows, 's');

  return days.map((d) => ({
    date: d,
    views: V[d] ?? 0,
    orders: O[d] ?? 0,
    gross: G[d] ?? 0,
    revenue: R[d] ?? 0,
    spend: S[d] ?? 0,
  }));
}

function funnel(from, to, filters, checkouts, views, orders) {
  const cta = eventCount('cta_click', from, to, filters);
  return [
    { stage: 'Visitas',            value: views },
    { stage: 'Clic en comprar',    value: cta },
    { stage: 'Checkout abierto',   value: checkouts },
    { stage: 'Pedidos',            value: orders },
  ];
}

function statusBreakdown(from, to, filters) {
  const where = ['created_at >= ?', 'created_at <= ?'];
  const params = [iso(from), iso(to)];
  if (filters.product_id) { where.push('product_id = ?'); params.push(filters.product_id); }
  if (filters.test_id) { where.push('test_id = ?'); params.push(filters.test_id); }
  return all(`SELECT status, COUNT(*) n, COALESCE(SUM(total),0) total FROM orders
              WHERE ${where.join(' AND ')} GROUP BY status`, params);
}

function topProducts(from, to) {
  return all(`SELECT p.id, p.name, p.image,
                     COUNT(o.id) orders,
                     COALESCE(SUM(CASE WHEN o.status='delivered' THEN o.total ELSE 0 END),0) revenue
              FROM orders o JOIN products p ON p.id = o.product_id
              WHERE o.created_at >= ? AND o.created_at <= ? AND o.status != 'cancelled'
              GROUP BY p.id ORDER BY orders DESC LIMIT 8`, [iso(from), iso(to)]);
}

function topPages(from, to) {
  return all(`SELECT pg.id, pg.title, pg.slug, pg.variant,
                     (SELECT COUNT(DISTINCT session_id) FROM events e WHERE e.page_id = pg.id AND e.type='pageview' AND e.created_at >= ? AND e.created_at <= ?) views,
                     (SELECT COUNT(*) FROM orders o WHERE o.page_id = pg.id AND o.status != 'cancelled' AND o.created_at >= ? AND o.created_at <= ?) orders
              FROM pages pg ORDER BY views DESC LIMIT 8`,
    [iso(from), iso(to), iso(from), iso(to)]);
}

function byCity(from, to, filters) {
  const where = ['created_at >= ?', 'created_at <= ?', "status != 'cancelled'", "city != ''"];
  const params = [iso(from), iso(to)];
  if (filters.product_id) { where.push('product_id = ?'); params.push(filters.product_id); }
  return all(`SELECT city, COUNT(*) n, COALESCE(SUM(total),0) total FROM orders
              WHERE ${where.join(' AND ')} GROUP BY city ORDER BY n DESC LIMIT 10`, params);
}

function bySource(from, to, filters) {
  const where = ['created_at >= ?', 'created_at <= ?', "status != 'cancelled'"];
  const params = [iso(from), iso(to)];
  if (filters.product_id) { where.push('product_id = ?'); params.push(filters.product_id); }
  return all(`SELECT CASE WHEN utm_source = '' THEN 'directo' ELSE utm_source END source,
                     COUNT(*) n, COALESCE(SUM(total),0) total
              FROM orders WHERE ${where.join(' AND ')} GROUP BY source ORDER BY n DESC LIMIT 8`, params);
}

function byDevice(from, to, filters) {
  const where = ["type = 'pageview'", 'created_at >= ?', 'created_at <= ?'];
  const params = [iso(from), iso(to)];
  if (filters.product_id) { where.push('product_id = ?'); params.push(filters.product_id); }
  return all(`SELECT CASE WHEN device = '' THEN 'desconocido' ELSE device END device,
                     COUNT(DISTINCT session_id) n
              FROM events WHERE ${where.join(' AND ')} GROUP BY device ORDER BY n DESC`, params);
}

/* ── Comparativa de variantes ─────────────────────────────────────────── */

/** Función de distribución normal acumulada (Abramowitz & Stegun 26.2.17). */
function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937
    + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}

/**
 * Test z de dos proporciones. Devuelve la confianza (0–1) de que la diferencia
 * entre dos tasas de conversión sea real y no ruido.
 */
export function significance(convA, viewsA, convB, viewsB) {
  if (viewsA < 1 || viewsB < 1) return null;
  const p1 = convA / viewsA;
  const p2 = convB / viewsB;
  const p = (convA + convB) / (viewsA + viewsB);
  const se = Math.sqrt(p * (1 - p) * (1 / viewsA + 1 / viewsB));
  if (!(se > 0)) return null;
  const z = (p1 - p2) / se;
  return 2 * normalCDF(Math.abs(z)) - 1;   // dos colas
}

/**
 * Todas las variantes de un testeo con sus métricas y su confianza estadística
 * frente a la que va ganando. Es lo que alimenta el módulo de Test A/B.
 */
export function variantBreakdown(testId) {
  const rows = all(`
    SELECT pg.id, pg.variant, pg.title, pg.slug, pg.status,
           (SELECT COUNT(DISTINCT session_id) FROM events e
             WHERE e.page_id = pg.id AND e.type = 'pageview') views,
           (SELECT COUNT(DISTINCT session_id) FROM events e
             WHERE e.page_id = pg.id AND e.type = 'checkout_open') checkouts,
           (SELECT COUNT(*) FROM orders o
             WHERE o.page_id = pg.id AND o.status != 'cancelled') orders,
           (SELECT COUNT(*) FROM orders o
             WHERE o.page_id = pg.id AND o.status = 'delivered') delivered,
           (SELECT COALESCE(SUM(total),0) FROM orders o
             WHERE o.page_id = pg.id AND o.status = 'delivered') revenue
    FROM pages pg WHERE pg.test_id = ? ORDER BY pg.variant`, [testId]);

  const withRates = rows.map((r) => ({
    ...r,
    cr: r.views ? +(r.orders / r.views * 100).toFixed(2) : 0,
    checkout_rate: r.views ? +(r.checkouts / r.views * 100).toFixed(2) : 0,
    delivery_rate: r.orders ? +(r.delivered / r.orders * 100).toFixed(1) : 0,
    aov: r.delivered ? Math.round(r.revenue / r.delivered) : 0,
  }));

  // El líder es la variante con mejor conversión entre las que tienen muestra
  const eligible = withRates.filter((r) => r.views >= 30);
  const leader = eligible.slice().sort((a, b) => b.cr - a.cr)[0] || null;

  return {
    variants: withRates.map((r) => ({
      ...r,
      is_leader: !!leader && r.id === leader.id,
      confidence: leader && r.id !== leader.id
        ? significance(leader.orders, leader.views, r.orders, r.views)
        : null,
      // Regla práctica: por debajo de ~100 visitas o 10 pedidos el dato no decide
      enough_sample: r.views >= 100 && r.orders >= 10,
    })),
    leader_id: leader?.id ?? null,
    total_views: withRates.reduce((a, r) => a + r.views, 0),
    total_orders: withRates.reduce((a, r) => a + r.orders, 0),
  };
}
