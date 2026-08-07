import { createHash } from 'node:crypto';
import { getSetting } from '../db.js';
import { CURRENCY } from '../config.js';

/**
 * API de Conversiones de Meta — respaldo del Purchase del navegador.
 *
 * Los dos salen en el mismo momento, al tomarse el pedido, y llevan el código
 * del pedido como `event_id`: Meta los reconoce como el mismo hecho y cuenta
 * una sola compra.
 *
 * No es redundancia inútil. Entre bloqueadores de anuncios, Safari e iOS se
 * pierde una parte de los eventos del navegador; este sale del servidor, donde
 * nada lo bloquea, y además viaja con los datos del comprador hasheados, que
 * mejoran el emparejamiento.
 *
 * Nota sobre el contra entrega: aquí "compra" significa pedido tomado, no
 * cobrado. Meta va a optimizar hacia gente que pide, y tu tasa de entrega
 * decide cuántos de esos se vuelven plata. El ROAS de Ads Manager va a salir
 * más alto que el real del panel, y esa diferencia es exactamente el porcentaje
 * que no se entrega.
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
 * Reporta el pedido como Purchase.
 *
 * Nunca lanza: un fallo de red hacia Meta no puede tumbar el registro de un
 * pedido ni dejar al cliente sin su confirmación. Devuelve
 * `{ ok, skipped?, error? }` para que quien llame lo deje escrito.
 */
export async function sendPurchase(order, { sourceUrl = '', eventTime = null } = {}) {
  const pixels = await getSetting('pixels', {});
  const pixelId = (pixels.meta || '').trim();
  const token = (pixels.meta_capi_token || '').trim();
  if (!pixelId || !token) return { ok: false, skipped: 'sin token de la API de Conversiones' };

  const body = {
    data: [{
      event_name: 'Purchase',
      // `eventTime` sólo se usa al recuperar pedidos viejos: Meta acepta hasta
      // 7 días atrás, y mandarlos con su hora real conserva la atribución al
      // clic que los originó. En el camino normal se deja la de ahora.
      event_time: eventTime ?? Math.floor(Date.now() / 1000),
      // El mismo identificador que usa el píxel del navegador. Es lo único que
      // impide que cada venta se cuente dos veces.
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
        signal: AbortSignal.timeout(2500),
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
