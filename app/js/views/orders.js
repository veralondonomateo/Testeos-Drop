import {
  el, clear, api, state, money, num, fmtDate, fmtDateTime, fmtAgo,
  orderStatus, toast, toastError, debounce, copyText, parseMoney,
} from '../core.js';
import { icon } from '../icons.js';
import {
  card, dataTable, cellStack, statusBadge, emptyState, skeletonTable,
  searchBox, selectControl, tabBar, drawer, modal, field, readForm,
  defList, timeline, pipeline, confirmDialog, banner,
} from '../ui.js';
import { setHeader, navigate, refreshBootstrap } from '../app.js';

const STATUS_FLOW = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

export default async function ordersView({ host, params, query }) {
  const filters = { status: '', q: '', product_id: '' };
  let orders = [];
  let counts = {};
  let products = [];
  const selected = new Set();

  const listHost = el('div');
  const bulkBar = el('div');

  const exportBtn = el('button', { class: 'btn ghost' }, icon('download'), 'Exportar CSV');
  exportBtn.addEventListener('click', () => {
    const q = api.qs({ status: filters.status, q: filters.q, product_id: filters.product_id });
    window.location.href = `/api/orders-export.csv${q}`;
  });

  const newBtn = el('button', { class: 'btn' }, icon('plus'), 'Nuevo pedido');
  newBtn.addEventListener('click', () => openOrderForm());

  setHeader('Pedidos', 'Gestiona el pipeline completo del contra entrega', [exportBtn, newBtn]);

  const search = searchBox('Buscar por nombre, teléfono, ciudad o código…', debounce((v) => {
    filters.q = v; load();
  }));

  const tabsHost = el('div');
  const productFilter = el('div');

  host.append(
    el('div', { class: 'filters' }, tabsHost, el('div', { class: 'spacer' }), productFilter, search),
    bulkBar,
    card({ flush: true, body: listHost })
  );

  listHost.append(skeletonTable(8));

  /* ── Carga ── */

  async function load() {
    listHost.classList.add('refreshing');
    try {
      const [res, prodRes] = await Promise.all([
        api.get('/api/orders', { ...filters, limit: 300 }),
        products.length ? Promise.resolve({ products }) : api.get('/api/products'),
      ]);
      orders = res.orders;
      counts = res.counts;
      products = prodRes.products;
      renderTabs();
      renderProductFilter();
      renderList();
    } catch (err) {
      toastError(err);
    } finally {
      listHost.classList.remove('refreshing');
    }
  }

  function renderTabs() {
    const items = [{ value: '', label: 'Todos', count: counts.all }];
    for (const key of Object.keys(state.bootstrap.order_status)) {
      items.push({ value: key, label: orderStatus(key).label, count: counts[key] });
    }
    clear(tabsHost).append(tabBar(items, filters.status, (v) => {
      filters.status = v;
      selected.clear();
      load();
    }));
  }

  function renderProductFilter() {
    if (products.length < 2) return clear(productFilter);
    clear(productFilter).append(selectControl(
      [{ value: '', label: 'Todos los productos' }, ...products.map((p) => ({ value: p.id, label: p.name }))],
      filters.product_id,
      (v) => { filters.product_id = v; load(); },
      { width: '190px' }
    ));
  }

  function renderBulkBar() {
    clear(bulkBar);
    if (!selected.size) return;

    const statusSel = selectControl(
      [{ value: '', label: 'Cambiar estado a…' },
        ...Object.entries(state.bootstrap.order_status).map(([k, v]) => ({ value: k, label: v.label }))],
      '',
      async (v) => {
        if (!v) return;
        try {
          const r = await api.post('/api/orders/bulk-status', { ids: [...selected], status: v });
          toast(`${r.updated} pedido${r.updated === 1 ? '' : 's'} actualizado${r.updated === 1 ? '' : 's'}`);
          selected.clear();
          await load();
          refreshBootstrap();
        } catch (err) { toastError(err); }
      },
      { width: '200px' }
    );

    const clearBtn = el('button', { class: 'btn ghost sm' }, 'Quitar selección');
    clearBtn.addEventListener('click', () => { selected.clear(); renderList(); });

    bulkBar.append(banner({
      ico: 'check',
      text: `${selected.size} pedido${selected.size === 1 ? '' : 's'} seleccionado${selected.size === 1 ? '' : 's'}`,
      action: el('div', { class: 'row' }, statusSel, clearBtn),
    }));
  }

  function renderList() {
    renderBulkBar();
    clear(listHost);

    if (!orders.length) {
      listHost.append(emptyState({
        icon: 'cart',
        title: filters.q || filters.status ? 'Ningún pedido coincide' : 'Todavía no hay pedidos',
        text: filters.q || filters.status
          ? 'Prueba con otro filtro o limpia la búsqueda.'
          : 'Publica tu landing y lanza tráfico: los pedidos entrarán aquí automáticamente.',
        action: (() => {
          const b = el('button', { class: 'btn' }, icon('plus'), 'Registrar uno manualmente');
          b.addEventListener('click', () => openOrderForm());
          return b;
        })(),
      }));
      return;
    }

    listHost.append(dataTable([
      {
        key: 'code', label: 'Pedido', width: '190px',
        render: (o) => cellStack(o.customer_name, `${o.code} · ${fmtAgo(o.created_at)}`),
      },
      {
        key: 'city', label: 'Destino',
        render: (o) => cellStack(o.city || '—', o.department || ''),
      },
      {
        key: 'product_name', label: 'Producto',
        render: (o) => cellStack(o.product_name || '—', o.offer_name ? o.offer_name.split('—')[0].trim() : `${o.qty} und.`),
      },
      { key: 'total', label: 'Total', num: true, render: (o) => el('span', { class: 'cell-strong num', text: money(o.total) }) },
      {
        key: 'utm_source', label: 'Origen',
        render: (o) => el('span', { class: 'small muted', text: o.utm_source || 'directo' }),
      },
      { key: 'status', label: 'Estado', render: (o) => statusBadge(orderStatus(o.status)) },
      {
        key: 'actions', label: '', width: '44px',
        render: (o) => {
          const b = el('button', { class: 'icon-btn', style: { width: '30px', height: '30px' }, title: 'Ver detalle' }, icon('chevronRight'));
          b.addEventListener('click', (e) => { e.stopPropagation(); openDetail(o.id); });
          return b;
        },
      },
    ], orders, {
      onRowClick: (o) => openDetail(o.id),
      selectable: true,
      selected,
      onSelect: () => renderList(),
    }));
  }

  /* ── Detalle ── */

  async function openDetail(orderId) {
    const { order } = await api.get(`/api/orders/${orderId}`);
    const meta = orderStatus(order.status);

    const body = el('div', { class: 'stack' });

    // Pipeline visual
    const stepIndex = STATUS_FLOW.indexOf(order.status);
    if (stepIndex >= 0) {
      body.append(el('div', {},
        el('div', { class: 'sec-title', text: 'Progreso' }),
        pipeline(STATUS_FLOW.map((s, i) => ({ label: orderStatus(s).label, step: i })), stepIndex)));
    } else {
      body.append(banner({
        tone: order.status === 'cancelled' ? 'warn' : '',
        ico: 'alert',
        text: `Este pedido está marcado como ${meta.label.toLowerCase()}.`,
      }));
    }

    // Cambio de estado
    const statusRow = el('div', { class: 'row wrap' });
    for (const key of Object.keys(state.bootstrap.order_status)) {
      if (key === order.status) continue;
      const b = el('button', { class: 'btn ghost sm' }, orderStatus(key).label);
      b.addEventListener('click', async () => {
        try {
          await api.patch(`/api/orders/${order.id}`, { status: key });
          toast(`Pedido marcado como ${orderStatus(key).label.toLowerCase()}`);
          d.close();
          await load();
          refreshBootstrap();
        } catch (err) { toastError(err); }
      });
      statusRow.append(b);
    }
    body.append(card({ title: 'Cambiar estado', tight: true, body: statusRow }));

    // Datos del cliente
    const waLink = order.phone
      ? el('a', {
        href: `https://wa.me/57${order.phone.replace(/\D/g, '')}`,
        target: '_blank', rel: 'noopener',
        style: { color: 'var(--series-1)', fontWeight: '500' },
      }, order.phone)
      : '—';

    body.append(card({
      title: 'Entrega',
      body: defList([
        ['Cliente', order.customer_name],
        ['Teléfono', waLink],
        ['Correo', order.email || '—'],
        ['Dirección', order.address || '—'],
        ['Ciudad', `${order.city || '—'}${order.department ? `, ${order.department}` : ''}`],
        ['Transportadora', order.courier || '—'],
        ['Guía', order.tracking || '—'],
      ]),
    }));

    body.append(card({
      title: 'Compra',
      body: defList([
        ['Producto', order.product_name || '—'],
        ['Oferta', order.offer_name || '—'],
        ['Cantidad', `${order.qty} und.`],
        ['Subtotal', money(order.subtotal)],
        ['Envío', order.shipping ? money(order.shipping) : 'Gratis'],
        ['Total a cobrar', el('b', { text: money(order.total) })],
        ['Costo estimado', money(order.cost_total)],
        ['Margen bruto', el('b', {
          style: { color: order.total - order.cost_total >= 0 ? 'var(--good)' : 'var(--critical)' },
          text: money(order.total - order.cost_total),
        })],
        ['Pago', order.payment_method === 'cod' ? 'Contra entrega' : 'En línea'],
      ]),
    }));

    body.append(card({
      title: 'Atribución',
      body: defList([
        ['Landing', order.page_title || '—'],
        ['Testeo', order.test_name ? `${order.test_code} · ${order.test_name}` : '—'],
        ['Variante', order.variant || 'A'],
        ['Fuente', order.utm_source || 'directo'],
        ['Campaña', order.utm_campaign || '—'],
        ['Creativo', order.utm_content || '—'],
        ['Dispositivo', order.device || '—'],
      ]),
    }));

    // Notas y logística editables
    const logisticsForm = el('form', { class: 'form-grid' },
      el('div', { class: 'field-row' },
        field({
          label: 'Transportadora', name: 'courier', type: 'select', value: order.courier,
          options: [{ value: '', label: 'Sin asignar' },
            ...(state.bootstrap.settings.couriers || []).map((c) => ({ value: c.name, label: c.name }))],
        }),
        field({ label: 'Número de guía', name: 'tracking', value: order.tracking, placeholder: 'Ej: 99887766' })),
      field({ label: 'Notas internas', name: 'notes', type: 'textarea', value: order.notes, placeholder: 'Cliente pidió entrega en la tarde…' }),
      el('button', { class: 'btn', type: 'submit' }, icon('save'), 'Guardar cambios'));

    logisticsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.patch(`/api/orders/${order.id}`, readForm(logisticsForm));
        toast('Pedido actualizado');
        d.close();
        load();
      } catch (err) { toastError(err); }
    });

    body.append(card({ title: 'Logística y notas', body: logisticsForm }));

    body.append(card({
      title: 'Historial',
      body: timeline(order.events.map((e) => ({
        title: e.message || e.type,
        meta: `${fmtDateTime(e.created_at)} · ${e.actor}`,
      }))),
    }));

    const copyBtn = el('button', { class: 'btn ghost' }, icon('copy'), 'Copiar datos');
    copyBtn.addEventListener('click', () => copyText(
      `${order.customer_name}\n${order.phone}\n${order.address}\n${order.city}, ${order.department}\n`
      + `${order.product_name} — ${order.offer_name}\nTotal: ${money(order.total)}\nPedido: ${order.code}`));

    const delBtn = el('button', { class: 'btn ghost' }, icon('trash'));
    delBtn.title = 'Eliminar pedido';
    delBtn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: '¿Eliminar este pedido?',
        text: `Se borrará ${order.code} de forma permanente. Si sólo quieres descartarlo, márcalo como cancelado.`,
        confirmLabel: 'Eliminar',
      });
      if (!ok) return;
      await api.delete(`/api/orders/${order.id}`);
      toast('Pedido eliminado');
      d.close();
      load();
      refreshBootstrap();
    });

    const d = drawer({
      title: order.code,
      subtitle: `${fmtDateTime(order.created_at)} · ${meta.label}`,
      body,
      footer: el('div', { class: 'row', style: { width: '100%' } }, delBtn, el('div', { class: 'spacer' }), copyBtn),
    });
  }

  /* ── Alta manual ── */

  function openOrderForm() {
    const form = el('form', { class: 'form-grid' });
    const offerHost = el('div');

    const productOptions = products.map((p) => ({ value: p.id, label: p.name }));
    const productField = field({
      label: 'Producto', name: 'product_id', type: 'select',
      options: productOptions.length ? productOptions : [{ value: '', label: 'Crea un producto primero' }],
    });

    function renderOffers() {
      const pid = productField.querySelector('select').value;
      const product = products.find((p) => p.id === pid);
      clear(offerHost);
      if (!product) return;
      const opts = (product.offers || []).map((o) => ({ value: o.id, label: `${o.name} — ${money(o.price)}` }));
      offerHost.append(field({
        label: 'Oferta', name: 'offer_id', type: 'select',
        options: opts.length ? opts : [{ value: '', label: `Precio base — ${money(product.price)}` }],
      }));
    }
    productField.querySelector('select').addEventListener('change', renderOffers);

    form.append(
      productField,
      offerHost,
      el('div', { class: 'field-row' },
        field({ label: 'Nombre del cliente', name: 'customer_name', required: true, placeholder: 'Nombre y apellido' }),
        field({ label: 'Teléfono', name: 'phone', type: 'tel', required: true, placeholder: '300 000 0000' })),
      el('div', { class: 'field-row' },
        field({ label: 'Departamento', name: 'department', placeholder: 'Antioquia' }),
        field({ label: 'Ciudad', name: 'city', placeholder: 'Medellín' })),
      field({ label: 'Dirección', name: 'address', placeholder: 'Calle 10 # 20-30, barrio' }),
      el('div', { class: 'field-row' },
        field({ label: 'Cantidad', name: 'qty', type: 'number', value: '1', min: '1' }),
        field({ label: 'Total a cobrar', name: 'total', prefix: '$', placeholder: '99900' })),
      field({ label: 'Notas', name: 'notes', type: 'textarea', rows: 2, placeholder: 'Opcional' }));

    renderOffers();

    // Autocompleta el total al elegir la oferta
    form.addEventListener('change', (e) => {
      if (e.target.name !== 'offer_id' && e.target.name !== 'product_id') return;
      const pid = form.querySelector('[name=product_id]')?.value;
      const product = products.find((p) => p.id === pid);
      if (!product) return;
      const oid = form.querySelector('[name=offer_id]')?.value;
      const offer = (product.offers || []).find((o) => o.id === oid);
      form.querySelector('[name=total]').value = String(offer ? offer.price : product.price);
      form.querySelector('[name=qty]').value = String(offer ? offer.qty : 1);
    });

    modal({
      title: 'Registrar pedido manual',
      subtitle: 'Para pedidos que llegan por WhatsApp, llamada o mensaje directo.',
      body: form,
      large: true,
      actions: [
        { label: 'Cancelar', variant: 'ghost' },
        {
          label: 'Crear pedido',
          onClick: async () => {
            const data = readForm(form);
            const product = products.find((p) => p.id === data.product_id);
            const offer = (product?.offers || []).find((o) => o.id === data.offer_id);
            try {
              await api.post('/api/orders', {
                ...data,
                total: parseMoney(data.total),
                subtotal: parseMoney(data.total),
                offer_name: offer?.name || '',
              });
              toast('Pedido creado');
              await load();
              refreshBootstrap();
            } catch (err) {
              toastError(err);
              return false;
            }
          },
        },
      ],
    });
  }

  await load();

  if (params[0]) openDetail(params[0]).catch(toastError);
  else if (query.new === '1') openOrderForm();
}
