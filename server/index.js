import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { APP_DIR, ASSETS_DIR, PORT, HOST, ORDER_STATUS, TEST_STATUS, VERDICTS, DB_FILE } from './config.js';
import { all, one, getSetting, setSetting } from './db.js';
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
import { ensureSeed, purgeDemoData, hasDemoData } from './seed.js';

ensureSeed();

const router = new Router();
const auth = (ctx) => Auth.requireAuth(ctx);

/* ── Sesión ───────────────────────────────────────────────────────────── */

router.post('/api/auth/login', async ({ body, res }) => {
  const { user, token } = Auth.login(body.email, body.password);
  json(res, { user }, 200, { 'set-cookie': cookie(Auth.COOKIE_NAME, token) });
});

router.post('/api/auth/logout', ({ ctx, res }) => {
  Auth.logout(ctx.token);
  json(res, { ok: true }, 200, { 'set-cookie': cookie(Auth.COOKIE_NAME, '', { clear: true }) });
});

router.get('/api/auth/me', ({ ctx }) => ({ user: auth(ctx) }));

/* ── Bootstrap: catálogos que la SPA necesita al arrancar ─────────────── */

router.get('/api/bootstrap', ({ ctx }) => {
  auth(ctx);
  return {
    order_status: ORDER_STATUS,
    test_status: TEST_STATUS,
    verdicts: VERDICTS,
    settings: {
      store: getSetting('store', {}),
      couriers: getSetting('couriers', []),
      pixels: getSetting('pixels', {}),
    },
    demo_data: hasDemoData(),
    counts: {
      orders: one('SELECT COUNT(*) n FROM orders').n,
      products: one('SELECT COUNT(*) n FROM products').n,
      pages: one('SELECT COUNT(*) n FROM pages').n,
      tests: one('SELECT COUNT(*) n FROM tests').n,
      pending: one(`SELECT COUNT(*) n FROM orders WHERE status = 'pending'`).n,
    },
  };
});

/* ── Productos ────────────────────────────────────────────────────────── */

router.get('/api/products', ({ ctx, query }) => (auth(ctx), { products: Products.listProducts(query) }));
router.get('/api/products/:id', ({ ctx, params }) => (auth(ctx), { product: Products.getProduct(params.id) }));
router.post('/api/products', ({ ctx, body }) => (auth(ctx), { product: Products.createProduct(body) }));
router.patch('/api/products/:id', ({ ctx, params, body }) => (auth(ctx), { product: Products.updateProduct(params.id, body) }));
router.delete('/api/products/:id', ({ ctx, params }) => (auth(ctx), Products.deleteProduct(params.id)));

/* ── Pedidos ──────────────────────────────────────────────────────────── */

router.get('/api/orders', ({ ctx, query }) => (auth(ctx), Orders.listOrders(query)));
router.get('/api/orders/:id', ({ ctx, params }) => (auth(ctx), { order: Orders.getOrder(params.id) }));
router.post('/api/orders', ({ ctx, body }) => {
  const u = auth(ctx);
  return { order: Orders.createOrder(body, { source: 'panel', actor: u.name }) };
});
router.patch('/api/orders/:id', ({ ctx, params, body }) => {
  const u = auth(ctx);
  return { order: Orders.updateOrder(params.id, body, u.name) };
});
router.post('/api/orders/:id/note', ({ ctx, params, body }) => {
  const u = auth(ctx);
  return { order: Orders.addNote(params.id, body.message, u.name) };
});
router.post('/api/orders/bulk-status', ({ ctx, body }) => {
  const u = auth(ctx);
  return Orders.bulkStatus(body.ids, body.status, u.name);
});
router.delete('/api/orders/:id', ({ ctx, params }) => (auth(ctx), Orders.deleteOrder(params.id)));

router.get('/api/orders-export.csv', ({ ctx, query, res }) => {
  auth(ctx);
  const csv = Orders.ordersCSV(query);
  res.writeHead(200, {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
  });
  res.end(csv);
});

/* ── Clientes ─────────────────────────────────────────────────────────── */

router.get('/api/customers', ({ ctx, query }) => (auth(ctx), { customers: Orders.listCustomers(query) }));
router.get('/api/customers/:id', ({ ctx, params }) => (auth(ctx), { customer: Orders.getCustomer(params.id) }));

/* ── Páginas ──────────────────────────────────────────────────────────── */

router.get('/api/pages', ({ ctx, query }) => (auth(ctx), { pages: Pages.listPages(query) }));
router.get('/api/pages/:id', ({ ctx, params }) => (auth(ctx), { page: Pages.getPage(params.id) }));
router.get('/api/pages/:id/html', ({ ctx, params }) => (auth(ctx), { html: Pages.getPageHTML(params.id) }));
router.put('/api/pages/:id/html', ({ ctx, params, body }) => (auth(ctx), { page: Pages.savePageHTML(params.id, body.html) }));
router.post('/api/pages', ({ ctx, body }) => (auth(ctx), { page: Pages.createPage(body) }));
router.post('/api/pages/:id/duplicate', ({ ctx, params }) => (auth(ctx), { page: Pages.duplicatePage(params.id) }));
router.patch('/api/pages/:id', ({ ctx, params, body }) => (auth(ctx), { page: Pages.updatePage(params.id, body) }));
router.delete('/api/pages/:id', ({ ctx, params }) => (auth(ctx), Pages.deletePage(params.id)));

/* ── Testeos ──────────────────────────────────────────────────────────── */

router.get('/api/tests', ({ ctx, query }) => (auth(ctx), { tests: Tests.listTests(query) }));
router.get('/api/tests/:id', ({ ctx, params }) => (auth(ctx), { test: Tests.getTest(params.id) }));
router.post('/api/tests', ({ ctx, body }) => (auth(ctx), { test: Tests.createTest(body) }));
router.patch('/api/tests/:id', ({ ctx, params, body }) => (auth(ctx), { test: Tests.updateTest(params.id, body) }));
router.delete('/api/tests/:id', ({ ctx, params }) => (auth(ctx), Tests.deleteTest(params.id)));
router.get('/api/tests/:id/variants', ({ ctx, params }) => (auth(ctx), { variants: Analytics.variantBreakdown(params.id) }));

/* ── Inversión / finanzas ─────────────────────────────────────────────── */

router.get('/api/spend', ({ ctx, query }) => (auth(ctx), { spend: Tests.listSpend(query) }));
router.post('/api/spend', ({ ctx, body }) => (auth(ctx), { entry: Tests.addSpend(body) }));
router.delete('/api/spend/:id', ({ ctx, params }) => (auth(ctx), Tests.deleteSpend(params.id)));

/* ── Analítica ────────────────────────────────────────────────────────── */

router.get('/api/analytics', ({ ctx, query }) => {
  auth(ctx);
  return Analytics.overview(query.range || '30d', {
    product_id: query.product_id || null,
    test_id: query.test_id || null,
  });
});

/* ── Ajustes ──────────────────────────────────────────────────────────── */

router.get('/api/settings', ({ ctx }) => {
  auth(ctx);
  return {
    store: getSetting('store', {}),
    couriers: getSetting('couriers', []),
    pixels: getSetting('pixels', {}),
    users: Auth.listUsers(),
  };
});

router.put('/api/settings', ({ ctx, body }) => {
  auth(ctx);
  for (const key of ['store', 'couriers', 'pixels']) {
    if (body[key] !== undefined) setSetting(key, body[key]);
  }
  return { ok: true, store: getSetting('store', {}), couriers: getSetting('couriers', []), pixels: getSetting('pixels', {}) };
});

router.post('/api/users', ({ ctx, body }) => (auth(ctx), { user: Auth.createUser(body) }));

router.post('/api/demo/purge', ({ ctx }) => (auth(ctx), purgeDemoData()));

/* ── Tracking público (sin sesión) ────────────────────────────────────── */

router.post('/api/track/event', ({ body, req }) => Track.trackEvent(body, req));
router.post('/api/track/order', ({ body, req }) => Track.trackOrder(body, req));

/* ── Landing pública + preview ────────────────────────────────────────── */

router.get('/p/:slug', ({ params, query, res, ctx }) => {
  const preview = query.preview === '1' && !!ctx.user;
  const page = Pages.renderPublicPage(params.slug, { preview });
  if (!page) {
    return html(res, notFoundPage(params.slug), 404);
  }
  html(res, page);
});

router.get('/_ds/runtime.js', ({ res }) => {
  if (!serveStatic(res, APP_DIR, 'runtime.js')) throw notFound();
});

// Imágenes de las landings: cacheables y fuera del HTML, para que la página
// pese poco en datos móviles — que es donde vive este tráfico.
router.get('/assets/:file', ({ params, res }) => {
  if (!serveStatic(res, ASSETS_DIR, params.file, { immutable: true })) throw notFound();
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

/* ── Servidor ─────────────────────────────────────────────────────────── */

const server = createServer(async (req, res) => {
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
    const ctx = { token, user: Auth.userFromToken(token) };

    const match = router.match(req.method, pathname);
    if (match) {
      const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody(req) : {};
      const query = Object.fromEntries(url.searchParams);
      const result = await match.handler({ req, res, ctx, body, query, params: match.params, url });
      if (result !== undefined && !res.writableEnded) json(res, result);
      return;
    }

    // Archivos estáticos del panel
    if (req.method === 'GET') {
      const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (serveStatic(res, APP_DIR, rel, { immutable: /\.(woff2|png|jpe?g|svg|webp)$/.test(rel) })) return;
      // Fallback SPA: cualquier ruta desconocida sin extensión sirve el panel
      if (!pathname.startsWith('/api/') && !/\.[a-z0-9]{2,5}$/i.test(pathname)) {
        if (serveStatic(res, APP_DIR, 'index.html')) return;
      }
    }

    throw notFound(`Ruta no encontrada: ${req.method} ${pathname}`);
  } catch (err) {
    if (res.writableEnded) return;
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) console.error('[error]', err);
    if (pathname.startsWith('/api/')) {
      json(res, { error: err.message || 'Error interno', details: err.details ?? null }, status);
    } else {
      text(res, err.message || 'Error interno', status);
    }
  }
});

// Última red: preferimos un error registrado a un panel caído a mitad de un testeo
process.on('uncaughtException', (err) => console.error('[uncaught]', err));
process.on('unhandledRejection', (err) => console.error('[unhandled]', err));

server.listen(PORT, HOST, () => {
  const base = `http://${HOST}:${PORT}`;
  const landing = one(`SELECT slug FROM pages WHERE status = 'published' ORDER BY created_at LIMIT 1`);
  console.log(`
  ╭──────────────────────────────────────────────────────────╮
  │  DropStudio · plataforma de testeo de productos          │
  ╰──────────────────────────────────────────────────────────╯

   Panel      ${base}
   Landing    ${landing ? `${base}/p/${landing.slug}` : '— publica una página desde el panel —'}
   Base       ${DB_FILE.replace(process.env.HOME || '', '~')}

   Acceso     admin@dropstudio.co  ·  admin123
`);
});
