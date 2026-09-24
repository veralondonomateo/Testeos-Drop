import {
  el, clear, api, money, moneyShort, num, numShort, pct, fmtDate,
  orderStatus, seriesColors, toastError, huecos, TAPADO,
} from '../core.js';
import { icon } from '../icons.js';
import {
  card, statTile, selectControl, skeletonStats, rankList, emptyState, dataTable, cellStack,
} from '../ui.js';
import { lineChart, smallMultiples, barChart, funnelChart, donutChart, legend, tableView } from '../charts.js';
import { setHeader, navigate } from '../app.js';

const RANGES = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '14d', label: 'Últimos 14 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: '365d', label: 'Último año' },
  { value: 'day', label: 'Un día concreto…' },
];

/** Hoy en la zona del negocio, que es la que usa el servidor para cortar el día. */
const hoyKey = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

const esDia = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function analyticsView({ host }) {
  let range = localStorage.getItem('ds_range') || '30d';
  let productId = '';
  let products = [];
  const cleanups = [];

  // Un día suelto se guarda como '2026-08-17'. El <select> muestra entonces la
  // opción "Un día concreto…" y al lado aparece el calendario con esa fecha.
  const dayInput = el('input', {
    type: 'date', class: 'control', max: hoyKey(),
    value: esDia(range) ? range : hoyKey(),
    style: { display: esDia(range) ? '' : 'none', minWidth: '148px' },
  });
  dayInput.addEventListener('change', () => {
    if (!dayInput.value) return;
    range = dayInput.value; localStorage.setItem('ds_range', range); load();
  });

  const rangeSel = selectControl(RANGES, esDia(range) ? 'day' : range, (v) => {
    if (v === 'day') {
      dayInput.style.display = '';
      range = dayInput.value || hoyKey();
    } else {
      dayInput.style.display = 'none';
      range = v;
    }
    localStorage.setItem('ds_range', range);
    load();
  }, { width: '168px' });

  const productSel = el('div');

  setHeader('Analíticas', 'Qué funciona, dónde se cae la gente y cuánto cuesta cada venta',
    [productSel, rangeSel, dayInput]);

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
    const cob = data.cobertura || null;
    const faltan = huecos(cob);
    const faltaPauta = faltan.some((f) => f.clave === 'pauta');
    const sinCosto = faltan.some((f) => f.clave === 'costo');
    const sinEntrega = faltan.some((f) => f.clave === 'entrega');

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
          [['Utilidad neta', sinCosto ? TAPADO : money(k.profit.value),
            sinCosto ? 'falta el coste de producto' : null],
            ['Inversión en pauta', money(k.spend.value),
              faltaPauta ? `sólo ${num(cob.dias_con_pauta)} de ${num(cob.dias_periodo)} días` : null],
            ['Ticket promedio', money(k.aov.value), null]].map(([label, value, nota]) =>
            el('div', {},
              el('div', { class: 'small muted', text: label }),
              el('div', { style: { fontSize: '19px', fontWeight: '600', marginTop: '3px' }, text: value }),
              nota ? el('div', { class: 'small muted', style: { marginTop: '2px' }, text: nota }) : null)))),
    }));

    /* Lo que no se puede calcular, dicho antes de que nadie decida con ello */
    if (faltan.length) {
      content.append(card({
        title: 'Antes de leer estas cifras',
        subtitle: `${faltan.length === 1 ? 'Un dato que falta' : `${num(faltan.length)} datos que faltan`} y qué cifra deja sin base`,
        body: el('ul', { class: 'lectura' },
          ...faltan.map((f) => el('li', { class: 'ojo' },
            el('b', { text: f.titulo }),
            el('span', { text: `${f.detalle} ${f.arreglo}` })))),
      }));
    }

    /* Lectura en palabras */
    const lectura = leerPeriodo(k, data.funnel, cob);
    if (lectura.length) {
      content.append(card({
        title: 'Lectura del periodo',
        subtitle: 'Lo que dicen estos números, en una frase cada uno',
        body: el('ul', { class: 'lectura' },
          ...lectura.map((f) => el('li', { class: f.tono },
            el('b', { text: f.titular }),
            el('span', { text: f.detalle })))),
      }));
    }

    /* KPIs secundarios */
    content.append(el('div', { class: 'stats c5' },
      statTile({ label: 'Visitas', value: num(k.views.value), delta: k.views.delta, spark: s.map((d) => d.views), color: colors[0] }),
      statTile({ label: 'Pedidos', value: num(k.orders.value), delta: k.orders.delta, spark: s.map((d) => d.orders), color: colors[2] }),
      statTile({ label: 'Conversión', value: pct(k.cr.value, 2), delta: k.cr.delta, hint: 'visita → pedido' }),
      statTile({
        label: 'CPA',
        value: faltaPauta ? TAPADO : money(k.cpa.value),
        delta: faltaPauta ? null : k.cpa.delta,
        inverse: true,
        hint: faltaPauta ? 'falta inversión por cargar' : 'coste por pedido',
      }),
      statTile({
        label: 'Tasa de entrega',
        value: sinEntrega ? TAPADO : pct(k.delivery.value),
        hint: sinEntrega ? 'sin estados reales' : 'de los pedidos del periodo',
      })));

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


/**
 * Traduce las cifras del periodo a frases.
 *
 * Existe porque un panel lleno de números correctos puede seguir sin
 * responder "¿cómo vamos?". Cada frase se calcula de los mismos datos que
 * pintan los gráficos —no hay un segundo origen que pueda desincronizarse— y
 * lleva su tono, que además del color usa la palabra: el color no es la única
 * señal, como exige el manual de marca.
 */
function leerPeriodo(k, funnel, cob) {
  const frases = [];
  const sinSoporte = new Set(huecos(cob).map((f) => f.clave));
  const n = (x) => (Number.isFinite(x) ? x : 0);

  // Rentabilidad: lo que entra por cada peso invertido.
  const gasto = n(k.spend?.value), util = n(k.profit?.value), ingreso = n(k.revenue?.value);
  // Sin el gasto entero o sin costes de producto, esta frase sólo sabría
  // mentir a favor: se calla y lo explica la tarjeta de datos que faltan.
  if (gasto > 0 && !sinSoporte.has('pauta') && !sinSoporte.has('costo')) {
    const roas = ingreso / gasto;
    frases.push({
      tono: util >= 0 ? 'bien' : 'mal',
      titular: util >= 0 ? 'El periodo deja utilidad.' : 'El periodo cierra en pérdida.',
      detalle: `Por cada ${money(1000)} de pauta entraron ${money(Math.round(roas * 1000))} `
        + `en ventas cobradas. Utilidad neta: ${money(util)}.`,
    });
  }

  // Dónde se pierde más gente en el embudo.
  if (Array.isArray(funnel) && funnel.length >= 2) {
    let peor = null;
    for (let i = 1; i < funnel.length; i++) {
      const antes = n(funnel[i - 1].value), ahora = n(funnel[i].value);
      if (antes <= 0) continue;
      const caida = 1 - ahora / antes;
      if (!peor || caida > peor.caida) {
        // El API llama `stage` a la etiqueta del paso, no `label`.
        peor = { caida, de: funnel[i - 1].stage, a: funnel[i].stage, antes, ahora };
      }
    }
    if (peor) {
      frases.push({
        tono: peor.caida > 0.8 ? 'ojo' : 'neutro',
        titular: `La mayor fuga está entre ${peor.de.toLowerCase()} y ${peor.a.toLowerCase()}.`,
        detalle: `Ahí se pierde el ${pct(peor.caida * 100)}: de ${num(peor.antes)} `
          + `quedan ${num(peor.ahora)}. Es el paso que más rinde si se mejora.`,
      });
    }
  }

  // Entrega: en contra entrega es la mitad del negocio.
  const entrega = n(k.delivery?.value);
  if (entrega > 0 && !sinSoporte.has('entrega')) {
    frases.push({
      tono: entrega >= 70 ? 'bien' : entrega >= 55 ? 'neutro' : 'ojo',
      titular: `Se entrega el ${pct(entrega)} de los pedidos.`,
      detalle: entrega >= 70
        ? 'Está en el rango sano para contra entrega.'
        : 'Cada pedido no entregado cuesta el flete de ida, el de vuelta y el producto inmovilizado.',
    });
  }

  // Coste de traer un pedido contra lo que deja.
  const cpa = n(k.cpa?.value), ticket = n(k.aov?.value);
  if (cpa > 0 && ticket > 0 && !sinSoporte.has('pauta')) {
    const margen = ticket - cpa;
    frases.push({
      tono: margen > 0 ? 'neutro' : 'mal',
      titular: margen > 0
        ? `Cada pedido deja ${money(margen)} antes de producto y flete.`
        : 'Traer un pedido cuesta más de lo que factura.',
      detalle: `Cuesta ${money(cpa)} conseguirlo y factura ${money(ticket)} de media.`,
    });
  }

  return frases;
}
