/* Mapa de navegación y registro de vistas. */

import dashboard from './views/dashboard.js';
import orders from './views/orders.js';
import products from './views/products.js';
import pages from './views/pages.js';
import tests from './views/tests.js';
import analytics from './views/analytics.js';
import {
  customersView, logisticsView, financeView, settingsView, abTestView, aiAdsView,
} from './views/misc.js';

export const NAV = [
  {
    label: 'Operación',
    items: [
      { id: 'dashboard', label: 'Panel', icon: 'dashboard' },
      { id: 'orders', label: 'Pedidos', icon: 'orders' },
      { id: 'customers', label: 'Clientes', icon: 'customers' },
      { id: 'logistics', label: 'Logística', icon: 'logistics' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { id: 'products', label: 'Productos', icon: 'products' },
      { id: 'pages', label: 'Páginas', icon: 'pages' },
    ],
  },
  {
    label: 'Crecimiento',
    items: [
      { id: 'tests', label: 'Testeos', icon: 'tests' },
      { id: 'analytics', label: 'Analíticas', icon: 'analytics' },
      { id: 'finance', label: 'Finanzas', icon: 'finance' },
    ],
  },
  {
    label: 'Experimentos',
    items: [
      // La comparación con significancia ya funciona; falta el reparto automático
      { id: 'abtest', label: 'Test A/B', icon: 'abtest', beta: true },
      { id: 'ai-ads', label: 'Anuncios con IA', icon: 'ai', soon: true },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { id: 'settings', label: 'Ajustes', icon: 'settings' },
    ],
  },
];

export const routes = {
  dashboard,
  orders,
  products,
  pages,
  tests,
  analytics,
  customers: customersView,
  logistics: logisticsView,
  finance: financeView,
  settings: settingsView,
  abtest: abTestView,
  'ai-ads': aiAdsView,
};
