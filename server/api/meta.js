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
 * Envía un evento cualquiera por la API de Conversiones.
 *
 * Existe porque el píxel del navegador sólo llega a una parte de la gente: entre
 * iOS, Safari, Brave y los bloqueadores se pierde la mitad larga de los eventos,
 * y con la mitad de las visitas Meta no tiene con qué optimizar. El mismo evento
 * sale por los dos caminos con idéntico `event_id`, así que Meta los une y
 * cuenta uno.
 *
 * `fbp` y `fbc` son lo que de verdad decide el emparejamiento: `fbc` guarda el
 * clic en el anuncio. Sin ellos el evento llega pero queda sin atribuir.
 *
 * Nunca lanza: un fallo hacia Meta no puede afectar a la visita ni al pedido.
 */
export async function sendEvent({
  eventName, eventId, sourceUrl = '', value = 0, contentIds = [],
  fbp = '', fbc = '', clientIp = '', userAgent = '', user = null, eventTime = null,
}) {
  if (!eventName) return { ok: false, skipped: 'sin evento' };

  const pixels = await getSetting('pixels', {});
  const pixelId = (pixels.meta || '').trim();
  const token = (pixels.meta_capi_token || '').trim();
  if (!pixelId || !token) return { ok: false, skipped: 'sin token de la API de Conversiones' };
  if (esLocal(sourceUrl)) return { ok: false, skipped: 'evento de desarrollo, no se manda al píxel' };

  const user_data = user ? userData(user) : {};
  if (fbp) user_data.fbp = fbp;
  if (fbc) user_data.fbc = fbc;
  if (clientIp) user_data.client_ip_address = clientIp;
  if (userAgent) user_data.client_user_agent = userAgent;
  // Sin ninguna señal de identidad Meta rechaza el evento; no vale la pena el viaje.
  if (!Object.keys(user_data).length) return { ok: false, skipped: 'sin datos de emparejamiento' };

  const custom_data = { currency: CURRENCY };
  if (value) custom_data.value = Number(value) || 0;
  if (contentIds.length) { custom_data.content_type = 'product'; custom_data.content_ids = contentIds; }

  const body = {
    data: [{
      event_name: eventName,
      event_time: eventTime ?? Math.floor(Date.now() / 1000),
      ...(eventId ? { event_id: eventId } : {}),
      action_source: 'website',
      ...(sourceUrl ? { event_source_url: sourceUrl } : {}),
      user_data,
      custom_data,
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
    if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    return { ok: true, received: data.events_received ?? 1 };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Reporta el pedido como Purchase.
 *
 * Nunca lanza: un fallo de red hacia Meta no puede tumbar el registro de un
 * pedido ni dejar al cliente sin su confirmación. Devuelve
 * `{ ok, skipped?, error? }` para que quien llame lo deje escrito.
 */
/**
 * Un pedido hecho contra un servidor local no puede llegar al píxel real. Pasó:
 * en el conjunto de datos hay una compra con host 127.0.0.1, de alguien
 * levantando el servidor contra la base de producción para probar.
 */
function esLocal(sourceUrl) {
  try {
    const h = new URL(sourceUrl).hostname;
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(h) || h.endsWith('.local');
  } catch { return false; }
}

export async function sendPurchase(order, { sourceUrl = '', eventTime = null, fbp = '', fbc = '', clientIp = '', userAgent = '' } = {}) {
  const pixels = await getSetting('pixels', {});
  const pixelId = (pixels.meta || '').trim();
  const token = (pixels.meta_capi_token || '').trim();
  if (!pixelId || !token) return { ok: false, skipped: 'sin token de la API de Conversiones' };
  if (esLocal(sourceUrl)) return { ok: false, skipped: 'pedido de desarrollo, no se manda al píxel' };

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
      // Al hash del comprador se le suman las señales del navegador: son las
      // que permiten atribuir la venta al clic que la originó.
      user_data: (() => {
        const u = userData(order);
        if (fbp) u.fbp = fbp;
        if (fbc) u.fbc = fbc;
        if (clientIp) u.client_ip_address = clientIp;
        if (userAgent) u.client_user_agent = userAgent;
        return u;
      })(),
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
