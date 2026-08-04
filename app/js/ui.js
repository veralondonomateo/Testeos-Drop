/* ═══ Componentes de interfaz reutilizables ═══════════════════════════ */

import { el, clear, $, num, money, pct } from './core.js';
import { icon, iconHTML } from './icons.js';
import { sparkline } from './charts.js';

/* ── Stat tile ───────────────────────────────────────────────────────── */

/**
 * @param {Object} o
 * @param {string} o.label
 * @param {string} o.value      ya formateado
 * @param {number} [o.delta]    variación % vs periodo anterior
 * @param {boolean} [o.inverse] true si "subir" es malo (CPA, costo)
 * @param {string} [o.hint]
 * @param {number[]} [o.spark]
 */
export function statTile({ label, value, delta, inverse = false, hint, spark, color, badge }) {
  const node = el('div', { class: 'stat' },
    el('div', { class: 'stat-label' }, label),
    el('div', { class: 'stat-value' }, value),
    el('div', { class: 'stat-foot' },
      delta != null && Number.isFinite(delta) ? deltaChip(delta, inverse) : null,
      hint ? el('span', { class: 'stat-hint', text: hint }) : null,
      badge || null));

  if (spark && spark.length > 1) {
    const host = el('div', { class: 'stat-spark' });
    node.append(host);
    requestAnimationFrame(() => sparkline(host, spark, { color }));
  }
  return node;
}

export function deltaChip(delta, inverse = false) {
  const d = Number(delta) || 0;
  if (Math.abs(d) < 0.05) {
    return el('span', { class: 'delta flat' }, '±0%');
  }
  const rising = d > 0;
  const good = inverse ? !rising : rising;
  const abs = Math.abs(d);
  // Un salto de cuatro cifras suele significar "el periodo anterior estaba casi
  // vacío": el número exacto no informa, así que se tope.
  const label = abs >= 1000 ? '>999%' : `${abs.toFixed(abs < 10 ? 1 : 0).replace('.', ',')}%`;
  return el('span', { class: `delta ${good ? 'up' : 'down'}` },
    icon(rising ? 'arrowUp' : 'arrowDown'), label);
}

/* ── Badge de estado ─────────────────────────────────────────────────── */

export function statusBadge(meta) {
  return el('span', { class: `badge ${meta.tone || ''}` },
    el('span', { class: 'dot' }), meta.label);
}

/* ── Estado vacío ────────────────────────────────────────────────────── */

export function emptyState({ icon: ico = 'box', title, text, action }) {
  return el('div', { class: 'empty' },
    el('div', { class: 'ico' }, icon(ico)),
    el('h3', { text: title }),
    el('p', { text }),
    action || null);
}

/* ── Esqueleto de carga ──────────────────────────────────────────────── */

export function skeletonTable(rows = 6) {
  return el('div', { style: { padding: '16px 20px' } },
    Array.from({ length: rows }, () => el('div', { class: 'skel skel-row' })));
}

export function skeletonStats(n = 4) {
  return el('div', { class: `stats c${n}` },
    Array.from({ length: n }, () => el('div', { class: 'skel', style: { height: '112px', borderRadius: '16px' } })));
}

/* ── Drawer ──────────────────────────────────────────────────────────── */

let openDrawer = null;

/**
 * Panel lateral. Devuelve { close, body, setFooter }.
 */
export function drawer({ title, subtitle, body, footer, wide = false, onClose }) {
  closeDrawer();

  const overlay = el('div', { class: 'overlay' });
  const bodyHost = el('div', { class: 'drawer-body' });
  const footHost = el('div', { class: 'drawer-foot' });

  const closeBtn = el('button', { class: 'icon-btn', 'aria-label': 'Cerrar' }, icon('close'));
  const panel = el('aside', { class: `drawer${wide ? ' wide' : ''}`, role: 'dialog', 'aria-modal': 'true' },
    el('div', { class: 'drawer-head' },
      el('div', { class: 't' },
        el('h2', { text: title }),
        subtitle ? el('p', { text: subtitle }) : null),
      closeBtn),
    bodyHost,
    footHost);

  if (body) bodyHost.append(body);
  if (footer) footHost.append(footer); else footHost.style.display = 'none';

  document.body.append(overlay, panel);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => { overlay.classList.add('open'); panel.classList.add('open'); });

  const close = () => {
    overlay.classList.remove('open');
    panel.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { overlay.remove(); panel.remove(); }, 260);
    openDrawer = null;
    onClose?.();
  };

  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  openDrawer = { close };

  return {
    close,
    body: bodyHost,
    setFooter(node) {
      clear(footHost);
      if (node) { footHost.append(node); footHost.style.display = ''; }
      else footHost.style.display = 'none';
    },
    setTitle(t) { panel.querySelector('.drawer-head h2').textContent = t; },
  };
}

export const closeDrawer = () => openDrawer?.close();

/* ── Modal ───────────────────────────────────────────────────────────── */

export function modal({ title, subtitle, body, actions = [], large = false, onClose }) {
  const wrap = el('div', { class: 'modal-wrap open', role: 'dialog', 'aria-modal': 'true' });
  const overlay = el('div', { class: 'overlay open', style: { zIndex: '-1' } });

  const close = () => {
    document.removeEventListener('keydown', onKey);
    wrap.remove();
    document.body.style.overflow = '';
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };

  const panel = el('div', { class: `modal${large ? ' lg' : ''}` },
    el('div', { class: 'modal-head' },
      el('h2', { text: title }),
      subtitle ? el('p', { text: subtitle }) : null),
    el('div', { class: 'modal-body' }, body),
    actions.length ? el('div', { class: 'modal-foot' },
      actions.map((a) => {
        const btn = el('button', { class: `btn ${a.variant || 'ghost'}`, type: 'button' }, a.label);
        btn.addEventListener('click', async () => {
          if (a.close !== false && !a.onClick) return close();
          btn.disabled = true;
          try {
            const keep = await a.onClick?.(close);
            if (keep !== false && a.close !== false) close();
          } finally { btn.disabled = false; }
        });
        return btn;
      })) : null);

  wrap.append(overlay, panel);
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(wrap);
  document.body.style.overflow = 'hidden';

  const firstInput = panel.querySelector('input, textarea, select');
  if (firstInput) setTimeout(() => firstInput.focus(), 60);

  return { close, panel };
}

/** Confirmación destructiva. Resuelve a true/false. */
export function confirmDialog({ title, text, confirmLabel = 'Confirmar', danger = true }) {
  return new Promise((resolve) => {
    let done = false;
    const settle = (v) => { if (!done) { done = true; resolve(v); } };
    modal({
      title,
      subtitle: text,
      body: el('div'),
      onClose: () => settle(false),
      actions: [
        { label: 'Cancelar', variant: 'ghost' },
        {
          label: confirmLabel,
          variant: danger ? 'danger' : '',
          onClick: () => { settle(true); },
        },
      ],
    });
  });
}

/* ── Campos de formulario ────────────────────────────────────────────── */

export function field({ label, name, value = '', type = 'text', placeholder = '', help, required, options, rows, prefix, min, step, disabled }) {
  let input;
  if (type === 'textarea') {
    input = el('textarea', { name, placeholder, rows: rows || 3, disabled });
    input.value = value ?? '';
  } else if (type === 'select') {
    input = el('select', { name, disabled });
    for (const o of options || []) {
      const opt = el('option', { value: o.value, text: o.label });
      if (String(o.value) === String(value)) opt.selected = true;
      input.append(opt);
    }
  } else {
    input = el('input', { name, type, placeholder, required, min, step, disabled });
    input.value = value ?? '';
  }

  const control = prefix
    ? el('div', { class: 'input-prefix' }, el('span', { text: prefix }), input)
    : input;

  return el('div', { class: 'field' },
    label ? el('label', { for: name, text: label + (required ? ' *' : '') }) : null,
    control,
    help ? el('span', { class: 'help', text: help }) : null);
}

/** Lee un formulario como objeto plano. */
export function readForm(root) {
  const out = {};
  for (const node of root.querySelectorAll('[name]')) {
    if (node.type === 'checkbox') out[node.name] = node.checked;
    else out[node.name] = node.value;
  }
  return out;
}

export function switchField(label, name, checked = false) {
  const input = el('input', { type: 'checkbox', name });
  input.checked = !!checked;
  return el('label', { class: 'switch' }, input,
    el('span', { class: 'track' }),
    el('span', { class: 'switch-label', text: label }));
}

/* ── Barra de filtros ────────────────────────────────────────────────── */

export function searchBox(placeholder, onInput, value = '') {
  const input = el('input', { type: 'search', placeholder, value });
  input.addEventListener('input', () => onInput(input.value.trim()));
  return el('div', { class: 'search' }, icon('search'), input);
}

export function selectControl(options, value, onChange, { width } = {}) {
  const sel = el('select', { class: 'control', style: width ? { minWidth: width } : {} });
  for (const o of options) {
    const opt = el('option', { value: o.value, text: o.label });
    if (String(o.value) === String(value)) opt.selected = true;
    sel.append(opt);
  }
  sel.addEventListener('change', () => onChange(sel.value));
  return el('div', { class: 'select-wrap' }, sel, icon('chevronDown'));
}

export function tabBar(items, active, onChange) {
  const bar = el('div', { class: 'tabs', role: 'tablist' });
  for (const it of items) {
    const btn = el('button', {
      class: `tab${String(it.value) === String(active) ? ' active' : ''}`,
      role: 'tab', type: 'button',
    }, it.label, it.count != null ? el('span', { class: 'n', text: num(it.count) }) : null);
    btn.addEventListener('click', () => onChange(it.value));
    bar.append(btn);
  }
  return bar;
}

/* ── Tabla ───────────────────────────────────────────────────────────── */

/**
 * @param {Array} columns  {key,label,num?,render?,width?}
 * @param {Array} rows
 * @param {Object} opts    {onRowClick, empty, selectable, selected, onSelect}
 */
export function dataTable(columns, rows, opts = {}) {
  const { onRowClick, empty, selectable, selected = new Set(), onSelect } = opts;

  if (!rows.length && empty) return empty;

  const allOn = selectable && rows.length > 0 && rows.every((r) => selected.has(r.id));

  const headCheck = selectable ? el('th', { class: 'tight' },
    checkbox(allOn, () => {
      if (allOn) rows.forEach((r) => selected.delete(r.id));
      else rows.forEach((r) => selected.add(r.id));
      onSelect?.(selected);
    })) : null;

  const table = el('table', { class: 'data' },
    el('thead', {}, el('tr', {},
      headCheck,
      columns.map((c) => el('th', {
        class: c.num ? 'num' : '',
        style: c.width ? { width: c.width } : {},
        text: c.label,
      })))),
    el('tbody', {}, rows.map((row) => {
      const tr = el('tr', { class: onRowClick ? 'clickable' : '' },
        selectable ? el('td', { class: 'tight' },
          checkbox(selected.has(row.id), (on) => {
            if (on) selected.add(row.id); else selected.delete(row.id);
            onSelect?.(selected);
          })) : null,
        columns.map((c) => {
          const content = c.render ? c.render(row) : row[c.key];
          return el('td', { class: c.num ? 'num' : '' },
            content instanceof Node ? content : String(content ?? '—'));
        }));
      if (selected.has(row.id)) tr.classList.add('selected');
      if (onRowClick) {
        tr.addEventListener('click', (e) => {
          if (e.target.closest('.checkbox, button, a')) return;
          onRowClick(row);
        });
      }
      return tr;
    })));

  return el('div', { class: 'table-wrap' }, table);
}

export function checkbox(on, onToggle) {
  const box = el('div', {
    class: `checkbox${on ? ' on' : ''}`, role: 'checkbox',
    'aria-checked': String(!!on), tabindex: '0',
  }, icon('check'));
  const toggle = (e) => {
    e.stopPropagation();
    const next = !box.classList.contains('on');
    box.classList.toggle('on', next);
    box.setAttribute('aria-checked', String(next));
    onToggle(next);
  };
  box.addEventListener('click', toggle);
  box.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(e); } });
  return box;
}

/* ── Celdas compuestas ───────────────────────────────────────────────── */

export function cellStack(main, sub) {
  return el('div', { class: 'cell-stack' },
    el('div', { class: 'cell-strong', text: main }),
    sub ? el('div', { class: 'cell-sub', text: sub }) : null);
}

export function cellMedia(thumbContent, main, sub) {
  return el('div', { class: 'row', style: { gap: '11px' } },
    el('div', { class: 'thumb' }, thumbContent),
    cellStack(main, sub));
}

/* ── Lista de definiciones ───────────────────────────────────────────── */

export function defList(pairs) {
  return el('dl', { class: 'dl' },
    pairs.filter(Boolean).map(([k, v]) => el('div', { class: 'dl-row' },
      el('dt', { text: k }),
      el('dd', {}, v instanceof Node ? v : String(v ?? '—')))));
}

/* ── Ranking ─────────────────────────────────────────────────────────── */

export function rankList(items, { formatValue = num, showBar = true } = {}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return el('div', { class: 'rank-list' },
    items.map((it, i) => el('div', { class: 'rank-item' },
      el('span', { class: 'n', text: String(i + 1) }),
      el('div', { class: 'body' },
        el('div', { class: 'name', text: it.name }),
        it.sub ? el('div', { class: 'sub', text: it.sub }) : null,
        showBar ? el('div', { class: 'track' },
          el('div', { class: 'fill', style: { width: `${(it.value / max) * 100}%` } })) : null),
      el('span', { class: 'val', text: formatValue(it.value) }))));
}

/* ── Card ────────────────────────────────────────────────────────────── */

export function card({ title, subtitle, actions, body, flush = false, tight = false }) {
  return el('section', { class: 'card' },
    title ? el('header', { class: 'card-head' },
      el('div', { class: 'card-title' }, title, subtitle ? el('span', { text: subtitle }) : null),
      actions || null) : null,
    el('div', { class: `card-body${flush ? ' flush' : tight ? ' tight' : ''}` }, body));
}

/* ── Banner ──────────────────────────────────────────────────────────── */

export function banner({ text, html, tone = '', action, ico = 'info' }) {
  return el('div', { class: `banner ${tone}` },
    el('div', { class: 'ico' }, icon(ico)),
    el('div', { class: 'txt', ...(html ? { html } : { text }) }),
    action || null);
}

/* ── Pipeline de estados ─────────────────────────────────────────────── */

export function pipeline(steps, currentStep) {
  return el('div', { class: 'pipeline' },
    steps.map((s) => el('div', {
      class: `pipe-step${s.step < currentStep ? ' done' : s.step === currentStep ? ' current' : ''}`,
    },
      el('div', { class: 'pipe-bar' }),
      el('span', { class: 'lbl', text: s.label }))));
}

/* ── Timeline ────────────────────────────────────────────────────────── */

export function timeline(items) {
  return el('div', { class: 'timeline' },
    items.map((it, i) => el('div', { class: 'tl-item' },
      el('div', { class: `tl-dot${i === 0 ? ' active' : ''}` }),
      el('div', { class: 'tl-body' },
        el('div', { class: 'tl-title', text: it.title }),
        el('div', { class: 'tl-meta', text: it.meta })))));
}

/* ── Vista "próximamente" ────────────────────────────────────────────── */

export function comingSoon({ ico, title, text, cards = [], note }) {
  return el('div', { class: 'soon-hero' },
    el('div', { class: 'ico' }, icon(ico)),
    el('span', { class: 'badge warning' }, 'Próximamente'),
    el('h2', { text: title }),
    el('p', { text }),
    cards.length ? el('div', { class: 'soon-preview' },
      cards.map((c, i) => el('div', { class: 'soon-card' },
        el('div', { class: 'n', text: String(i + 1).padStart(2, '0') }),
        el('h4', { text: c.title }),
        el('p', { text: c.text })))) : null,
    note ? el('p', { class: 'small muted', style: { marginTop: '24px' }, text: note }) : null);
}
