import { all, one, run, insert, update } from '../db.js';
import { ORDER_STATUS } from '../config.js';
import { id, nowISO, orderCode, clean, toInt } from '../lib/util.js';
import { HttpError, notFound } from '../lib/http.js';

const EDITABLE = ['customer_name', 'phone', 'email', 'department', 'city', 'address', 'notes',
  'qty', 'subtotal', 'shipping', 'total', 'cost_total', 'status', 'courier', 'tracking', 'offer_name'];

const ENRICH = `
  SELECT o.*,
         p.name  AS product_name,
         p.image AS product_image,
         pg.title AS page_title, pg.slug AS page_slug,
         t.name  AS test_name, t.code AS test_code
  FROM orders o
  LEFT JOIN products p ON p.id = o.product_id
  LEFT JOIN pages    pg ON pg.id = o.page_id
  LEFT JOIN tests    t  ON t.id = o.test_id`;

export async function listOrders(query = {}) {
  const where = [];
  const params = [];
  if (query.status && ORDER_STATUS[query.status]) { where.push('o.status = ?'); params.push(query.status); }
  if (query.product_id) { where.push('o.product_id = ?'); params.push(query.product_id); }
  if (query.test_id) { where.push('o.test_id = ?'); params.push(query.test_id); }
  if (query.from) { where.push('o.created_at >= ?'); params.push(query.from); }
  if (query.to) { where.push('o.created_at <= ?'); params.push(query.to); }
  if (query.q) {
    where.push('(o.code ILIKE ? OR o.customer_name ILIKE ? OR o.phone ILIKE ? OR o.city ILIKE ?)');
    const like = `%${query.q}%`;
    params.push(like, like, like, like);
  }
  const limit = Math.min(500, toInt(query.limit, 200) || 200);
  const orders = await all(
    `${ENRICH} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.created_at DESC LIMIT ${limit}`,
    params
  );
  return { orders, counts: await countsByStatus() };
}

export async function countsByStatus() {
  const rows = await all('SELECT status, COUNT(*) n FROM orders GROUP BY status');
  const out = { all: 0 };
  for (const k of Object.keys(ORDER_STATUS)) out[k] = 0;
  for (const r of rows) { out[r.status] = Number(r.n); out.all += Number(r.n); }
  return out;
}

export async function getOrder(oid) {
  const o = await one(`${ENRICH} WHERE o.id = ? OR o.code = ?`, [oid, oid]);
  if (!o) throw notFound('Pedido no encontrado');
  return {
    ...o,
    events: await all('SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at DESC', [o.id]),
  };
}

const logEvent = (orderId, type, message, actor = 'sistema') =>
  insert('order_events', { id: id('oev'), order_id: orderId, type, message, actor, created_at: nowISO() });

/**
 * Crea un pedido. Se usa tanto desde el panel (manual) como desde la landing pública.
 */
export async function createOrder(body, { source = 'panel', actor = 'sistema' } = {}) {
  const name = clean(body.customer_name ?? body.name, 120);
  const phone = clean(body.phone, 40).replace(/\s+/g, ' ');
  if (!name) throw new HttpError(400, 'El nombre es obligatorio');
  if (phone.replace(/\D/g, '').length < 7) throw new HttpError(400, 'El teléfono no es válido');

  const page = body.page_id
    ? await one('SELECT * FROM pages WHERE id = ? OR slug = ?', [body.page_id, body.page_id])
    : null;
  const productId = body.product_id || page?.product_id || null;
  const product = productId ? await one('SELECT * FROM products WHERE id = ?', [productId]) : null;

  const qty = Math.max(1, toInt(body.qty, 1));
  const subtotal = toInt(body.subtotal ?? body.total ?? product?.price ?? 0);
  const shipping = toInt(body.shipping ?? 0);
  const total = toInt(body.total ?? subtotal + shipping);
  const costTotal = toInt(body.cost_total ?? (product ? (product.cost * qty + product.ship_cost) : 0));

  const customer = await upsertCustomer({
    name, phone, email: body.email, department: body.department,
    city: body.city, address: body.address,
  });

  const order = {
    id: id('ord'),
    code: orderCode(),
    product_id: productId,
    page_id: page?.id ?? null,
    test_id: body.test_id || page?.test_id || null,
    customer_id: customer.id,
    offer_name: clean(body.offer_name ?? body.offer, 160),
    customer_name: name,
    phone,
    email: clean(body.email, 160),
    department: clean(body.department, 80),
    city: clean(body.city, 80),
    address: clean(body.address, 300),
    notes: clean(body.notes, 600),
    qty, subtotal, shipping, total, cost_total: costTotal,
    payment_method: body.payment_method === 'online' ? 'online' : 'cod',
    status: ORDER_STATUS[body.status] ? body.status : 'pending',
    courier: clean(body.courier, 60),
    tracking: clean(body.tracking, 80),
    variant: clean(body.variant, 8) || page?.variant || 'A',
    utm_source: clean(body.utm_source, 80),
    utm_medium: clean(body.utm_medium, 80),
    utm_campaign: clean(body.utm_campaign, 120),
    utm_content: clean(body.utm_content, 120),
    device: clean(body.device, 20),
    session_id: clean(body.session_id, 60),
    is_demo: 0,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  await insert('orders', order);
  await logEvent(order.id, 'created',
    source === 'landing' ? 'Pedido recibido desde la landing' : 'Pedido creado manualmente', actor);

  if (product && product.stock > 0) {
    await run('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [qty, product.id]);
  }
  return getOrder(order.id);
}

export async function updateOrder(oid, body, actor = 'sistema') {
  const existing = await one('SELECT * FROM orders WHERE id = ?', [oid]);
  if (!existing) throw notFound('Pedido no encontrado');
  const patch = { ...body };
  for (const k of ['qty', 'subtotal', 'shipping', 'total', 'cost_total']) {
    if (patch[k] != null) patch[k] = toInt(patch[k]);
  }
  if (patch.status && !ORDER_STATUS[patch.status]) throw new HttpError(400, 'Estado de pedido inválido');
  patch.updated_at = nowISO();
  await update('orders', oid, patch, [...EDITABLE, 'updated_at']);

  if (patch.status && patch.status !== existing.status) {
    await logEvent(oid, 'status',
      `${ORDER_STATUS[existing.status].label} → ${ORDER_STATUS[patch.status].label}`, actor);
    if (patch.status === 'delivered') await recomputeCustomer(existing.customer_id);
  }
  if (patch.notes != null && patch.notes !== existing.notes) await logEvent(oid, 'note', 'Nota actualizada', actor);
  return getOrder(oid);
}

export async function bulkStatus(ids, status, actor = 'sistema') {
  if (!ORDER_STATUS[status]) throw new HttpError(400, 'Estado inválido');
  let n = 0;
  for (const oid of (Array.isArray(ids) ? ids : []).slice(0, 500)) {
    try { await updateOrder(oid, { status }, actor); n++; } catch { /* ignora los que ya no existen */ }
  }
  return { updated: n };
}

export async function deleteOrder(oid) {
  const { changes } = await run('DELETE FROM orders WHERE id = ?', [oid]);
  if (!changes) throw notFound('Pedido no encontrado');
  return { ok: true };
}

export async function addNote(oid, message, actor) {
  if (!await one('SELECT id FROM orders WHERE id = ?', [oid])) throw notFound('Pedido no encontrado');
  await logEvent(oid, 'note', clean(message, 600), actor);
  return getOrder(oid);
}

/* ── Clientes ─────────────────────────────────────────────────────────── */

async function upsertCustomer({ name, phone, email, department, city, address }) {
  const existing = await one('SELECT * FROM customers WHERE phone = ?', [phone]);
  const now = nowISO();
  if (existing) {
    await run(`UPDATE customers SET name = ?, email = COALESCE(NULLIF(?,''), email),
         department = COALESCE(NULLIF(?,''), department), city = COALESCE(NULLIF(?,''), city),
         address = COALESCE(NULLIF(?,''), address), orders_count = orders_count + 1,
         last_order_at = ? WHERE id = ?`,
    [name, clean(email, 160), clean(department, 80), clean(city, 80), clean(address, 300), now, existing.id]);
    return existing;
  }
  const c = {
    id: id('cus'), phone, name, email: clean(email, 160),
    department: clean(department, 80), city: clean(city, 80), address: clean(address, 300),
    orders_count: 1, total_spent: 0, tags: '', created_at: now, last_order_at: now,
  };
  await insert('customers', c);
  return c;
}

/** Recalcula el gasto acumulado del cliente contando sólo pedidos entregados. */
export async function recomputeCustomer(customerId) {
  if (!customerId) return;
  const r = await one(`SELECT COALESCE(SUM(total),0) spent FROM orders
                       WHERE customer_id = ? AND status = 'delivered'`, [customerId]);
  await run('UPDATE customers SET total_spent = ? WHERE id = ?', [Number(r.spent), customerId]);
}

export function listCustomers(query = {}) {
  const where = [];
  const params = [];
  if (query.q) {
    where.push('(name ILIKE ? OR phone ILIKE ? OR city ILIKE ? OR email ILIKE ?)');
    const like = `%${query.q}%`;
    params.push(like, like, like, like);
  }
  return all(`SELECT * FROM customers ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
              ORDER BY last_order_at DESC NULLS LAST LIMIT 300`, params);
}

export async function getCustomer(cid) {
  const c = await one('SELECT * FROM customers WHERE id = ?', [cid]);
  if (!c) throw notFound('Cliente no encontrado');
  return { ...c, orders: await all(`${ENRICH} WHERE o.customer_id = ? ORDER BY o.created_at DESC`, [cid]) };
}

/* ── Exportación ──────────────────────────────────────────────────────── */

const CSV_COLS = [
  ['code', 'Pedido'], ['created_at', 'Fecha'], ['status', 'Estado'], ['customer_name', 'Cliente'],
  ['phone', 'Teléfono'], ['department', 'Departamento'], ['city', 'Ciudad'], ['address', 'Dirección'],
  ['product_name', 'Producto'], ['offer_name', 'Oferta'], ['qty', 'Cantidad'], ['total', 'Total'],
  ['payment_method', 'Pago'], ['courier', 'Transportadora'], ['tracking', 'Guía'],
  ['utm_source', 'Fuente'], ['utm_campaign', 'Campaña'], ['variant', 'Variante'], ['notes', 'Notas'],
];

export async function ordersCSV(query = {}) {
  const { orders } = await listOrders({ ...query, limit: 5000 });
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = CSV_COLS.map(([, label]) => esc(label)).join(',');
  const body = orders.map((o) => CSV_COLS.map(([k]) => esc(
    k === 'status' ? ORDER_STATUS[o.status]?.label ?? o.status : o[k]
  )).join(',')).join('\n');
  return `﻿${head}\n${body}`;
}
