/* ═══ Gráficos ═════════════════════════════════════════════════════════
   SVG sin dependencias. Reglas fijas:
   · un solo eje Y, nunca doble escala
   · rejilla y ejes en hairline sólido, recesivos
   · líneas de 2px, marcador final ≥8px con anillo de 2px del color de fondo
   · barras ≤24px con extremo redondeado 4px y base recta, 2px de aire entre vecinas
   · leyenda siempre que haya ≥2 series; etiquetas directas selectivas
   · toda gráfica tiene su tabla equivalente (accesible, sin depender del color)
   ═══════════════════════════════════════════════════════════════════════ */

import { el, clear, token, seriesColors, num, money, axisDate, esc } from './core.js';
import { icon } from './icons.js';

const NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v != null) node.setAttribute(k, v);
  }
  return node;
}

/** Escala de ticks "bonita": 0 / 250 / 500 / 750 / 1.000 */
function niceScale(max, ticks = 4) {
  if (!(max > 0)) return { max: 1, step: 1, values: [0, 1] };
  // Con máximos pequeños los pasos fraccionarios se redondean a la misma
  // etiqueta ("0 0 1 1 1"): en ese rango el eje va de uno en uno.
  if (max <= ticks) {
    const top = Math.ceil(max);
    return { max: top, step: 1, values: Array.from({ length: top + 1 }, (_, i) => i) };
  }
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const top = Math.ceil(max / step) * step;
  const values = [];
  for (let v = 0; v <= top + 1e-9; v += step) values.push(v);
  return { max: top, step, values };
}

/**
 * Vuelve a dibujar cuando cambia el ancho del contenedor o el tema.
 * Devuelve una función de limpieza.
 */
function responsive(host, draw) {
  let width = 0;
  const render = () => {
    const w = host.clientWidth;
    if (w > 0) { width = w; draw(w); }
  };
  const ro = new ResizeObserver(() => {
    if (Math.abs(host.clientWidth - width) > 1) render();
  });
  ro.observe(host);
  const onTheme = () => render();
  window.addEventListener('ds:theme', onTheme);
  render();
  return () => { ro.disconnect(); window.removeEventListener('ds:theme', onTheme); };
}

/* ── Gráfico de líneas / área con crosshair ───────────────────────────── */

/**
 * @param {HTMLElement} host
 * @param {Object} cfg
 * @param {string[]} cfg.labels           etiquetas del eje X (fechas YYYY-MM-DD)
 * @param {{name,values,format?}[]} cfg.series
 * @param {boolean} [cfg.area]            rellena bajo la línea (sólo con 1 serie)
 * @param {(n:number)=>string} [cfg.formatY]
 * @param {number} [cfg.height]
 */
export function lineChart(host, cfg) {
  const {
    labels = [], series = [], area = false,
    formatY = num, height = 240,
  } = cfg;

  clear(host);
  host.classList.add('chart');

  if (!labels.length || !series.length) {
    host.append(el('div', { class: 'empty', style: { padding: '40px 0' } },
      el('p', { text: 'Sin datos en este periodo.' })));
    return () => {};
  }

  const tip = el('div', { class: 'chart-tip' });
  host.append(tip);

  const cleanup = responsive(host, (W) => {
    const colors = seriesColors();
    const surface = token('surface');
    const H = height;
    const padL = 52, padR = 16, padT = 14, padB = 26;
    const plotW = Math.max(10, W - padL - padR);
    const plotH = H - padT - padB;

    const allValues = series.flatMap((s) => s.values);
    const scale = niceScale(Math.max(...allValues, 0));

    const x = (i) => padL + (labels.length === 1 ? plotW / 2 : (i / (labels.length - 1)) * plotW);
    const y = (v) => padT + plotH - (v / scale.max) * plotH;

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img' });
    svg.setAttribute('aria-label', `${series.map((s) => s.name).join(' y ')} por día`);

    // Rejilla horizontal + ticks
    for (const v of scale.values) {
      svg.append(svgEl('line', {
        x1: padL, x2: W - padR, y1: y(v), y2: y(v),
        class: v === 0 ? 'axis-line' : 'grid-line',
      }));
      const t = svgEl('text', { x: padL - 9, y: y(v) + 3.5, 'text-anchor': 'end', class: 'axis-label' });
      t.textContent = formatY(v);
      svg.append(t);
    }

    // Etiquetas del eje X — como máximo 6, sin colisiones
    const stepX = Math.max(1, Math.ceil(labels.length / 6));
    labels.forEach((lab, i) => {
      if (i % stepX !== 0 && i !== labels.length - 1) return;
      const t = svgEl('text', { x: x(i), y: H - 7, 'text-anchor': 'middle', class: 'axis-label' });
      t.textContent = axisDate(lab);
      svg.append(t);
    });

    // Series
    series.forEach((s, si) => {
      const color = s.color || colors[si % colors.length];
      const pts = s.values.map((v, i) => [x(i), y(v)]);
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

      if (area && series.length === 1) {
        svg.append(svgEl('path', {
          d: `${d} L${x(labels.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`,
          fill: color, 'fill-opacity': .10, stroke: 'none',
        }));
      }
      svg.append(svgEl('path', {
        d, fill: 'none', stroke: color, 'stroke-width': 2,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
      }));

      // Marcador final con anillo del color de la superficie
      const last = pts[pts.length - 1];
      svg.append(svgEl('circle', { cx: last[0], cy: last[1], r: 6, fill: surface }));
      svg.append(svgEl('circle', { cx: last[0], cy: last[1], r: 4, fill: color }));
    });

    // Capa de interacción: crosshair + puntos
    const hoverLine = svgEl('line', {
      y1: padT, y2: padT + plotH, stroke: token('axis'), 'stroke-width': 1, opacity: 0,
    });
    svg.append(hoverLine);

    const dots = series.map((s, si) => {
      const ring = svgEl('circle', { r: 6, fill: surface, opacity: 0 });
      const core = svgEl('circle', { r: 4, fill: s.color || colors[si % colors.length], opacity: 0 });
      svg.append(ring, core);
      return { ring, core };
    });

    const hit = svgEl('rect', {
      x: padL - plotW / (labels.length * 2 || 2), y: 0,
      width: plotW + padR, height: H, fill: 'transparent', style: 'cursor:crosshair',
    });
    svg.append(hit);

    const showAt = (i) => {
      const px = x(i);
      hoverLine.setAttribute('x1', px);
      hoverLine.setAttribute('x2', px);
      hoverLine.setAttribute('opacity', 1);
      series.forEach((s, si) => {
        const py = y(s.values[i]);
        for (const c of [dots[si].ring, dots[si].core]) {
          c.setAttribute('cx', px); c.setAttribute('cy', py); c.setAttribute('opacity', 1);
        }
      });
      tip.innerHTML = `<div class="tip-date">${esc(axisDate(labels[i]))}</div>`
        + series.map((s, si) => `<div class="tip-row">
             <span class="sw" style="background:${s.color || colors[si % colors.length]}"></span>
             <span class="k">${esc(s.name)}</span>
             <span class="v">${esc((s.format || formatY)(s.values[i]))}</span></div>`).join('');
      tip.classList.add('on');
      const clampedX = Math.min(Math.max(px, 70), W - 70);
      tip.style.left = `${clampedX}px`;
      tip.style.top = `${Math.max(y(Math.max(...series.map((s) => s.values[i]))) - 12, 40)}px`;
    };

    const hide = () => {
      hoverLine.setAttribute('opacity', 0);
      dots.forEach((d) => { d.ring.setAttribute('opacity', 0); d.core.setAttribute('opacity', 0); });
      tip.classList.remove('on');
    };

    const indexFromEvent = (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      const i = Math.round(((px - padL) / plotW) * (labels.length - 1));
      return Math.min(labels.length - 1, Math.max(0, i));
    };

    hit.addEventListener('mousemove', (e) => showAt(indexFromEvent(e)));
    hit.addEventListener('mouseleave', hide);
    hit.addEventListener('touchstart', (e) => showAt(indexFromEvent(e.touches[0])), { passive: true });
    hit.addEventListener('touchmove', (e) => showAt(indexFromEvent(e.touches[0])), { passive: true });
    hit.addEventListener('touchend', hide);

    const old = host.querySelector('svg');
    if (old) old.remove();
    host.insertBefore(svg, tip);
  });

  return cleanup;
}

/* ── Small multiples ─────────────────────────────────────────────────── */

/**
 * Dos o más medidas de escalas distintas, apiladas y compartiendo el eje X.
 * Es la alternativa correcta al doble eje: cada serie conserva su propia
 * escala sin inventar una correlación que los datos no tienen.
 */
export function smallMultiples(host, { labels, panels, height = 130 }) {
  clear(host);
  const cleanups = [];

  panels.forEach((panel, i) => {
    const wrap = el('div', { style: { marginTop: i ? '20px' : '0' } });
    const head = el('div', { class: 'row', style: { marginBottom: '4px' } },
      el('span', {
        class: 'legend-key line',
        style: { background: panel.color || seriesColors()[i % 4] },
      }),
      el('span', { style: { fontSize: '12.5px', fontWeight: '500' }, text: panel.name }),
      el('div', { class: 'spacer' }),
      el('span', {
        class: 'small muted num',
        text: panel.total != null ? panel.total : '',
      }));

    const chartHost = el('div');
    wrap.append(head, chartHost);
    host.append(wrap);

    cleanups.push(lineChart(chartHost, {
      labels,
      series: [{ name: panel.name, values: panel.values, color: panel.color, format: panel.format }],
      area: true,
      formatY: panel.formatY,
      height,
    }));
  });

  return () => cleanups.forEach((fn) => fn?.());
}

/* ── Columnas ─────────────────────────────────────────────────────────── */

export function barChart(host, cfg) {
  const { labels = [], values = [], formatY = num, format = num, height = 220, color } = cfg;

  clear(host);
  host.classList.add('chart');

  if (!labels.length) {
    host.append(el('div', { class: 'empty', style: { padding: '32px 0' } },
      el('p', { text: 'Sin datos en este periodo.' })));
    return () => {};
  }

  const tip = el('div', { class: 'chart-tip' });
  host.append(tip);

  return responsive(host, (W) => {
    const fill = color || seriesColors()[0];
    const H = height;
    const padL = 52, padR = 14, padT = 12, padB = 26;
    const plotW = Math.max(10, W - padL - padR);
    const plotH = H - padT - padB;
    const scale = niceScale(Math.max(...values, 0));

    const band = plotW / labels.length;
    const barW = Math.min(24, Math.max(4, band - 6));   // ≤24px, el resto es aire
    const y = (v) => padT + plotH - (v / scale.max) * plotH;

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, height: H, role: 'img' });

    for (const v of scale.values) {
      svg.append(svgEl('line', {
        x1: padL, x2: W - padR, y1: y(v), y2: y(v),
        class: v === 0 ? 'axis-line' : 'grid-line',
      }));
      const t = svgEl('text', { x: padL - 9, y: y(v) + 3.5, 'text-anchor': 'end', class: 'axis-label' });
      t.textContent = formatY(v);
      svg.append(t);
    }

    const stepX = Math.max(1, Math.ceil(labels.length / 7));
    values.forEach((v, i) => {
      const cx = padL + band * i + band / 2;
      const top = y(v);
      const h = Math.max(0, y(0) - top);
      // Extremo superior redondeado 4px, base recta sobre la línea cero
      const r = Math.min(4, h);
      const path = h <= 0 ? '' :
        `M${cx - barW / 2} ${y(0)} L${cx - barW / 2} ${top + r}
         Q${cx - barW / 2} ${top} ${cx - barW / 2 + r} ${top}
         L${cx + barW / 2 - r} ${top} Q${cx + barW / 2} ${top} ${cx + barW / 2} ${top + r}
         L${cx + barW / 2} ${y(0)} Z`;
      if (path) {
        const bar = svgEl('path', { d: path, fill });
        svg.append(bar);
      }
      const hit = svgEl('rect', {
        x: cx - band / 2, y: padT, width: band, height: plotH,
        fill: 'transparent', style: 'cursor:pointer',
      });
      hit.addEventListener('mouseenter', () => {
        tip.innerHTML = `<div class="tip-date">${esc(axisDate(labels[i]))}</div>
          <div class="tip-row"><span class="sw" style="background:${fill}"></span>
          <span class="k">${esc(cfg.name || 'Valor')}</span><span class="v">${esc(format(v))}</span></div>`;
        tip.classList.add('on');
        tip.style.left = `${Math.min(Math.max(cx, 70), W - 70)}px`;
        tip.style.top = `${Math.max(top - 10, 34)}px`;
      });
      hit.addEventListener('mouseleave', () => tip.classList.remove('on'));
      svg.append(hit);

      if (i % stepX === 0 || i === labels.length - 1) {
        const t = svgEl('text', { x: cx, y: H - 7, 'text-anchor': 'middle', class: 'axis-label' });
        t.textContent = axisDate(labels[i]);
        svg.append(t);
      }
    });

    const old = host.querySelector('svg');
    if (old) old.remove();
    host.insertBefore(svg, tip);
  });
}

/* ── Sparkline (para stat tiles) ─────────────────────────────────────── */

export function sparkline(host, values, { height = 34, color } = {}) {
  clear(host);
  if (!values || values.length < 2) return () => {};

  return responsive(host, (W) => {
    const c = color || seriesColors()[0];
    const H = height, pad = 4;
    const max = Math.max(...values), min = Math.min(...values);
    const span = max - min || 1;
    const x = (i) => (i / (values.length - 1)) * (W - 2 * pad) + pad;
    const y = (v) => H - pad - ((v - min) / span) * (H - 2 * pad);

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, height: H, 'aria-hidden': 'true' });
    const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    svg.append(svgEl('path', {
      d: `${d} L${x(values.length - 1)} ${H} L${x(0)} ${H} Z`,
      fill: c, 'fill-opacity': .10, stroke: 'none',
    }));
    svg.append(svgEl('path', { d, fill: 'none', stroke: c, 'stroke-width': 1.8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    svg.append(svgEl('circle', { cx: x(values.length - 1), cy: y(values[values.length - 1]), r: 3.6, fill: token('surface') }));
    svg.append(svgEl('circle', { cx: x(values.length - 1), cy: y(values[values.length - 1]), r: 2.4, fill: c }));

    clear(host);
    host.append(svg);
  });
}

/* ── Embudo (rampa ordinal de un solo tono) ──────────────────────────── */

const RAMP_LIGHT = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab'];
const RAMP_DARK  = ['#9ec5f4', '#5598e7', '#3987e5', '#256abf'];

export function funnelChart(host, steps) {
  clear(host);
  const dark = document.documentElement.dataset.theme === 'dark';
  const ramp = dark ? RAMP_DARK : RAMP_LIGHT;
  const top = steps[0]?.value || 1;

  const wrap = el('div', { class: 'funnel' });
  steps.forEach((s, i) => {
    const prev = i === 0 ? null : steps[i - 1].value;
    const rate = prev ? (prev > 0 ? (s.value / prev) * 100 : 0) : 100;
    const width = top > 0 ? Math.max(1.2, (s.value / top) * 100) : 0;

    wrap.append(el('div', { class: 'funnel-step' },
      el('div', { class: 'funnel-top' },
        el('span', { class: 'name', text: s.stage }),
        el('span', { class: 'val num', text: num(s.value) }),
        el('span', { class: 'rate num', text: i === 0 ? '100%' : `${rate.toFixed(1).replace('.', ',')}%` })),
      el('div', { class: 'funnel-bar' },
        el('div', {
          class: 'fill',
          style: { width: `${width}%`, background: ramp[Math.min(i, ramp.length - 1)] },
        }))));
  });
  host.append(wrap);
}

/* ── Anillo (parte-de-un-todo, ≤6 segmentos) ─────────────────────────── */

export function donutChart(host, slices, { size = 160, centerLabel = '', centerValue = '' } = {}) {
  clear(host);
  const colors = seriesColors();
  const surface = token('surface');
  const total = slices.reduce((a, s) => a + s.value, 0);

  const R = size / 2, r = R * 0.62, cx = R, cy = R;
  const svg = svgEl('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size, role: 'img' });
  svg.setAttribute('aria-label', slices.map((s) => `${s.name}: ${s.value}`).join(', '));

  if (total === 0) {
    svg.append(svgEl('circle', { cx, cy, r: (R + r) / 2, fill: 'none', stroke: token('surface-3'), 'stroke-width': R - r }));
  } else {
    let angle = -Math.PI / 2;
    const gap = 0.028;                    // ~2px de aire entre segmentos
    slices.forEach((s, i) => {
      const sweep = (s.value / total) * Math.PI * 2;
      if (sweep <= 0) return;
      const a0 = angle + gap / 2;
      const a1 = angle + sweep - gap / 2;
      if (a1 > a0) {
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const p = (rad, ang) => `${(cx + rad * Math.cos(ang)).toFixed(2)} ${(cy + rad * Math.sin(ang)).toFixed(2)}`;
        svg.append(svgEl('path', {
          d: `M${p(R, a0)} A${R} ${R} 0 ${large} 1 ${p(R, a1)} L${p(r, a1)} A${r} ${r} 0 ${large} 0 ${p(r, a0)} Z`,
          fill: s.color || colors[i % colors.length],
          stroke: surface, 'stroke-width': 0,
        }));
      }
      angle += sweep;
    });
  }

  const wrap = el('div', { style: { position: 'relative', width: `${size}px`, margin: '0 auto' } });
  wrap.append(svg);
  if (centerValue) {
    wrap.append(el('div', {
      style: {
        position: 'absolute', inset: '0', display: 'grid', placeContent: 'center',
        textAlign: 'center', pointerEvents: 'none',
      },
    },
      el('div', { style: { fontSize: '22px', fontWeight: '600', letterSpacing: '-.02em' }, text: centerValue }),
      el('div', { style: { fontSize: '11px', color: 'var(--muted)' }, text: centerLabel })));
  }
  host.append(wrap);
}

/* ── Leyenda + tabla equivalente ─────────────────────────────────────── */

export function legend(items, { line = false } = {}) {
  const colors = seriesColors();
  return el('div', { class: 'legend' },
    items.map((it, i) => el('span', { class: 'legend-item' },
      el('span', {
        class: `legend-key${line ? ' line' : ''}`,
        style: { background: it.color || colors[i % colors.length] },
      }),
      it.name)));
}

/**
 * Vista de tabla equivalente a la gráfica — plegable.
 * Garantiza que ningún valor dependa sólo del color o del tooltip.
 */
export function tableView(columns, rows, { label = 'Ver los datos en tabla' } = {}) {
  const body = el('div', { class: 'table-wrap', style: { display: 'none', marginTop: '14px' } },
    el('table', { class: 'data' },
      el('thead', {}, el('tr', {}, columns.map((c) =>
        el('th', { class: c.num ? 'num' : '', text: c.label })))),
      el('tbody', {}, rows.map((r) => el('tr', {}, columns.map((c) =>
        el('td', { class: c.num ? 'num' : '', text: r[c.key] ?? '—' })))))));

  const btn = el('button', { class: 'table-toggle', type: 'button', 'aria-expanded': 'false' },
    label, icon('chevronDown'));

  btn.addEventListener('click', () => {
    const open = body.style.display === 'none';
    body.style.display = open ? 'block' : 'none';
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.firstChild.textContent = open ? 'Ocultar la tabla' : label;
  });

  return el('div', { style: { marginTop: '10px' } }, btn, body);
}
