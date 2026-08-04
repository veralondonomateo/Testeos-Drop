import { all, one, run, insert, getSetting, setSetting, createSchema, transaction } from './db.js';
import { id, nowISO, orderCode, hashPassword, dayKey } from './lib/util.js';
import { renderPlasmaLanding, VARIANTS, VARIANT_CODES } from './landing/plasma.js';


/**
 * La landing de Plasma se genera desde `server/landing/plasma.js`, que contiene
 * la estructura de alta conversión completa. Aquí sólo se le pasan las ofertas
 * reales del producto para que el selector del checkout apunte a sus ids.
 */
export const prepareLanding = (offers, variant = 'A') => renderPlasmaLanding(offers, variant);

/* ── Datos de demostración ────────────────────────────────────────────── */

const CITIES = [
  ['Bogotá', 'Cundinamarca'], ['Medellín', 'Antioquia'], ['Cali', 'Valle del Cauca'],
  ['Barranquilla', 'Atlántico'], ['Bucaramanga', 'Santander'], ['Cartagena', 'Bolívar'],
  ['Pereira', 'Risaralda'], ['Manizales', 'Caldas'], ['Cúcuta', 'Norte de Santander'],
  ['Ibagué', 'Tolima'], ['Villavicencio', 'Meta'], ['Santa Marta', 'Magdalena'],
];
const FIRST = ['Carlos', 'Patricia', 'Jorge', 'María', 'Luis', 'Gloria', 'Fernando', 'Rosa', 'Álvaro',
  'Beatriz', 'Hernán', 'Consuelo', 'Ricardo', 'Amparo', 'Óscar', 'Marta', 'Gustavo', 'Elena'];
const LAST = ['Muñoz', 'Gómez', 'Rodríguez', 'Ramírez', 'Torres', 'Cardona', 'Vargas', 'Osorio',
  'Betancur', 'Salazar', 'Quintero', 'Restrepo', 'Mejía', 'Arango'];

let seedState = 42;
const rnd = () => (seedState = (seedState * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (a, b) => Math.floor(a + rnd() * (b - a + 1));

async function seedDemoData({ product, page, test, offers }) {
  // 70 días para que la comparación "vs periodo anterior" a 30 días sea justa
  const DAYS = 70;
  const statusPool = [
    ...Array(46).fill('delivered'), ...Array(14).fill('shipped'), ...Array(10).fill('confirmed'),
    ...Array(11).fill('pending'), ...Array(5).fill('packed'), ...Array(9).fill('returned'),
    ...Array(5).fill('cancelled'),
  ];

  for (let d = DAYS; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(9, 0, 0, 0);
    const day = dayKey(date);

    // La curva sube conforme el testeo "escala"
    const ramp = 0.55 + (DAYS - d) / DAYS * 0.75;
    const weekend = [0, 6].includes(date.getDay()) ? 0.78 : 1;
    const sessions = Math.round(between(70, 130) * ramp * weekend);

    // Inversión publicitaria del día
    await insert('ad_spend', {
      id: id('spd'), test_id: test.id, product_id: product.id, date: day,
      channel: 'meta',
      spend: Math.round(sessions * between(900, 1400) / 100) * 100,
      impressions: sessions * between(28, 46),
      clicks: Math.round(sessions * 1.08),
      is_demo: 1,
    });

    let ctaClicks = 0, checkouts = 0;
    for (let s = 0; s < sessions; s++) {
      const ts = new Date(date);
      ts.setHours(between(7, 22), between(0, 59), between(0, 59));
      const sid = `demo_${day}_${s}`;
      const device = rnd() < 0.82 ? 'mobile' : rnd() < 0.6 ? 'desktop' : 'tablet';
      const source = rnd() < 0.86 ? 'facebook' : rnd() < 0.5 ? 'instagram' : 'directo';

      const ev = async (type, at) => insert('events', {
        id: id('evt'), type, page_id: page.id, product_id: product.id, test_id: test.id,
        session_id: sid, variant: 'A', device, utm_source: source, utm_campaign: 'plasma-corazon-frio',
        value: 0, is_demo: 1, created_at: at.toISOString(),
      });

      ev('pageview', ts);
      if (rnd() < 0.62) ev('scroll_50', new Date(ts.getTime() + 40000));
      if (rnd() < 0.31) ev('scroll_90', new Date(ts.getTime() + 95000));

      if (rnd() < 0.18) {
        ctaClicks++;
        ev('cta_click', new Date(ts.getTime() + 120000));
        if (rnd() < 0.55) {
          checkouts++;
          ev('checkout_open', new Date(ts.getTime() + 140000));

          if (rnd() < 0.34) {
            const offer = rnd() < 0.68 ? offers[0] : pick(offers);
            const [city, dept] = pick(CITIES);
            const name = `${pick(FIRST)} ${pick(LAST)}`;
            const phone = `3${between(0, 2)}${between(1000000, 9999999)}`;
            const status = pick(statusPool);
            const createdAt = new Date(ts.getTime() + 180000).toISOString();

            let customer = await one('SELECT * FROM customers WHERE phone = ?', [phone]);
            if (!customer) {
              customer = {
                id: id('cus'), phone, name, email: '', department: dept, city,
                address: `Calle ${between(1, 180)} # ${between(1, 90)}-${between(1, 90)}`,
                orders_count: 0, total_spent: 0, tags: 'demo', created_at: createdAt, last_order_at: createdAt,
              };
              await insert('customers', customer);
            }
            await run('UPDATE customers SET orders_count = orders_count + 1, last_order_at = ? WHERE id = ?', [createdAt, customer.id]);
            if (status === 'delivered') {
              await run('UPDATE customers SET total_spent = total_spent + ? WHERE id = ?', [offer.price, customer.id]);
            }

            const order = {
              id: id('ord'), code: orderCode(), product_id: product.id, page_id: page.id,
              test_id: test.id, customer_id: customer.id, offer_name: offer.name,
              customer_name: name, phone, email: '', department: dept, city,
              address: customer.address, notes: '',
              qty: offer.qty, subtotal: offer.price, shipping: 0, total: offer.price,
              cost_total: product.cost * offer.qty + product.ship_cost,
              payment_method: 'cod', status,
              courier: ['delivered', 'shipped', 'returned'].includes(status) ? pick(['Interrapidísimo', 'Servientrega', 'Envía']) : '',
              tracking: ['delivered', 'shipped', 'returned'].includes(status) ? String(between(10000000, 99999999)) : '',
              variant: 'A', utm_source: source, utm_medium: 'cpc',
              utm_campaign: 'plasma-corazon-frio', utm_content: `creativo-${between(1, 4)}`,
              device, session_id: sid, is_demo: 1,
              created_at: createdAt, updated_at: createdAt,
            };
            await insert('orders', order);
            await insert('order_events', {
              id: id('oev'), order_id: order.id, type: 'created',
              message: 'Pedido recibido desde la landing', actor: 'landing', created_at: createdAt,
            });
            await insert('events', {
              id: id('evt'), type: 'order', page_id: page.id, product_id: product.id, test_id: test.id,
              session_id: sid, variant: 'A', device, utm_source: source, utm_campaign: 'plasma-corazon-frio',
              value: offer.price, is_demo: 1, created_at: createdAt,
            });
          }
        }
      }
    }
    void ctaClicks; void checkouts;
  }
}

/**
 * Tráfico de demostración para las variantes B, C y D.
 * Cada una recibe un volumen y una conversión distintos a propósito, para que
 * el módulo de Test A/B tenga los tres casos que importan: una variante que ya
 * gana con confianza, una que pierde, y una sin muestra suficiente para decidir.
 */
async function seedVariantTraffic({ product, test, offers, pages }) {
  const PLAN = {
    B: { sessions: 900, cr: 0.033, days: 26 },   // gana
    C: { sessions: 820, cr: 0.020, days: 26 },   // pierde
    D: { sessions: 190, cr: 0.029, days: 9 },    // muestra corta
  };
  const statusPool = [
    ...Array(48).fill('delivered'), ...Array(15).fill('shipped'), ...Array(12).fill('confirmed'),
    ...Array(12).fill('pending'), ...Array(8).fill('returned'), ...Array(5).fill('cancelled'),
  ];

  for (const page of pages) {
    const plan = PLAN[page.variant];
    if (!plan) continue;

    for (let i = 0; i < plan.sessions; i++) {
      const ts = new Date();
      ts.setDate(ts.getDate() - between(0, plan.days));
      ts.setHours(between(7, 22), between(0, 59), between(0, 59), 0);
      const sid = `demo_${page.variant}_${i}`;
      const device = rnd() < 0.83 ? 'mobile' : 'desktop';
      const source = rnd() < 0.88 ? 'facebook' : 'instagram';

      const ev = async (type, at, value = 0) => insert('events', {
        id: id('evt'), type, page_id: page.id, product_id: product.id, test_id: test.id,
        session_id: sid, variant: page.variant, device, utm_source: source,
        utm_campaign: `plasma-${page.variant.toLowerCase()}`, value,
        is_demo: 1, created_at: at.toISOString(),
      });

      ev('pageview', ts);
      if (rnd() < 0.64) ev('scroll_50', new Date(ts.getTime() + 40000));
      if (rnd() < 0.33) ev('scroll_90', new Date(ts.getTime() + 95000));
      if (rnd() < 0.19) ev('cta_click', new Date(ts.getTime() + 120000));
      if (rnd() < 0.11) ev('checkout_open', new Date(ts.getTime() + 140000));

      if (rnd() >= plan.cr) continue;

      const offer = rnd() < 0.7 ? offers[0] : pick(offers);
      const [city, dept] = pick(CITIES);
      const name = `${pick(FIRST)} ${pick(LAST)}`;
      const phone = `3${between(0, 2)}${between(1000000, 9999999)}`;
      const status = pick(statusPool);
      const createdAt = new Date(ts.getTime() + 180000).toISOString();

      let customer = await one('SELECT * FROM customers WHERE phone = ?', [phone]);
      if (!customer) {
        customer = {
          id: id('cus'), phone, name, email: '', department: dept, city,
          address: `Calle ${between(1, 180)} # ${between(1, 90)}-${between(1, 90)}`,
          orders_count: 0, total_spent: 0, tags: 'demo', created_at: createdAt, last_order_at: createdAt,
        };
        await insert('customers', customer);
      }
      await run('UPDATE customers SET orders_count = orders_count + 1, last_order_at = ? WHERE id = ?', [createdAt, customer.id]);
      if (status === 'delivered') {
        await run('UPDATE customers SET total_spent = total_spent + ? WHERE id = ?', [offer.price, customer.id]);
      }

      const order = {
        id: id('ord'), code: orderCode(), product_id: product.id, page_id: page.id,
        test_id: test.id, customer_id: customer.id, offer_name: offer.name,
        customer_name: name, phone, email: '', department: dept, city,
        address: customer.address, notes: '',
        qty: offer.qty, subtotal: offer.price, shipping: 0, total: offer.price,
        cost_total: product.cost * offer.qty + product.ship_cost,
        payment_method: 'cod', status,
        courier: ['delivered', 'shipped', 'returned'].includes(status) ? pick(['Interrapidísimo', 'Servientrega', 'Envía']) : '',
        tracking: ['delivered', 'shipped', 'returned'].includes(status) ? String(between(10000000, 99999999)) : '',
        variant: page.variant, utm_source: source, utm_medium: 'cpc',
        utm_campaign: `plasma-${page.variant.toLowerCase()}`, utm_content: `creativo-${between(1, 4)}`,
        device, session_id: sid, is_demo: 1,
        created_at: createdAt, updated_at: createdAt,
      };
      await insert('orders', order);
      await insert('order_events', {
        id: id('oev'), order_id: order.id, type: 'created',
        message: 'Pedido recibido desde la landing', actor: 'landing', created_at: createdAt,
      });
      ev('order', new Date(createdAt), offer.price);
    }
  }
}

/** Borra todo lo marcado como demo. Se expone en Ajustes del panel. */
export async function purgeDemoData() {
  const orderIds = (await all('SELECT id FROM orders WHERE is_demo = 1')).map((r) => r.id);
  for (const oid of orderIds) await run('DELETE FROM order_events WHERE order_id = ?', [oid]);
  await run('DELETE FROM orders WHERE is_demo = 1');
  await run('DELETE FROM events WHERE is_demo = 1');
  await run('DELETE FROM ad_spend WHERE is_demo = 1');
  await run("DELETE FROM customers WHERE tags = 'demo'");
  await setSetting('demo_data', false);
  return { ok: true, removed: orderIds.length };
}

export const hasDemoData = async () => (await getSetting('demo_data', false)) === true;

/* ── Siembra inicial ──────────────────────────────────────────────────── */

export async function ensureSeed() {
  if (await one('SELECT id FROM users LIMIT 1')) return false;
  const now = nowISO();

  // Credenciales del primer usuario. En producción ponlas como variables de
  // entorno: dejar 'admin123' en un panel expuesto es regalar el acceso.
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@dropstudio.co').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  if (adminPass === 'admin123') {
    console.warn('[seed] ⚠ Usando la contraseña por defecto. Define ADMIN_PASSWORD antes de exponer el panel.');
  }
  await run('INSERT INTO users (id,email,name,role,password_hash,created_at) VALUES (?,?,?,?,?,?)',
    [id('usr'), adminEmail, 'Mateo', 'owner', hashPassword(adminPass), now]);

  await setSetting('store', {
    name: 'DropStudio',
    legal_name: 'DropStudio SAS',
    country: 'CO',
    currency: 'COP',
    whatsapp: '',
    default_shipping: 0,
    timezone: 'America/Bogota',
  });
  await setSetting('couriers', [
    { name: 'Interrapidísimo', cost: 12000, active: true },
    { name: 'Servientrega', cost: 13500, active: true },
    { name: 'Envía', cost: 12500, active: true },
    { name: 'Coordinadora', cost: 14000, active: false },
  ]);
  await setSetting('pixels', { meta: '', tiktok: '', google: '' });

  // ── Producto piloto ──
  const product = {
    id: id('prd'), slug: 'plasma-remolacha-organica',
    name: 'Plasma — Remolacha Orgánica',
    tagline: 'Fuerza concentrada para tu corazón · 2040 mg',
    category: 'Salud y bienestar',
    supplier: '', supplier_url: '',
    description: 'Suplemento de remolacha orgánica de máxima potencia (2040 mg) con pimienta negra. '
      + 'Una tableta al día como apoyo natural a la circulación y a una presión saludable. '
      + 'Registro INVIMA. Pago contra entrega en toda Colombia.',
    image: '',
    cost: 22000,          // costo estimado por frasco — ajústalo en el panel
    price: 99900,
    compare_price: 200000,
    ship_cost: 12000,     // costo de envío que asumes tú
    stock: 180,
    status: 'testing',
    created_at: now, updated_at: now,
  };
  await insert('products', product);

  const offers = [
    { id: id('ofr'), product_id: product.id, name: 'Lleva 2, Paga 1 — $99.900 (recomendado)', qty: 2, price: 99900, compare_price: 200000, is_default: 1, sort: 0 },
    { id: id('ofr'), product_id: product.id, name: '4 frascos — $179.900 (ahorra más)', qty: 4, price: 179900, compare_price: 400000, is_default: 0, sort: 1 },
    { id: id('ofr'), product_id: product.id, name: '1 frasco — $99.900', qty: 1, price: 99900, compare_price: 100000, is_default: 0, sort: 2 },
  ];
  for (const o of offers) await insert('offers', o);

  // ── Testeo piloto ──
  const test = {
    id: id('tst'), code: 'T-001',
    name: 'Plasma Corazón — tráfico frío Meta',
    product_id: product.id,
    hypothesis: 'Un público 50+ interesado en salud cardiovascular convierte por debajo de $35.000 de CPA '
      + 'con el ángulo "óxido nítrico" y pago contra entrega.',
    channel: 'meta', status: 'running',
    budget: 1500000, target_cpa: 35000,
    start_date: dayKey(new Date(Date.now() - 70 * 86400000)),
    end_date: null, verdict: '', notes: '',
    created_at: now, updated_at: now,
  };
  await insert('tests', test);

  // ── Landings: una por variante, todas contra el mismo testeo ──
  const pages = [];
  for (const code of VARIANT_CODES) {
    const v = VARIANTS[code];
    const page = {
      id: id('pag'), slug: v.slug,
      title: `Plasma — ${v.name}`,
      product_id: product.id, test_id: test.id,
      variant: code, type: 'landing', status: 'published',
      html: renderPlasmaLanding(offers, code),
      notes: `Ángulo ${v.angle}. Hipótesis: ${v.hypothesis}`,
      created_at: now, updated_at: now, published_at: now,
    };
    await insert('pages', page);
    pages.push(page);
  }

  // ── Datos de demostración ──
  if (process.env.SEED_DEMO === '1') {
    try {
      await seedDemoData({ product, page: pages[0], test, offers });
      await seedVariantTraffic({ product, test, offers, pages });
      await setSetting('demo_data', true);
    } catch (err) {
      console.error('[seed] no se pudieron generar los datos de demostración:', err.message);
    }
  }

  console.log('[seed] Base inicializada · producto, 4 variantes y testeo listos.');
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ensureSeed();
}
