/**
 * Sincroniza la inversión de Meta con la tabla `ad_spend`.
 *
 * Es lo que hace que el CPA y el ROAS del panel sean cifras y no estimaciones.
 * Sin esto había que pedir los datos a mano cada día.
 */

import { run, all } from '../db.js';
import { inversionPorDia } from '../lib/meta-ads.js';
import { dayKey, addDays } from '../lib/util.js';

const TEST = 'tst_dermafol';
const PRODUCTO = 'prd_dermafol360';

/**
 * Cuántos días hacia atrás se rehacen en cada pasada.
 *
 * No basta con traer el día de hoy: Meta sigue ajustando las cifras de un día
 * durante horas —atribución que entra tarde, clics que se recuentan— y el gasto
 * de ayer a mediodía no es el definitivo. Rehacer una ventana corta deja
 * siempre el número bueno sin tener que adivinar cuándo cerró.
 */
const DIAS_ATRAS = 3;

/**
 * Trae la inversión y la deja escrita. Devuelve qué días tocó.
 *
 * El id de cada fila es determinista (`spd_<fecha>_meta`), así que volver a
 * pasar por el mismo día actualiza en vez de duplicar. Esa es toda la
 * protección que hace falta contra ejecuciones repetidas del cron.
 */
export async function sincronizarInversion() {
  const hasta = dayKey();
  const desde = addDays(hasta, -DIAS_ATRAS);

  const r = await inversionPorDia(desde, hasta);
  if (!r.ok) return { ok: false, error: r.error, desde, hasta };

  for (const d of r.dias) {
    await run(
      `INSERT INTO ad_spend (id, test_id, product_id, date, channel, spend, impressions, clicks, is_demo)
       VALUES (?,?,?,?,?,?,?,?,0)
       ON CONFLICT (id) DO UPDATE
         SET spend = EXCLUDED.spend,
             impressions = EXCLUDED.impressions,
             clicks = EXCLUDED.clicks`,
      [`spd_${d.date.replace(/-/g, '')}_meta`, TEST, PRODUCTO, d.date, 'meta',
        d.spend, d.impressions, d.clicks]
    );
  }

  return { ok: true, desde, hasta, dias: r.dias };
}

/** Lo que hay guardado, para mirarlo desde el panel. */
export async function resumenInversion(dias = 7) {
  const hasta = dayKey();
  const desde = addDays(hasta, -(dias - 1));
  const filas = await all(
    `SELECT s.date, s.spend, s.clicks, s.impressions,
            (SELECT COUNT(*) FROM orders o
              WHERE o.status != 'cancelled'
                AND to_char((o.created_at::timestamptz AT TIME ZONE 'America/Bogota')::date,'YYYY-MM-DD') = s.date) pedidos
     FROM ad_spend s
     WHERE s.date >= ? AND s.date <= ? AND s.channel = 'meta'
     ORDER BY s.date DESC`,
    [desde, hasta]
  );
  return filas.map((f) => ({
    ...f,
    cpa: f.pedidos ? Math.round(f.spend / f.pedidos) : null,
    costo_por_clic: f.clicks ? Math.round(f.spend / f.clicks) : null,
  }));
}
