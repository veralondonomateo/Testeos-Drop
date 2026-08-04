import { all, one, run, insert, update } from '../db.js';
import { id, nowISO, clean, toInt, dayKey } from '../lib/util.js';
import { HttpError, notFound } from '../lib/http.js';

const EDITABLE = ['name', 'product_id', 'hypothesis', 'channel', 'status', 'budget',
  'target_cpa', 'start_date', 'end_date', 'verdict', 'notes'];

const n = (v) => Number(v ?? 0);

/** Métricas vivas de un testeo: inversión, pedidos, CPA, ROAS y margen. */
export async function testMetrics(testId) {
  const [spend, o, d, views] = await Promise.all([
    one(`SELECT COALESCE(SUM(spend),0) s, COALESCE(SUM(clicks),0) c, COALESCE(SUM(impressions),0) i
         FROM ad_spend WHERE test_id = ?`, [testId]),
    one(`SELECT COUNT(*) orders, COALESCE(SUM(total),0) gross, COALESCE(SUM(cost_total),0) cogs
         FROM orders WHERE test_id = ? AND status != 'cancelled'`, [testId]),
    one(`SELECT COUNT(*) delivered, COALESCE(SUM(total),0) revenue, COALESCE(SUM(cost_total),0) cogs
         FROM orders WHERE test_id = ? AND status = 'delivered'`, [testId]),
    one(`SELECT COUNT(DISTINCT session_id) n FROM events WHERE test_id = ? AND type = 'pageview'`, [testId]),
  ]);

  const orders = n(o.orders);
  const delivered = n(d.delivered);
  const revenue = n(d.revenue);
  const cogs = n(d.cogs);
  const s = n(spend.s);
  const profit = revenue - cogs - s;
  const v = n(views.n);

  return {
    spend: s,
    clicks: n(spend.c),
    impressions: n(spend.i),
    views: v,
    orders,
    delivered,
    gross: n(o.gross),
    revenue,
    cogs,
    profit,
    cpa: orders ? Math.round(s / orders) : 0,
    cpc: n(spend.c) ? Math.round(s / n(spend.c)) : 0,
    cr: v ? +(orders / v * 100).toFixed(2) : 0,
    delivery_rate: orders ? +(delivered / orders * 100).toFixed(1) : 0,
    roas: s ? +(revenue / s).toFixed(2) : 0,
  };
}

async function enrich(t) {
  if (!t) return null;
  const [product, pages, metrics] = await Promise.all([
    t.product_id ? one('SELECT name FROM products WHERE id = ?', [t.product_id]) : null,
    all('SELECT id, title, slug, variant, status, notes FROM pages WHERE test_id = ? ORDER BY variant', [t.id]),
    testMetrics(t.id),
  ]);
  return { ...t, product_name: product?.name ?? null, pages, metrics };
}

export async function listTests(query = {}) {
  const where = [];
  const params = [];
  if (query.status) { where.push('status = ?'); params.push(query.status); }
  if (query.product_id) { where.push('product_id = ?'); params.push(query.product_id); }
  const rows = await all(
    `SELECT * FROM tests ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`,
    params
  );
  return Promise.all(rows.map(enrich));
}

export async function getTest(tid) {
  const t = await one('SELECT * FROM tests WHERE id = ? OR code = ?', [tid, tid]);
  if (!t) throw notFound('Testeo no encontrado');
  const [base, spendLog, recent] = await Promise.all([
    enrich(t),
    all('SELECT * FROM ad_spend WHERE test_id = ? ORDER BY date DESC', [t.id]),
    all(`SELECT id, code, customer_name, city, total, status, created_at
         FROM orders WHERE test_id = ? ORDER BY created_at DESC LIMIT 20`, [t.id]),
  ]);
  return { ...base, spend_log: spendLog, recent_orders: recent };
}

async function nextCode() {
  const r = await one('SELECT COUNT(*) n FROM tests');
  return `T-${String(Number(r.n) + 1).padStart(3, '0')}`;
}

export async function createTest(body) {
  const name = clean(body.name, 140);
  if (!name) throw new HttpError(400, 'El nombre del testeo es obligatorio');
  const now = nowISO();
  const test = {
    id: id('tst'),
    code: await nextCode(),
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
  await insert('tests', test);
  return getTest(test.id);
}

export async function updateTest(tid, body) {
  if (!await one('SELECT id FROM tests WHERE id = ?', [tid])) throw notFound('Testeo no encontrado');
  const patch = { ...body };
  for (const k of ['budget', 'target_cpa']) if (patch[k] != null) patch[k] = toInt(patch[k]);
  if (patch.verdict != null && !['', 'winner', 'iterate', 'loser'].includes(patch.verdict)) {
    throw new HttpError(400, 'Veredicto inválido');
  }
  patch.updated_at = nowISO();
  await update('tests', tid, patch, [...EDITABLE, 'updated_at']);
  return getTest(tid);
}

export async function deleteTest(tid) {
  const { changes } = await run('DELETE FROM tests WHERE id = ?', [tid]);
  if (!changes) throw notFound('Testeo no encontrado');
  return { ok: true };
}

/* ── Inversión publicitaria ───────────────────────────────────────────── */

export async function addSpend(body) {
  const test = body.test_id ? await one('SELECT * FROM tests WHERE id = ?', [body.test_id]) : null;
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
    is_demo: 0,
  };
  await insert('ad_spend', row);
  return row;
}

export async function deleteSpend(sid) {
  const { changes } = await run('DELETE FROM ad_spend WHERE id = ?', [sid]);
  if (!changes) throw notFound('Registro no encontrado');
  return { ok: true };
}

export function listSpend(query = {}) {
  const where = [];
  const params = [];
  if (query.test_id) { where.push('s.test_id = ?'); params.push(query.test_id); }
  if (query.from) { where.push('s.date >= ?'); params.push(query.from); }
  if (query.to) { where.push('s.date <= ?'); params.push(query.to); }
  return all(`SELECT s.*, t.name test_name, t.code test_code FROM ad_spend s
              LEFT JOIN tests t ON t.id = s.test_id
              ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
              ORDER BY s.date DESC LIMIT 400`, params);
}
