import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { all, one, run, insert, update } from '../db.js';
import { PAGES_DIR } from '../config.js';
import { id, nowISO, slugify, clean } from '../lib/util.js';
import { HttpError, notFound } from '../lib/http.js';

mkdirSync(PAGES_DIR, { recursive: true });

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

const enrich = (p) => p && ({
  ...p,
  product_name: p.product_id ? one('SELECT name FROM products WHERE id = ?', [p.product_id])?.name ?? null : null,
  test_name: p.test_id ? one('SELECT name FROM tests WHERE id = ?', [p.test_id])?.name ?? null : null,
  views: one(`SELECT COUNT(*) n FROM events WHERE page_id = ? AND type = 'pageview'`, [p.id]).n,
  orders: one(`SELECT COUNT(*) n FROM orders WHERE page_id = ? AND status != 'cancelled'`, [p.id]).n,
  url: `/p/${p.slug}`,
});

export function listPages(query = {}) {
  const where = [];
  const params = [];
  if (query.product_id) { where.push('product_id = ?'); params.push(query.product_id); }
  if (query.test_id) { where.push('test_id = ?'); params.push(query.test_id); }
  if (query.q) { where.push('(title LIKE ? OR slug LIKE ?)'); params.push(`%${query.q}%`, `%${query.q}%`); }
  return all(`SELECT * FROM pages ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY updated_at DESC`, params)
    .map(enrich);
}

export function getPage(pid) {
  const p = one('SELECT * FROM pages WHERE id = ? OR slug = ?', [pid, pid]);
  if (!p) throw notFound('Página no encontrada');
  return enrich(p);
}

export function getPageHTML(pid) {
  const p = one('SELECT * FROM pages WHERE id = ? OR slug = ?', [pid, pid]);
  if (!p) throw notFound('Página no encontrada');
  const file = join(PAGES_DIR, p.file);
  if (!existsSync(file)) return '';
  return readFileSync(file, 'utf8');
}

export function savePageHTML(pid, htmlBody) {
  const p = one('SELECT * FROM pages WHERE id = ?', [pid]);
  if (!p) throw notFound('Página no encontrada');
  if (typeof htmlBody !== 'string' || !htmlBody.trim()) throw new HttpError(400, 'El HTML no puede estar vacío');
  writeFileSync(join(PAGES_DIR, p.file), htmlBody, 'utf8');
  run('UPDATE pages SET updated_at = ? WHERE id = ?', [nowISO(), pid]);
  return getPage(pid);
}

function uniqueSlug(base, ignoreId = null) {
  let slug = slugify(base);
  let n = 2;
  while (one('SELECT id FROM pages WHERE slug = ? AND id != ?', [slug, ignoreId ?? ''])) {
    slug = `${slugify(base)}-${n++}`;
  }
  return slug;
}

export function createPage(body) {
  const title = clean(body.title, 140) || 'Nueva landing';
  const slug = uniqueSlug(body.slug || title);
  const now = nowISO();
  const page = {
    id: id('pag'), slug, title,
    product_id: body.product_id || null,
    test_id: body.test_id || null,
    variant: clean(body.variant, 4).toUpperCase() || 'A',
    type: ['landing', 'advertorial', 'quiz', 'upsell', 'gracias'].includes(body.type) ? body.type : 'landing',
    status: 'draft',
    file: `${slug}.html`,
    notes: clean(body.notes, 600),
    created_at: now, updated_at: now, published_at: null,
  };
  let source = BLANK;
  if (body.clone_from) {
    try { source = getPageHTML(body.clone_from) || BLANK; } catch { /* usa el blanco */ }
  } else if (typeof body.html === 'string' && body.html.trim()) {
    source = body.html;
  }
  writeFileSync(join(PAGES_DIR, page.file), source, 'utf8');
  insert('pages', page);
  return getPage(page.id);
}

export function updatePage(pid, body) {
  const existing = one('SELECT * FROM pages WHERE id = ?', [pid]);
  if (!existing) throw notFound('Página no encontrada');
  const patch = { ...body };
  if (patch.slug != null) patch.slug = uniqueSlug(patch.slug, pid);
  if (patch.variant) patch.variant = clean(patch.variant, 4).toUpperCase();
  patch.updated_at = nowISO();
  update('pages', pid, patch, [...EDITABLE, 'updated_at']);
  if (body.status === 'published' && existing.status !== 'published') {
    run('UPDATE pages SET published_at = ? WHERE id = ?', [nowISO(), pid]);
  }
  return getPage(pid);
}

export function deletePage(pid) {
  const p = one('SELECT * FROM pages WHERE id = ?', [pid]);
  if (!p) throw notFound('Página no encontrada');
  try { unlinkSync(join(PAGES_DIR, p.file)); } catch { /* ya no existe */ }
  run('DELETE FROM pages WHERE id = ?', [pid]);
  return { ok: true };
}

export function duplicatePage(pid) {
  const p = getPage(pid);
  return createPage({
    title: `${p.title} (copia)`,
    product_id: p.product_id, test_id: p.test_id,
    variant: p.variant === 'A' ? 'B' : p.variant,
    type: p.type, clone_from: p.id,
  });
}

/**
 * Devuelve el HTML público de la landing con el runtime de tracking inyectado
 * justo antes de `</body>`. El runtime captura sesión, eventos y el envío del pedido.
 */
export function renderPublicPage(slug, { preview = false } = {}) {
  const p = one('SELECT * FROM pages WHERE slug = ?', [slug]);
  if (!p) return null;
  if (p.status !== 'published' && !preview) return null;

  const product = p.product_id ? one('SELECT * FROM products WHERE id = ?', [p.product_id]) : null;
  const offers = product ? all('SELECT * FROM offers WHERE product_id = ? ORDER BY sort, price', [product.id]) : [];
  const source = readFileSync(join(PAGES_DIR, p.file), 'utf8');

  const ctx = {
    pageId: p.id,
    pageSlug: p.slug,
    productId: p.product_id,
    testId: p.test_id,
    variant: p.variant,
    preview,
    product: product && { id: product.id, name: product.name, price: product.price, ship_cost: product.ship_cost },
    offers: offers.map((o) => ({ id: o.id, name: o.name, qty: o.qty, price: o.price, is_default: !!o.is_default })),
  };

  const inject = `\n<script>window.__DS__=${JSON.stringify(ctx).replace(/</g, '\\u003c')};</script>\n<script src="/_ds/runtime.js" defer></script>\n`;
  return source.includes('</body>')
    ? source.replace(/<\/body>/i, `${inject}</body>`)
    : source + inject;
}
