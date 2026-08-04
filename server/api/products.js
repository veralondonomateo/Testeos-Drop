import { all, one, run, insert, update } from '../db.js';
import { id, nowISO, slugify, clean, toInt } from '../lib/util.js';
import { HttpError, notFound } from '../lib/http.js';

const EDITABLE = ['name', 'slug', 'tagline', 'category', 'supplier', 'supplier_url', 'description',
  'image', 'cost', 'price', 'compare_price', 'ship_cost', 'stock', 'status'];

const offersOf = (productId) =>
  all('SELECT * FROM offers WHERE product_id = ? ORDER BY sort, price', [productId]);

export async function listProducts(query = {}) {
  const where = [];
  const params = [];
  if (query.status) { where.push('status = ?'); params.push(query.status); }
  if (query.q) {
    where.push('(name ILIKE ? OR slug ILIKE ? OR category ILIKE ?)');
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`);
  }
  const rows = await all(
    `SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`,
    params
  );
  return Promise.all(rows.map(async (p) => ({
    ...p,
    offers: await offersOf(p.id),
    orders_count: Number((await one('SELECT COUNT(*) n FROM orders WHERE product_id = ? AND status != ?', [p.id, 'cancelled'])).n),
    pages_count: Number((await one('SELECT COUNT(*) n FROM pages WHERE product_id = ?', [p.id])).n),
  })));
}

export async function getProduct(pid) {
  const p = await one('SELECT * FROM products WHERE id = ? OR slug = ?', [pid, pid]);
  if (!p) throw notFound('Producto no encontrado');
  return { ...p, offers: await offersOf(p.id) };
}

async function uniqueSlug(base, ignoreId = null) {
  const root = slugify(base);
  let slug = root;
  let n = 2;
  while (await one('SELECT id FROM products WHERE slug = ? AND id != ?', [slug, ignoreId ?? ''])) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

export async function createProduct(body) {
  const name = clean(body.name, 120);
  if (!name) throw new HttpError(400, 'El nombre del producto es obligatorio');
  const now = nowISO();
  const product = {
    id: id('prd'),
    slug: await uniqueSlug(body.slug || name),
    name,
    tagline: clean(body.tagline, 200),
    category: clean(body.category, 60),
    supplier: clean(body.supplier, 120),
    supplier_url: clean(body.supplier_url, 400),
    description: clean(body.description, 4000),
    image: clean(body.image, 500),
    cost: toInt(body.cost),
    price: toInt(body.price),
    compare_price: toInt(body.compare_price),
    ship_cost: toInt(body.ship_cost),
    stock: toInt(body.stock),
    status: ['draft', 'testing', 'winner', 'archived'].includes(body.status) ? body.status : 'draft',
    created_at: now,
    updated_at: now,
  };
  await insert('products', product);
  await saveOffers(product.id, body.offers);
  return getProduct(product.id);
}

export async function updateProduct(pid, body) {
  const existing = await one('SELECT * FROM products WHERE id = ?', [pid]);
  if (!existing) throw notFound('Producto no encontrado');
  const patch = { ...body };
  if (patch.slug != null) patch.slug = await uniqueSlug(patch.slug, pid);
  for (const k of ['cost', 'price', 'compare_price', 'ship_cost', 'stock']) {
    if (patch[k] != null) patch[k] = toInt(patch[k]);
  }
  patch.updated_at = nowISO();
  await update('products', pid, patch, [...EDITABLE, 'updated_at']);
  if (Array.isArray(body.offers)) await saveOffers(pid, body.offers);
  return getProduct(pid);
}

export async function deleteProduct(pid) {
  const { changes } = await run('DELETE FROM products WHERE id = ?', [pid]);
  if (!changes) throw notFound('Producto no encontrado');
  return { ok: true };
}

/** Reemplaza el set completo de ofertas del producto. */
export async function saveOffers(productId, offers) {
  if (!Array.isArray(offers)) return;
  await run('DELETE FROM offers WHERE product_id = ?', [productId]);
  for (const [i, o] of offers.slice(0, 12).entries()) {
    await insert('offers', {
      id: id('ofr'),
      product_id: productId,
      name: clean(o.name, 120) || `Oferta ${i + 1}`,
      qty: Math.max(1, toInt(o.qty, 1)),
      price: toInt(o.price),
      compare_price: toInt(o.compare_price),
      is_default: o.is_default ? 1 : 0,
      sort: toInt(o.sort, i),
    });
  }
}
