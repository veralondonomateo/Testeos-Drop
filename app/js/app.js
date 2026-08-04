/* ═══ Shell de la aplicación: sesión, navegación y layout ═════════════ */

import {
  $, el, clear, api, state, initTheme, toggleTheme, isDark,
  toast, toastError, initials, num,
} from './core.js';
import { icon } from './icons.js';
import { field, readForm } from './ui.js';
import { routes, NAV } from './routes.js';

initTheme();

const root = $('#root');

/* ── Login ───────────────────────────────────────────────────────────── */

/**
 * En local precargamos las credenciales de siembra por comodidad.
 * En cualquier otro host el formulario sale vacío y sin pista visible: dejar la
 * contraseña de admin escrita en una página pública sería regalar el panel.
 */
const isLocal = ['localhost', '127.0.0.1', '::1', ''].includes(location.hostname);

function renderLogin(prefillError) {
  clear(root);

  const form = el('form', { class: 'form-grid' },
    field({
      label: 'Correo', name: 'email', type: 'email', placeholder: 'tu@correo.com',
      required: true, value: isLocal ? 'admin@dropstudio.co' : '',
    }),
    field({
      label: 'Contraseña', name: 'password', type: 'password', placeholder: '••••••••',
      required: true, value: isLocal ? 'admin123' : '',
    }),
    el('button', { class: 'btn lg block', type: 'submit', style: { marginTop: '4px' } }, 'Entrar al panel'));

  const errBox = el('div', { class: 'field' });
  if (prefillError) errBox.append(el('span', { class: 'err', text: prefillError }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const data = readForm(form);
    btn.disabled = true;
    btn.textContent = 'Entrando…';
    clear(errBox);
    try {
      const { user } = await api.post('/api/auth/login', data);
      state.user = user;
      await boot();
    } catch (err) {
      errBox.append(el('span', { class: 'err', text: err.message }));
      btn.disabled = false;
      btn.textContent = 'Entrar al panel';
    }
  });

  root.append(el('div', { class: 'login-shell' },
    el('div', { class: 'login-panel' },
      el('div', { class: 'login-box' },
        el('div', { class: 'brand' },
          el('div', { class: 'brand-mark' }, icon('logo')),
          el('div', { class: 'brand-text' },
            el('div', { class: 'brand-name', text: 'DropStudio' }),
            el('div', { class: 'brand-sub', text: 'Panel de testeo' }))),
        el('h1', { text: 'Bienvenido de vuelta' }),
        el('p', { text: 'Entra para revisar tus pedidos, lanzar testeos y medir qué producto vale la pena escalar.' }),
        form,
        errBox,
        isLocal
          ? el('div', { class: 'login-hint', html: 'Acceso de prueba · <code>admin@dropstudio.co</code> / <code>admin123</code>' })
          : null)),

    el('div', { class: 'login-art' },
      el('div', { class: 'brand' },
        el('div', { class: 'brand-mark', style: { background: 'rgba(255,255,255,.14)', color: 'inherit' } }, icon('logo')),
        el('div', { class: 'brand-text' },
          el('div', { class: 'brand-name', text: 'DropStudio' }))),
      el('div', {},
        el('h2', { text: 'Testea más productos en menos tiempo.' }),
        el('p', { text: 'Monta una landing, lanza el tráfico, mide el CPA real y decide con datos si escalas o descartas.' }),
        el('div', { class: 'feats' },
          [
            ['rocket', 'De la landing al primer pedido en minutos'],
            ['target', 'CPA, ROAS y tasa de entrega en vivo'],
            ['layers', 'Un veredicto por testeo: escalar, iterar o descartar'],
          ].map(([ic, txt]) => el('div', { class: 'feat' }, icon(ic), txt)))),
      el('div', { class: 'foot', text: `© ${new Date().getFullYear()} DropStudio` }))));
}

/* ── Layout del panel ────────────────────────────────────────────────── */

let viewHost = null;
let sidebarEl = null;
let cleanupView = null;

function renderShell() {
  clear(root);

  const nav = el('nav', { class: 'nav' });
  for (const group of NAV) {
    const g = el('div', { class: 'nav-group' }, el('div', { class: 'nav-label', text: group.label }));
    for (const item of group.items) {
      const link = el('a', {
        class: `nav-item${item.soon ? ' soon' : ''}`,
        href: `#/${item.id}`,
        dataset: { route: item.id },
      },
        icon(item.icon),
        el('span', { class: 'label', text: item.label }),
        item.soon ? el('span', { class: 'soon-tag', text: 'Pronto' })
          : item.beta ? el('span', { class: 'soon-tag beta', text: 'Beta' })
            : el('span', { class: 'count', dataset: { count: item.id } }));
      if (!item.soon && !item.beta) link.querySelector('.count').style.display = 'none';
      g.append(link);
    }
    nav.append(g);
  }

  const themeBtn = el('button', { class: 'icon-btn', title: 'Cambiar tema', 'aria-label': 'Cambiar tema' },
    icon(isDark() ? 'sun' : 'moon'));
  themeBtn.addEventListener('click', () => {
    toggleTheme();
    clear(themeBtn).append(icon(isDark() ? 'sun' : 'moon'));
  });

  const menuBtn = el('button', { class: 'icon-btn mobile-only', 'aria-label': 'Abrir menú' }, icon('menu'));
  menuBtn.addEventListener('click', () => sidebarEl.classList.toggle('open'));

  const logoutBtn = el('div', { class: 'user-chip', title: 'Cerrar sesión' },
    el('div', { class: 'avatar', text: initials(state.user.name) }),
    el('div', { class: 'user-meta' },
      el('div', { class: 'user-name', text: state.user.name }),
      el('div', { class: 'user-mail', text: state.user.email })),
    icon('logout'));
  logoutBtn.addEventListener('click', async () => {
    await api.post('/api/auth/logout').catch(() => {});
    state.user = null;
    location.hash = '';
    renderLogin();
  });

  sidebarEl = el('aside', { class: 'sidebar' },
    el('a', { class: 'brand', href: '#/dashboard' },
      el('div', { class: 'brand-mark' }, icon('logo')),
      el('div', { class: 'brand-text' },
        el('div', { class: 'brand-name', text: 'DropStudio' }),
        el('div', { class: 'brand-sub', text: 'Testeo de productos' }))),
    nav,
    el('div', { class: 'sidebar-foot' }, logoutBtn));

  viewHost = el('main', { class: 'view', id: 'view' });

  const topbar = el('header', { class: 'topbar' },
    menuBtn,
    el('div', { class: 'topbar-title', id: 'topbar-title' }),
    el('div', { class: 'topbar-actions', id: 'topbar-actions' }, themeBtn));

  root.append(el('div', { class: 'shell' }, sidebarEl,
    el('div', { class: 'main' }, topbar, viewHost)));

  nav.addEventListener('click', () => sidebarEl.classList.remove('open'));
}

function updateCounts() {
  const c = state.bootstrap?.counts || {};
  const map = { orders: c.pending, products: c.products, pages: c.pages, tests: c.tests };
  for (const [id, value] of Object.entries(map)) {
    const badge = document.querySelector(`.count[data-count="${id}"]`);
    if (!badge) continue;
    if (value > 0) { badge.textContent = num(value); badge.style.display = ''; }
    else badge.style.display = 'none';
  }
}

/** Refresca el bootstrap (contadores del sidebar) sin bloquear la vista. */
export async function refreshBootstrap() {
  try {
    state.bootstrap = await api.get('/api/bootstrap');
    updateCounts();
  } catch (err) {
    if (err?.status === 401) {
      state.user = null;
      renderLogin('Tu sesión expiró. Entra de nuevo.');
      return;
    }
    /* cualquier otro fallo: la vista sigue con los datos que ya tiene */
  }
}

/* ── Router (hash) ───────────────────────────────────────────────────── */

export function setHeader(title, subtitle, actions) {
  const t = $('#topbar-title');
  const a = $('#topbar-actions');
  if (!t) return;
  clear(t).append(el('h1', { text: title }), subtitle ? el('p', { text: subtitle }) : null);

  // Conserva el botón de tema, que siempre es el último
  const themeBtn = a.lastElementChild;
  clear(a);
  if (actions) a.append(...(Array.isArray(actions) ? actions : [actions]));
  a.append(themeBtn);
}

export const navigate = (path) => { location.hash = `#/${path}`; };

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, queryStr] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return {
    name: parts[0] || 'dashboard',
    params: parts.slice(1),
    query: Object.fromEntries(new URLSearchParams(queryStr || '')),
  };
}

async function renderRoute() {
  if (!state.user) return;
  const route = parseHash();
  const view = routes[route.name] || routes.dashboard;
  state.route = route;

  for (const link of document.querySelectorAll('.nav-item')) {
    link.classList.toggle('active', link.dataset.route === route.name);
  }

  cleanupView?.();
  cleanupView = null;
  clear(viewHost);
  viewHost.scrollTop = 0;
  window.scrollTo(0, 0);

  try {
    cleanupView = await view({ host: viewHost, params: route.params, query: route.query }) || null;
  } catch (err) {
    // Sesión caída: volver al login en vez de dejar una vista rota
    if (err?.status === 401) {
      state.user = null;
      renderLogin('Tu sesión expiró. Entra de nuevo.');
      return;
    }
    console.error(err);
    clear(viewHost).append(el('div', { class: 'card' },
      el('div', { class: 'empty' },
        el('div', { class: 'ico' }, icon('alert')),
        el('h3', { text: 'No pudimos cargar esta sección' }),
        el('p', { text: err.message }))));
  }
  refreshBootstrap();
}

window.addEventListener('hashchange', renderRoute);

/* ── Arranque ────────────────────────────────────────────────────────── */

async function boot() {
  state.bootstrap = await api.get('/api/bootstrap');
  renderShell();
  updateCounts();
  if (!location.hash) location.hash = '#/dashboard';
  await renderRoute();
}

(async function start() {
  try {
    const { user } = await api.get('/api/auth/me');
    state.user = user;
    await boot();
  } catch {
    renderLogin();
  }
})();

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.status === 401) {
    state.user = null;
    renderLogin('Tu sesión expiró. Entra de nuevo.');
  }
});
