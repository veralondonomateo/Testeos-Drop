import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = join(ROOT, 'data');
export const PAGES_DIR = join(DATA_DIR, 'pages');
export const ASSETS_DIR = join(DATA_DIR, 'assets');
export const APP_DIR = join(ROOT, 'app');
export const DB_FILE = join(DATA_DIR, 'drop.db');

export const PORT = Number(process.env.PORT || 4321);
export const HOST = process.env.HOST || '127.0.0.1';

export const CURRENCY = 'COP';
export const SESSION_DAYS = 30;

/** Estados del pedido — el pipeline completo de un COD en Colombia. */
export const ORDER_STATUS = {
  pending:    { label: 'Pendiente',   tone: 'neutral',  step: 1 },
  confirmed:  { label: 'Confirmado',  tone: 'info',     step: 2 },
  packed:     { label: 'Alistado',    tone: 'info',     step: 3 },
  shipped:    { label: 'En camino',   tone: 'warning',  step: 4 },
  delivered:  { label: 'Entregado',   tone: 'good',     step: 5 },
  returned:   { label: 'Devuelto',    tone: 'serious',  step: 6 },
  cancelled:  { label: 'Cancelado',   tone: 'critical', step: 6 },
};

/** Un pedido "cobrado" es el que efectivamente generó caja. */
export const REVENUE_STATUSES = ['delivered'];
/** Pedidos que siguen vivos en el embudo (no cancelados ni devueltos). */
export const ACTIVE_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

export const TEST_STATUS = {
  planned:  { label: 'Planeado',   tone: 'neutral' },
  running:  { label: 'En curso',   tone: 'info' },
  paused:   { label: 'Pausado',    tone: 'warning' },
  finished: { label: 'Finalizado', tone: 'good' },
};

export const VERDICTS = {
  '':        { label: 'Sin veredicto', tone: 'neutral' },
  winner:    { label: 'Ganador',       tone: 'good' },
  iterate:   { label: 'Iterar',        tone: 'warning' },
  loser:     { label: 'Descartado',    tone: 'critical' },
};
