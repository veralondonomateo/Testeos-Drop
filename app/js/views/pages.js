import {
  el, clear, api, num, pct, fmtDate, fmtAgo, toast, toastError,
  debounce, copyText,
} from '../core.js';
import { icon } from '../icons.js';
import {
  card, dataTable, cellStack, emptyState, skeletonTable, searchBox,
  drawer, modal, field, readForm, confirmDialog, statTile, banner, selectControl,
} from '../ui.js';
import { setHeader, refreshBootstrap } from '../app.js';

const TYPES = {
  landing: 'Landing', advertorial: 'Advertorial', quiz: 'Quiz',
  upsell: 'Upsell', gracias: 'Gracias',
};

export default async function pagesView({ host, params }) {
  const filters = { q: '' };
  let pages = [];
  let products = [];
  let tests = [];

  const newBtn = el('button', { class: 'btn' }, icon('plus'), 'Nueva página');
  newBtn.addEventListener('click', () => openCreate());

  setHeader('Páginas', 'Tus landings de testeo, publicadas y medidas', newBtn);

  const statsHost = el('div');
  const listHost = el('div');

  host.append(
    statsHost,
    el('div', { class: 'filters', style: { marginTop: '16px' } },
      el('div', { class: 'spacer' }),
      searchBox('Buscar página…', debounce((v) => { filters.q = v; load(); }))),
    card({ flush: true, body: listHost })
  );
  listHost.append(skeletonTable(4));

  async function load() {
    listHost.classList.add('refreshing');
    try {
      const [pagesRes, prodRes, testRes] = await Promise.all([
        api.get('/api/pages', filters),
        api.get('/api/products'),
        api.get('/api/tests'),
      ]);
      pages = pagesRes.pages;
      products = prodRes.products;
      tests = testRes.tests;
      renderStats();
      renderList();
    } catch (err) { toastError(err); }
    finally { listHost.classList.remove('refreshing'); }
  }

  function renderStats() {
    const published = pages.filter((p) => p.status === 'published').length;
    const views = pages.reduce((a, p) => a + p.views, 0);
    const orders = pages.reduce((a, p) => a + p.orders, 0);
    clear(statsHost).append(el('div', { class: 'stats c4' },
      statTile({ label: 'Páginas', value: num(pages.length), hint: 'en total' }),
      statTile({ label: 'Publicadas', value: num(published), hint: 'recibiendo tráfico' }),
      statTile({ label: 'Visitas acumuladas', value: num(views), hint: 'sesiones únicas' }),
      statTile({
        label: 'Conversión global', value: views ? pct((orders / views) * 100, 2) : '—',
        hint: `${num(orders)} pedidos`,
      })));
  }

  function renderList() {
    clear(listHost);
    if (!pages.length) {
      listHost.append(emptyState({
        icon: 'pages',
        title: filters.q ? 'Ninguna página coincide' : 'Todavía no hay páginas',
        text: 'Crea tu primera landing, publícala y empieza a recibir pedidos.',
        action: (() => {
          const b = el('button', { class: 'btn' }, icon('plus'), 'Crear página');
          b.addEventListener('click', () => openCreate());
          return b;
        })(),
      }));
      return;
    }

    listHost.append(dataTable([
      {
        key: 'title', label: 'Página',
        render: (p) => cellStack(p.title, `/p/${p.slug} · ${TYPES[p.type] || p.type}`),
      },
      { key: 'product_name', label: 'Producto', render: (p) => p.product_name || '—' },
      {
        key: 'test_name', label: 'Testeo',
        render: (p) => el('span', { class: 'small', text: p.test_name || '—' }),
      },
      {
        key: 'variant', label: 'Variante',
        render: (p) => el('span', { class: 'badge' }, p.variant),
      },
      { key: 'views', label: 'Visitas', num: true, render: (p) => num(p.views) },
      { key: 'orders', label: 'Pedidos', num: true, render: (p) => num(p.orders) },
      {
        key: 'cr', label: 'CR', num: true,
        render: (p) => el('span', {
          class: 'cell-strong num',
          text: p.views ? pct((p.orders / p.views) * 100, 2) : '—',
        }),
      },
      {
        key: 'status', label: 'Estado',
        render: (p) => el('span', { class: `badge ${p.status === 'published' ? 'good' : ''}` },
          el('span', { class: 'dot' }), p.status === 'published' ? 'Publicada' : 'Borrador'),
      },
      {
        key: 'actions', label: '', width: '92px',
        render: (p) => {
          const row = el('div', { class: 'row', style: { gap: '5px', justifyContent: 'flex-end' } });
          const open = el('a', {
            class: 'icon-btn', style: { width: '30px', height: '30px' },
            href: `/p/${p.slug}${p.status === 'published' ? '' : '?preview=1'}`,
            target: '_blank', rel: 'noopener', title: 'Abrir la landing',
          }, icon('external'));
          open.addEventListener('click', (e) => e.stopPropagation());
          const edit = el('button', { class: 'icon-btn', style: { width: '30px', height: '30px' }, title: 'Editar' }, icon('edit'));
          edit.addEventListener('click', (e) => { e.stopPropagation(); openEditor(p); });
          row.append(open, edit);
          return row;
        },
      },
    ], pages, { onRowClick: (p) => openEditor(p) }));
  }

  /* ── Crear ── */

  function openCreate() {
    const form = el('form', { class: 'form-grid' },
      field({ label: 'Título', name: 'title', required: true, placeholder: 'Ej: Plasma — landing corazón v5' }),
      el('div', { class: 'field-row' },
        field({
          label: 'Producto', name: 'product_id', type: 'select',
          options: [{ value: '', label: 'Sin producto' }, ...products.map((p) => ({ value: p.id, label: p.name }))],
        }),
        field({
          label: 'Testeo', name: 'test_id', type: 'select',
          options: [{ value: '', label: 'Sin testeo' }, ...tests.map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` }))],
        })),
      el('div', { class: 'field-row' },
        field({
          label: 'Tipo', name: 'type', type: 'select',
          options: Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v })),
        }),
        field({ label: 'Variante', name: 'variant', value: 'A', help: 'A, B, C… para comparar versiones' })),
      field({
        label: 'Partir de', name: 'clone_from', type: 'select',
        options: [{ value: '', label: 'Página en blanco' }, ...pages.map((p) => ({ value: p.id, label: `Copiar de: ${p.title}` }))],
        help: 'Duplicar una landing existente es la forma más rápida de iterar.',
      }));

    modal({
      title: 'Nueva página',
      subtitle: 'Cada landing tiene su propia URL pública y sus métricas independientes.',
      body: form,
      large: true,
      actions: [
        { label: 'Cancelar', variant: 'ghost' },
        {
          label: 'Crear página',
          onClick: async () => {
            const data = readForm(form);
            if (!data.title?.trim()) { toast('Ponle un título', { type: 'err' }); return false; }
            try {
              const { page } = await api.post('/api/pages', data);
              toast('Página creada');
              await load();
              refreshBootstrap();
              openEditor(page);
            } catch (err) { toastError(err); return false; }
          },
        },
      ],
    });
  }

  /* ── Editor ── */

  async function openEditor(page) {
    const { html } = await api.get(`/api/pages/${page.id}/html`);
    let currentHTML = html;
    let dirty = false;

    const body = el('div', { class: 'stack' });

    /* Estado de publicación */
    const publishRow = el('div', { class: 'row wrap' });
    const publishBtn = el('button', {
      class: `btn ${page.status === 'published' ? 'ghost' : ''}`,
    }, icon(page.status === 'published' ? 'eye' : 'rocket'),
      page.status === 'published' ? 'Despublicar' : 'Publicar ahora');
    publishBtn.addEventListener('click', async () => {
      const next = page.status === 'published' ? 'draft' : 'published';
      try {
        const res = await api.patch(`/api/pages/${page.id}`, { status: next });
        page.status = res.page.status;
        toast(next === 'published' ? 'Landing publicada — ya recibe tráfico' : 'Landing despublicada');
        d.close();
        load();
      } catch (err) { toastError(err); }
    });

    const url = `${location.origin}/p/${page.slug}`;
    const copyBtn = el('button', { class: 'btn ghost' }, icon('copy'), 'Copiar URL');
    copyBtn.addEventListener('click', () => copyText(url));

    const openBtn = el('a', {
      class: 'btn ghost', href: `/p/${page.slug}${page.status === 'published' ? '' : '?preview=1'}`,
      target: '_blank', rel: 'noopener',
    }, icon('external'), 'Abrir');

    publishRow.append(publishBtn, copyBtn, openBtn);

    body.append(card({
      title: page.status === 'published' ? 'Publicada' : 'En borrador',
      subtitle: page.status === 'published'
        ? 'Cualquiera con el enlace puede comprar.'
        : 'Sólo tú puedes verla, con ?preview=1.',
      body: el('div', { class: 'stack', style: { gap: '12px' } },
        el('code', {
          style: {
            display: 'block', padding: '11px 13px', borderRadius: '10px',
            background: 'var(--surface-2)', border: '1px solid var(--line)',
            fontSize: '12.5px', wordBreak: 'break-all', fontFamily: 'ui-monospace, monospace',
          },
          text: url,
        }),
        publishRow),
    }));

    /* Métricas */
    body.append(el('div', { class: 'stats c3' },
      statTile({ label: 'Visitas', value: num(page.views) }),
      statTile({ label: 'Pedidos', value: num(page.orders) }),
      statTile({
        label: 'Conversión',
        value: page.views ? pct((page.orders / page.views) * 100, 2) : '—',
      })));

    /* Ajustes */
    const settingsForm = el('form', { class: 'form-grid' },
      field({ label: 'Título', name: 'title', value: page.title, required: true }),
      field({ label: 'URL (slug)', name: 'slug', value: page.slug, prefix: '/p/', help: 'Cambiarlo rompe los enlaces que ya compartiste.' }),
      el('div', { class: 'field-row' },
        field({
          label: 'Producto', name: 'product_id', type: 'select', value: page.product_id || '',
          options: [{ value: '', label: 'Sin producto' }, ...products.map((p) => ({ value: p.id, label: p.name }))],
        }),
        field({
          label: 'Testeo', name: 'test_id', type: 'select', value: page.test_id || '',
          options: [{ value: '', label: 'Sin testeo' }, ...tests.map((t) => ({ value: t.id, label: `${t.code} · ${t.name}` }))],
        })),
      el('div', { class: 'field-row' },
        field({
          label: 'Tipo', name: 'type', type: 'select', value: page.type,
          options: Object.entries(TYPES).map(([k, v]) => ({ value: k, label: v })),
        }),
        field({ label: 'Variante', name: 'variant', value: page.variant })),
      field({ label: 'Notas', name: 'notes', type: 'textarea', rows: 2, value: page.notes }));

    const saveSettings = el('button', { class: 'btn ghost sm', type: 'button' }, icon('save'), 'Guardar ajustes');
    saveSettings.addEventListener('click', async () => {
      try {
        await api.patch(`/api/pages/${page.id}`, readForm(settingsForm));
        toast('Ajustes guardados');
        load();
      } catch (err) { toastError(err); }
    });
    settingsForm.append(saveSettings);

    body.append(card({ title: 'Ajustes de la página', body: settingsForm }));

    /* Editor de HTML + vista previa */
    const editor = el('textarea', { class: 'code-editor', spellcheck: 'false' });
    editor.value = currentHTML;
    editor.addEventListener('input', () => { dirty = true; currentHTML = editor.value; });

    const previewFrame = el('iframe', {
      title: 'Vista previa', class: 'preview-frame',
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
    });

    const modeTabs = el('div', { class: 'tabs' });
    const editorPane = el('div', {}, editor);
    const phoneWrap = el('div', { class: 'phone-frame' });
    const previewPane = el('div', { style: { display: 'none' } }, phoneWrap);

    let mode = 'edit';
    const setMode = (m) => {
      mode = m;
      editorPane.style.display = m === 'edit' ? '' : 'none';
      previewPane.style.display = m === 'edit' ? 'none' : '';
      for (const t of modeTabs.children) t.classList.toggle('active', t.dataset.mode === m);
      if (m === 'edit') return;

      // Móvil dentro del marco de teléfono; escritorio a todo el ancho de la tarjeta
      const asPhone = m === 'mobile';
      phoneWrap.className = asPhone ? 'phone-frame' : 'desktop-frame';
      phoneWrap.append(previewFrame);
      previewFrame.srcdoc = currentHTML;
    };

    for (const [key, label, ic] of [
      ['edit', 'Código', 'code'],
      ['mobile', 'Móvil', 'mobile'],
      ['desktop', 'Escritorio', 'desktop'],
    ]) {
      const btn = el('button', { class: 'tab', type: 'button', dataset: { mode: key } }, icon(ic), label);
      btn.addEventListener('click', () => setMode(key));
      modeTabs.append(btn);
    }
    setMode('edit');

    const saveHTML = el('button', { class: 'btn sm' }, icon('save'), 'Guardar HTML');
    saveHTML.addEventListener('click', async () => {
      saveHTML.disabled = true;
      try {
        await api.put(`/api/pages/${page.id}/html`, { html: editor.value });
        dirty = false;
        toast('HTML guardado');
        if (mode === 'preview') previewFrame.srcdoc = editor.value;
      } catch (err) { toastError(err); }
      finally { saveHTML.disabled = false; }
    });

    body.append(card({
      title: 'Contenido',
      subtitle: 'El tracking y el envío del pedido se inyectan automáticamente al publicar.',
      actions: el('div', { class: 'row' }, modeTabs, saveHTML),
      body: el('div', {}, editorPane, previewPane),
    }));

    body.append(banner({
      ico: 'info',
      html: 'Para que el formulario registre pedidos, el contenedor debe llevar <b>data-ds-form</b>, '
        + 'los campos <b>name="customer_name"</b>, <b>phone</b>, <b>department</b>, <b>city</b>, <b>address</b>, '
        + 'y el selector de oferta <b>data-ds-offer</b>. La landing de Plasma ya viene lista.',
    }));

    /* Footer */
    const dupBtn = el('button', { class: 'btn ghost' }, icon('copy'), 'Duplicar');
    dupBtn.addEventListener('click', async () => {
      try {
        const { page: copy } = await api.post(`/api/pages/${page.id}/duplicate`);
        toast(`Creada "${copy.title}" como variante ${copy.variant}`);
        d.close();
        await load();
      } catch (err) { toastError(err); }
    });

    const delBtn = el('button', { class: 'btn ghost' }, icon('trash'));
    delBtn.title = 'Eliminar página';
    delBtn.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: `¿Eliminar "${page.title}"?`,
        text: 'Se borra el HTML de forma permanente. Los pedidos que ya recibió se conservan.',
        confirmLabel: 'Eliminar',
      });
      if (!ok) return;
      await api.delete(`/api/pages/${page.id}`);
      toast('Página eliminada');
      d.close();
      load();
      refreshBootstrap();
    });

    const d = drawer({
      title: page.title,
      subtitle: `Actualizada ${fmtAgo(page.updated_at)}`,
      body,
      wide: true,
      footer: el('div', { class: 'row', style: { width: '100%' } },
        delBtn, el('div', { class: 'spacer' }), dupBtn),
      onClose: () => {
        if (dirty) toast('Tenías cambios sin guardar en el HTML', { type: 'err' });
      },
    });
  }

  await load();
  if (params[0]) {
    const p = pages.find((x) => x.id === params[0]);
    if (p) openEditor(p);
  }
}
