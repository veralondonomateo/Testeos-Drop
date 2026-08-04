/* Iconografía — trazo 1.7, esquinas redondeadas, 24×24. */

const wrap = (paths, opts = {}) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${opts.w || 1.7}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const icons = {
  logo: wrap('<path d="M4 13h4l2.5-6 3 12L16 13h4"/>', { w: 2.1 }),

  dashboard: wrap('<rect x="3" y="3" width="7.5" height="8.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="5" rx="2"/><rect x="13.5" y="10.5" width="7.5" height="10.5" rx="2"/><rect x="3" y="14" width="7.5" height="7" rx="2"/>'),
  orders: wrap('<path d="M6 2.5h9l4 4V21a.5.5 0 01-.5.5h-13A.5.5 0 015 21V3a.5.5 0 011-.5z"/><path d="M15 2.5V7h4"/><path d="M9 12.5h6M9 16.5h4"/>'),
  products: wrap('<path d="M20.5 7.5l-8.5-4.7-8.5 4.7v9l8.5 4.7 8.5-4.7z"/><path d="M3.7 7.4L12 12l8.3-4.6M12 12v9.2"/>'),
  pages: wrap('<rect x="3" y="3.5" width="18" height="17" rx="2.5"/><path d="M3 8.5h18M7.5 12.5h9M7.5 16h5.5"/>'),
  tests: wrap('<path d="M9.5 2.5v6.2L4.6 17a2.4 2.4 0 002.1 3.5h10.6a2.4 2.4 0 002.1-3.5l-4.9-8.3V2.5"/><path d="M8 2.5h8M7.2 14.5h9.6"/>'),
  analytics: wrap('<path d="M3.5 20.5h17"/><path d="M6.5 16.5v-4M11 16.5V7M15.5 16.5v-6M20 16.5V4.5"/>'),
  customers: wrap('<circle cx="9" cy="8" r="3.6"/><path d="M2.8 20a6.4 6.4 0 0112.4 0"/><path d="M16.5 5.2a3.4 3.4 0 010 6.6M18 14.3a5.6 5.6 0 013.3 5"/>'),
  logistics: wrap('<path d="M2.5 6.5h10.5v10H2.5z"/><path d="M13 9.5h4l3.5 3.5v3.5H13z"/><circle cx="6.5" cy="18.5" r="1.9"/><circle cx="16.5" cy="18.5" r="1.9"/>'),
  finance: wrap('<path d="M12 2.8v18.4"/><path d="M16.5 6.5H9.8a2.9 2.9 0 000 5.8h4.4a2.9 2.9 0 010 5.8H7"/>'),
  abtest: wrap('<rect x="2.8" y="4.5" width="8" height="15" rx="2"/><rect x="13.2" y="4.5" width="8" height="15" rx="2"/><path d="M5.6 9h2.4M5.6 12.5h2.4M16 9h2.4M16 12.5h2.4M16 16h2.4"/>'),
  ai: wrap('<path d="M12 2.8l1.9 5.3 5.3 1.9-5.3 1.9L12 17.2l-1.9-5.3L4.8 10l5.3-1.9z"/><path d="M18.5 16.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>'),
  settings: wrap('<circle cx="12" cy="12" r="3.1"/><path d="M19.6 14.5a1.6 1.6 0 00.3 1.8l.1.1a1.9 1.9 0 11-2.7 2.7l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5v.2a1.9 1.9 0 11-3.8 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a1.9 1.9 0 11-2.7-2.7l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1h-.2a1.9 1.9 0 110-3.8h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a1.9 1.9 0 112.7-2.7l.1.1a1.6 1.6 0 001.8.3h.1a1.6 1.6 0 001-1.5v-.2a1.9 1.9 0 113.8 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a1.9 1.9 0 112.7 2.7l-.1.1a1.6 1.6 0 00-.3 1.8v.1a1.6 1.6 0 001.5 1h.2a1.9 1.9 0 110 3.8h-.1a1.6 1.6 0 00-1.5 1z"/>'),

  plus: wrap('<path d="M12 5v14M5 12h14"/>', { w: 2 }),
  search: wrap('<circle cx="10.5" cy="10.5" r="7"/><path d="M20.5 20.5l-4.6-4.6"/>'),
  chevronDown: wrap('<path d="M5.5 8.5L12 15l6.5-6.5"/>', { w: 2 }),
  chevronRight: wrap('<path d="M9 5.5l6.5 6.5L9 18.5"/>', { w: 2 }),
  chevronLeft: wrap('<path d="M15 5.5L8.5 12l6.5 6.5"/>', { w: 2 }),
  arrowUp: wrap('<path d="M12 19V5M6 11l6-6 6 6"/>', { w: 2.2 }),
  arrowDown: wrap('<path d="M12 5v14M6 13l6 6 6-6"/>', { w: 2.2 }),
  arrowRight: wrap('<path d="M5 12h14M13 6l6 6-6 6"/>', { w: 2 }),
  external: wrap('<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14v5.5a1.5 1.5 0 01-1.5 1.5h-12A1.5 1.5 0 013 19.5v-12A1.5 1.5 0 014.5 6H10"/>'),
  close: wrap('<path d="M6 6l12 12M18 6L6 18"/>', { w: 2 }),
  check: wrap('<path d="M4.5 12.5l5 5 10-11"/>', { w: 2.4 }),
  menu: wrap('<path d="M3.5 7h17M3.5 12h17M3.5 17h17"/>', { w: 2 }),
  more: wrap('<circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/>'),
  edit: wrap('<path d="M16.5 3.5a2.1 2.1 0 013 3L7.5 18.5l-4 1 1-4z"/>'),
  trash: wrap('<path d="M3.5 6h17M8.5 6V4.5A1.5 1.5 0 0110 3h4a1.5 1.5 0 011.5 1.5V6M18.5 6v13.5a1.5 1.5 0 01-1.5 1.5H7a1.5 1.5 0 01-1.5-1.5V6"/><path d="M10 10.5v6M14 10.5v6"/>'),
  copy: wrap('<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 5.5v-1a1 1 0 00-1-1h-10a1 1 0 00-1 1v10a1 1 0 001 1h1"/>'),
  download: wrap('<path d="M12 3.5v12M7 11l5 5 5-5"/><path d="M4 19.5h16"/>'),
  eye: wrap('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  phone: wrap('<path d="M6.6 3.5h3l1.6 4-2 1.4a12 12 0 005.9 5.9l1.4-2 4 1.6v3a1.6 1.6 0 01-1.7 1.6A16.5 16.5 0 015 5.2 1.6 1.6 0 016.6 3.5z"/>'),
  pin: wrap('<path d="M12 21.5s7-6 7-11.5a7 7 0 10-14 0c0 5.5 7 11.5 7 11.5z"/><circle cx="12" cy="10" r="2.6"/>'),
  calendar: wrap('<rect x="3.5" y="5" width="17" height="16" rx="2.4"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>'),
  clock: wrap('<circle cx="12" cy="12" r="8.8"/><path d="M12 7v5.3l3.3 2"/>'),
  info: wrap('<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.5M12 7.8v.01"/>'),
  alert: wrap('<path d="M10.6 3.6L2.4 17.5A1.6 1.6 0 003.8 20h16.4a1.6 1.6 0 001.4-2.5L13.4 3.6a1.6 1.6 0 00-2.8 0z"/><path d="M12 9.5v4M12 17v.01"/>'),
  sparkles: wrap('<path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z"/><path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>'),
  rocket: wrap('<path d="M9 15.5l-3.5-.6a.8.8 0 01-.5-1.3l3-3.4A9.8 9.8 0 0115.5 7 6 6 0 0121 3.5 6 6 0 0117.5 9a9.8 9.8 0 01-3.2 7.5l-3.4 3a.8.8 0 01-1.3-.5z"/><circle cx="15.5" cy="8.5" r="1.4"/><path d="M7 17c-1.3 1.3-1.5 4-1.5 4s2.7-.2 4-1.5"/>'),
  sun: wrap('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>'),
  moon: wrap('<path d="M20.5 14.3A8.6 8.6 0 019.7 3.5a8.8 8.8 0 102.8 17.2 8.8 8.8 0 008-6.4z"/>'),
  logout: wrap('<path d="M9.5 20.5h-4a2 2 0 01-2-2v-13a2 2 0 012-2h4"/><path d="M16 16.5l4.5-4.5L16 7.5M20 12H9"/>'),
  filter: wrap('<path d="M3.5 5.5h17l-6.5 8v6l-4 2v-8z"/>'),
  refresh: wrap('<path d="M20.5 12a8.5 8.5 0 01-14.6 6M3.5 12A8.5 8.5 0 0118 6"/><path d="M18 2.5V6h-3.5M6 21.5V18h3.5"/>'),
  save: wrap('<path d="M19.5 21h-15a1.5 1.5 0 01-1.5-1.5v-15A1.5 1.5 0 014.5 3h11L21 8.5v11a1.5 1.5 0 01-1.5 1.5z"/><path d="M7 3v6h8V3M7 21v-7h10v7"/>'),
  code: wrap('<path d="M8.5 17.5L3 12l5.5-5.5M15.5 6.5L21 12l-5.5 5.5M13.5 3.5l-3 17"/>'),
  mobile: wrap('<rect x="6.5" y="2.5" width="11" height="19" rx="2.6"/><path d="M10.5 18.5h3"/>'),
  desktop: wrap('<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>'),
  target: wrap('<circle cx="12" cy="12" r="8.8"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>'),
  layers: wrap('<path d="M12 2.8l9 4.7-9 4.7-9-4.7z"/><path d="M3 12.3l9 4.7 9-4.7M3 16.8l9 4.7 9-4.7"/>'),
  table: wrap('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M3 15h18M9.5 4v16"/>'),
  lock: wrap('<rect x="4.5" y="10" width="15" height="11" rx="2.2"/><path d="M8 10V7a4 4 0 018 0v3"/>'),
  mail: wrap('<rect x="2.5" y="4.5" width="19" height="15" rx="2.2"/><path d="M3 6.5l9 6 9-6"/>'),
  user: wrap('<circle cx="12" cy="8" r="4"/><path d="M4 20.5a8 8 0 0116 0"/>'),
  box: wrap('<path d="M21 8.5v7a2 2 0 01-1 1.7l-7 4a2 2 0 01-2 0l-7-4a2 2 0 01-1-1.7v-7a2 2 0 011-1.7l7-4a2 2 0 012 0l7 4a2 2 0 011 1.7z"/><path d="M3.3 7.4L12 12.3l8.7-4.9M12 21.5v-9.2"/>'),
  wallet: wrap('<path d="M20.5 8.5V6.8A1.8 1.8 0 0018.7 5H4.8A1.8 1.8 0 003 6.8v10.4A1.8 1.8 0 004.8 19h13.9a1.8 1.8 0 001.8-1.8V15.5"/><path d="M21.5 8.5h-5a3.5 3.5 0 000 7h5z"/>'),
  trending: wrap('<path d="M3 16.5l6-6 4 4 8-8"/><path d="M15 6.5h6v6"/>'),
  cart: wrap('<path d="M2.5 3.5h2.6l2.4 12.2a1.6 1.6 0 001.6 1.3h8.7a1.6 1.6 0 001.6-1.3L21 7.5H6"/><circle cx="10" cy="20.5" r="1.3"/><circle cx="18" cy="20.5" r="1.3"/>'),
  truck: wrap('<path d="M2.5 6.5h11v10h-11z"/><path d="M13.5 10h3.6l3.4 3.4v3.1h-7z"/><circle cx="6.5" cy="18.5" r="2"/><circle cx="17" cy="18.5" r="2"/>'),
  megaphone: wrap('<path d="M3.5 10.5v3a1.5 1.5 0 001.5 1.5h2l7 4.5V6L7 10.5H5a1.5 1.5 0 00-1.5 1.5z"/><path d="M18 8.5a5 5 0 010 7"/>'),
  flask: wrap('<path d="M9.5 2.5v6.2L4.6 17a2.4 2.4 0 002.1 3.5h10.6a2.4 2.4 0 002.1-3.5l-4.9-8.3V2.5"/><path d="M8 2.5h8"/>'),
};

/** Devuelve un nodo SVG listo para insertar. */
export function icon(name) {
  const span = document.createElement('span');
  span.style.display = 'contents';
  span.innerHTML = icons[name] || icons.info;
  return span.firstElementChild;
}

export const iconHTML = (name) => icons[name] || icons.info;
