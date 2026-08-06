import { createHash } from 'node:crypto';
import { getSetting } from '../db.js';
import { CURRENCY } from '../config.js';

/**
 * API de Conversiones de Meta — el Purchase de verdad.
 *
 * El píxel del navegador no puede marcar compras en contra entrega: cuando el
 * cliente envía el formulario todavía no ha pagado nada, y en Colombia una
 * parte de esos pedidos termina devuelta o cancelada. Si Purchase se disparara
 * ahí, Meta optimizaría hacia gente que *pide* y no hacia gente que *paga*, y
 * el ROAS del panel no cuadraría nunca con el de Ads Manager.
 *
 * Por eso el reparto es:
 *
 *   navegador  →  Lead      cuando se toma el pedido
 *   servidor   →  Purchase  cuando el pedido queda en 'delivered'
 *
 * El Purchase sale desde aquí, no desde el navegador, porque el momento en que
 * se confirma la entrega ocurre días después y con el cliente sin la página
 * abierta.
 */

const API_VERSION = 'v21.0';

/** Meta exige SHA-256 en minúscula sobre el dato ya normalizado. */
const sha256 = (v) => createHash('sha256').update(String(v)).digest('hex');

const norm = (v) => String(v ?? '').trim().toLowerCase();

/**
 * Teléfono en formato E.164 sin el '+', que es lo que Meta espera.
 * Los números colombianos se guardan como '3001234567'; sin el indicativo 57
 * el emparejamiento con la cuenta de Facebook del cliente falla.
 */
function normPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('57')) return digits;
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

/** Sólo se envían los campos que existen: un hash de cadena vacía empeora el match. */
function userData(order) {
  const out = {};
  const phone = normPhone(order.phone);
  if (phone) out.ph = [sha256(phone)];
  if (order.email) out.em = [sha256(norm(order.email))];

  const parts = norm(order.customer_name).split(/\s+/).filter(Boolean);
  if (parts[0]) out.fn = [sha256(parts[0])];
  if (parts.length > 1) out.ln = [sha256(parts[parts.length - 1])];

  if (order.city) out.ct = [sha256(norm(order.city).replace(/\s/g, ''))];
  if (order.department) out.st = [sha256(norm(order.department).replace(/\s/g, ''))];
  out.country = [sha256('co')];
  return out;
}

/**
 * Reporta un pedido entregado como Purchase.
 *
 * Nunca lanza: un fallo de red hacia Meta no puede impedir que un pedido se
 * marque como entregado en el panel. Devuelve `{ ok, skipped?, error? }` para
 * que quien llame pueda registrarlo.
 */
export async function sendPurchase(order, { sourceUrl = '' } = {}) {
  const pixels = await getSetting('pixels', {});
  const pixelId = (pixels.meta || '').trim();
  const token = (pixels.meta_capi_token || '').trim();
  if (!pixelId || !token) return { ok: false, skipped: 'sin token de la API de Conversiones' };

  const body = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      // El código del pedido es estable y único: si un pedido se marcara
      // entregado dos veces, Meta descarta el duplicado en vez de contar dos
      // compras.
      event_id: order.code,
      action_source: 'website',
      ...(sourceUrl ? { event_source_url: sourceUrl } : {}),
      user_data: userData(order),
      custom_data: {
        currency: CURRENCY,
        value: Number(order.total) || 0,
        order_id: order.code,
        content_type: 'product',
        content_ids: [order.product_id || ''],
        content_name: order.offer_name || '',
        num_items: Number(order.qty) || 1,
      },
    }],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true, received: data.events_received ?? 1 };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
