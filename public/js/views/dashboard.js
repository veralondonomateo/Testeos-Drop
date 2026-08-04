import {
  el, clear, api, state, money, moneyShort, num, numShort, pct,
  fmtAgo, fmtDate, orderStatus, seriesColors,
} from '../core.js';
import { icon } from '../icons.js';
import {
  statTile, card, dataTable, cellStack, statusBadge, emptyState,
  skeletonStats, selectControl, rankList, banner, deltaChip,
} from '../ui.js';
import { lineChart, smallMultiples, funnelChart, legend, tableView } from '../charts.js';
import { setHeader, navigate } from '../app.js';

const RANGES = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '14d', label: 'Últimos 14 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
];

export default async function dashboard({ host }) {
  let range = localStorage.getItem('ds_range') || '30d';
  const cleanups = [];

  const rangeSelect = selectControl(RANGES, range, (v) => {
    range = v;
    localStorage.setItem('ds_range', v);
    load();
  }, { width: '168px' });

  const newOrderBtn = el('button', { class: 'btn' }, icon('plus'), 'Registrar pedido');
  newOrderBtn.addEventListener('click', () => navigate('orders?new=1'));

  setHeader('Panel', `Hola ${state.user.name.split(' ')[0]} — así va tu operación`,
    [rangeSelect, newOrderBtn]);

  const content = el('div', { class: 'stack' });
  host.append(content);
  content.append(skeletonStats(5));

  async function load() {
    content.classList.add('refreshing');
    try {
      const [data, ordersRes, testsRes] = await Promise.all([
        api.get('/api/analytics', { range }),
        api.get('/api/orders', { limit: 8 }),
        api.get('/api/tests'),
      ]);
      cleanups.forEach((fn) => fn?.());
      cleanups.length = 0;
      clear(content);
      render(data, ordersRes.orders, testsRes.tests);
    } finally {
      content.classList.remove('refreshing');
    }
  }

  function render(data, recentOrders, tests) {
    const k = data.kpis;
    const s = data.series;
    const colors = seriesColors();

    if (state.bootstrap?.demo_mode) {
      content.append(banner({
        tone: 'warn', ico: 'alert',
        html: '<b>Modo demostración.</b> La base vive en memoria y se reinicia sola: lo que edites '
          + 'aquí no se guarda. Para usar datos reales, quita <code>DEMO_MODE</code> y añade '
          + '<code>DATABASE_URL</code> en Vercel.',
      }));
    } else if (state.bootstrap?.demo_data) {
      content.append(banner({
        tone: 'warn', ico: 'alert',
        html: '<b>Datos de demostración activos.</b> Están aquí para que veas el panel funcionando. '
          + 'Bórralos desde Ajustes antes de lanzar tu primer testeo real.',
        action: (() => {
          const b = el('button', { class: 'btn ghost sm' }, 'Ir a Ajustes');
          b.addEventListener('click', () => navigate('settings'));
          return b;
        })(),
      }));
    }

    /* ── KPIs ── */
    const profitPositive = k.profit.value >= 0;
    content.append(el('div', { class: 'stats c5' },
      statTile({
        label: 'Ingresos cobrados', value: money(k.revenue.value), delta: k.revenue.delta,
        hint: 'pedidos entregados', spark: s.map((d) => d.revenue), color: colors[0],
      }),
      statTile({
        label: 'Utilidad neta', value: money(k.profit.value), delta: k.profit.delta,
        hint: 'ingresos − producto − pauta',
        badge: el('span', { class: `badge ${profitPositive ? 'good' : 'critical'}` },
          profitPositive ? 'En positivo' : 'En rojo'),
      }),
      statTile({
        label: 'Pedidos', value: num(k.orders.value), delta: k.orders.delta,
        hint: `${pct(k.delivery.value)} entregados`, spark: s.map((d) => d.orders), color: colors[2],
      }),
      statTile({
        label: 'CPA', value: money(k.cpa.value), delta: k.cpa.delta, inverse: true,
        hint: `${money(k.spend.value)} invertidos`,
      }),
      statTile({
        label: 'ROAS', value: `${String(k.roas.value).replace('.', ',')}×`, delta: k.roas.delta,
        hint: `conversión ${pct(k.cr.value, 2)}`,
      })));

    /* ── Gráfico principal + embudo ── */
    const chartHost = el('div');
    const chartCard = card({
      title: 'Pedidos e inversión por día',
      subtitle: `${fmtDate(data.from)} — ${fmtDate(data.to)}`,
      body: el('div', {}, chartHost,
        tableView(
          [
            { key: 'date', label: 'Fecha' },
            { key: 'views', label: 'Visitas', num: true },
            { key: 'orders', label: 'Pedidos', num: true },
            { key: 'spend', label: 'Inversión', num: true },
            { key: 'revenue', label: 'Cobrado', num: true },
          ],
          s.map((d) => ({
            date: fmtDate(d.date), views: num(d.views), orders: num(d.orders),
            spend: money(d.spend), revenue: money(d.revenue),
          }))
        )),
    });

    const funnelHost = el('div');
    const funnelCard = card({
      title: 'Embudo de conversión',
      subtitle: 'De la visita al pedido',
      body: el('div', {}, funnelHost,
        el('div', { class: 'row', style: { marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--line-soft)' } },
          el('div', { class: 'spacer' },
            el('div', { class: 'small muted', text: 'Conversión total' }),
            el('div', { style: { fontSize: '19px', fontWeight: '600', marginTop: '2px' }, text: pct(k.cr.value, 2) })),
          el('div', { style: { textAlign: 'right' } },
            el('div', { class: 'small muted', text: 'Ticket promedio' }),
            el('div', { style: { fontSize: '19px', fontWeight: '600', marginTop: '2px' }, text: money(k.aov.value) })))),
    });

    content.append(el('div', { class: 'grid main-side' }, chartCard, funnelCard));

    // Pedidos e inversión tienen escalas muy distintas: van como small multiples,
    // cada uno con su propio eje, en vez de forzar un doble eje engañoso.
    cleanups.push(smallMultiples(chartHost, {
      labels: s.map((d) => d.date),
      height: 118,
      panels: [
        {
          name: 'Pedidos', color: colors[0], values: s.map((d) => d.orders),
          format: num, formatY: numShort, total: `${num(k.orders.value)} en el periodo`,
        },
        {
          name: 'Inversión en pauta', color: colors[1], values: s.map((d) => d.spend),
          format: money, formatY: moneyShort, total: `${money(k.spend.value)} en el periodo`,
        },
      ],
    }));
    funnelChart(funnelHost, data.funnel);

    /* ── Testeos activos ── */
    const running = tests.filter((t) => t.status === 'running');
    if (running.length) {
      content.append(card({
        title: 'Testeos en curso',
        subtitle: `${running.length} campaña${running.length > 1 ? 's' : ''} corriendo ahora`,
        actions: (() => {
          const b = el('button', { class: 'btn ghost sm' }, 'Ver todos');
          b.addEventListener('click', () => navigate('tests'));
          return b;
        })(),
        flush: true,
        body: dataTable([
          {
            key: 'name', label: 'Testeo',
            render: (t) => cellStack(t.name, `${t.code} · ${t.product_name || 'sin producto'}`),
          },
          { key: 'views', label: 'Visitas', num: true, render: (t) => num(t.metrics.views) },
          { key: 'orders', label: 'Pedidos', num: true, render: (t) => num(t.metrics.orders) },
          { key: 'spend', label: 'Invertido', num: true, render: (t) => money(t.metrics.spend) },
          {
            key: 'cpa', label: 'CPA', num: true,
            render: (t) => {
              const good = t.target_cpa > 0 && t.metrics.cpa > 0 && t.metrics.cpa <= t.target_cpa;
              const bad = t.target_cpa > 0 && t.metrics.cpa > t.target_cpa;
              return el('span', {
                style: { fontWeight: '600', color: good ? 'var(--good)' : bad ? 'var(--critical)' : 'inherit' },
                text: t.metrics.cpa ? money(t.metrics.cpa) : '—',
              });
            },
          },
          {
            key: 'roas', label: 'ROAS', num: true,
            render: (t) => (t.metrics.roas ? `${String(t.metrics.roas).replace('.', ',')}×` : '—'),
          },
          {
            key: 'profit', label: 'Utilidad', num: true,
            render: (t) => el('span', {
              style: { fontWeight: '600', color: t.metrics.profit >= 0 ? 'var(--good)' : 'var(--critical)' },
              text: money(t.metrics.profit),
            }),
          },
        ], running, { onRowClick: (t) => navigate(`tests/${t.id}`) }),
      }));
    }

    /* ── Pedidos recientes + rankings ── */
    const ordersCard = card({
      title: 'Últimos pedidos',
      subtitle: `${num(state.bootstrap?.counts?.pending || 0)} pendientes por confirmar`,
      actions: (() => {
        const b = el('button', { class: 'btn ghost sm' }, 'Ver todos');
        b.addEventListener('click', () => navigate('orders'));
        return b;
      })(),
      flush: true,
      body: recentOrders.length ? dataTable([
        {
          key: 'customer_name', label: 'Cliente',
          render: (o) => cellStack(o.customer_name, `${o.city || '—'} · ${o.code}`),
        },
        { key: 'product_name', label: 'Producto', render: (o) => o.product_name || '—' },
        { key: 'total', label: 'Total', num: true, render: (o) => money(o.total) },
        { key: 'status', label: 'Estado', render: (o) => statusBadge(orderStatus(o.status)) },
        { key: 'created_at', label: 'Cuándo', num: true, render: (o) => el('span', { class: 'muted small', text: fmtAgo(o.created_at) }) },
      ], recentOrders, { onRowClick: (o) => navigate(`orders/${o.id}`) })
        : emptyState({
          icon: 'cart', title: 'Aún no hay pedidos',
          text: 'Cuando alguien complete el formulario de tu landing, aparecerá aquí en tiempo real.',
        }),
    });

    const side = el('div', { class: 'stack' },
      card({
        title: 'Ciudades con más pedidos',
        body: data.by_city.length
          ? rankList(data.by_city.map((c) => ({ name: c.city, value: c.n, sub: money(c.total) })))
          : el('p', { class: 'small muted', text: 'Sin pedidos en este periodo.' }),
      }),
      card({
        title: 'Fuentes de tráfico',
        body: data.by_source.length
          ? rankList(data.by_source.map((c) => ({ name: c.source, value: c.n })))
          : el('p', { class: 'small muted', text: 'Sin datos de atribución todavía.' }),
      }));

    content.append(el('div', { class: 'grid main-side' }, ordersCard, side));
  }

  await load();
  return () => cleanups.forEach((fn) => fn?.());
}
