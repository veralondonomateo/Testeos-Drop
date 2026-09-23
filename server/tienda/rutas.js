/**
 * Qué página de la tienda corresponde a cada ruta.
 *
 * Vive aparte del servidor porque la tienda es de una marca y el servidor es de
 * todas: aquí sólo se decide qué se pinta, y quién puede verlo lo decide el
 * enrutado por dominio.
 */

import * as P from './paginas.js';

/**
 * Devuelve el HTML de la ruta, o null si no es de la tienda.
 *
 * Null no significa 404: significa "esto no es mío". El servidor sigue
 * buscando, y por ahí es como conviven las landings de anuncios, el panel y los
 * estáticos con la tienda en el mismo dominio.
 */
export function resolver(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';

  if (p === '/') return P.home();
  if (p === '/catalogo') return P.catalogo();
  if (p === '/combos') return P.combos();
  if (p === '/suscripciones') return P.suscripciones();
  if (p === '/nosotros') return P.nosotros();
  if (p === '/guias') return P.guias();
  if (p === '/preguntas-frecuentes') return P.preguntas();
  if (p === '/contacto') return P.contacto();
  if (p === '/seguimiento') return P.seguimiento();
  if (p === '/cuenta') return P.cuenta();
  if (p === '/carrito') return P.carrito();
  if (p === '/checkout') return P.checkout();

  const prod = p.match(/^\/producto\/([a-z0-9-]+)$/);
  if (prod) return P.producto(prod[1]) || P.noEncontrada();

  const guia = p.match(/^\/guias\/([a-z0-9-]+)$/);
  if (guia) return P.guia(guia[1]) || P.noEncontrada();

  const pol = p.match(/^\/politicas\/([a-z0-9-]+)$/);
  if (pol) return P.politica(pol[1]) || P.noEncontrada();

  return null;
}

/** Las rutas que la tienda reclama, para no pisar estáticos ni el panel. */
export const ES_DE_TIENDA = (pathname) => {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p.startsWith('/api/') || p.startsWith('/p/') || p.startsWith('/t/')) return false;
  if (/\.[a-z0-9]{2,5}$/i.test(p)) return false;   // estáticos: los sirve el CDN
  return true;
};

export const paginaNoEncontrada = () => P.noEncontrada();
