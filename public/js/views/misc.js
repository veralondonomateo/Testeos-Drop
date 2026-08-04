/* Clientes · Logística · Finanzas · Ajustes · módulos próximos */

import {
  el, clear, api, state, money, moneyShort, num, pct, fmtDate, fmtDateTime, fmtAgo,
  orderStatus, toast, toastError, debounce, initials, parseMoney, copyText, seriesColors,
} from '../core.js';
import { icon } from '../icons.js';
import {
  card, dataTable, cellStack, statusBadge, emptyState, skeletonTable, statTile,
  searchBox, selectControl, drawer, modal, field, readForm, confirmDialog,
  banner, defList, comingSoon, rankList, timeline,
} from '../ui.js';
import { barChart, lineChart, legend, tableView } from '../charts.js';
import { setHeader, navigate, refreshBootstrap } from '../app.js';

/* ═══ Clientes ════════════════════════════════════════════════════════ */

export async function customersView({ host }) {
  let customers = [];
  const filters = { q: '' };

  setHeader('Clientes', 'Quién te compra, cuánto y desde dónde');

  const statsHost = el('div');
  const listHost = el('div');

  host.append(
    statsHost,
    el('div', { class: 'filters', style: { marginTop: '16px' } },
      el('div', { class: 'spacer' }),
      searchBox('Buscar por nombre, teléfono o ciudad…', debounce((v) => { filters.q = v; load(); }))),
    card({ flush: true, body: listHost })
  );
  listHost.append(skeletonTable(6));

  async function load() {
    listHost.classList.add('refreshing');
    try {
      customers = (await api.get('/api/customers', filters)).customers;
      renderStats();
      renderList();
    } catch (err) { toastError(err); }
    finally { listHost.classList.remove('refreshing'); }
  }

  function renderStats() {
    const repeat = customers.filter((c) => c.orders_count > 1).length;
    const spent = customers.reduce((a, c) => a + c.total_spent, 0);
    clear(statsHost).append(el('div', { class: 'stats c4' },
      statTile({ label: 'Clientes', value: num(customers.length) }),
      statTile({
        label: 'Compradores recurrentes', value: num(repeat),
        hint: customers.length ? pct((repeat / customers.length) * 100, 1) : '—',
      }),
      statTile({ label: 'Facturado a clientes', value: money(spent), hint: 'sólo pedidos entregados' }),
      statTile({
        label: 'Valor por cliente',
        value: customers.length ? money(Math.round(spent / customers.length)) : '—',
      })));
  }

  function renderList() {
    clear(listHost);
    if (!customers.length) {
      listHost.append(emptyState({
        icon: 'customers',
        title: filters.q ? 'Ningún cliente coincide' : 'Todavía no hay clientes',
        text: 'Cada pedido crea o actualiza automáticamente su ficha de cliente.',
      }));
      return;
    }

    listHost.append(dataTable([
      {
        key: 'name', label: 'Cliente',
        render: (c) => el('div', { class: 'row', style: { gap: '11px' } },
          el('div', { class: 'avatar', style: { flex: '0 0 32px' }, text: initials(c.name) }),
          cellStack(c.name, c.phone)),
      },
      { key: 'city', label: 'Ciudad', render: (c) => cellStack(c.city || '—', c.department || '') },
      { key: 'orders_count', label: 'Pedidos', num: true, render: (c) => num(c.orders_count) },
      { key: 'total_spent', label: 'Gastado', num: true, render: (c) => el('span', { class: 'cell-strong num', text: money(c.total_spent) }) },
      {
        key: 'last_order_at', label: 'Último pedido', num: true,
        render: (c) => el('span', { class: 'small muted', text: fmtAgo(c.last_order_at) }),
      },
    ], customers, { onRowClick: (c) => openCustomer(c.id) }));
  }

  async function openCustomer(cid) {
    const { customer } = await api.get(`/api/customers/${cid}`);
    const body = el('div', { class: 'stack' });

    body.append(el('div', { class: 'stats c2' },
      statTile({ label: 'Pedidos', value: num(customer.orders_count) }),
      statTile({ label: 'Total gastado', value: money(customer.total_spent), hint: 'entregados' })));

    body.append(card({
      title: 'Contacto',
      body: defList([
        ['Teléfono', customer.phone
          ? el('a', {
            href: `https://wa.me/57${customer.phone.replace(/\D/g, '')}`,
            target: '_blank', rel: 'noopener', style: { color: 'var(--series-1)' },
          }, customer.phone)
          : '—'],
        ['Correo', customer.email || '—'],
        ['Dirección', customer.address || '—'],
        ['Ciudad', `${customer.city || '—'}${customer.department ? `, ${customer.department}` : ''}`],
        ['Cliente desde', fmtDate(customer.created_at)],
      ]),
    }));

    body.append(card({
      title: 'Historial de pedidos',
      flush: true,
      body: customer.orders.length ? dataTable([
        { key: 'code', label: 'Pedido', render: (o) => cellStack(o.code, fmtDate(o.created_at)) },
        { key: 'product_name', label: 'Producto', render: (o) => o.product_name || '—' },
        { key: 'total', label: 'Total', num: true, render: (o) => money(o.total) },
        { key: 'status', label: 'Estado', render: (o) => statusBadge(orderStatus(o.status)) },
      ], customer.orders, { onRowClick: (o) => { d.close(); navigate(`orders/${o.id}`); } })
        : emptyState({ icon: 'cart', title: 'Sin pedidos', text: '' }),
    }));

    const d = drawer({ title: customer.name, subtitle: customer.phone, body });
  }

  await load();
}

/* ═══ Logística ═══════════════════════════════════════════════════════ */

export async function logisticsView({ host }) {
  setHeader('Logística', 'El estado real de tus envíos contra entrega');

  const content = el('div', { class: 'stack' });
  host.append(content);
  content.append(skeletonTable(6));

  const { orders } = await api.get('/api/orders', { limit: 500 });
  clear(content);

  const inTransit = orders.filter((o) => ['confirmed', 'packed', 'shipped'].includes(o.status));
  const delivered = orders.filter((o) => o.status === 'delivered');
  const returned = orders.filter((o) => o.status === 'returned');
  const shippedTotal = delivered.length + returned.length;
  const deliveryRate = shippedTotal ? (delivered.length / shippedTotal) * 100 : 0;

  // En COD la tasa de entrega es la métrica que más margen mueve
  content.append(el('div', { class: 'stats c4' },
    statTile({ label: 'En tránsito', value: num(inTransit.length), hint: 'confirmados, alistados y en camino' }),
    statTile({ label: 'Entregados', value: num(delivered.length), hint: money(delivered.reduce((a, o) => a + o.total, 0)) }),
    statTile({ label: 'Devueltos', value: num(returned.length), hint: `costo perdido ${money(returned.reduce((a, o) => a + o.cost_total, 0))}` }),
    statTile({
      label: 'Tasa de entrega', value: shippedTotal ? pct(deliveryRate) : '—',
      badge: shippedTotal
        ? el('span', { class: `badge ${deliveryRate >= 80 ? 'good' : deliveryRate >= 65 ? 'warning' : 'critical'}` },
          deliveryRate >= 80 ? 'Saludable' : deliveryRate >= 65 ? 'Mejorable' : 'Crítica')
        : null,
    })));

  if (shippedTotal >= 10 && deliveryRate < 75) {
    content.append(banner({
      tone: 'warn', ico: 'alert',
      html: `Tu tasa de entrega está en <b>${pct(deliveryRate)}</b>. Cada devolución te cuesta el producto y el flete: `
        + 'confirmar por WhatsApp antes de despachar suele subirla entre 10 y 20 puntos.',
    }));
  }

  /* Transportadoras */
  const byCourier = {};
  for (const o of [...delivered, ...returned, ...inTransit]) {
    const key = o.courier || 'Sin asignar';
    byCourier[key] ??= { name: key, total: 0, delivered: 0, returned: 0 };
    byCourier[key].total++;
    if (o.status === 'delivered') byCourier[key].delivered++;
    if (o.status === 'returned') byCourier[key].returned++;
  }
  const courierRows = Object.values(byCourier).sort((a, b) => b.total - a.total);

  content.append(el('div', { class: 'grid main-side' },
    card({
      title: 'Desempeño por transportadora',
      subtitle: 'Cuál te entrega mejor',
      flush: true,
      body: courierRows.length ? dataTable([
        { key: 'name', label: 'Transportadora' },
        { key: 'total', label: 'Envíos', num: true, render: (r) => num(r.total) },
        { key: 'delivered', label: 'Entregados', num: true, render: (r) => num(r.delivered) },
        { key: 'returned', label: 'Devueltos', num: true, render: (r) => num(r.returned) },
        {
          key: 'rate', label: 'Tasa de entrega', num: true,
          render: (r) => {
            const closed = r.delivered + r.returned;
            if (!closed) return '—';
            const rate = (r.delivered / closed) * 100;
            return el('span', {
              class: 'cell-strong num',
              style: { color: rate >= 80 ? 'var(--good)' : rate >= 65 ? 'var(--warning)' : 'var(--critical)' },
              text: pct(rate),
            });
          },
        },
      ], courierRows) : emptyState({ icon: 'truck', title: 'Sin envíos registrados', text: 'Asigna transportadora y guía desde el detalle de cada pedido.' }),
    }),
    card({
      title: 'Transportadoras configuradas',
      subtitle: 'Se gestionan desde Ajustes',
      body: el('div', { class: 'rank-list' },
        (state.bootstrap.settings.couriers || []).map((c) => el('div', { class: 'rank-item' },
          el('div', { class: 'body' },
            el('div', { class: 'name', text: c.name }),
            el('div', { class: 'sub', text: c.active ? 'Activa' : 'Inactiva' })),
          el('span', { class: 'val', text: money(c.cost) })))),
    })));

  /* Pendientes de despacho */
  const toShip = orders.filter((o) => ['pending', 'confirmed', 'packed'].includes(o.status));
  content.append(card({
    title: 'Por despachar',
    subtitle: `${num(toShip.length)} pedidos esperando salir`,
    flush: true,
    body: toShip.length ? dataTable([
      { key: 'code', label: 'Pedido', render: (o) => cellStack(o.code, fmtAgo(o.created_at)) },
      { key: 'customer_name', label: 'Cliente', render: (o) => cellStack(o.customer_name, o.phone) },
      { key: 'city', label: 'Destino', render: (o) => cellStack(o.city || '—', o.department || '') },
      { key: 'address', label: 'Dirección', render: (o) => el('span', { class: 'small', text: o.address || '—' }) },
      { key: 'total', label: 'A cobrar', num: true, render: (o) => money(o.total) },
      { key: 'status', label: 'Estado', render: (o) => statusBadge(orderStatus(o.status)) },
    ], toShip, { onRowClick: (o) => navigate(`orders/${o.id}`) })
      : emptyState({ icon: 'check', title: 'Todo despachado', text: 'No queda ningún pedido pendiente de salida.' }),
  }));
}

/* ═══ Finanzas ════════════════════════════════════════════════════════ */

export async function financeView({ host }) {
  let range = localStorage.getItem('ds_range') || '30d';
  const cleanups = [];

  const rangeSel = selectControl([
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 90 días' },
  ], range, (v) => { range = v; localStorage.setItem('ds_range', v); load(); }, { width: '168px' });

  setHeader('Finanzas', 'De la venta bruta a la utilidad que te queda', rangeSel);

  const content = el('div', { class: 'stack' });
  host.append(content);

  async function load() {
    content.classList.add('refreshing');
    try {
      const [data, spendRes, testsRes] = await Promise.all([
        api.get('/api/analytics', { range }),
        api.get('/api/spend'),
        api.get('/api/tests'),
      ]);
      cleanups.forEach((fn) => fn?.());
      cleanups.length = 0;
      clear(content);
      render(data, spendRes.spend, testsRes.tests);
    } catch (err) { toastError(err); }
    finally { content.classList.remove('refreshing'); }
  }

  function render(data, spendLog, tests) {
    const k = data.kpis;
    const s = data.series;
    const colors = seriesColors();

    const revenue = k.revenue.value;
    const spend = k.spend.value;
    const cogs = s.reduce((a, d) => a + 0, 0); // el COGS del periodo llega dentro de la utilidad
    const profit = k.profit.value;
    const productCost = revenue - spend - profit;   // ingresos − pauta − utilidad

    /* Cascada: de lo cobrado a lo que queda */
    content.append(card({
      title: 'De lo cobrado a lo que te queda',
      subtitle: `${fmtDate(data.from)} — ${fmtDate(data.to)}`,
      body: el('div', { class: 'stack', style: { gap: '14px' } },
        waterfallRow('Ingresos cobrados', revenue, revenue, colors[2], 'Pedidos entregados en el periodo'),
        waterfallRow('− Costo de producto y envío', productCost, revenue, colors[1], 'Lo que te costó cumplir esos pedidos'),
        waterfallRow('− Inversión en pauta', spend, revenue, colors[3], 'Lo registrado en tus testeos'),
        el('div', { style: { height: '1px', background: 'var(--line)', margin: '4px 0' } }),
        waterfallRow('= Utilidad neta', profit, revenue, profit >= 0 ? 'var(--good)' : 'var(--critical)', 'Lo que realmente ganaste')),
    }));

    content.append(el('div', { class: 'stats c4' },
      statTile({ label: 'Ingresos cobrados', value: money(revenue), delta: k.revenue.delta }),
      statTile({ label: 'Inversión en pauta', value: money(spend), delta: k.spend.delta, inverse: true }),
      statTile({
        label: 'Utilidad neta', value: money(profit), delta: k.profit.delta,
        badge: el('span', { class: `badge ${profit >= 0 ? 'good' : 'critical'}` }, profit >= 0 ? 'Positiva' : 'Negativa'),
      }),
      statTile({
        label: 'Margen neto', value: revenue ? pct((profit / revenue) * 100) : '—',
        hint: 'sobre lo cobrado',
      })));

    /* Ingresos vs inversión */
    const chartHost = el('div');
    content.append(card({
      title: 'Ingresos frente a inversión',
      subtitle: 'Ambas magnitudes en pesos, en un solo eje',
      actions: legend([{ name: 'Cobrado', color: colors[2] }, { name: 'Invertido', color: colors[1] }], { line: true }),
      body: el('div', {}, chartHost,
        tableView([
          { key: 'date', label: 'Fecha' },
          { key: 'revenue', label: 'Cobrado', num: true },
          { key: 'spend', label: 'Invertido', num: true },
          { key: 'diff', label: 'Diferencia', num: true },
        ], s.map((d) => ({
          date: fmtDate(d.date), revenue: money(d.revenue), spend: money(d.spend),
          diff: money(d.revenue - d.spend),
        })))),
    }));
    cleanups.push(lineChart(chartHost, {
      labels: s.map((d) => d.date),
      series: [
        { name: 'Cobrado', values: s.map((d) => d.revenue), color: colors[2], format: money },
        { name: 'Invertido', values: s.map((d) => d.spend), color: colors[1], format: money },
      ],
      formatY: moneyShort, height: 250,
    }));

    /* Rentabilidad por testeo */
    const withSpend = tests.filter((t) => t.metrics.spend > 0 || t.metrics.orders > 0);
    content.append(card({
      title: 'Rentabilidad por testeo',
      subtitle: 'Cuál te devuelve el dinero y cuál se lo come',
      flush: true,
      body: withSpend.length ? dataTable([
        { key: 'name', label: 'Testeo', render: (t) => cellStack(t.name, `${t.code} · ${t.product_name || '—'}`) },
        { key: 'spend', label: 'Invertido', num: true, render: (t) => money(t.metrics.spend) },
        { key: 'revenue', label: 'Cobrado', num: true, render: (t) => money(t.metrics.revenue) },
        { key: 'cogs', label: 'Costo producto', num: true, render: (t) => money(t.metrics.cogs) },
        {
          key: 'profit', label: 'Utilidad', num: true,
          render: (t) => el('span', {
            class: 'cell-strong num',
            style: { color: t.metrics.profit >= 0 ? 'var(--good)' : 'var(--critical)' },
            text: money(t.metrics.profit),
          }),
        },
        { key: 'roas', label: 'ROAS', num: true, render: (t) => (t.metrics.roas ? `${String(t.metrics.roas).replace('.', ',')}×` : '—') },
      ], withSpend, { onRowClick: (t) => navigate(`tests/${t.id}`) })
        : emptyState({ icon: 'finance', title: 'Sin datos financieros', text: 'Registra la inversión de tus testeos para ver la rentabilidad real.' }),
    }));

    /* Registro de inversión */
    content.append(card({
      title: 'Registro de inversión publicitaria',
      subtitle: `${spendLog.length} entradas`,
      flush: true,
      body: spendLog.length ? dataTable([
        { key: 'date', label: 'Fecha', render: (r) => fmtDate(r.date) },
        { key: 'test_name', label: 'Testeo', render: (r) => cellStack(r.test_name || '—', r.test_code || '') },
        { key: 'channel', label: 'Canal' },
        { key: 'spend', label: 'Inversión', num: true, render: (r) => money(r.spend) },
        { key: 'clicks', label: 'Clics', num: true, render: (r) => num(r.clicks) },
        { key: 'cpc', label: 'CPC', num: true, render: (r) => (r.clicks ? money(Math.round(r.spend / r.clicks)) : '—') },
      ], spendLog.slice(0, 60))
        : emptyState({ icon: 'wallet', title: 'Sin inversión registrada', text: 'Añádela desde el detalle de cada testeo.' }),
    }));
  }

  function waterfallRow(label, value, base, color, hint) {
    const width = base > 0 ? Math.min(100, (Math.abs(value) / base) * 100) : 0;
    return el('div', {},
      el('div', { class: 'row', style: { marginBottom: '6px' } },
        el('span', { style: { fontSize: '13px' } }, label),
        el('div', { class: 'spacer' }),
        el('span', { style: { fontSize: '14px', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }, text: money(value) })),
      el('div', { class: 'funnel-bar' },
        el('div', { class: 'fill', style: { width: `${width}%`, background: color } })),
      hint ? el('div', { class: 'small muted', style: { marginTop: '4px' }, text: hint }) : null);
  }

  await load();
  return () => cleanups.forEach((fn) => fn?.());
}

/* ═══ Ajustes ═════════════════════════════════════════════════════════ */

export async function settingsView({ host }) {
  setHeader('Ajustes', 'Tienda, transportadoras, píxeles y equipo');

  const content = el('div', { class: 'stack' });
  host.append(content);

  const data = await api.get('/api/settings');
  const store = data.store || {};
  const couriers = structuredClone(data.couriers || []);
  const pixels = data.pixels || {};

  /* Datos demo */
  if (state.bootstrap?.demo_data) {
    const purgeBtn = el('button', { class: 'btn danger' }, icon('trash'), 'Borrar datos de demostración');
    purgeBtn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: '¿Borrar todos los datos de demostración?',
        text: 'Se eliminan los pedidos, eventos, clientes e inversión generados como ejemplo. '
          + 'Tu producto, tu testeo y tu landing de Plasma se conservan intactos.',
        confirmLabel: 'Borrar la demo',
      });
      if (!ok) return;
      const r = await api.post('/api/demo/purge');
      toast(`${r.removed} pedidos de demostración eliminados. El panel quedó limpio.`);
      await refreshBootstrap();
      navigate('dashboard');
    });

    content.append(card({
      title: 'Datos de demostración',
      subtitle: 'Actualmente activos',
      body: el('div', { class: 'stack' },
        el('p', { class: 'small muted', style: { lineHeight: '1.6' } },
          'El panel viene con 70 días de pedidos, visitas e inversión simulados para que puedas ver '
          + 'todos los módulos funcionando. Bórralos antes de lanzar tu primer testeo real: '
          + 'tu producto, tu testeo T-001 y la landing de Plasma no se tocan.'),
        el('div', {}, purgeBtn)),
    }));
  }

  /* Tienda */
  const storeForm = el('form', { class: 'form-grid' },
    el('div', { class: 'field-row' },
      field({ label: 'Nombre de la marca', name: 'name', value: store.name || '' }),
      field({ label: 'Razón social', name: 'legal_name', value: store.legal_name || '' })),
    el('div', { class: 'field-row c3' },
      field({ label: 'País', name: 'country', value: store.country || 'CO' }),
      field({ label: 'Moneda', name: 'currency', value: store.currency || 'COP', disabled: true }),
      field({ label: 'WhatsApp de atención', name: 'whatsapp', value: store.whatsapp || '', placeholder: '300 000 0000' })),
    field({
      label: 'Costo de envío por defecto', name: 'default_shipping', prefix: '$',
      value: store.default_shipping ?? 0,
      help: 'Se usa como referencia al crear productos nuevos.',
    }));
  const storeBtn = el('button', { class: 'btn', type: 'button' }, icon('save'), 'Guardar');
  storeBtn.addEventListener('click', async () => {
    const d = readForm(storeForm);
    await api.put('/api/settings', { store: { ...store, ...d, default_shipping: parseMoney(d.default_shipping) } });
    toast('Datos de la tienda guardados');
    refreshBootstrap();
  });
  storeForm.append(storeBtn);
  content.append(card({ title: 'Tienda', body: storeForm }));

  /* Transportadoras */
  const courierHost = el('div', { class: 'stack', style: { gap: '10px' } });

  function renderCouriers() {
    clear(courierHost);
    couriers.forEach((c, i) => {
      const nameInput = el('input', { value: c.name });
      const costInput = el('input', { value: c.cost });
      const active = el('input', { type: 'checkbox' });
      active.checked = !!c.active;

      nameInput.addEventListener('input', () => { c.name = nameInput.value; });
      costInput.addEventListener('input', () => { c.cost = parseMoney(costInput.value); });
      active.addEventListener('change', () => { c.active = active.checked; });

      const del = el('button', { class: 'icon-btn', type: 'button', title: 'Quitar' }, icon('trash'));
      del.addEventListener('click', () => { couriers.splice(i, 1); renderCouriers(); });

      courierHost.append(el('div', {
        style: {
          display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '10px',
          alignItems: 'end', padding: '12px', borderRadius: '12px',
          border: '1px solid var(--line)', background: 'var(--surface-2)',
        },
      },
        el('div', { class: 'field' }, el('label', { text: 'Transportadora' }), nameInput),
        el('div', { class: 'field' }, el('label', { text: 'Costo del flete' }),
          el('div', { class: 'input-prefix' }, el('span', { text: '$' }), costInput)),
        el('label', { class: 'switch', style: { height: '40px' } }, active,
          el('span', { class: 'track' }), el('span', { class: 'switch-label small', text: 'Activa' })),
        del));
    });
  }
  renderCouriers();

  const addCourier = el('button', { class: 'btn ghost sm', type: 'button' }, icon('plus'), 'Añadir transportadora');
  addCourier.addEventListener('click', () => { couriers.push({ name: '', cost: 0, active: true }); renderCouriers(); });

  const courierSave = el('button', { class: 'btn', type: 'button' }, icon('save'), 'Guardar');
  courierSave.addEventListener('click', async () => {
    await api.put('/api/settings', { couriers: couriers.filter((c) => c.name.trim()) });
    toast('Transportadoras guardadas');
    refreshBootstrap();
  });

  content.append(card({
    title: 'Transportadoras',
    subtitle: 'Aparecen en el selector de cada pedido',
    body: el('div', { class: 'stack' }, courierHost, el('div', { class: 'row' }, addCourier, el('div', { class: 'spacer' }), courierSave)),
  }));

  /* Píxeles */
  const pixelForm = el('form', { class: 'form-grid' },
    field({ label: 'Meta Pixel ID', name: 'meta', value: pixels.meta || '', placeholder: '1234567890' }),
    field({ label: 'TikTok Pixel ID', name: 'tiktok', value: pixels.tiktok || '', placeholder: 'C1AB…' }),
    field({ label: 'Google Ads / GA4 ID', name: 'google', value: pixels.google || '', placeholder: 'G-XXXXXXX' }));
  const pixelBtn = el('button', { class: 'btn', type: 'button' }, icon('save'), 'Guardar');
  pixelBtn.addEventListener('click', async () => {
    await api.put('/api/settings', { pixels: readForm(pixelForm) });
    toast('Píxeles guardados');
    refreshBootstrap();
  });
  pixelForm.append(pixelBtn);

  content.append(card({
    title: 'Píxeles de seguimiento',
    subtitle: 'Se guardan aquí; la inyección automática llega con el módulo de anuncios',
    body: el('div', { class: 'stack' },
      banner({
        ico: 'info',
        text: 'Por ahora el panel mide con su propio tracking de primera parte (visitas, clics, checkout y pedidos). '
          + 'Estos IDs quedan guardados para cuando conectemos las plataformas.',
      }),
      pixelForm),
  }));

  /* Equipo */
  const usersHost = el('div');
  function renderUsers(list) {
    clear(usersHost).append(dataTable([
      {
        key: 'name', label: 'Usuario',
        render: (u) => el('div', { class: 'row', style: { gap: '11px' } },
          el('div', { class: 'avatar', style: { flex: '0 0 32px' }, text: initials(u.name) }),
          cellStack(u.name, u.email)),
      },
      { key: 'role', label: 'Rol', render: (u) => el('span', { class: 'badge' }, u.role === 'owner' ? 'Propietario' : 'Equipo') },
      { key: 'created_at', label: 'Desde', num: true, render: (u) => el('span', { class: 'small muted', text: fmtDate(u.created_at) }) },
    ], list));
  }
  renderUsers(data.users);

  const addUser = el('button', { class: 'btn ghost sm' }, icon('plus'), 'Invitar');
  addUser.addEventListener('click', () => {
    const form = el('form', { class: 'form-grid' },
      field({ label: 'Nombre', name: 'name', required: true }),
      field({ label: 'Correo', name: 'email', type: 'email', required: true }),
      field({ label: 'Contraseña', name: 'password', type: 'password', required: true, help: 'Mínimo 6 caracteres' }),
      field({
        label: 'Rol', name: 'role', type: 'select',
        options: [{ value: 'staff', label: 'Equipo' }, { value: 'owner', label: 'Propietario' }],
      }));
    modal({
      title: 'Invitar a alguien al panel',
      body: form,
      actions: [
        { label: 'Cancelar', variant: 'ghost' },
        {
          label: 'Crear usuario',
          onClick: async () => {
            try {
              await api.post('/api/users', readForm(form));
              toast('Usuario creado');
              const fresh = await api.get('/api/settings');
              renderUsers(fresh.users);
            } catch (err) { toastError(err); return false; }
          },
        },
      ],
    });
  });

  content.append(card({ title: 'Equipo', actions: addUser, flush: true, body: usersHost }));

  /* Sistema */
  content.append(card({
    title: 'Sistema',
    body: defList([
      ['Base de datos', 'SQLite local · data/drop.db'],
      ['Moneda', 'COP (pesos colombianos)'],
      ['Zona horaria', store.timezone || 'America/Bogota'],
      ['Versión', 'DropStudio 1.0'],
    ]),
  }));
}

/* ═══ Módulos próximos ════════════════════════════════════════════════ */

export async function abTestView({ host }) {
  const { tests } = await api.get('/api/tests');
  const withVariants = tests.filter((t) => new Set(t.pages.map((p) => p.variant)).size > 1);

  let testId = withVariants[0]?.id ?? tests[0]?.id ?? null;

  const selector = el('div');
  setHeader('Test A/B', 'Compara tus variantes y sabe cuándo el resultado ya es confiable', selector);

  const content = el('div', { class: 'stack' });
  host.append(content);

  function renderSelector() {
    if (tests.length < 2) return;
    clear(selector).append(selectControl(
      tests.map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` })),
      testId, (v) => { testId = v; load(); }, { width: '260px' }
    ));
  }

  async function load() {
    content.classList.add('refreshing');
    try {
      clear(content);
      if (!testId) {
        content.append(card({
          body: emptyState({
            icon: 'abtest', title: 'Todavía no tienes testeos',
            text: 'Crea un testeo, vincúlale dos o más landings con letras distintas y aquí verás la comparación.',
            action: (() => {
              const b = el('button', { class: 'btn' }, 'Ir a Testeos');
              b.addEventListener('click', () => navigate('tests'));
              return b;
            })(),
          }),
        }));
        return;
      }
      const [{ variants }, { test }] = await Promise.all([
        api.get(`/api/tests/${testId}/variants`),
        api.get(`/api/tests/${testId}`),
      ]);
      render(variants, test);
    } catch (err) { toastError(err); }
    finally { content.classList.remove('refreshing'); }
  }

  function render(data, test) {
    const rows = data.variants;
    const leader = rows.find((r) => r.is_leader);

    if (rows.length < 2) {
      content.append(card({
        body: emptyState({
          icon: 'abtest',
          title: 'Este testeo tiene una sola variante',
          text: 'Duplica la landing desde Páginas, cámbiale el titular o el ángulo y asígnale la letra B contra este mismo testeo.',
          action: (() => {
            const b = el('button', { class: 'btn' }, 'Ir a Páginas');
            b.addEventListener('click', () => navigate('pages'));
            return b;
          })(),
        }),
      }));
      return;
    }

    /* Lectura del experimento en una frase */
    content.append(readout(rows, leader));

    /* Resumen */
    content.append(el('div', { class: 'stats c4' },
      statTile({ label: 'Variantes en prueba', value: num(rows.length), hint: test.name }),
      statTile({ label: 'Visitas repartidas', value: num(data.total_views) }),
      statTile({ label: 'Pedidos', value: num(data.total_orders) }),
      statTile({
        label: 'Va ganando', value: leader ? `Variante ${leader.variant}` : '—',
        hint: leader ? pct(leader.cr, 2) + ' de conversión' : 'sin muestra suficiente',
      })));

    /* Comparación lado a lado */
    content.append(card({
      title: 'Comparación de variantes',
      subtitle: 'Conversión de visita a pedido, con la confianza de que la diferencia sea real',
      flush: true,
      body: dataTable([
        {
          key: 'variant', label: 'Variante', width: '260px',
          render: (r) => el('div', { class: 'row', style: { gap: '11px' } },
            el('div', {
              class: 'thumb',
              style: r.is_leader ? { background: 'var(--good-bg)', color: 'var(--good)', borderColor: 'transparent', fontWeight: '700' } : {},
            }, r.variant),
            cellStack(r.title.replace('Plasma — ', ''), `/p/${r.slug}`)),
        },
        { key: 'views', label: 'Visitas', num: true, render: (r) => num(r.views) },
        { key: 'orders', label: 'Pedidos', num: true, render: (r) => num(r.orders) },
        {
          key: 'cr', label: 'Conversión', num: true,
          render: (r) => el('div', {},
            el('div', {
              class: 'cell-strong num',
              style: { color: r.is_leader ? 'var(--good)' : 'inherit' },
              text: pct(r.cr, 2),
            }),
            leader && !r.is_leader && leader.cr > 0
              ? el('div', { class: 'cell-sub num', text: `${((r.cr / leader.cr - 1) * 100).toFixed(0)}% vs líder` })
              : null),
        },
        { key: 'checkout_rate', label: 'Abre checkout', num: true, render: (r) => pct(r.checkout_rate, 2) },
        { key: 'delivery_rate', label: 'Entrega', num: true, render: (r) => (r.orders ? pct(r.delivery_rate) : '—') },
        { key: 'revenue', label: 'Cobrado', num: true, render: (r) => money(r.revenue) },
        {
          key: 'confidence', label: 'Confianza', width: '150px',
          render: (r) => confidenceCell(r),
        },
      ], rows, { onRowClick: (r) => navigate(`pages/${r.id}`) }),
    }));

    /* Barras de conversión — una sola serie, comparación directa */
    const maxCr = Math.max(...rows.map((r) => r.cr), 0.01);
    content.append(card({
      title: 'Conversión por variante',
      subtitle: 'Cada barra es visita → pedido',
      body: el('div', { class: 'funnel' },
        rows.map((r) => el('div', { class: 'funnel-step' },
          el('div', { class: 'funnel-top' },
            el('span', { class: 'name' }, `Variante ${r.variant} · ${r.title.replace('Plasma — ', '')}`),
            el('span', { class: 'val num', text: pct(r.cr, 2) }),
            el('span', { class: 'rate num', text: `${num(r.orders)}/${num(r.views)}` })),
          el('div', { class: 'funnel-bar' },
            el('div', {
              class: 'fill',
              style: {
                width: `${Math.max(1.5, (r.cr / maxCr) * 100)}%`,
                background: r.is_leader ? 'var(--good)' : 'var(--series-1)',
              },
            }))))),
    }));

    /* Hipótesis de cada variante */
    content.append(card({
      title: 'Qué está probando cada variante',
      subtitle: 'La hipótesis se escribe antes de lanzar, no después de ver el resultado',
      body: el('div', { class: 'stack', style: { gap: '14px' } },
        rows.map((r) => el('div', {
          style: {
            padding: '16px 18px', borderRadius: '12px',
            border: '1px solid var(--line)',
            background: r.is_leader ? 'var(--good-bg)' : 'var(--surface-2)',
          },
        },
          el('div', { class: 'row', style: { marginBottom: '6px' } },
            el('span', { class: `badge ${r.is_leader ? 'good' : ''}` }, `Variante ${r.variant}`),
            el('span', { style: { fontWeight: '600', fontSize: '13.5px' }, text: r.title.replace('Plasma — ', '') }),
            el('div', { class: 'spacer' }),
            el('a', {
              class: 'btn ghost sm', href: `/p/${r.slug}`, target: '_blank', rel: 'noopener',
            }, icon('external'), 'Abrir')),
          el('p', {
            class: 'small', style: { color: 'var(--ink-2)', lineHeight: '1.6' },
            text: notesOf(test, r) || 'Sin hipótesis registrada.',
          })))),
    }));

    /* Lo que aún no está automatizado */
    content.append(card({
      title: 'Próximamente',
      subtitle: 'Lo que todavía tienes que hacer a mano',
      body: el('div', { class: 'stack' },
        banner({
          ico: 'info',
          html: 'Hoy repartes el tráfico <b>tú</b>: creas un conjunto de anuncios por variante y apuntas '
            + 'cada uno a su URL. El panel ya mide y compara el resultado con confianza estadística real.',
        }),
        el('div', { class: 'soon-preview' },
          [
            ['Reparto automático', 'Una sola URL que divide el tráfico entre variantes, con la asignación fijada por sesión.'],
            ['Corte automático', 'Al alcanzar confianza, la variante perdedora se apaga sola.'],
            ['Tamaño de muestra', 'Te dirá cuántas visitas faltan para poder decidir, antes de gastar.'],
          ].map(([t, d], i) => el('div', { class: 'soon-card' },
            el('div', { class: 'n', text: String(i + 1).padStart(2, '0') }),
            el('h4', { text: t }),
            el('p', { text: d }))))),
    }));
  }

  renderSelector();
  await load();
}

/** La hipótesis vive en las notas de la página. */
function notesOf(test, row) {
  const page = (test.pages || []).find((p) => p.id === row.id);
  return page?.notes || '';
}

function confidenceCell(r) {
  if (r.is_leader) {
    return el('span', { class: 'badge good' }, el('span', { class: 'dot' }), 'Líder');
  }
  if (!r.enough_sample) {
    return el('div', {},
      el('span', { class: 'badge' }, el('span', { class: 'dot' }), 'Muestra corta'),
      el('div', { class: 'cell-sub', text: r.views < 100 ? `faltan ${num(100 - r.views)} visitas` : `faltan ${num(10 - r.orders)} pedidos` }));
  }
  if (r.confidence == null) return el('span', { class: 'muted small' }, '—');

  const c = r.confidence * 100;
  const tone = c >= 95 ? 'good' : c >= 85 ? 'warning' : '';
  return el('div', {},
    el('span', { class: `badge ${tone}` }, el('span', { class: 'dot' }), pct(c, 0)),
    el('div', { class: 'cell-sub', text: c >= 95 ? 'diferencia real' : 'aún no concluyente' }));
}

/** Traduce el estado del experimento a una recomendación en lenguaje llano. */
function readout(rows, leader) {
  const ready = rows.filter((r) => r.enough_sample);
  if (!leader || ready.length < 2) {
    const falta = rows.filter((r) => !r.enough_sample).length;
    return banner({
      ico: 'info',
      html: `Todavía no puedes declarar un ganador: <b>${falta} de ${rows.length} variantes</b> no llegan `
        + 'a 100 visitas y 10 pedidos. Con menos que eso la conversión se mueve demasiado como para decidir.',
    });
  }
  const beaten = rows.filter((r) => !r.is_leader && r.confidence != null && r.confidence >= 0.95);
  if (beaten.length === rows.length - 1) {
    return banner({
      ico: 'rocket',
      html: `La <b>variante ${leader.variant}</b> gana con más del 95% de confianza contra todas las demás `
        + `(${pct(leader.cr, 2)} de conversión). Puedes apagar el resto y mandarle todo el presupuesto.`,
    });
  }
  if (beaten.length) {
    return banner({
      tone: 'warn', ico: 'alert',
      html: `La <b>variante ${leader.variant}</b> va adelante y ya supera con confianza a ${beaten.length} `
        + 'de sus rivales, pero no a todas. Deja correr las que siguen empatadas antes de cortar.',
    });
  }
  return banner({
    tone: 'warn', ico: 'alert',
    html: `La <b>variante ${leader.variant}</b> va arriba con ${pct(leader.cr, 2)}, pero la diferencia `
      + 'todavía puede ser azar. No cortes nada: necesitas más tráfico para confirmarlo.',
  });
}

export async function aiAdsView({ host }) {
  setHeader('Anuncios con IA', 'Generar creativos y copys a partir de tu producto');

  const { products } = await api.get('/api/products');

  host.append(el('div', { class: 'stack' },
    comingSoon({
      ico: 'ai',
      title: 'Anuncios con IA',
      text: 'A partir de la ficha de tu producto y de lo que ya sabes que convierte, el panel generará '
        + 'ángulos de venta, ganchos, guiones de video y variantes de copy listos para pegar en el '
        + 'administrador de anuncios.',
      cards: [
        { title: 'Ángulos de venta', text: 'Distintas maneras de vender el mismo producto: dolor, aspiración, autoridad, comparación.' },
        { title: 'Guiones y ganchos', text: 'Los primeros 3 segundos escritos para retener, con variantes para probar en paralelo.' },
        { title: 'Aprende de tus datos', text: 'Prioriza los ángulos que en tus propios testeos bajaron el CPA, no los que suenan bonito.' },
      ],
      note: 'Se alimentará de la descripción, el precio y los aprendizajes que registres en cada testeo — mientras más completes esos campos, mejores serán las propuestas.',
    }),

    card({
      title: 'Qué tan listo está tu catálogo',
      subtitle: 'La calidad de las propuestas dependerá de estos campos',
      flush: true,
      body: products.length ? dataTable([
        { key: 'name', label: 'Producto', render: (p) => cellStack(p.name, p.category || '—') },
        {
          key: 'desc', label: 'Descripción',
          render: (p) => readyBadge(p.description?.length > 80),
        },
        { key: 'price', label: 'Precio', render: (p) => readyBadge(p.price > 0) },
        { key: 'cost', label: 'Costo', render: (p) => readyBadge(p.cost > 0) },
        { key: 'offers', label: 'Ofertas', render: (p) => readyBadge((p.offers || []).length > 0) },
        {
          key: 'score', label: 'Listo', num: true,
          render: (p) => {
            const checks = [p.description?.length > 80, p.price > 0, p.cost > 0, (p.offers || []).length > 0];
            const done = checks.filter(Boolean).length;
            return el('span', { class: 'cell-strong num', text: `${done}/4` });
          },
        },
      ], products, { onRowClick: (p) => navigate(`products/${p.id}`) })
        : emptyState({ icon: 'box', title: 'Sin productos', text: 'Crea un producto para preparar el terreno.' }),
    })));
}

function readyBadge(ok) {
  return el('span', { class: `badge ${ok ? 'good' : ''}` },
    el('span', { class: 'dot' }), ok ? 'Listo' : 'Falta');
}
