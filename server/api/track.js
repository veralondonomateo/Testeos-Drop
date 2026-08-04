import { insert, one } from '../db.js';
import { id, nowISO, clean, toInt, detectDevice } from '../lib/util.js';
import { createOrder } from './orders.js';

const ALLOWED = new Set(['pageview', 'scroll_50', 'scroll_90', 'cta_click', 'checkout_open', 'checkout_abandon', 'order']);

/** Registra un evento de la landing pública. Silencioso ante datos basura. */
export function trackEvent(body, req) {
  const type = clean(body.type, 30);
  if (!ALLOWED.has(type)) return { ok: false };

  const page = body.page_id ? one('SELECT * FROM pages WHERE id = ?', [body.page_id]) : null;
  insert('events', {
    id: id('evt'),
    type,
    page_id: page?.id ?? null,
    product_id: page?.product_id ?? body.product_id ?? null,
    test_id: page?.test_id ?? body.test_id ?? null,
    session_id: clean(body.session_id, 60) || id('ses'),
    variant: clean(body.variant, 4) || page?.variant || 'A',
    device: clean(body.device, 20) || detectDevice(req.headers['user-agent'] || ''),
    utm_source: clean(body.utm_source, 80),
    utm_campaign: clean(body.utm_campaign, 120),
    value: toInt(body.value),
    created_at: nowISO(),
  });
  return { ok: true };
}

/** Recibe el pedido enviado desde el formulario de la landing. */
export function trackOrder(body, req) {
  const order = createOrder({
    ...body,
    device: clean(body.device, 20) || detectDevice(req.headers['user-agent'] || ''),
  }, { source: 'landing', actor: 'landing' });

  trackEvent({ ...body, type: 'order', value: order.total }, req);
  return { ok: true, code: order.code, id: order.id, total: order.total };
}
