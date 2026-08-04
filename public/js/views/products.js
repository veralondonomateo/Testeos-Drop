import {
  el, clear, api, money, num, pct, fmtDate, toast, toastError,
  debounce, parseMoney,
} from '../core.js';
import { icon } from '../icons.js';
import {
  card, dataTable, cellStack, emptyState, skeletonTable, searchBox,
  drawer, field, readForm, confirmDialog, statTile, tabBar,
} from '../ui.js';
import { setHeader, navigate, refreshBootstrap } from '../app.js';

const STATUS = {
  draft:    { label: 'Borrador',  tone: 'neutral' },
  testing:  { label: 'En testeo', tone: 'info' },
  winner:   { label: 'Ganador',   tone: 'good' },
  archived: { label: 'Archivado', tone: 'neutral' },
};

export default async function productsView({ host, params }) {
  const filters = { q: '', status: '' };
  let products = [];

  const newBtn = el('button', { class: 'btn' }, icon('plus'), 'Nuevo producto');
  newBtn.addEventListener('click', () => openEditor(null));

  setHeader('Productos', 'El catálogo de lo que estás probando', newBtn);

  const tabsHost = el('div');
  const listHost = el('div');
  const statsHost = el('div');

  host.append(
    statsHost,
    el('div', { class: 'filters', style: { marginTop: '16px' } },
      tabsHost, el('div', { class: 'spacer' }),
      searchBox('Buscar producto…', debounce((v) => { filters.q = v; load(); }))),
    card({ flush: true, body: listHost })
  );
  listHost.append(skeletonTable(5));

  async function load() {
    listHost.classList.add('refreshing');
    try {
      products = (await api.get('/api/products', filters)).products;
      renderStats();
      renderTabs();
      renderList();
    } catch (err) { toastError(err); }
    finally { listHost.classList.remove('refreshing'); }
  }

  function renderStats() {
    const testing = products.filter((p) => p.status === 'testing').length;
    const winners = products.filter((p) => p.status === 'winner').length;
    const stock = products.reduce((a, p) => a + p.stock, 0);
    clear(statsHost).append(el('div', { class: 'stats c4' },
      statTile({ label: 'Productos', value: num(products.length), hint: 'en el catálogo' }),
      statTile({ label: 'En testeo', value: num(testing), hint: 'con tráfico activo' }),
      statTile({ label: 'Ganadores', value: num(winners), hint: 'validados para escalar' }),
      statTile({ label: 'Unidades en stock', value: num(stock), hint: 'suma del catálogo' })));
  }

  function renderTabs() {
    const count = (s) => products.filter((p) => p.status === s).length;
    clear(tabsHost).append(tabBar([
      { value: '', label: 'Todos' },
      ...Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label, count: count(k) })),
    ], filters.status, (v) => { filters.status = v; load(); }));
  }

  function renderList() {
    clear(listHost);
    if (!products.length) {
      listHost.append(emptyState({
        icon: 'box',
        title: filters.q ? 'Ningún producto coincide' : 'Aún no hay productos',
        text: 'Crea el primero con su costo y precio para que el panel calcule tu margen real.',
        action: (() => {
          const b = el('button', { class: 'btn' }, icon('plus'), 'Crear producto');
          b.addEventListener('click', () => openEditor(null));
          return b;
        })(),
      }));
      return;
    }

    listHost.append(dataTable([
      {
        key: 'name', label: 'Producto',
        render: (p) => el('div', { class: 'row', style: { gap: '11px' } },
          el('div', { class: 'thumb' }, p.image
            ? el('img', { src: p.image, alt: '' })
            : el('span', { text: p.name[0] })),
          cellStack(p.name, p.tagline || p.category || '—')),
      },
      {
        key: 'price', label: 'Precio', num: true,
        render: (p) => el('div', {},
          el('div', { class: 'cell-strong num', text: money(p.price) }),
          p.compare_price > p.price
            ? el('div', { class: 'cell-sub num', style: { textDecoration: 'line-through' }, text: money(p.compare_price) })
            : null),
      },
      {
        key: 'margin', label: 'Margen', num: true,
        render: (p) => {
          const margin = p.price - p.cost - p.ship_cost;
          const rate = p.price > 0 ? (margin / p.price) * 100 : 0;
          return el('div', {},
            el('div', {
              class: 'cell-strong num',
              style: { color: margin >= 0 ? 'var(--good)' : 'var(--critical)' },
              text: money(margin),
            }),
            el('div', { class: 'cell-sub num', text: pct(rate, 0) }));
        },
      },
      { key: 'stock', label: 'Stock', num: true, render: (p) => num(p.stock) },
      { key: 'orders_count', label: 'Pedidos', num: true, render: (p) => num(p.orders_count) },
      { key: 'pages_count', label: 'Landings', num: true, render: (p) => num(p.pages_count) },
      {
        key: 'status', label: 'Estado',
        render: (p) => el('span', { class: `badge ${STATUS[p.status]?.tone || ''}` },
          el('span', { class: 'dot' }), STATUS[p.status]?.label || p.status),
      },
    ], products, { onRowClick: (p) => openEditor(p) }));
  }

  /* ── Editor ── */

  function openEditor(product) {
    const isNew = !product;
    const offers = product?.offers?.length
      ? structuredClone(product.offers)
      : [{ name: '', qty: 1, price: 0, compare_price: 0, is_default: 1 }];

    const form = el('form', { class: 'form-grid', id: 'product-form' });
    const offersHost = el('div', { class: 'stack', style: { gap: '10px' } });
    const marginHost = el('div');

    form.append(
      field({ label: 'Nombre', name: 'name', required: true, value: product?.name || '', placeholder: 'Ej: Plasma — Remolacha Orgánica' }),
      field({ label: 'Frase corta', name: 'tagline', value: product?.tagline || '', placeholder: 'Fuerza concentrada para tu corazón' }),
      el('div', { class: 'field-row' },
        field({ label: 'Categoría', name: 'category', value: product?.category || '', placeholder: 'Salud y bienestar' }),
        field({
          label: 'Estado', name: 'status', type: 'select', value: product?.status || 'draft',
          options: Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label })),
        })),
      field({ label: 'Descripción', name: 'description', type: 'textarea', rows: 4, value: product?.description || '' }),
      field({ label: 'URL de la imagen', name: 'image', value: product?.image || '', placeholder: 'https://…', help: 'Opcional. Se muestra en las listas del panel.' }),

      el('div', { class: 'sec-title', style: { marginTop: '8px' }, text: 'Economía unitaria' }),
      el('div', { class: 'field-row c3' },
        field({ label: 'Costo del producto', name: 'cost', prefix: '$', value: product?.cost ?? 0, help: 'Lo que te cuesta a ti' }),
        field({ label: 'Costo de envío', name: 'ship_cost', prefix: '$', value: product?.ship_cost ?? 0, help: 'Lo que asumes tú' }),
        field({ label: 'Stock', name: 'stock', type: 'number', value: product?.stock ?? 0 })),
      el('div', { class: 'field-row' },
        field({ label: 'Precio de venta', name: 'price', prefix: '$', value: product?.price ?? 0 }),
        field({ label: 'Precio tachado', name: 'compare_price', prefix: '$', value: product?.compare_price ?? 0, help: 'Para el anclaje de precio' })),
      marginHost,

      el('div', { class: 'sec-title', style: { marginTop: '8px' }, text: 'Ofertas / paquetes' }),
      el('p', { class: 'small muted', style: { marginTop: '-8px' }, text: 'Estas son las opciones que verá el cliente en el selector de la landing.' }),
      offersHost);

    const addOfferBtn = el('button', { class: 'btn ghost sm', type: 'button' }, icon('plus'), 'Añadir oferta');
    addOfferBtn.addEventListener('click', () => {
      offers.push({ name: '', qty: 1, price: 0, compare_price: 0, is_default: 0 });
      renderOffers();
    });
    form.append(addOfferBtn);

    function renderOffers() {
      clear(offersHost);
      offers.forEach((o, i) => {
        const row = el('div', {
          style: {
            border: '1px solid var(--line)', borderRadius: '12px', padding: '14px',
            background: 'var(--surface-2)', display: 'grid', gap: '10px',
          },
        });
        const nameInput = el('input', { value: o.name, placeholder: 'Ej: Lleva 2, Paga 1' });
        const qtyInput = el('input', { type: 'number', min: '1', value: o.qty });
        const priceInput = el('input', { value: o.price });
        const defaultRadio = el('input', { type: 'radio', name: 'offer_default' });
        defaultRadio.checked = !!o.is_default;

        nameInput.addEventListener('input', () => { o.name = nameInput.value; });
        qtyInput.addEventListener('input', () => { o.qty = Number(qtyInput.value) || 1; });
        priceInput.addEventListener('input', () => { o.price = parseMoney(priceInput.value); updateMargin(); });
        defaultRadio.addEventListener('change', () => {
          offers.forEach((x, xi) => { x.is_default = xi === i ? 1 : 0; });
        });

        const del = el('button', { class: 'icon-btn', type: 'button', title: 'Quitar' }, icon('trash'));
        del.addEventListener('click', () => { offers.splice(i, 1); renderOffers(); });

        row.append(
          el('div', { class: 'row' },
            el('div', { class: 'field', style: { flex: '1' } },
              el('label', { text: `Oferta ${i + 1}` }), nameInput),
            offers.length > 1 ? del : null),
          el('div', { class: 'field-row c3' },
            el('div', { class: 'field' }, el('label', { text: 'Unidades' }), qtyInput),
            el('div', { class: 'field' }, el('label', { text: 'Precio' }),
              el('div', { class: 'input-prefix' }, el('span', { text: '$' }), priceInput)),
            el('div', { class: 'field' }, el('label', { text: 'Predeterminada' }),
              el('label', { class: 'switch', style: { height: '40px' } }, defaultRadio,
                el('span', { class: 'switch-label muted small', text: 'Preseleccionada' })))));
        offersHost.append(row);
      });
    }

    function updateMargin() {
      const d = readForm(form);
      const price = parseMoney(d.price);
      const cost = parseMoney(d.cost);
      const ship = parseMoney(d.ship_cost);
      const margin = price - cost - ship;
      const rate = price > 0 ? (margin / price) * 100 : 0;
      // Con un margen sano el producto aguanta un CPA razonable
      const breakEvenCPA = Math.max(0, margin);

      clear(marginHost).append(el('div', {
        style: {
          display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '12px',
          padding: '14px 16px', borderRadius: '12px',
          background: 'var(--surface-2)', border: '1px solid var(--line)',
        },
      },
        el('div', {},
          el('div', { class: 'small muted', text: 'Margen por venta' }),
          el('div', {
            style: { fontSize: '17px', fontWeight: '600', marginTop: '2px', color: margin >= 0 ? 'var(--good)' : 'var(--critical)' },
            text: money(margin),
          })),
        el('div', {},
          el('div', { class: 'small muted', text: 'Margen %' }),
          el('div', { style: { fontSize: '17px', fontWeight: '600', marginTop: '2px' }, text: pct(rate, 0) })),
        el('div', {},
          el('div', { class: 'small muted', text: 'CPA de equilibrio' }),
          el('div', { style: { fontSize: '17px', fontWeight: '600', marginTop: '2px' }, text: money(breakEvenCPA) }))));
    }

    form.addEventListener('input', debounce(updateMargin, 200));
    renderOffers();
    updateMargin();

    const saveBtn = el('button', { class: 'btn' }, icon('save'), isNew ? 'Crear producto' : 'Guardar cambios');
    saveBtn.addEventListener('click', async () => {
      const data = readForm(form);
      if (!data.name?.trim()) return toast('Ponle un nombre al producto', { type: 'err' });
      const payload = {
        ...data,
        cost: parseMoney(data.cost),
        ship_cost: parseMoney(data.ship_cost),
        price: parseMoney(data.price),
        compare_price: parseMoney(data.compare_price),
        stock: Number(data.stock) || 0,
        offers: offers.filter((o) => o.name.trim()).map((o, i) => ({ ...o, sort: i })),
      };
      saveBtn.disabled = true;
      try {
        if (isNew) await api.post('/api/products', payload);
        else await api.patch(`/api/products/${product.id}`, payload);
        toast(isNew ? 'Producto creado' : 'Producto actualizado');
        d.close();
        await load();
        refreshBootstrap();
      } catch (err) { toastError(err); saveBtn.disabled = false; }
    });

    const footer = el('div', { class: 'row', style: { width: '100%' } });
    if (!isNew) {
      const delBtn = el('button', { class: 'btn ghost' }, icon('trash'));
      delBtn.title = 'Eliminar producto';
      delBtn.addEventListener('click', async () => {
        const ok = await confirmDialog({
          title: `¿Eliminar "${product.name}"?`,
          text: 'Las landings y pedidos asociados se conservarán, pero quedarán sin producto vinculado.',
          confirmLabel: 'Eliminar',
        });
        if (!ok) return;
        await api.delete(`/api/products/${product.id}`);
        toast('Producto eliminado');
        d.close();
        load();
        refreshBootstrap();
      });
      footer.append(delBtn);
    }
    footer.append(el('div', { class: 'spacer' }), saveBtn);

    const d = drawer({
      title: isNew ? 'Nuevo producto' : product.name,
      subtitle: isNew ? 'Define costo y precio para medir tu margen real' : `Creado el ${fmtDate(product.created_at)}`,
      body: form,
      footer,
      wide: true,
    });
  }

  await load();
  if (params[0]) {
    const p = products.find((x) => x.id === params[0]);
    if (p) openEditor(p);
  }
}
