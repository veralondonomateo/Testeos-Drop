/**
 * Alta de la barra Dermafol para piel madura (mercado de EE. UU.) — `npm run seed:bar`.
 *
 * Crea o actualiza el producto, sus tres ofertas, el testeo T-003 y la landing
 * `/p/dermafol-bar`. Es idempotente: si ya existen, reescribe el HTML y deja el
 * resto en paz, así que se puede correr cada vez que se toque el generador para
 * republicar la página sin pasar por el panel.
 *
 * OJO CON LA MONEDA. El esquema guarda dinero en enteros sin decimales porque
 * nació para pesos colombianos. Aquí los importes son DÓLARES ENTEROS: 24, 57 y
 * 85 son US$24, US$57 y US$85. El panel los va a formatear como si fueran pesos
 * y el píxel los va a reportar como COP (está fijo en `public/runtime.js`), así
 * que el ROAS de este producto no es comparable con el de los otros dos sin
 * convertir. Ver la nota al final del README.
 */

import { all, one, insert, run, closePool, hasConnectionString } from './db.js';
import { nowISO } from './lib/util.js';
import { renderDermafolBarFunnel, DERMAFOL_BAR_SLUG } from './landing/dermafol-bar.js';

const PRODUCT_ID = 'prd_dermafol_bar';
const TEST_ID = 'tst_dermafol_bar';
const PAGE_ID = 'pag_dermafol_bar';

/* Dólares enteros. El orden importa: el índice de cada oferta es el que usa el
   `data-plan` de los planes de la landing para mover el <select> del checkout. */
const OFFERS = [
  { id: 'ofr_bar1', name: '1 bar — $24', qty: 1, price: 24, compare_price: 24, is_default: 0, sort: 0 },
  { id: 'ofr_bar3', name: '3 bars — $57 (most popular)', qty: 3, price: 57, compare_price: 72, is_default: 1, sort: 1 },
  { id: 'ofr_bar5', name: '5 bars — $85 (best value)', qty: 5, price: 85, compare_price: 120, is_default: 0, sort: 2 },
];

export async function seedDermafolBar() {
  const now = nowISO();

  const product = {
    id: PRODUCT_ID,
    slug: 'dermafol-cleansing-bar',
    name: 'Dermafol Cleansing Bar (US)',
    tagline: 'pH 5.5 syndet bar formulated for mature skin',
    category: 'Body care',
    supplier: '', supplier_url: '',
    description: 'Syndet cleansing bar, 4.23 oz, pH 5.5, formulated for skin 50+. '
      + 'Positioned on mature-skin comfort and freshness, not on odor correction. '
      + 'Prices are in whole US dollars.',
    image: '/assets/bar-hero.jpg',
    cost: 4,          // estimación del informe (§29.2: US$3,00-4,50 a 5.000 unidades)
    price: 24,
    compare_price: 24,
    ship_cost: 6,     // benchmark 3PL del informe, redondeado
    stock: 0,
    status: 'testing',
    created_at: now, updated_at: now,
  };

  const existingProduct = await one('SELECT id FROM products WHERE id = ?', [PRODUCT_ID]);
  if (existingProduct) {
    await run(
      `UPDATE products SET name = ?, tagline = ?, description = ?, image = ?,
       price = ?, cost = ?, ship_cost = ?, updated_at = ? WHERE id = ?`,
      [product.name, product.tagline, product.description, product.image,
        product.price, product.cost, product.ship_cost, now, PRODUCT_ID],
    );
  } else {
    await insert('products', product);
  }

  for (const o of OFFERS) {
    const row = { ...o, product_id: PRODUCT_ID };
    const exists = await one('SELECT id FROM offers WHERE id = ?', [o.id]);
    if (exists) {
      await run(
        'UPDATE offers SET name = ?, qty = ?, price = ?, compare_price = ?, is_default = ?, sort = ? WHERE id = ?',
        [o.name, o.qty, o.price, o.compare_price, o.is_default, o.sort, o.id],
      );
    } else {
      await insert('offers', row);
    }
  }

  const existingTest = await one('SELECT id FROM tests WHERE id = ?', [TEST_ID]);
  if (!existingTest) {
    await insert('tests', {
      id: TEST_ID, code: 'T-003',
      name: 'Dermafol Bar — US mature skin, cold Meta traffic',
      product_id: PRODUCT_ID,
      hypothesis: 'Angle A of the market report ("does your skin feel tight after a shower?") converts US '
        + 'adults 50-70 below a US$34 CPA on the 3-bar set, without ever naming age-related odor.',
      channel: 'meta', status: 'planned',
      budget: 0, target_cpa: 34,
      start_date: null, end_date: null, verdict: '', notes: '',
      created_at: now, updated_at: now,
    });
  }

  // Las ofertas se releen de la base para que la landing lleve los ids reales:
  // son los `value` de los <option> que el runtime manda con el pedido.
  const offers = await all('SELECT * FROM offers WHERE product_id = ? ORDER BY sort', [PRODUCT_ID]);
  const html = renderDermafolBarFunnel(offers);

  const existingPage = await one('SELECT id FROM pages WHERE id = ?', [PAGE_ID]);
  if (existingPage) {
    await run('UPDATE pages SET html = ?, title = ?, updated_at = ?, published_at = ? WHERE id = ?',
      [html, 'Dermafol Bar — US mature skin (A)', now, now, PAGE_ID]);
  } else {
    await insert('pages', {
      id: PAGE_ID, slug: DERMAFOL_BAR_SLUG,
      title: 'Dermafol Bar — US mature skin (A)',
      product_id: PRODUCT_ID, test_id: TEST_ID,
      // Entra en borrador a propósito: los testimonios son plantillas y una
      // landing en borrador sólo se ve con sesión y `?preview=1`, sin ensuciar
      // métricas ni quedar expuesta. Se publica desde el panel cuando esté
      // revisada.
      variant: 'A', type: 'landing', status: 'draft',
      html,
      notes: 'Ángulo A del informe: piel madura y comodidad. Sin claim de olor por edad, sin nonenal. '
        + 'Testimonios en plantilla — reemplazar por clientes reales antes de mandar tráfico.',
      created_at: now, updated_at: now, published_at: now,
    });
  }

  console.log(`[seed:bar] Listo · producto, 3 ofertas, T-003 y /p/${DERMAFOL_BAR_SLUG} (${(html.length / 1024).toFixed(0)} KB)`);
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!hasConnectionString()) {
    console.error('[seed:bar] Falta DATABASE_URL. Ponlo en .env y vuelve a correr.');
    process.exit(1);
  }
  seedDermafolBar()
    .catch((err) => { console.error('[seed:bar]', err.message); process.exitCode = 1; })
    .finally(closePool);
}
