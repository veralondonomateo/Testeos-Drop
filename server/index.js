import { createServer } from 'node:http';
import { PUBLIC_DIR, PORT, HOST, ORDER_STATUS, TEST_STATUS, VERDICTS } from './config.js';
import { one, getSetting, setSetting, hasConnectionString, DbError } from './db.js';
import {
  Router, readBody, json, text, html, parseCookies, cookie, serveStatic,
  HttpError, notFound, escapeHtml,
} from './lib/http.js';

import * as Auth from './api/auth.js';
import * as Products from './api/products.js';
import * as Orders from './api/orders.js';
import * as Pages from './api/pages.js';
import * as Tests from './api/tests.js';
import * as Analytics from './api/analytics.js';
import * as Track from './api/track.js';
import { purgeDemoData, hasDemoData } from './seed.js';

const router = new Router();
const auth = (ctx) => Auth.requireAuth(ctx);

/* ── Diagnóstico ──────────────────────────────────────────────────────────
   Público a propósito y sin secretos: es lo primero que hay que mirar cuando
   el despliegue responde 500. Dice si falta configuración o falta migrar.
   ────────────────────────────────────────────────────────────────────── */

router.get('/api/health', async ({ res }) => {
  const out = {
    ok: false,
    database_url: hasConnectionString() ? 'configurada' : 'FALTA',
    conexion: null,
    esquema: null,
    usuarios: null,
    siguiente_paso: null,
  };

  if (!hasConnectionString()) {
    out.siguiente_paso = 'Añade DATABASE_URL en Vercel → Settings → Environment Variables '
      + '(usa el Transaction pooler de Supabase, puerto 6543) y vuelve a desplegar.';
    return json(res, out, 503);
  }

  try {
    const r = await one('SELECT COUNT(*) n FROM users');
    out.conexion = 'ok';
    out.esquema = 'ok';
    out.usuarios = r.n;
    out.ok = r.n > 0;
    out.siguiente_paso = r.n > 0
      ? null
      : 'El esquema existe pero no hay usuarios. Corre `npm run migrate`.';
  } catch (err) {
    out.conexion = err instanceof DbError && err.message.includes('conectar') ? 'FALLA' : 'ok';
    out.esquema = 'FALTA';
    out.siguiente_paso = err.hint || err.message;
  }
  return json(res, out, out.ok ? 200 : 503);
});

/* ── Sesión ───────────────────────────────────────────────────────────── */

router.post('/api/auth/login', async ({ body, res }) => {
  const { user, token } = await Auth.login(body.email, body.password);
  json(res, { user }, 200, { 'set-cookie': cookie(Auth.COOKIE_NAME, token) });
});

router.post('/api/auth/logout', async ({ ctx, res }) => {
  await Auth.logout(ctx.token);
  json(res, { ok: true }, 200, { 'set-cookie': cookie(Auth.COOKIE_NAME, '', { clear: true }) });
});

router.get('/api/auth/me', ({ ctx }) => ({ user: auth(ctx) }));

/* ── Bootstrap: catálogos que la SPA necesita al arrancar ─────────────── */

router.get('/api/bootstrap', async ({ ctx }) => {
  auth(ctx);
  const [store, couriers, pixels, demo, orders, products, pages, tests, pending] = await Promise.all([
    getSetting('store', {}),
    getSetting('couriers', []),
    getSetting('pixels', {}),
    hasDemoData(),
    one('SELECT COUNT(*) n FROM orders'),
    one('SELECT COUNT(*) n FROM products'),
    one('SELECT COUNT(*) n FROM pages'),
    one('SELECT COUNT(*) n FROM tests'),
    one(`SELECT COUNT(*) n FROM orders WHERE status = 'pending'`),
  ]);
  return {
    order_status: ORDER_STATUS,
    test_status: TEST_STATUS,
    verdicts: VERDICTS,
    settings: { store, couriers, pixels },
    demo_data: demo,
    counts: {
      orders: orders.n, products: products.n, pages: pages.n,
      tests: tests.n, pending: pending.n,
    },
  };
});

/* ── Productos ────────────────────────────────────────────────────────── */

router.get('/api/products', async ({ ctx, query }) => (auth(ctx), { products: await Products.listProducts(query) }));
router.get('/api/products/:id', async ({ ctx, params }) => (auth(ctx), { product: await Products.getProduct(params.id) }));
router.post('/api/products', async ({ ctx, body }) => (auth(ctx), { product: await Products.createProduct(body) }));
router.patch('/api/products/:id', async ({ ctx, params, body }) => (auth(ctx), { product: await Products.updateProduct(params.id, body) }));
router.delete('/api/products/:id', async ({ ctx, params }) => (auth(ctx), Products.deleteProduct(params.id)));

/* ── Pedidos ──────────────────────────────────────────────────────────── */

router.get('/api/orders', async ({ ctx, query }) => (auth(ctx), Orders.listOrders(query)));
router.get('/api/orders/:id', async ({ ctx, params }) => (auth(ctx), { order: await Orders.getOrder(params.id) }));
router.post('/api/orders', async ({ ctx, body }) => {
  const u = auth(ctx);
  return { order: await Orders.createOrder(body, { source: 'panel', actor: u.name }) };
});
router.patch('/api/orders/:id', async ({ ctx, params, body }) => {
  const u = auth(ctx);
  return { order: await Orders.updateOrder(params.id, body, u.name) };
});
router.post('/api/orders/:id/note', async ({ ctx, params, body }) => {
  const u = auth(ctx);
  return { order: await Orders.addNote(params.id, body.message, u.name) };
});
router.post('/api/orders/bulk-status', async ({ ctx, body }) => {
  const u = auth(ctx);
  return Orders.bulkStatus(body.ids, body.status, u.name);
});
router.delete('/api/orders/:id', async ({ ctx, params }) => (auth(ctx), Orders.deleteOrder(params.id)));

router.get('/api/orders-export.csv', async ({ ctx, query, res }) => {
  auth(ctx);
  const csv = await Orders.ordersCSV(query);
  res.writeHead(200, {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
  });
  res.end(csv);
});

/* ── Clientes ─────────────────────────────────────────────────────────── */

router.get('/api/customers', async ({ ctx, query }) => (auth(ctx), { customers: await Orders.listCustomers(query) }));
router.get('/api/customers/:id', async ({ ctx, params }) => (auth(ctx), { customer: await Orders.getCustomer(params.id) }));

/* ── Páginas ──────────────────────────────────────────────────────────── */

router.get('/api/pages', async ({ ctx, query }) => (auth(ctx), { pages: await Pages.listPages(query) }));
router.get('/api/pages/:id', async ({ ctx, params }) => (auth(ctx), { page: await Pages.getPage(params.id) }));
router.get('/api/pages/:id/html', async ({ ctx, params }) => (auth(ctx), { html: await Pages.getPageHTML(params.id) }));
router.put('/api/pages/:id/html', async ({ ctx, params, body }) => (auth(ctx), { page: await Pages.savePageHTML(params.id, body.html) }));
router.post('/api/pages', async ({ ctx, body }) => (auth(ctx), { page: await Pages.createPage(body) }));
router.post('/api/pages/:id/duplicate', async ({ ctx, params }) => (auth(ctx), { page: await Pages.duplicatePage(params.id) }));
router.patch('/api/pages/:id', async ({ ctx, params, body }) => (auth(ctx), { page: await Pages.updatePage(params.id, body) }));
router.delete('/api/pages/:id', async ({ ctx, params }) => (auth(ctx), Pages.deletePage(params.id)));

/* ── Testeos ──────────────────────────────────────────────────────────── */

router.get('/api/tests', async ({ ctx, query }) => (auth(ctx), { tests: await Tests.listTests(query) }));
router.get('/api/tests/:id', async ({ ctx, params }) => (auth(ctx), { test: await Tests.getTest(params.id) }));
router.post('/api/tests', async ({ ctx, body }) => (auth(ctx), { test: await Tests.createTest(body) }));
router.patch('/api/tests/:id', async ({ ctx, params, body }) => (auth(ctx), { test: await Tests.updateTest(params.id, body) }));
router.delete('/api/tests/:id', async ({ ctx, params }) => (auth(ctx), Tests.deleteTest(params.id)));
router.get('/api/tests/:id/variants', async ({ ctx, params }) => (auth(ctx), { variants: await Analytics.variantBreakdown(params.id) }));

/* ── Inversión / finanzas ─────────────────────────────────────────────── */

router.get('/api/spend', async ({ ctx, query }) => (auth(ctx), { spend: await Tests.listSpend(query) }));
router.post('/api/spend', async ({ ctx, body }) => (auth(ctx), { entry: await Tests.addSpend(body) }));
router.delete('/api/spend/:id', async ({ ctx, params }) => (auth(ctx), Tests.deleteSpend(params.id)));

/* ── Analítica ────────────────────────────────────────────────────────── */

router.get('/api/analytics', async ({ ctx, query }) => {
  auth(ctx);
  return Analytics.overview(query.range || '30d', {
    product_id: query.product_id || null,
    test_id: query.test_id || null,
  });
});

/* ── Ajustes ──────────────────────────────────────────────────────────── */

router.get('/api/settings', async ({ ctx }) => {
  auth(ctx);
  const [store, couriers, pixels, users] = await Promise.all([
    getSetting('store', {}), getSetting('couriers', []), getSetting('pixels', {}), Auth.listUsers(),
  ]);
  return { store, couriers, pixels, users };
});

router.put('/api/settings', async ({ ctx, body }) => {
  auth(ctx);
  for (const key of ['store', 'couriers', 'pixels']) {
    if (body[key] !== undefined) await setSetting(key, body[key]);
  }
  const [store, couriers, pixels] = await Promise.all([
    getSetting('store', {}), getSetting('couriers', []), getSetting('pixels', {}),
  ]);
  return { ok: true, store, couriers, pixels };
});

router.post('/api/users', async ({ ctx, body }) => (auth(ctx), { user: await Auth.createUser(body) }));

router.post('/api/demo/purge', async ({ ctx }) => (auth(ctx), purgeDemoData()));

/* ── Tracking público (sin sesión) ────────────────────────────────────── */

router.post('/api/track/event', ({ body, req }) => Track.trackEvent(body, req));
router.post('/api/track/order', ({ body, req }) => Track.trackOrder(body, req));

/* ── Landing pública + preview ────────────────────────────────────────── */

router.get('/p/:slug', async ({ params, query, res, ctx }) => {
  const preview = query.preview === '1' && !!ctx.user;
  const page = await Pages.renderPublicPage(params.slug, { preview });
  if (!page) return html(res, notFoundPage(params.slug), 404);
  html(res, page);
});

function notFoundPage(slug) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Página no disponible</title>
<style>body{font-family:system-ui,sans-serif;background:#f5f5f4;color:#16161a;display:grid;place-items:center;
min-height:100vh;margin:0;padding:32px;text-align:center}.b{max-width:400px}h1{font-size:22px;margin:0 0 10px}
p{color:#6e6e76;line-height:1.6}code{background:#eee;padding:2px 6px;border-radius:5px}</style></head>
<body><div class="b"><h1>Esta página no está publicada</h1>
<p>No encontramos una landing publicada en <code>/p/${escapeHtml(slug)}</code>.
Publícala desde el módulo <b>Páginas</b> del panel.</p></div></body></html>`;
}

/* ── Handler ──────────────────────────────────────────────────────────────
   Función HTTP pura, sin `listen()`. Vercel la consume desde `api/index.js`;
   en local la envuelve el createServer del final del archivo.
   ────────────────────────────────────────────────────────────────────── */

export async function handler(req, res) {
  // Una ruta malformada ("//", un %-escape roto) no puede tumbar el proceso:
  // los escáneres y bots mandan basura constantemente.
  let url;
  let pathname;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return text(res, 'Petición malformada', 400);
  }

  try {
    const cookies = parseCookies(req);
    const token = cookies[Auth.COOKIE_NAME];
    const ctx = { token, user: await Auth.userFromToken(token) };

    const match = router.match(req.method, pathname);
    if (match) {
      const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody(req) : {};
      const query = Object.fromEntries(url.searchParams);
      const result = await match.handler({ req, res, ctx, body, query, params: match.params, url });
      if (result !== undefined && !res.writableEnded) json(res, result);
      return;
    }

    // En Vercel los estáticos los sirve el CDN antes de llegar aquí; esta rama
    // es la que atiende el desarrollo local.
    if (req.method === 'GET') {
      const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
      const immutable = /\.(woff2|png|jpe?g|svg|webp)$/.test(rel);
      if (serveStatic(res, PUBLIC_DIR, rel, { immutable })) return;
      if (!pathname.startsWith('/api/') && !/\.[a-z0-9]{2,5}$/i.test(pathname)) {
        if (serveStatic(res, PUBLIC_DIR, 'index.html')) return;
      }
    }

    throw notFound(`Ruta no encontrada: ${req.method} ${pathname}`);
  } catch (err) {
    if (res.writableEnded) return;
    const status = err?.status ?? (err instanceof HttpError ? err.status : 500);
    if (status >= 500) console.error('[error]', err);
    // La pista de DbError viaja al cliente: sin ella el panel sólo mostraría
    // "Error 500" y no habría forma de saber que falta migrar.
    const hint = err?.hint ?? null;
    if (pathname.startsWith('/api/')) {
      json(res, { error: err.message || 'Error interno', hint, details: err.details ?? null }, status);
    } else {
      text(res, [err.message, hint].filter(Boolean).join('\n\n') || 'Error interno', status);
    }
  }
}

export default handler;

/* ── Servidor local ───────────────────────────────────────────────────── */

// Sólo se levanta cuando el archivo se ejecuta directamente (`npm start`).
// Bajo Vercel el módulo se importa y esta rama nunca corre.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  process.on('uncaughtException', (err) => console.error('[uncaught]', err));
  process.on('unhandledRejection', (err) => console.error('[unhandled]', err));

  createServer(handler).listen(PORT, HOST, async () => {
    const base = `http://${HOST}:${PORT}`;
    const landing = await one(`SELECT slug FROM pages WHERE status = 'published' ORDER BY created_at LIMIT 1`)
      .catch(() => null);
    console.log(`
  ╭──────────────────────────────────────────────────────────╮
  │  DropStudio · plataforma de testeo de productos          │
  ╰──────────────────────────────────────────────────────────╯

   Panel      ${base}
   Landing    ${landing ? `${base}/p/${landing.slug}` : '— corre `npm run migrate` primero —'}
   Base       Postgres (DATABASE_URL)
`);
  });
}
