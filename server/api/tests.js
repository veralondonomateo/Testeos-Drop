import { all, one, run, insert, update } from '../db.js';
import { id, nowISO, clean, toInt, dayKey } from '../lib/util.js';
import { HttpError, notFound } from '../lib/http.js';

const EDITABLE = ['name', 'product_id', 'hypothesis', 'channel', 'status', 'budget',
  'target_cpa', 'start_date', 'end_date', 'verdict', 'notes'];

/** Métricas vivas de un testeo: inversión, pedidos, CPA, ROAS y margen. */
export function testMetrics(testId) {
  const spend = one('SELECT COALESCE(SUM(spend),0) s, COALESCE(SUM(clicks),0) c, COALESCE(SUM(impressions),0) i FROM ad_spend WHERE test_id = ?', [testId]);
  const o = one(`SELECT COUNT(*) orders,
                        COALESCE(SUM(total),0) gross,
                        COALESCE(SUM(cost_total),0) cogs
                 FROM orders WHERE test_id = ? AND status != 'cancelled'`, [testId]);
  const d = one(`SELECT COUNT(*) delivered, COALESCE(SUM(total),0) revenue, COALESCE(SUM(cost_total),0) cogs
                 FROM orders WHERE test_id = ? AND status = 'delivered'`, [testId]);
  const views = one(`SELECT COUNT(DISTINCT session_id) n FROM events WHERE test_id = ? AND type = 'pageview'`, [testId]).n;

  const orders = o.orders;
  const profit = d.revenue - d.cogs - spend.s;
  return {
    spend: spend.s,
    clicks: spend.c,
    impressions: spend.i,
    views,
    orders,
    delivered: d.delivered,
    gross: o.gross,
    revenue: d.revenue,
    cogs: d.cogs,
    profit,
    cpa: orders ? Math.round(spend.s / orders) : 0,
    cpc: spend.c ? Math.round(spend.s / spend.c) : 0,
    cr: views ? +(orders / views * 100).toFixed(2) : 0,
    delivery_rate: orders ? +(d.delivered / orders * 100).toFixed(1) : 0,
    roas: spend.s ? +(d.revenue / spend.s).toFixed(2) : 0,
  };
}

const enrich = (t) => t && ({
  ...t,
  product_name: t.product_id ? one('SELECT name FROM products WHERE id = ?', [t.product_id])?.name ?? null : null,
  pages: all('SELECT id, title, slug, variant, status, notes FROM pages WHERE test_id = ? ORDER BY variant', [t.id]),
  metrics: testMetrics(t.id),
});

export function listTests(query = {}) {
  const where = [];
  const params = [];
  if (query.status) { where.push('status = ?'); params.push(query.status); }
  if (query.product_id) { where.push('product_id = ?'); params.push(query.product_id); }
  return all(`SELECT * FROM tests ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`, params)
    .map(enrich);
}

export function getTest(tid) {
  const t = one('SELECT * FROM tests WHERE id = ? OR code = ?', [tid, tid]);
  if (!t) throw notFound('Testeo no encontrado');
  return {
    ...enrich(t),
    spend_log: all('SELECT * FROM ad_spend WHERE test_id = ? ORDER BY date DESC', [t.id]),
    recent_orders: all(`SELECT id, code, customer_name, city, total, status, created_at
                        FROM orders WHERE test_id = ? ORDER BY created_at DESC LIMIT 20`, [t.id]),
  };
}

function nextCode() {
  const n = one('SELECT COUNT(*) n FROM tests').n + 1;
  return `T-${String(n).padStart(3, '0')}`;
}

export function createTest(body) {
  const name = clean(body.name, 140);
  if (!name) throw new HttpError(400, 'El nombre del testeo es obligatorio');
  const now = nowISO();
  const test = {
    id: id('tst'),
    code: nextCode(),
    name,
    product_id: body.product_id || null,
    hypothesis: clean(body.hypothesis, 1000),
    channel: ['meta', 'tiktok', 'google', 'organico', 'otro'].includes(body.channel) ? body.channel : 'meta',
    status: 'planned',
    budget: toInt(body.budget),
    target_cpa: toInt(body.target_cpa),
    start_date: clean(body.start_date, 10) || dayKey(),
    end_date: clean(body.end_date, 10) || null,
    verdict: '',
    notes: clean(body.notes, 2000),
    created_at: now, updated_at: now,
  };
  insert('tests', test);
  return getTest(test.id);
}

export function updateTest(tid, body) {
  if (!one('SELECT id FROM tests WHERE id = ?', [tid])) throw notFound('Testeo no encontrado');
  const patch = { ...body };
  for (const k of ['budget', 'target_cpa']) if (patch[k] != null) patch[k] = toInt(patch[k]);
  if (patch.verdict != null && !['', 'winner', 'iterate', 'loser'].includes(patch.verdict)) {
    throw new HttpError(400, 'Veredicto inválido');
  }
  patch.updated_at = nowISO();
  update('tests', tid, patch, [...EDITABLE, 'updated_at']);
  return getTest(tid);
}

export function deleteTest(tid) {
  const n = run('DELETE FROM tests WHERE id = ?', [tid]).changes;
  if (!n) throw notFound('Testeo no encontrado');
  return { ok: true };
}

/* ── Inversión publicitaria ───────────────────────────────────────────── */

export function addSpend(body) {
  const test = body.test_id ? one('SELECT * FROM tests WHERE id = ?', [body.test_id]) : null;
  if (!test) throw new HttpError(400, 'Debes elegir un testeo válido');
  const row = {
    id: id('spd'),
    test_id: test.id,
    product_id: test.product_id,
    date: clean(body.date, 10) || dayKey(),
    channel: clean(body.channel, 20) || test.channel,
    spend: toInt(body.spend),
    impressions: toInt(body.impressions),
    clicks: toInt(body.clicks),
  };
  insert('ad_spend', row);
  return row;
}

export function deleteSpend(sid) {
  const n = run('DELETE FROM ad_spend WHERE id = ?', [sid]).changes;
  if (!n) throw notFound('Registro no encontrado');
  return { ok: true };
}

export function listSpend(query = {}) {
  const where = [];
  const params = [];
  if (query.test_id) { where.push('test_id = ?'); params.push(query.test_id); }
  if (query.from) { where.push('date >= ?'); params.push(query.from); }
  if (query.to) { where.push('date <= ?'); params.push(query.to); }
  return all(`SELECT s.*, t.name test_name, t.code test_code FROM ad_spend s
              LEFT JOIN tests t ON t.id = s.test_id
              ${where.length ? 'WHERE ' + where.map((w) => `s.${w}`).join(' AND ') : ''}
              ORDER BY s.date DESC LIMIT 400`, params);
}
