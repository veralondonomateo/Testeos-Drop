import {
  el, clear, api, money, moneyShort, num, numShort, pct, fmtDate,
  orderStatus, seriesColors, toastError,
} from '../core.js';
import { icon } from '../icons.js';
import {
  card, statTile, selectControl, skeletonStats, rankList, emptyState, dataTable, cellStack,
} from '../ui.js';
import { lineChart, smallMultiples, barChart, funnelChart, donutChart, legend, tableView } from '../charts.js';
import { setHeader, navigate } from '../app.js';

const RANGES = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '14d', label: 'Últimos 14 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: '365d', label: 'Último año' },
];

export default async function analyticsView({ host }) {
  let range = localStorage.getItem('ds_range') || '30d';
  let productId = '';
  let products = [];
  const cleanups = [];

  const rangeSel = selectControl(RANGES, range, (v) => {
    range = v; localStorage.setItem('ds_range', v); load();
  }, { width: '168px' });

  const productSel = el('div');

  setHeader('Analíticas', 'Qué funciona, dónde se cae la gente y cuánto cuesta cada venta',
    [productSel, rangeSel]);

  const content = el('div', { class: 'stack' });
  host.append(content);
  content.append(skeletonStats(4));

  async function load() {
    content.classList.add('refreshing');
    try {
      const [data, prodRes] = await Promise.all([
        api.get('/api/analytics', { range, product_id: productId }),
        products.length ? Promise.resolve({ products }) : api.get('/api/products'),
      ]);
      products = prodRes.products;
      renderProductFilter();
      cleanups.forEach((fn) => fn?.());
      cleanups.length = 0;
      clear(content);
      render(data);
    } catch (err) { toastError(err); }
    finally { content.classList.remove('refreshing'); }
  }

  function renderProductFilter() {
    if (products.length < 2) return;
    clear(productSel).append(selectControl(
      [{ value: '', label: 'Todos los productos' }, ...products.map((p) => ({ value: p.id, label: p.name }))],
      productId, (v) => { productId = v; load(); }, { width: '200px' }
    ));
  }

  function render(data) {
    const k = data.kpis;
    const s = data.series;
    const colors = seriesColors();

    /* Hero: la única cifra que encabeza la vista */
    content.append(card({
      body: el('div', { class: 'row wrap', style: { gap: '32px' } },
        el('div', {},
          el('div', { class: 'small muted', text: `Ingresos cobrados · ${fmtDate(data.from)} — ${fmtDate(data.to)}` }),
          el('div', { class: 'hero-figure', style: { marginTop: '4px' }, text: money(k.revenue.value) }),
          el('div', { class: 'row', style: { marginTop: '10px' } },
            Number.isFinite(k.revenue.delta)
              ? el('span', { class: `badge ${k.revenue.delta >= 0 ? 'good' : 'critical'}` },
                `${k.revenue.delta >= 0 ? '+' : ''}${String(k.revenue.delta).replace('.', ',')}%`)
              : el('span', { class: 'badge' }, 'Sin periodo previo'),
            el('span', {
              class: 'small muted',
              text: Number.isFinite(k.revenue.delta) ? 'vs el periodo anterior' : 'para comparar',
            }))),
        el('div', { class: 'spacer' }),
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '28px' } },
          [['Utilidad neta', money(k.profit.value)],
            ['Inversión en pauta', money(k.spend.value)],
            ['Ticket promedio', money(k.aov.value)]].map(([label, value]) =>
            el('div', {},
              el('div', { class: 'small muted', text: label }),
              el('div', { style: { fontSize: '19px', fontWeight: '600', marginTop: '3px' }, text: value }))))),
    }));

    /* KPIs secundarios */
    content.append(el('div', { class: 'stats c5' },
      statTile({ label: 'Visitas', value: num(k.views.value), delta: k.views.delta, spark: s.map((d) => d.views), color: colors[0] }),
      statTile({ label: 'Pedidos', value: num(k.orders.value), delta: k.orders.delta, spark: s.map((d) => d.orders), color: colors[2] }),
      statTile({ label: 'Conversión', value: pct(k.cr.value, 2), delta: k.cr.delta, hint: 'visita → pedido' }),
      statTile({ label: 'CPA', value: money(k.cpa.value), delta: k.cpa.delta, inverse: true }),
      statTile({ label: 'Tasa de entrega', value: pct(k.delivery.value), hint: 'de los pedidos del periodo' })));

    /* Serie de ingresos */
    const revHost = el('div');
    content.append(card({
      title: 'Ingresos cobrados por día',
      subtitle: 'Sólo pedidos entregados — el dinero que realmente entró',
      body: el('div', {}, revHost,
        tableView([
          { key: 'date', label: 'Fecha' },
          { key: 'revenue', label: 'Cobrado', num: true },
          { key: 'gross', label: 'Vendido', num: true },
          { key: 'spend', label: 'Invertido', num: true },
        ], s.map((d) => ({
          date: fmtDate(d.date), revenue: money(d.revenue), gross: money(d.gross), spend: money(d.spend),
        })))),
    }));
    cleanups.push(lineChart(revHost, {
      labels: s.map((d) => d.date),
      series: [{ name: 'Cobrado', values: s.map((d) => d.revenue), format: money }],
      area: true, formatY: moneyShort, height: 250,
    }));

    /* Visitas vs pedidos */
    const trafficHost = el('div');
    const funnelHost = el('div');
    content.append(el('div', { class: 'grid main-side' },
      card({
        title: 'Tráfico y pedidos',
        subtitle: 'Cada medida con su propia escala — sin doble eje',
        body: el('div', {}, trafficHost,
          tableView([
            { key: 'date', label: 'Fecha' },
            { key: 'views', label: 'Visitas', num: true },
            { key: 'orders', label: 'Pedidos', num: true },
          ], s.map((d) => ({ date: fmtDate(d.date), views: num(d.views), orders: num(d.orders) })))),
      }),
      card({
        title: 'Embudo',
        subtitle: 'Dónde se pierde la conversión',
        body: el('div', {}, funnelHost),
      })));

    cleanups.push(smallMultiples(trafficHost, {
      labels: s.map((d) => d.date),
      height: 112,
      panels: [
        {
          name: 'Visitas únicas', color: colors[0], values: s.map((d) => d.views),
          format: num, formatY: numShort, total: `${num(k.views.value)} en total`,
        },
        {
          name: 'Pedidos', color: colors[2], values: s.map((d) => d.orders),
          format: num, formatY: numShort, total: `${num(k.orders.value)} en total`,
        },
      ],
    }));
    funnelChart(funnelHost, data.funnel);

    /* Inversión diaria */
    const spendHost = el('div');
    content.append(card({
      title: 'Inversión publicitaria por día',
      subtitle: 'Lo que registraste en cada testeo',
      body: el('div', {}, spendHost),
    }));
    cleanups.push(barChart(spendHost, {
      labels: s.map((d) => d.date),
      values: s.map((d) => d.spend),
      name: 'Inversión',
      formatY: moneyShort, format: money, height: 210, color: colors[1],
    }));

    /* Desgloses */
    const deviceHost = el('div');
    const statusRows = data.by_status.map((r) => ({
      ...r, meta: orderStatus(r.status),
    }));

    content.append(el('div', { class: 'grid g3' },
      card({
        title: 'Productos con más pedidos',
        body: data.top_products.length
          ? rankList(data.top_products.map((p) => ({ name: p.name, value: p.orders, sub: money(p.revenue) })))
          : el('p', { class: 'small muted', text: 'Sin pedidos en este periodo.' }),
      }),
      card({
        title: 'Landings con más tráfico',
        body: data.top_pages.length
          ? rankList(data.top_pages.map((p) => ({
            name: `${p.title} (${p.variant})`,
            value: p.views,
            sub: p.views ? `${num(p.orders)} pedidos · CR ${pct((p.orders / p.views) * 100, 2)}` : 'sin visitas',
          })))
          : el('p', { class: 'small muted', text: 'Sin visitas registradas.' }),
      }),
      card({
        title: 'Dispositivos',
        subtitle: 'De dónde llegan tus visitas',
        body: el('div', {}, deviceHost),
      })));

    const devices = data.by_device.filter((d) => d.n > 0);
    const totalDevices = devices.reduce((a, d) => a + d.n, 0);
    if (devices.length) {
      donutChart(deviceHost, devices.map((d) => ({ name: d.device, value: d.n })), {
        size: 150, centerValue: numShort(totalDevices), centerLabel: 'visitas',
      });
      deviceHost.append(el('div', { style: { marginTop: '16px' } },
        legend(devices.map((d) => ({ name: `${d.device} · ${pct((d.n / totalDevices) * 100, 0)}` })))));
    } else {
      deviceHost.append(el('p', { class: 'small muted', text: 'Sin visitas registradas.' }));
    }

    /* Estados de pedido y ciudades */
    content.append(el('div', { class: 'grid g2' },
      card({
        title: 'Pedidos por estado',
        subtitle: 'La salud de tu operación de contra entrega',
        flush: true,
        body: statusRows.length ? dataTable([
          {
            key: 'status', label: 'Estado',
            render: (r) => el('span', { class: `badge ${r.meta.tone}` }, el('span', { class: 'dot' }), r.meta.label),
          },
          { key: 'n', label: 'Pedidos', num: true, render: (r) => num(r.n) },
          { key: 'total', label: 'Valor', num: true, render: (r) => money(r.total) },
          {
            key: 'share', label: '% del total', num: true,
            render: (r) => {
              const t = statusRows.reduce((a, x) => a + x.n, 0);
              return pct(t ? (r.n / t) * 100 : 0, 1);
            },
          },
        ], statusRows) : emptyState({ icon: 'cart', title: 'Sin pedidos', text: 'No hay pedidos en este rango de fechas.' }),
      }),
      card({
        title: 'Ciudades',
        subtitle: 'Dónde entregas más',
        body: data.by_city.length
          ? rankList(data.by_city.map((c) => ({ name: c.city, value: c.n, sub: money(c.total) })))
          : el('p', { class: 'small muted', text: 'Sin pedidos con ciudad registrada.' }),
      })));
  }

  await load();
  return () => cleanups.forEach((fn) => fn?.());
}
