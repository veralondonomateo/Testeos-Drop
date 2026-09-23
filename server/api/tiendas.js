/**
 * Tiendas: qué marca vive en qué dominio.
 *
 * El sistema nació sirviendo todas las landings desde un único dominio, con el
 * producto metido en la URL (`/p/dermafol-funnel`, `/p/plasma-corazon`). Eso
 * funciona para testear, pero no para vender: una clienta que ve
 * `testeos-drop.vercel.app` en la barra del navegador justo antes de dar su
 * dirección y su teléfono tiene una razón perfectamente sensata para no
 * hacerlo.
 *
 * Una tienda es una fila: un nombre, un dominio y —cuando exista— la página que
 * se sirve en la raíz. Añadir una marca nueva es insertar esa fila y apuntar el
 * DNS; no hay código que tocar.
 *
 * Las páginas sin `tienda_id` siguen comportándose como antes y se sirven desde
 * cualquier dominio. Eso es deliberado: el panel, los enlaces de testeo que ya
 * circulan y las páginas viejas tienen que seguir funcionando mientras la
 * migración avanza marca por marca.
 */

import { all, one, run } from '../db.js';
import { nowISO } from '../lib/util.js';

/**
 * El mismo minuto de caché que usan las páginas, y por el mismo motivo: esto
 * corre en cada visita y los dominios cambian una vez al año.
 */
const TTL = 60_000;
const cache = () => (globalThis.__dsTiendaCache ||= new Map());

/** Se llama al crear o editar una tienda: el cambio debe verse ya. */
export const olvidarTiendas = () => cache().clear();

/**
 * Normaliza un host a la forma en que se guarda el dominio.
 *
 * Quita el puerto —`localhost:4321` en desarrollo— y el `www.`, porque un
 * dominio y su `www` son la misma tienda y obligar a registrar los dos sería
 * una fuente de fallos silenciosos: la mitad del tráfico entraría por un host
 * que no está en la tabla y acabaría en la página equivocada.
 */
export function normalizarHost(host) {
  return String(host || '').toLowerCase().trim().split(':')[0].replace(/^www\./, '');
}

/**
 * La tienda de este host, o null si el dominio no es de ninguna.
 *
 * Devolver null no es un error: es lo que pasa en el dominio de Vercel y en
 * local, donde se sirve el panel y todas las páginas sin distinción.
 */
export async function tiendaDeHost(host) {
  const dominio = normalizarHost(host);
  if (!dominio) return null;

  const key = `tienda:${dominio}`;
  const hit = cache().get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  if (hit) cache().delete(key);

  const t = await one(
    `SELECT * FROM tiendas WHERE lower(dominio) = ? AND status = 'activa'`,
    [dominio]
  );
  cache().set(key, { value: t || null, until: Date.now() + TTL });
  return t || null;
}

/**
 * Si esta página puede servirse desde esta tienda.
 *
 * Una página sin tienda es de todos —las viejas, las de testeo— y una tienda
 * sólo sirve lo suyo. Lo segundo importa más de lo que parece: sin esta
 * comprobación, `dermafol.co/p/plasma-corazon` respondería con la landing de
 * otro producto bajo la marca equivocada.
 */
export function paginaEsDeTienda(page, tienda) {
  if (!page) return false;
  if (!tienda) return true;             // el dominio neutro sirve todo
  return page.tienda_id === tienda.id;  // un dominio de marca, sólo lo suyo
}

/**
 * El HTML de la portada de una tienda, o null si todavía no tiene.
 *
 * Si no se ha designado una portada se sirve su landing publicada más
 * reciente. No es un apaño: mientras la tienda no exista, lo que la marca
 * quiere en su raíz es exactamente lo que ya está vendiendo.
 */
export async function portadaDe(tienda) {
  const { renderPage } = await import('./pages.js');
  let p = tienda.home_page_id
    ? await one(`SELECT * FROM pages WHERE id = ? AND status = 'published'`, [tienda.home_page_id])
    : null;
  if (!p) {
    p = await one(
      `SELECT * FROM pages WHERE tienda_id = ? AND status = 'published'
       ORDER BY published_at DESC NULLS LAST, updated_at DESC LIMIT 1`,
      [tienda.id]
    );
  }
  return p ? renderPage(p) : null;
}

/* ── Panel ───────────────────────────────────────────────────────────── */

export async function listarTiendas() {
  return all(`SELECT t.*,
      (SELECT COUNT(*) FROM pages p WHERE p.tienda_id = t.id) paginas
    FROM tiendas t ORDER BY t.nombre`);
}

export async function crearTienda(body) {
  const id = `tnd_${normalizarHost(body.dominio).replace(/[^a-z0-9]/g, '_')}`;
  const ahora = nowISO();
  await run(
    `INSERT INTO tiendas (id, nombre, dominio, home_page_id, status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?)`,
    [id, String(body.nombre || '').trim(), normalizarHost(body.dominio),
      body.home_page_id || null, body.status || 'activa', ahora, ahora]
  );
  olvidarTiendas();
  return one('SELECT * FROM tiendas WHERE id = ?', [id]);
}

export async function actualizarTienda(id, body) {
  const campos = [], valores = [];
  for (const k of ['nombre', 'home_page_id', 'status']) {
    if (body[k] !== undefined) { campos.push(`${k} = ?`); valores.push(body[k] || null); }
  }
  if (body.dominio !== undefined) { campos.push('dominio = ?'); valores.push(normalizarHost(body.dominio)); }
  if (!campos.length) return one('SELECT * FROM tiendas WHERE id = ?', [id]);
  campos.push('updated_at = ?'); valores.push(nowISO(), id);
  await run(`UPDATE tiendas SET ${campos.join(', ')} WHERE id = ?`, valores);
  olvidarTiendas();
  return one('SELECT * FROM tiendas WHERE id = ?', [id]);
}

/** Asigna páginas a una tienda de una vez, que es como se migra una marca. */
export async function asignarPaginas(tiendaId, slugs) {
  for (const slug of slugs) {
    await run('UPDATE pages SET tienda_id = ?, updated_at = ? WHERE slug = ?',
      [tiendaId, nowISO(), slug]);
  }
  olvidarTiendas();
  return all('SELECT slug, tienda_id FROM pages WHERE tienda_id = ?', [tiendaId]);
}
