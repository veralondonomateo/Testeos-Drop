/**
 * Dataset compacto para el modo demostración.
 *
 * Se siembra en memoria al primer arranque, así que tiene que ser rápido:
 * se insertan las filas por lotes en vez de una por una. Los volúmenes son
 * bastante menores que los del seed completo, pero suficientes para que
 * ninguna vista del panel se vea vacía y el módulo de A/B tenga sus tres
 * casos (una variante que gana, una que pierde, una sin muestra).
 */
import { id, nowISO, orderCode, hashPassword, dayKey } from './lib/util.js';
import { renderPlasmaLanding, VARIANTS, VARIANT_CODES } from './landing/plasma.js';

const CITIES = [
  ['Bogotá', 'Cundinamarca'], ['Medellín', 'Antioquia'], ['Cali', 'Valle del Cauca'],
  ['Barranquilla', 'Atlántico'], ['Bucaramanga', 'Santander'], ['Cartagena', 'Bolívar'],
  ['Pereira', 'Risaralda'], ['Manizales', 'Caldas'],
];
const FIRST = ['Carlos', 'Patricia', 'Jorge', 'María', 'Luis', 'Gloria', 'Fernando', 'Rosa',
  'Álvaro', 'Beatriz', 'Hernán', 'Consuelo', 'Ricardo', 'Amparo', 'Óscar', 'Marta'];
const LAST = ['Muñoz', 'Gómez', 'Rodríguez', 'Ramírez', 'Torres', 'Cardona', 'Vargas',
  'Osorio', 'Betancur', 'Salazar', 'Quintero', 'Restrepo'];

// Generador determinista: la demo se ve igual en cada arranque
let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const between = (a, b) => Math.floor(a + rnd() * (b - a + 1));

/** INSERT por lotes: una sola sentencia con N tuplas. */
async function bulk(db, table, cols, rows) {
  if (!rows.length) return;
  const CHUNK = 400;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const params = [];
    const tuples = slice.map((row) => {
      const marks = cols.map((c) => { params.push(row[c]); return `$${params.length}`; });
      return `(${marks.join(',')})`;
    });
    await db.query(`INSERT INTO ${table} (${cols.join(',')}) VALUES ${tuples.join(',')}`, params);
  }
}

export async function seedDemo(db) {
  const now = nowISO();

  /* ── Usuario ── */
  await db.query(
    'INSERT INTO users (id,email,name,role,password_hash,created_at) VALUES ($1,$2,$3,$4,$5,$6)',
    [id('usr'), 'demo@dropstudio.co', 'Mateo', 'owner', hashPassword('demo'), now]
  );

  /* ── Ajustes ── */
  const settings = [
    ['store', { name: 'DropStudio', legal_name: 'DropStudio SAS', country: 'CO', currency: 'COP', whatsapp: '', default_shipping: 0, timezone: 'America/Bogota' }],
    ['couriers', [
      { name: 'Interrapidísimo', cost: 12000, active: true },
      { name: 'Servientrega', cost: 13500, active: true },
      { name: 'Envía', cost: 12500, active: true },
    ]],
    ['pixels', { meta: '', tiktok: '', google: '' }],
    ['demo_data', true],
  ];
  await bulk(db, 'settings', ['key', 'value'],
    settings.map(([k, v]) => ({ key: k, value: JSON.stringify(v) })));

  /* ── Producto y ofertas ── */
  const product = {
    id: id('prd'), slug: 'plasma-remolacha-organica',
    name: 'Plasma — Remolacha Orgánica',
    tagline: 'Fuerza concentrada para tu corazón · 2040 mg',
    category: 'Salud y bienestar', supplier: '', supplier_url: '',
    description: 'Suplemento de remolacha orgánica de máxima potencia (2040 mg) con pimienta negra. '
      + 'Una tableta al día como apoyo natural a la circulación. Registro INVIMA.',
    image: '', cost: 22000, price: 99900, compare_price: 200000, ship_cost: 12000,
    stock: 180, status: 'testing', created_at: now, updated_at: now,
  };
  await bulk(db, 'products', Object.keys(product), [product]);

  const offers = [
    { id: id('ofr'), product_id: product.id, name: 'Lleva 2, Paga 1 — $99.900 (recomendado)', qty: 2, price: 99900, compare_price: 200000, is_default: 1, sort: 0 },
    { id: id('ofr'), product_id: product.id, name: '4 frascos — $179.900 (ahorra más)', qty: 4, price: 179900, compare_price: 400000, is_default: 0, sort: 1 },
    { id: id('ofr'), product_id: product.id, name: '1 frasco — $99.900', qty: 1, price: 99900, compare_price: 100000, is_default: 0, sort: 2 },
  ];
  await bulk(db, 'offers', Object.keys(offers[0]), offers);

  /* ── Testeo ── */
  const test = {
    id: id('tst'), code: 'T-001', name: 'Plasma Corazón — tráfico frío Meta',
    product_id: product.id,
    hypothesis: 'Un público 50+ interesado en salud cardiovascular convierte por debajo de '
      + '$35.000 de CPA con el ángulo "óxido nítrico" y pago contra entrega.',
    channel: 'meta', status: 'running', budget: 1500000, target_cpa: 35000,
    start_date: dayKey(new Date(Date.now() - 30 * 86400000)), end_date: null,
    verdict: '', notes: '', created_at: now, updated_at: now,
  };
  await bulk(db, 'tests', Object.keys(test), [test]);

  /* ── Las 4 landings ── */
  const pages = VARIANT_CODES.map((code) => {
    const v = VARIANTS[code];
    return {
      id: id('pag'), slug: v.slug, title: `Plasma — ${v.name}`,
      product_id: product.id, test_id: test.id, variant: code,
      type: 'landing', status: 'published',
      html: renderPlasmaLanding(offers, code),
      notes: `Ángulo ${v.angle}. Hipótesis: ${v.hypothesis}`,
      created_at: now, updated_at: now, published_at: now,
    };
  });
  await bulk(db, 'pages', Object.keys(pages[0]), pages);

  /* ── Tráfico, pedidos e inversión ──
     Conversión distinta por variante a propósito: B gana, C pierde y D se
     queda sin muestra suficiente. */
  const PLAN = { A: { s: 26, cr: 0.028 }, B: { s: 20, cr: 0.042 }, C: { s: 18, cr: 0.014 }, D: { s: 6, cr: 0.030 } };
  const DAYS = 30;
  const statusPool = [
    ...Array(48).fill('delivered'), ...Array(14).fill('shipped'), ...Array(12).fill('confirmed'),
    ...Array(12).fill('pending'), ...Array(9).fill('returned'), ...Array(5).fill('cancelled'),
  ];

  const events = [];
  const orders = [];
  const orderEvents = [];
  const customers = [];
  const spend = [];
  const seenPhones = new Set();

  for (let d = DAYS; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const day = dayKey(date);
    const weekend = [0, 6].includes(date.getDay()) ? 0.8 : 1;

    for (const page of pages) {
      const plan = PLAN[page.variant];
      if (!plan) continue;
      const sessions = Math.round(plan.s * weekend * (0.7 + (DAYS - d) / DAYS * 0.6));

      if (page.variant === 'A') {
        spend.push({
          id: id('spd'), test_id: test.id, product_id: product.id, date: day, channel: 'meta',
          spend: Math.round(sessions * between(3200, 4600) / 100) * 100,
          impressions: sessions * between(30, 46), clicks: Math.round(sessions * 1.1), is_demo: 1,
        });
      }

      for (let s = 0; s < sessions; s++) {
        const ts = new Date(date);
        ts.setHours(between(7, 22), between(0, 59), between(0, 59), 0);
        const sid = `d_${page.variant}_${day}_${s}`;
        const device = rnd() < 0.83 ? 'mobile' : 'desktop';
        const source = rnd() < 0.87 ? 'facebook' : 'instagram';
        const base = {
          page_id: page.id, product_id: product.id, test_id: test.id, session_id: sid,
          variant: page.variant, device, utm_source: source,
          utm_campaign: `plasma-${page.variant.toLowerCase()}`, is_demo: 1,
        };
        const push = (type, offsetMs, value = 0) => events.push({
          ...base, id: id('evt'), type, value,
          created_at: new Date(ts.getTime() + offsetMs).toISOString(),
        });

        push('pageview', 0);
        if (rnd() < 0.62) push('scroll_50', 40000);
        if (rnd() < 0.30) push('scroll_90', 95000);
        if (rnd() < 0.18) push('cta_click', 120000);
        if (rnd() < 0.10) push('checkout_open', 140000);
        if (rnd() >= plan.cr) continue;

        const offer = rnd() < 0.7 ? offers[0] : pick(offers);
        const [city, dept] = pick(CITIES);
        const name = `${pick(FIRST)} ${pick(LAST)}`;
        let phone = `3${between(0, 2)}${between(1000000, 9999999)}`;
        while (seenPhones.has(phone)) phone = `3${between(0, 2)}${between(1000000, 9999999)}`;
        seenPhones.add(phone);
        const status = pick(statusPool);
        const createdAt = new Date(ts.getTime() + 180000).toISOString();
        const address = `Calle ${between(1, 180)} # ${between(1, 90)}-${between(1, 90)}`;
        const customerId = id('cus');

        customers.push({
          id: customerId, phone, name, email: '', department: dept, city, address,
          orders_count: 1, total_spent: status === 'delivered' ? offer.price : 0,
          tags: 'demo', created_at: createdAt, last_order_at: createdAt,
        });

        const orderId = id('ord');
        const shipped = ['delivered', 'shipped', 'returned'].includes(status);
        orders.push({
          id: orderId, code: orderCode(), product_id: product.id, page_id: page.id,
          test_id: test.id, customer_id: customerId, offer_name: offer.name,
          customer_name: name, phone, email: '', department: dept, city, address, notes: '',
          qty: offer.qty, subtotal: offer.price, shipping: 0, total: offer.price,
          cost_total: product.cost * offer.qty + product.ship_cost,
          payment_method: 'cod', status,
          courier: shipped ? pick(['Interrapidísimo', 'Servientrega', 'Envía']) : '',
          tracking: shipped ? String(between(10000000, 99999999)) : '',
          variant: page.variant, utm_source: source, utm_medium: 'cpc',
          utm_campaign: `plasma-${page.variant.toLowerCase()}`,
          utm_content: `creativo-${between(1, 4)}`, device, session_id: sid, is_demo: 1,
          created_at: createdAt, updated_at: createdAt,
        });
        orderEvents.push({
          id: id('oev'), order_id: orderId, type: 'created',
          message: 'Pedido recibido desde la landing', actor: 'landing', created_at: createdAt,
        });
        push('order', 180000, offer.price);
      }
    }
  }

  await bulk(db, 'customers', Object.keys(customers[0]), customers);
  await bulk(db, 'orders', Object.keys(orders[0]), orders);
  await bulk(db, 'order_events', Object.keys(orderEvents[0]), orderEvents);
  await bulk(db, 'events', Object.keys(events[0]), events);
  await bulk(db, 'ad_spend', Object.keys(spend[0]), spend);

  return { orders: orders.length, events: events.length };
}
