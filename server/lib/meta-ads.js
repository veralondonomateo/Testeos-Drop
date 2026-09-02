/**
 * Lectura de la inversión publicitaria desde la API de Marketing de Meta.
 *
 * Sirve para que el CPA y el ROAS del panel salgan de la cifra real y no de
 * una estimación. Es sólo de lectura: nunca crea ni modifica nada en la cuenta.
 *
 * El token de la API de Conversiones que ya está configurado NO vale aquí —se
 * comprobó y devuelve "Ad account owner has NOT grant ads_read"—, así que va en
 * su propia variable.
 */

const API = 'https://graph.facebook.com/v21.0';

/** Cuenta publicitaria de Dermafol, en el BM Genesispsw. */
const CUENTA = process.env.META_AD_ACCOUNT || 'act_878173025258753';

/**
 * Sólo se suma lo que gastan las campañas de este producto.
 *
 * La cuenta es de Dermafol hoy, pero si mañana entra otro producto su gasto no
 * puede acabar contándose contra el CPA de éste. El filtro va por el nombre
 * porque es la convención que ya usan las campañas ("DERMAFOL | CBO | ...").
 */
const PATRON = process.env.META_CAMPANA_PATRON || 'DERMAFOL';

const token = () => process.env.META_ADS_TOKEN || '';

/**
 * Inversión por día y campaña, entre dos fechas.
 *
 * Se pide con `time_increment=1` para que Meta devuelva una fila por día: pedir
 * el rango entero daría un total y no se podría cuadrar día a día con los
 * pedidos, que es de donde sale el CPA.
 */
export async function inversionPorDia(desde, hasta) {
  if (!token()) return { ok: false, error: 'falta META_ADS_TOKEN' };

  const params = new URLSearchParams({
    level: 'campaign',
    fields: 'campaign_id,campaign_name,spend,impressions,clicks',
    time_range: JSON.stringify({ since: desde, until: hasta }),
    time_increment: '1',
    limit: '500',
    access_token: token(),
  });

  try {
    const r = await fetch(`${API}/${CUENTA}/insights?${params}`, {
      signal: AbortSignal.timeout(20_000),
    });
    const d = await r.json();
    if (!r.ok || d.error) {
      return { ok: false, error: d?.error?.message || `HTTP ${r.status}` };
    }

    // Meta devuelve el gasto como texto y en la moneda de la cuenta (COP).
    const dias = new Map();
    for (const fila of d.data || []) {
      if (PATRON && !String(fila.campaign_name || '').toUpperCase().includes(PATRON.toUpperCase())) continue;
      const dia = fila.date_start;
      const acc = dias.get(dia) || { spend: 0, impressions: 0, clicks: 0 };
      acc.spend += Math.round(Number(fila.spend || 0));
      acc.impressions += Number(fila.impressions || 0);
      acc.clicks += Number(fila.clicks || 0);
      dias.set(dia, acc);
    }
    return { ok: true, dias: [...dias.entries()].map(([date, v]) => ({ date, ...v })) };
  } catch (e) {
    return { ok: false, error: String(e?.message || e).slice(0, 200) };
  }
}
