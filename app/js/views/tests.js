import {
  el, clear, api, state, money, moneyShort, num, pct, fmtDate, fmtAgo,
  toast, toastError, testStatus, verdictOf, orderStatus, parseMoney, seriesColors,
} from '../core.js';
import { icon } from '../icons.js';
import {
  card, dataTable, cellStack, emptyState, skeletonTable, statTile,
  drawer, modal, field, readForm, confirmDialog, banner, tabBar,
  statusBadge, defList, rankList,
} from '../ui.js';
import { funnelChart, legend, tableView } from '../charts.js';
import { setHeader, navigate, refreshBootstrap } from '../app.js';

const CHANNELS = {
  meta: 'Meta Ads', tiktok: 'TikTok Ads', google: 'Google Ads',
  organico: 'Orgánico', otro: 'Otro',
};

export default async function testsView({ host, params }) {
  if (params[0]) return testDetail({ host, id: params[0] });

  let tests = [];
  let products = [];
  let filter = '';

  const newBtn = el('button', { class: 'btn' }, icon('plus'), 'Nuevo testeo');
  newBtn.addEventListener('click', () => openCreate());

  setHeader('Testeos', 'Cada producto que pruebas, con su veredicto', newBtn);

  const statsHost = el('div');
  const tabsHost = el('div');
  const listHost = el('div');

  host.append(
    statsHost,
    el('div', { class: 'filters', style: { marginTop: '16px' } }, tabsHost),
    card({ flush: true, body: listHost })
  );
  listHost.append(skeletonTable(4));

  async function load() {
    listHost.classList.add('refreshing');
    try {
      const [t, p] = await Promise.all([
        api.get('/api/tests', filter ? { status: filter } : {}),
        api.get('/api/products'),
      ]);
      tests = t.tests;
      products = p.products;
      renderStats();
      renderTabs();
      renderList();
    } catch (err) { toastError(err); }
    finally { listHost.classList.remove('refreshing'); }
  }

  function renderStats() {
    const totalSpend = tests.reduce((a, t) => a + t.metrics.spend, 0);
    const totalOrders = tests.reduce((a, t) => a + t.metrics.orders, 0);
    const totalProfit = tests.reduce((a, t) => a + t.metrics.profit, 0);
    const winners = tests.filter((t) => t.verdict === 'winner').length;

    clear(statsHost).append(el('div', { class: 'stats c4' },
      statTile({ label: 'Testeos lanzados', value: num(tests.length), hint: `${winners} ganador${winners === 1 ? '' : 'es'}` }),
      statTile({ label: 'Invertido en pauta', value: money(totalSpend), hint: 'acumulado' }),
      statTile({
        label: 'CPA promedio', value: totalOrders ? money(Math.round(totalSpend / totalOrders)) : '—',
        hint: `${num(totalOrders)} pedidos`,
      }),
      statTile({
        label: 'Utilidad acumulada', value: money(totalProfit),
        badge: el('span', { class: `badge ${totalProfit >= 0 ? 'good' : 'critical'}` },
          totalProfit >= 0 ? 'En positivo' : 'En rojo'),
      })));
  }

  function renderTabs() {
    clear(tabsHost).append(tabBar([
      { value: '', label: 'Todos' },
      ...Object.entries(state.bootstrap.test_status).map(([k, v]) => ({ value: k, label: v.label })),
    ], filter, (v) => { filter = v; load(); }));
  }

  function renderList() {
    clear(listHost);
    if (!tests.length) {
      listHost.append(emptyState({
        icon: 'flask',
        title: 'Aún no has lanzado ningún testeo',
        text: 'Un testeo agrupa un producto, sus landings y la pauta que le inviertes, para saber si vale la pena escalar.',
        action: (() => {
          const b = el('button', { class: 'btn' }, icon('plus'), 'Crear el primero');
          b.addEventListener('click', () => openCreate());
          return b;
        })(),
      }));
      return;
    }

    listHost.append(dataTable([
      {
        key: 'name', label: 'Testeo',
        render: (t) => cellStack(t.name, `${t.code} · ${t.product_name || 'sin producto'} · ${CHANNELS[t.channel] || t.channel}`),
      },
      { key: 'status', label: 'Estado', render: (t) => statusBadge(testStatus(t.status)) },
      { key: 'spend', label: 'Invertido', num: true, render: (t) => money(t.metrics.spend) },
      { key: 'orders', label: 'Pedidos', num: true, render: (t) => num(t.metrics.orders) },
      {
        key: 'cpa', label: 'CPA', num: true,
        render: (t) => cpaCell(t),
      },
      {
        key: 'cr', label: 'CR', num: true,
        render: (t) => (t.metrics.views ? pct(t.metrics.cr, 2) : '—'),
      },
      {
        key: 'profit', label: 'Utilidad', num: true,
        render: (t) => el('span', {
          class: 'cell-strong num',
          style: { color: t.metrics.profit >= 0 ? 'var(--good)' : 'var(--critical)' },
          text: money(t.metrics.profit),
        }),
      },
      {
        key: 'verdict', label: 'Veredicto',
        render: (t) => {
          const v = verdictOf(t.verdict);
          return el('span', { class: `badge ${v.tone}` }, el('span', { class: 'dot' }), v.label);
        },
      },
    ], tests, { onRowClick: (t) => navigate(`tests/${t.id}`) }));
  }

  function openCreate() {
    const form = el('form', { class: 'form-grid' },
      field({ label: 'Nombre del testeo', name: 'name', required: true, placeholder: 'Ej: Plasma Corazón — ángulo energía' }),
      el('div', { class: 'field-row' },
        field({
          label: 'Producto', name: 'product_id', type: 'select',
          options: products.length
            ? products.map((p) => ({ value: p.id, label: p.name }))
            : [{ value: '', label: 'Crea un producto primero' }],
        }),
        field({
          label: 'Canal', name: 'channel', type: 'select',
          options: Object.entries(CHANNELS).map(([k, v]) => ({ value: k, label: v })),
        })),
      field({
        label: 'Hipótesis', name: 'hypothesis', type: 'textarea', rows: 3,
        placeholder: 'Qué crees que va a pasar y por qué. Ej: "el público 50+ convierte bajo $35.000 de CPA con el ángulo de energía".',
        help: 'Escribirla antes de lanzar es lo que convierte un gasto en un aprendizaje.',
      }),
      el('div', { class: 'field-row' },
        field({ label: 'Presupuesto del testeo', name: 'budget', prefix: '$', placeholder: '600000' }),
        field({ label: 'CPA objetivo', name: 'target_cpa', prefix: '$', placeholder: '35000', help: 'Tu margen por venta marca el techo.' })),
      el('div', { class: 'field-row' },
        field({ label: 'Inicio', name: 'start_date', type: 'date', value: new Date().toISOString().slice(0, 10) }),
        field({ label: 'Fin previsto', name: 'end_date', type: 'date' })));

    modal({
      title: 'Nuevo testeo',
      subtitle: 'Define la hipótesis y el CPA objetivo antes de gastar el primer peso.',
      body: form,
      large: true,
      actions: [
        { label: 'Cancelar', variant: 'ghost' },
        {
          label: 'Crear testeo',
          onClick: async () => {
            const data = readForm(form);
            if (!data.name?.trim()) { toast('Ponle un nombre', { type: 'err' }); return false; }
            try {
              const { test } = await api.post('/api/tests', {
                ...data, budget: parseMoney(data.budget), target_cpa: parseMoney(data.target_cpa),
              });
              toast('Testeo creado');
              refreshBootstrap();
              navigate(`tests/${test.id}`);
            } catch (err) { toastError(err); return false; }
          },
        },
      ],
    });
  }

  await load();
}

function cpaCell(t) {
  const { cpa } = t.metrics;
  if (!cpa) return '—';
  const good = t.target_cpa > 0 && cpa <= t.target_cpa;
  const bad = t.target_cpa > 0 && cpa > t.target_cpa;
  return el('div', {},
    el('div', {
      class: 'cell-strong num',
      style: { color: good ? 'var(--good)' : bad ? 'var(--critical)' : 'inherit' },
      text: money(cpa),
    }),
    t.target_cpa ? el('div', { class: 'cell-sub num', text: `meta ${moneyShort(t.target_cpa)}` }) : null);
}

/* ═══ Detalle de un testeo ════════════════════════════════════════════ */

async function testDetail({ host, id }) {
  let test;
  try {
    test = (await api.get(`/api/tests/${id}`)).test;
  } catch (err) {
    setHeader('Testeo', '');
    host.append(card({ body: emptyState({ icon: 'alert', title: 'No encontramos este testeo', text: err.message }) }));
    return;
  }

  const backBtn = el('button', { class: 'btn ghost' }, icon('chevronLeft'), 'Testeos');
  backBtn.addEventListener('click', () => navigate('tests'));

  const spendBtn = el('button', { class: 'btn ghost' }, icon('plus'), 'Registrar inversión');
  spendBtn.addEventListener('click', () => openSpend());

  const editBtn = el('button', { class: 'btn' }, icon('edit'), 'Editar');
  editBtn.addEventListener('click', () => openEdit());

  setHeader(test.name, `${test.code} · ${CHANNELS[test.channel] || test.channel} · ${test.product_name || 'sin producto'}`,
    [backBtn, spendBtn, editBtn]);

  const content = el('div', { class: 'stack' });
  host.append(content);

  function render() {
    clear(content);
    const m = test.metrics;
    const colors = seriesColors();

    /* Estado y veredicto */
    const statusRow = el('div', { class: 'row wrap' });
    for (const [key, meta] of Object.entries(state.bootstrap.test_status)) {
      const b = el('button', { class: `btn ${test.status === key ? '' : 'ghost'} sm` }, meta.label);
      b.addEventListener('click', async () => {
        test = (await api.patch(`/api/tests/${test.id}`, { status: key })).test;
        toast(`Testeo marcado como ${meta.label.toLowerCase()}`);
        render();
      });
      statusRow.append(b);
    }

    const verdictRow = el('div', { class: 'row wrap' });
    for (const [key, meta] of Object.entries(state.bootstrap.verdicts)) {
      const b = el('button', { class: `btn ${test.verdict === key ? '' : 'ghost'} sm` }, meta.label);
      b.addEventListener('click', async () => {
        test = (await api.patch(`/api/tests/${test.id}`, { verdict: key })).test;
        toast(`Veredicto: ${meta.label}`);
        render();
      });
      verdictRow.append(b);
    }

    /* Lectura automática del testeo */
    content.append(readout(test));

    /* KPIs */
    content.append(el('div', { class: 'stats c5' },
      statTile({ label: 'Invertido', value: money(m.spend), hint: test.budget ? `de ${money(test.budget)}` : 'sin presupuesto fijado' }),
      statTile({ label: 'Pedidos', value: num(m.orders), hint: `${num(m.delivered)} entregados` }),
      statTile({
        label: 'CPA', value: m.cpa ? money(m.cpa) : '—',
        hint: test.target_cpa ? `meta ${money(test.target_cpa)}` : 'sin meta',
        badge: test.target_cpa && m.cpa
          ? el('span', { class: `badge ${m.cpa <= test.target_cpa ? 'good' : 'critical'}` },
            m.cpa <= test.target_cpa ? 'En meta' : 'Sobre la meta')
          : null,
      }),
      statTile({ label: 'ROAS', value: m.roas ? `${String(m.roas).replace('.', ',')}×` : '—', hint: `CR ${pct(m.cr, 2)}` }),
      statTile({
        label: 'Utilidad', value: money(m.profit),
        badge: el('span', { class: `badge ${m.profit >= 0 ? 'good' : 'critical'}` },
          m.profit >= 0 ? 'Rentable' : 'En pérdida'),
      })));

    /* Presupuesto consumido */
    if (test.budget > 0) {
      const usedPct = Math.min(100, (m.spend / test.budget) * 100);
      content.append(card({
        title: 'Presupuesto consumido',
        subtitle: `${money(m.spend)} de ${money(test.budget)}`,
        body: el('div', {},
          el('div', { class: 'meter' },
            el('div', {
              class: `fill ${usedPct >= 95 ? 'critical' : usedPct >= 75 ? 'warning' : ''}`,
              style: { width: `${usedPct}%` },
            })),
          el('div', { class: 'row', style: { marginTop: '10px' } },
            el('span', { class: 'small muted', text: `${pct(usedPct, 0)} usado` }),
            el('div', { class: 'spacer' }),
            el('span', { class: 'small muted', text: `Quedan ${money(Math.max(0, test.budget - m.spend))}` }))),
      }));
    }

    /* Embudo + hipótesis */
    const funnelHost = el('div');
    const funnelSteps = [
      { stage: 'Impresiones', value: m.impressions },
      { stage: 'Clics', value: m.clicks },
      { stage: 'Visitas a la landing', value: m.views },
      { stage: 'Pedidos', value: m.orders },
      { stage: 'Entregados', value: m.delivered },
    ];

    content.append(el('div', { class: 'grid main-side' },
      card({
        title: 'Embudo del testeo',
        subtitle: 'Del anuncio a la entrega — dónde se cae la gente',
        body: el('div', {}, funnelHost,
          tableView([
            { key: 'stage', label: 'Etapa' },
            { key: 'value', label: 'Cantidad', num: true },
          ], funnelSteps.map((s) => ({ stage: s.stage, value: num(s.value) })))),
      }),
      el('div', { class: 'stack' },
        card({
          title: 'Estado',
          body: el('div', { class: 'stack', style: { gap: '14px' } },
            el('div', {}, el('div', { class: 'sec-title', text: 'Fase' }), statusRow),
            el('div', {}, el('div', { class: 'sec-title', text: 'Veredicto' }), verdictRow)),
        }),
        card({
          title: 'Hipótesis',
          body: test.hypothesis
            ? el('p', { style: { fontSize: '13.5px', lineHeight: '1.65', color: 'var(--ink-2)' }, text: test.hypothesis })
            : el('p', { class: 'small muted', text: 'Sin hipótesis registrada. Escríbela desde Editar — es lo que convierte el gasto en aprendizaje.' }),
        }))));

    funnelChart(funnelHost, funnelSteps);

    /* Landings del testeo */
    content.append(card({
      title: 'Landings de este testeo',
      subtitle: test.pages.length ? `${test.pages.length} página${test.pages.length === 1 ? '' : 's'} vinculada${test.pages.length === 1 ? '' : 's'}` : '',
      flush: true,
      body: test.pages.length ? dataTable([
        { key: 'title', label: 'Página', render: (p) => cellStack(p.title, `/p/${p.slug}`) },
        { key: 'variant', label: 'Variante', render: (p) => el('span', { class: 'badge' }, p.variant) },
        {
          key: 'status', label: 'Estado',
          render: (p) => el('span', { class: `badge ${p.status === 'published' ? 'good' : ''}` },
            el('span', { class: 'dot' }), p.status === 'published' ? 'Publicada' : 'Borrador'),
        },
        {
          key: 'go', label: '', width: '44px',
          render: (p) => el('a', {
            class: 'icon-btn', style: { width: '30px', height: '30px' },
            href: `/p/${p.slug}${p.status === 'published' ? '' : '?preview=1'}`,
            target: '_blank', rel: 'noopener',
          }, icon('external')),
        },
      ], test.pages, { onRowClick: (p) => navigate(`pages/${p.id}`) })
        : emptyState({
          icon: 'pages', title: 'Sin landings vinculadas',
          text: 'Ve al módulo Páginas y asigna este testeo a una landing para empezar a medir.',
          action: (() => {
            const b = el('button', { class: 'btn ghost' }, 'Ir a Páginas');
            b.addEventListener('click', () => navigate('pages'));
            return b;
          })(),
        }),
    }));

    /* Inversión + pedidos */
    content.append(el('div', { class: 'grid g2' },
      card({
        title: 'Registro de inversión',
        subtitle: `${test.spend_log.length} entrada${test.spend_log.length === 1 ? '' : 's'}`,
        actions: (() => {
          const b = el('button', { class: 'btn ghost sm' }, icon('plus'), 'Añadir');
          b.addEventListener('click', () => openSpend());
          return b;
        })(),
        flush: true,
        body: test.spend_log.length ? dataTable([
          { key: 'date', label: 'Fecha', render: (s) => fmtDate(s.date) },
          { key: 'spend', label: 'Inversión', num: true, render: (s) => money(s.spend) },
          { key: 'clicks', label: 'Clics', num: true, render: (s) => num(s.clicks) },
          {
            key: 'cpc', label: 'CPC', num: true,
            render: (s) => (s.clicks ? money(Math.round(s.spend / s.clicks)) : '—'),
          },
          {
            key: 'del', label: '', width: '40px',
            render: (s) => {
              const b = el('button', { class: 'icon-btn', style: { width: '28px', height: '28px' } }, icon('trash'));
              b.addEventListener('click', async (e) => {
                e.stopPropagation();
                await api.delete(`/api/spend/${s.id}`);
                toast('Registro eliminado');
                reload();
              });
              return b;
            },
          },
        ], test.spend_log)
          : emptyState({
            icon: 'wallet', title: 'Sin inversión registrada',
            text: 'Anota cuánto gastas cada día para que el CPA y el ROAS sean reales.',
          }),
      }),
      card({
        title: 'Últimos pedidos',
        subtitle: `${num(test.metrics.orders)} en total`,
        flush: true,
        body: test.recent_orders.length ? dataTable([
          { key: 'customer_name', label: 'Cliente', render: (o) => cellStack(o.customer_name, o.city || '—') },
          { key: 'total', label: 'Total', num: true, render: (o) => money(o.total) },
          { key: 'status', label: 'Estado', render: (o) => statusBadge(orderStatus(o.status)) },
        ], test.recent_orders, { onRowClick: (o) => navigate(`orders/${o.id}`) })
          : emptyState({ icon: 'cart', title: 'Sin pedidos aún', text: 'Cuando entre el primero, aparecerá aquí.' }),
      })));

    /* Notas */
    const notesForm = el('form', { class: 'form-grid' },
      field({
        label: '', name: 'notes', type: 'textarea', rows: 4, value: test.notes,
        placeholder: 'Qué creativo funcionó, qué público falló, qué probarías después…',
      }));
    const notesBtn = el('button', { class: 'btn ghost sm', type: 'button' }, icon('save'), 'Guardar aprendizajes');
    notesBtn.addEventListener('click', async () => {
      test = (await api.patch(`/api/tests/${test.id}`, readForm(notesForm))).test;
      toast('Aprendizajes guardados');
    });
    notesForm.append(notesBtn);
    content.append(card({
      title: 'Aprendizajes',
      subtitle: 'Lo que este testeo te enseñó, para no repetir el error en el siguiente',
      body: notesForm,
    }));
  }

  async function reload() {
    test = (await api.get(`/api/tests/${test.id}`)).test;
    render();
  }

  function openSpend() {
    const form = el('form', { class: 'form-grid' },
      field({ label: 'Fecha', name: 'date', type: 'date', value: new Date().toISOString().slice(0, 10), required: true }),
      el('div', { class: 'field-row' },
        field({ label: 'Inversión del día', name: 'spend', prefix: '$', placeholder: '85000', required: true }),
        field({
          label: 'Canal', name: 'channel', type: 'select', value: test.channel,
          options: Object.entries(CHANNELS).map(([k, v]) => ({ value: k, label: v })),
        })),
      el('div', { class: 'field-row' },
        field({ label: 'Impresiones', name: 'impressions', type: 'number', placeholder: '12400' }),
        field({ label: 'Clics', name: 'clicks', type: 'number', placeholder: '310' })));

    modal({
      title: 'Registrar inversión',
      subtitle: 'Anótala a diario: sin este dato el CPA y el ROAS son ficción.',
      body: form,
      actions: [
        { label: 'Cancelar', variant: 'ghost' },
        {
          label: 'Guardar',
          onClick: async () => {
            const d = readForm(form);
            try {
              await api.post('/api/spend', { ...d, test_id: test.id, spend: parseMoney(d.spend) });
              toast('Inversión registrada');
              reload();
            } catch (err) { toastError(err); return false; }
          },
        },
      ],
    });
  }

  function openEdit() {
    const form = el('form', { class: 'form-grid' },
      field({ label: 'Nombre', name: 'name', value: test.name, required: true }),
      field({ label: 'Hipótesis', name: 'hypothesis', type: 'textarea', rows: 3, value: test.hypothesis }),
      el('div', { class: 'field-row' },
        field({ label: 'Presupuesto', name: 'budget', prefix: '$', value: test.budget }),
        field({ label: 'CPA objetivo', name: 'target_cpa', prefix: '$', value: test.target_cpa })),
      el('div', { class: 'field-row' },
        field({ label: 'Inicio', name: 'start_date', type: 'date', value: test.start_date || '' }),
        field({ label: 'Fin', name: 'end_date', type: 'date', value: test.end_date || '' })),
      field({
        label: 'Canal', name: 'channel', type: 'select', value: test.channel,
        options: Object.entries(CHANNELS).map(([k, v]) => ({ value: k, label: v })),
      }));

    modal({
      title: 'Editar testeo',
      body: form,
      large: true,
      actions: [
        {
          label: 'Eliminar', variant: 'danger',
          onClick: async (close) => {
            const ok = await confirmDialog({
              title: `¿Eliminar ${test.code}?`,
              text: 'Los pedidos y páginas se conservan, pero pierden el vínculo con este testeo.',
              confirmLabel: 'Eliminar',
            });
            if (!ok) return false;
            await api.delete(`/api/tests/${test.id}`);
            toast('Testeo eliminado');
            close();
            navigate('tests');
          },
        },
        { label: 'Cancelar', variant: 'ghost' },
        {
          label: 'Guardar',
          onClick: async () => {
            const d = readForm(form);
            try {
              await api.patch(`/api/tests/${test.id}`, {
                ...d, budget: parseMoney(d.budget), target_cpa: parseMoney(d.target_cpa),
              });
              toast('Testeo actualizado');
              await reload();
              setHeader(test.name, `${test.code} · ${CHANNELS[test.channel]} · ${test.product_name || ''}`,
                [backBtn, spendBtn, editBtn]);
            } catch (err) { toastError(err); return false; }
          },
        },
      ],
    });
  }

  render();
}

/**
 * Traduce las métricas a una recomendación en lenguaje llano.
 * No decide por el usuario: le dice qué está viendo el dato.
 */
function readout(test) {
  const m = test.metrics;

  if (m.spend === 0) {
    return banner({
      ico: 'info',
      text: 'Todavía no hay inversión registrada. Anota el gasto diario para que el CPA, el ROAS y la utilidad tengan sentido.',
    });
  }
  if (m.orders === 0) {
    return banner({
      tone: 'warn', ico: 'alert',
      html: `Llevas <b>${money(m.spend)}</b> invertidos y <b>ningún pedido</b>. `
        + 'Si ya superaste tu CPA objetivo sin una sola venta, suele ser señal de oferta o ángulo, no de puja.',
    });
  }

  const overTarget = test.target_cpa > 0 && m.cpa > test.target_cpa;
  const underTarget = test.target_cpa > 0 && m.cpa <= test.target_cpa;
  const lowSample = m.orders < 10;

  if (lowSample) {
    return banner({
      ico: 'info',
      html: `Sólo <b>${m.orders} pedido${m.orders === 1 ? '' : 's'}</b> hasta ahora: la muestra es pequeña para decidir. `
        + 'Con menos de 10 conversiones el CPA se mueve demasiado como para sacar conclusiones.',
    });
  }
  if (underTarget && m.profit > 0) {
    return banner({
      ico: 'rocket',
      html: `CPA de <b>${money(m.cpa)}</b> bajo tu meta de ${money(test.target_cpa)} y utilidad positiva de `
        + `<b>${money(m.profit)}</b>. Este testeo tiene pinta de ganador — considera subir presupuesto poco a poco.`,
    });
  }
  if (overTarget) {
    return banner({
      tone: 'warn', ico: 'alert',
      html: `CPA de <b>${money(m.cpa)}</b> contra una meta de ${money(test.target_cpa)}. `
        + `La tasa de entrega va en ${pct(m.delivery_rate)} — en contra entrega, mejorar la confirmación suele ser más rentable que bajar el CPA.`,
    });
  }
  return banner({
    ico: 'info',
    html: `${m.orders} pedidos a un CPA de <b>${money(m.cpa)}</b>, con ${pct(m.delivery_rate)} de entrega. `
      + 'Fija un CPA objetivo desde Editar para que el panel te diga si vas bien.',
  });
}
