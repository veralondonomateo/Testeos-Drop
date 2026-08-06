import { all, one, run, insert, update, getSetting } from '../db.js';
import { id, nowISO, slugify, clean } from '../lib/util.js';
import { HttpError, notFound } from '../lib/http.js';

/**
 * El HTML de cada landing vive en la columna `pages.html`, no en disco.
 * En serverless el sistema de archivos es de solo lectura y no se comparte
 * entre invocaciones, así que guardarlo en la base es lo único que permite
 * editar una página desde el panel y que el cambio sobreviva.
 */

const EDITABLE = ['title', 'slug', 'product_id', 'test_id', 'variant', 'type', 'status', 'notes'];

const BLANK = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nueva landing</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;background:#f5f5f4;color:#16161a;
       display:grid;place-items:center;min-height:100vh;padding:32px;text-align:center}
  .card{background:#fff;border-radius:20px;padding:40px;max-width:420px;box-shadow:0 20px 50px -30px rgba(0,0,0,.4)}
  h1{font-size:26px;margin:0 0 10px}
  p{color:#6e6e76;line-height:1.6;margin:0 0 22px}
  a{display:block;background:#16161a;color:#fff;text-decoration:none;padding:16px;border-radius:12px;font-weight:600}
</style></head>
<body><div class="card">
  <h1>Tu nueva landing</h1>
  <p>Edita el HTML desde el módulo <b>Páginas</b> del panel para empezar a testear.</p>
  <a href="#pedir">Botón de compra</a>
</div></body></html>`;

/** Campos ligeros: nunca traemos el HTML completo en los listados. */
const LIGHT = 'id, slug, title, product_id, test_id, variant, type, status, notes, created_at, updated_at, published_at';

async function enrich(p) {
  if (!p) return null;
  const [product, test, views, orders] = await Promise.all([
    p.product_id ? one('SELECT name FROM products WHERE id = ?', [p.product_id]) : null,
    p.test_id ? one('SELECT name FROM tests WHERE id = ?', [p.test_id]) : null,
    one(`SELECT COUNT(DISTINCT session_id) n FROM events WHERE page_id = ? AND type = 'pageview'`, [p.id]),
    one(`SELECT COUNT(*) n FROM orders WHERE page_id = ? AND status != 'cancelled'`, [p.id]),
  ]);
  return {
    ...p,
    product_name: product?.name ?? null,
    test_name: test?.name ?? null,
    views: Number(views.n),
    orders: Number(orders.n),
    url: `/p/${p.slug}`,
  };
}

export async function listPages(query = {}) {
  const where = [];
  const params = [];
  if (query.product_id) { where.push('product_id = ?'); params.push(query.product_id); }
  if (query.test_id) { where.push('test_id = ?'); params.push(query.test_id); }
  if (query.q) { where.push('(title ILIKE ? OR slug ILIKE ?)'); params.push(`%${query.q}%`, `%${query.q}%`); }
  const rows = await all(
    `SELECT ${LIGHT} FROM pages ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY updated_at DESC`,
    params
  );
  return Promise.all(rows.map(enrich));
}

export async function getPage(pid) {
  const p = await one(`SELECT ${LIGHT} FROM pages WHERE id = ? OR slug = ?`, [pid, pid]);
  if (!p) throw notFound('Página no encontrada');
  return enrich(p);
}

export async function getPageHTML(pid) {
  const p = await one('SELECT html FROM pages WHERE id = ? OR slug = ?', [pid, pid]);
  if (!p) throw notFound('Página no encontrada');
  return p.html ?? '';
}

export async function savePageHTML(pid, htmlBody) {
  if (typeof htmlBody !== 'string' || !htmlBody.trim()) throw new HttpError(400, 'El HTML no puede estar vacío');
  const { changes } = await run('UPDATE pages SET html = ?, updated_at = ? WHERE id = ?',
    [htmlBody, nowISO(), pid]);
  if (!changes) throw notFound('Página no encontrada');
  return getPage(pid);
}

async function uniqueSlug(base, ignoreId = null) {
  const root = slugify(base);
  let slug = root;
  let n = 2;
  while (await one('SELECT id FROM pages WHERE slug = ? AND id != ?', [slug, ignoreId ?? ''])) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

export async function createPage(body) {
  const title = clean(body.title, 140) || 'Nueva landing';
  const now = nowISO();

  let html = BLANK;
  if (body.clone_from) {
    try { html = (await getPageHTML(body.clone_from)) || BLANK; } catch { /* usa el blanco */ }
  } else if (typeof body.html === 'string' && body.html.trim()) {
    html = body.html;
  }

  const page = {
    id: id('pag'),
    slug: await uniqueSlug(body.slug || title),
    title,
    product_id: body.product_id || null,
    test_id: body.test_id || null,
    variant: clean(body.variant, 4).toUpperCase() || 'A',
    type: ['landing', 'advertorial', 'quiz', 'upsell', 'gracias'].includes(body.type) ? body.type : 'landing',
    status: 'draft',
    html,
    notes: clean(body.notes, 600),
    created_at: now, updated_at: now, published_at: null,
  };
  await insert('pages', page);
  return getPage(page.id);
}

export async function updatePage(pid, body) {
  const existing = await one(`SELECT ${LIGHT} FROM pages WHERE id = ?`, [pid]);
  if (!existing) throw notFound('Página no encontrada');
  const patch = { ...body };
  if (patch.slug != null) patch.slug = await uniqueSlug(patch.slug, pid);
  if (patch.variant) patch.variant = clean(patch.variant, 4).toUpperCase();
  patch.updated_at = nowISO();
  await update('pages', pid, patch, [...EDITABLE, 'updated_at']);
  if (body.status === 'published' && existing.status !== 'published') {
    await run('UPDATE pages SET published_at = ? WHERE id = ?', [nowISO(), pid]);
  }
  return getPage(pid);
}

export async function deletePage(pid) {
  const { changes } = await run('DELETE FROM pages WHERE id = ?', [pid]);
  if (!changes) throw notFound('Página no encontrada');
  return { ok: true };
}

export async function duplicatePage(pid) {
  const p = await getPage(pid);
  return createPage({
    title: `${p.title} (copia)`,
    product_id: p.product_id, test_id: p.test_id,
    variant: p.variant === 'A' ? 'B' : p.variant,
    type: p.type, clone_from: p.id,
  });
}

/**
 * Código base del píxel de Meta.
 *
 * Va lo más arriba posible para que `PageView` dispare antes de que el runtime
 * cargue: si se retrasa, Meta pierde vistas y la optimización se degrada.
 *
 * `ViewContent` sale aquí mismo con el valor del producto, para que el
 * algoritmo tenga señal de intención desde la primera visita. Los eventos del
 * embudo (InitiateCheckout, Purchase) los dispara `runtime.js`.
 */
function metaPixel(pixelId, product) {
  if (!pixelId) return '';
  const value = product?.price ?? 0;
  const contentId = product?.id ?? '';
  const contentName = (product?.name ?? '').replace(/'/g, "\\'");
  return `
<!-- Meta Pixel -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
fbq('track', 'ViewContent', {
  content_ids: ['${contentId}'],
  content_name: '${contentName}',
  content_type: 'product',
  value: ${value},
  currency: 'COP'
});
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel -->`;
}

/**
 * Devuelve el HTML público de la landing con el runtime de tracking inyectado
 * justo antes de `</body>`.
 */
export async function renderPublicPage(slug, { preview = false } = {}) {
  const p = await one('SELECT * FROM pages WHERE slug = ?', [slug]);
  if (!p) return null;
  if (p.status !== 'published' && !preview) return null;
  return renderPage(p, { preview });
}

/**
 * Igual que `renderPublicPage`, pero con la fila ya en mano: el reparto de
 * tráfico ya resolvió qué landing toca y volver a buscarla por slug sería una
 * consulta de más en cada visita.
 */
export async function renderPage(p, { preview = false } = {}) {
  const product = p.product_id ? await one('SELECT * FROM products WHERE id = ?', [p.product_id]) : null;
  const offers = product
    ? await all('SELECT * FROM offers WHERE product_id = ? ORDER BY sort, price', [product.id])
    : [];

  const pixels = await getSetting('pixels', {});
  // En preview no se dispara nada: mirar tu propia landing no debe ensuciar
  // ni tus métricas ni el aprendizaje del píxel.
  const metaId = preview ? '' : (pixels.meta || '').trim();

  const ctx = {
    pageId: p.id,
    pageSlug: p.slug,
    productId: p.product_id,
    testId: p.test_id,
    variant: p.variant,
    preview,
    meta_pixel: metaId,
    product: product && { id: product.id, name: product.name, price: product.price, ship_cost: product.ship_cost },
    offers: offers.map((o) => ({ id: o.id, name: o.name, qty: o.qty, price: o.price, is_default: !!o.is_default })),
  };

  // El runtime vive en public/, así que lo sirve el CDN de Vercel (y el
  // servidor local con la misma ruta): no pasa por la función serverless.
  const inject = `\n<script>window.__DS__=${JSON.stringify(ctx).replace(/</g, '\\u003c')};</script>\n<script src="/runtime.js" defer></script>\n`;
  const pixel = metaPixel(metaId, product);
  let source = p.html || '';

  // El píxel entra en el <head> para adelantar el PageView todo lo posible.
  if (pixel) {
    source = source.includes('</head>')
      ? source.replace(/<\/head>/i, `${pixel}\n</head>`)
      : pixel + source;
  }

  return source.includes('</body>')
    ? source.replace(/<\/body>/i, `${inject}</body>`)
    : source + inject;
}

/* ── Reparto de tráfico ──────────────────────────────────────────────── */

/**
 * Nombre de la cookie que fija la variante de un visitante.
 * El código del testeo se normaliza ('T-001' → 'ds_ab_t001') porque los
 * guiones son válidos en una cookie pero invitan a errores al leerla.
 */
export const splitCookie = (code) => `ds_ab_${String(code).toLowerCase().replace(/[^a-z0-9]/g, '')}`;

/**
 * Elige qué landing le toca a un visitante dentro de un testeo.
 *
 * `sticky` es la variante que el visitante ya traía asignada, y se respeta
 * siempre que siga publicada. Esto no es un detalle: si alguien que hizo clic
 * en el anuncio y vio la variante A volviera días después y cayera en la B, su
 * pedido se le acreditaría a la variante equivocada y la comparación dejaría de
 * medir lo que dice medir.
 *
 * Devuelve null si el testeo no existe o no tiene ninguna landing publicada.
 */
export async function pickVariant(testCode, sticky = null) {
  const test = await one('SELECT id, code, name FROM tests WHERE lower(code) = lower(?)', [testCode]);
  if (!test) return null;

  const pages = await all(
    `SELECT * FROM pages WHERE test_id = ? AND status = 'published' ORDER BY variant`,
    [test.id]
  );
  if (!pages.length) return null;

  const held = sticky ? pages.find((p) => p.variant === sticky) : null;
  if (held) return { test, page: held, fresh: false };

  // Uniforme entre las publicadas: con dos variantes es el 50/50 que se busca,
  // y si se publica una tercera el reparto se reajusta solo. Despublicar una a
  // mitad del testeo tampoco rompe el enlace — el tráfico pasa a las que queden
  // en vez de caer en un 404.
  return { test, page: pages[Math.floor(Math.random() * pages.length)], fresh: true };
}
