import { insert, one } from '../db.js';
import { id, nowISO, clean, toInt, detectDevice } from '../lib/util.js';
import { createOrder, reportPurchase } from './orders.js';
import { sendEvent } from './meta.js';
import { marcarParaDespacho } from './despacho.js';

// `seccion` lleva en `value` el número de sección alcanzada y `salida` los
// segundos que duró la visita. Juntos dicen dónde para la gente y si se va
// rebotando o después de leer, que son problemas distintos.
const ALLOWED = new Set(['pageview', 'scroll_50', 'scroll_90', 'cta_click',
  'checkout_open', 'checkout_abandon', 'order', 'seccion', 'salida']);

/** Registra un evento de la landing pública. Silencioso ante datos basura. */
export async function trackEvent(body, req) {
  const type = clean(body.type, 30);
  if (!ALLOWED.has(type)) return { ok: false };

  const page = body.page_id ? await one('SELECT * FROM pages WHERE id = ?', [body.page_id]) : null;
  await insert('events', {
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
    utm_content: clean(body.utm_content, 120),
    value: toInt(body.value),
    is_demo: 0,
    created_at: nowISO(),
  });

  // El mismo evento por la API de Conversiones, con el `event_id` que ya usó el
  // píxel del navegador. Meta los une: uno se pierde con los bloqueadores, el
  // otro no. Se espera la respuesta porque en serverless lo lanzado tras
  // responder puede congelarse; `sendEvent` corta a los 2,5 s y nunca lanza.
  // `meta_event` puede traer varios separados por coma: la visita dispara
  // PageView y ViewContent, que son los dos que usa Meta para optimizar.
  const eventos = clean(body.meta_event, 80).split(',').map((x) => x.trim()).filter(Boolean).slice(0, 3);
  if (eventos.length) {
    const comun = {
      sourceUrl: clean(body.source_url, 400),
      contentIds: page?.product_id ? [page.product_id] : [],
      fbp: clean(body.fbp, 120),
      fbc: clean(body.fbc, 200),
      clientIp: clientIp(req),
      userAgent: clean(req.headers['user-agent'], 400),
    };
    // El event_id que mandó el navegador vale para el primero; los demás se
    // derivan del mismo patrón `Evento_sesión` que usa el píxel.
    const sid = clean(body.session_id, 60);
    await Promise.all(eventos.map((ev, i) => sendEvent({
      ...comun,
      eventName: ev,
      eventId: i === 0 ? (clean(body.meta_event_id, 120) || `${ev}_${sid}`) : `${ev}_${sid}`,
      value: toInt(body.value),
    })));
  }

  return { ok: true };
}

/** IP real del visitante detrás del proxy de Vercel. */
function clientIp(req) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || req.socket?.remoteAddress || '';
}

/** Recibe el pedido enviado desde el formulario de la landing. */
export async function trackOrder(body, req) {
  const order = await createOrder({
    ...body,
    device: clean(body.device, 20) || detectDevice(req.headers['user-agent'] || ''),
  }, { source: 'landing', actor: 'landing' });

  // Envío repetido del formulario: `createOrder` devolvió el pedido que ya
  // existía en vez de crear uno nuevo. Ni evento de embudo ni Purchase — los dos
  // ya salieron con el primero, y repetirlos inflaría el embudo del panel y la
  // columna de compras de Ads Manager. Se responde con la confirmación del
  // pedido bueno para que el cliente la vea y no lo intente una tercera vez.
  if (order.duplicate) {
    return { ok: true, code: order.code, id: order.id, total: order.total, duplicate: true };
  }

  await trackEvent({ ...body, type: 'order', value: order.total }, req);

  // El respaldo por servidor del Purchase del navegador. Se espera porque en
  // serverless el trabajo lanzado después de responder puede congelarse a mitad;
  // `sendPurchase` nunca lanza y corta a los 2,5 s, así que un Meta lento no
  // deja al cliente mirando el botón de confirmar.
  await reportPurchase(order, {
    sourceUrl: clean(body.source_url, 400),
    fbp: clean(body.fbp, 120),
    fbc: clean(body.fbc, 200),
    clientIp: clientIp(req),
    userAgent: clean(req.headers['user-agent'], 400),
  });

  // Sólo se marca para despacho: quien lo manda a Mastershop es la barrida del
  // cron, unos minutos después. Hacerlo aquí costaba hasta 10 s de la respuesta
  // del checkout. Si esta marca falla, el pedido queda sin estado y la barrida
  // lo recoge igual, porque también toma los que no tienen ninguno.
  await marcarParaDespacho(order).catch(() => {});

  return { ok: true, code: order.code, id: order.id, total: order.total };
}
