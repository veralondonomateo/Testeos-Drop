/**
 * El armazón de la tienda: lo que comparten todas las páginas.
 *
 * Las landings de anuncios (`/p/...`, `/t/...`) no pasan por aquí y no deben
 * hacerlo: están convirtiendo y su HTML vive en la base, editado a mano. Esto
 * es para la tienda —portada, catálogo, políticas, ayuda—, que es contenido
 * estable y se gana más generándolo que guardándolo.
 *
 * Una sola función construye el documento: así un cambio de cabecera o de
 * tipografía entra en las trece páginas a la vez, que es justo lo que no pasa
 * cuando cada página es un HTML suelto.
 */

/** Tokens de marca. Salen de la referencia de diseño, muestreados del original. */
export const TOKENS = `
:root{
  --tinta:#2E2E2E;
  --tinta-suave:#6D6D6D;
  --tinta-tenue:#9A9A9A;
  --papel:#FFFFFF;
  --crema:#F7F5F3;
  --arena:#EFEAE5;
  --bruma:#E0EAF0;
  --arcilla:#916E53;
  --verde:#3F7D58;
  --linea:#E8E4E2;
  --radio:18px;
  --radio-s:12px;
  --ancho:1200px;
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation:none!important;transition:none!important}}
body{margin:0;background:var(--papel);color:var(--tinta);
  font-family:'DM Sans',system-ui,-apple-system,sans-serif;
  font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block;height:auto}
a{color:inherit}
h1,h2,h3,h4{margin:0;line-height:1.14;letter-spacing:-.025em;font-weight:700}
h1{font-size:clamp(28px,4.4vw,46px)}
h2{font-size:clamp(23px,3.1vw,34px)}
h3{font-size:clamp(17px,1.7vw,21px)}
p{margin:0 0 16px}
.w{max-width:var(--ancho);margin:0 auto;padding:0 20px}
.w-s{max-width:760px;margin:0 auto;padding:0 20px}
.sec{padding:clamp(44px,6vw,80px) 0}
.eyebrow{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--arcilla);margin:0 0 10px}
.lede{font-size:clamp(15.5px,1.5vw,18px);color:var(--tinta-suave);line-height:1.68}

/* botones */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  border:0;border-radius:999px;background:var(--tinta);color:#fff;
  font-family:inherit;font-size:15.5px;font-weight:700;padding:15px 30px;
  cursor:pointer;text-decoration:none;text-align:center;letter-spacing:.01em;
  transition:background .14s ease,transform .14s ease}
.btn:hover{background:#1a1a1a;transform:translateY(-1px)}
.btn:focus-visible{outline:3px solid var(--arcilla);outline-offset:3px}
.btn-b{width:100%}
.btn-2{background:#fff;color:var(--tinta);border:1.5px solid var(--linea)}
.btn-2:hover{background:var(--crema)}
.btn-s{padding:11px 20px;font-size:14px}

/* tarjetas y píldoras */
.card{background:#fff;border:1px solid var(--linea);border-radius:var(--radio);overflow:hidden}
.pill{display:inline-flex;align-items:center;gap:7px;background:var(--crema);
  border:1px solid var(--linea);border-radius:999px;padding:8px 15px;
  font-size:13px;font-weight:600;color:var(--tinta-suave)}

/* barra de anuncio */
.ann{background:var(--bruma);text-align:center;padding:10px 16px;font-size:13px;line-height:1.35}
.ann a{font-weight:700;text-decoration:underline;text-underline-offset:3px}

/* cabecera */
.hd{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.93);
  backdrop-filter:saturate(140%) blur(10px);border-bottom:1px solid var(--linea)}
.hd .in{max-width:var(--ancho);margin:0 auto;padding:8px 20px;
  display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px}
.hd .marca{grid-column:2;justify-self:center;text-decoration:none;display:block}
/* El logotipo viene sobre fondo blanco, que es el de la cabecera: encaja sin
   recortar. En el pie, que es crema, se usa el nombre en texto por eso mismo. */
.hd .marca img{height:42px;width:auto;display:block}
@media(min-width:900px){ .hd .marca img{height:48px} }
.hd nav{display:none}
.hd .der{grid-column:3;justify-self:end;display:flex;align-items:center;gap:6px}
.icono{display:grid;place-items:center;width:40px;height:40px;border:0;background:none;
  cursor:pointer;border-radius:10px;color:var(--tinta);text-decoration:none}
.icono:hover{background:var(--crema)}
.icono svg{width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.7;
  stroke-linecap:round;stroke-linejoin:round}
.cuenta{position:absolute;top:4px;right:4px;min-width:17px;height:17px;border-radius:9px;
  background:var(--tinta);color:#fff;font-size:10px;font-weight:700;display:grid;
  place-items:center;padding:0 4px}
.icono{position:relative}
@media(min-width:900px){
  .hd .in{grid-template-columns:auto 1fr auto}
  .hd .marca{grid-column:1;justify-self:start}
  .hd nav{grid-column:2;display:flex;gap:26px;justify-content:center}
  .hd nav a{font-size:13.5px;font-weight:600;text-decoration:none;color:var(--tinta-suave);
    letter-spacing:.02em;padding:6px 0;border-bottom:2px solid transparent}
  .hd nav a:hover,.hd nav a[aria-current]{color:var(--tinta);border-bottom-color:var(--tinta)}
  .hamb{display:none}
}

/* menú móvil */
.menu{position:fixed;inset:0;z-index:70;background:#fff;transform:translateX(-100%);
  transition:transform .24s ease;display:flex;flex-direction:column}
.menu.on{transform:none}
.menu .top{display:flex;justify-content:space-between;align-items:center;
  padding:14px 20px;border-bottom:1px solid var(--linea)}
.menu .top b{font-size:20px;letter-spacing:-.03em}
.menu ul{list-style:none;margin:0;padding:8px 0;overflow-y:auto}
.menu a{display:block;padding:15px 20px;font-size:17px;font-weight:600;text-decoration:none;
  border-bottom:1px solid var(--crema)}
.menu .pie{margin-top:auto;padding:18px 20px;border-top:1px solid var(--linea)}

/* pie */
.ft{background:var(--crema);border-top:1px solid var(--linea);padding:52px 0 26px;margin-top:40px}
.ft .cols{display:grid;grid-template-columns:1fr;gap:30px}
/* El logotipo viene en negro sobre blanco. En el pie, que es crema, se funde
   con multiply: el blanco desaparece y el negro se mantiene. Es lo que evita
   el recuadro blanco sin tener que reeditar el archivo. */
.ft .marca{height:30px;width:auto;margin:0 0 12px;mix-blend-mode:multiply}
.ft .kick{font-size:13.5px;color:var(--tinta-suave);max-width:270px}
.ft h4{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tinta-tenue);
  margin:0 0 12px;font-weight:700}
.ft ul{list-style:none;margin:0;padding:0}
.ft li{margin:0 0 9px}
.ft li a{font-size:14px;color:var(--tinta-suave);text-decoration:none}
.ft li a:hover{color:var(--tinta);text-decoration:underline;text-underline-offset:3px}
.ft .legal{border-top:1px solid var(--linea);margin-top:34px;padding-top:18px;
  display:flex;flex-wrap:wrap;gap:8px 22px;justify-content:space-between;
  font-size:12px;color:var(--tinta-tenue)}
.ft .legal a{text-decoration:none}
.ft .legal a:hover{text-decoration:underline}
@media(min-width:760px){ .ft .cols{grid-template-columns:1.6fr 1fr 1fr 1fr;gap:40px} }

/* utilidades de rejilla */
.g2{display:grid;grid-template-columns:1fr;gap:18px}
.g3{display:grid;grid-template-columns:1fr;gap:18px}
.g4{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
@media(min-width:720px){ .g2{grid-template-columns:1fr 1fr;gap:34px}
  .g3{grid-template-columns:repeat(3,1fr)} .g4{grid-template-columns:repeat(4,1fr);gap:20px} }

/* acordeón */
details.qa{border-bottom:1px solid var(--linea);padding:16px 0}
details.qa summary{cursor:pointer;font-size:16px;font-weight:600;list-style:none;
  display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
details.qa summary::-webkit-details-marker{display:none}
details.qa summary::after{content:'+';color:var(--arcilla);font-size:22px;line-height:1;flex:0 0 auto}
details.qa[open] summary::after{content:'\\2212'}
details.qa p{margin:11px 0 0;color:var(--tinta-suave);font-size:15px}
`;

/** La fuente, servida por Google con intercambio para no bloquear el pintado. */
const FUENTE = '<link rel="preconnect" href="https://fonts.googleapis.com">'
  + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  + '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">';

/** Navegación principal. Un único sitio donde vive, para que no se descuadre. */
export const NAV = [
  ['/catalogo', 'Catálogo'],
  ['/combos', 'Combos'],
  ['/suscripciones', 'Suscripciones'],
  ['/guias', 'Guías'],
  ['/nosotros', 'Nosotros'],
];

const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICONOS = {
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  cuenta: svg('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),
  carrito: svg('<path d="M4.5 7h15l-1.3 11.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8Z"/><path d="M9 7V5.6a3 3 0 0 1 6 0V7"/>'),
  cerrar: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
};

function cabecera(ruta) {
  const enlaces = NAV.map(([u, t]) =>
    `<a href="${u}"${ruta === u ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  return `<header class="hd"><div class="in">
  <button class="icono hamb" type="button" data-menu aria-label="Abrir menú" aria-expanded="false">${ICONOS.menu}</button>
  <a class="marca" href="/" aria-label="Dermafol · inicio"><img src="/assets/marca/dermafol-logotipo.png" alt="Dermafol" width="118" height="40"></a>
  <nav>${enlaces}</nav>
  <div class="der">
    <a class="icono" href="/cuenta" aria-label="Mi cuenta">${ICONOS.cuenta}</a>
    <a class="icono" href="/carrito" aria-label="Carrito" data-carrito>${ICONOS.carrito}<span class="cuenta" data-carrito-n hidden>0</span></a>
  </div>
</div></header>
<div class="menu" id="menu" aria-hidden="true">
  <div class="top"><img src="/assets/marca/dermafol-logotipo.png" alt="Dermafol" height="24" style="height:24px;width:auto">
    <button class="icono" type="button" data-menu-cerrar aria-label="Cerrar menú">${ICONOS.cerrar}</button></div>
  <ul>${NAV.map(([u, t]) => `<li><a href="${u}">${t}</a></li>`).join('')}
    <li><a href="/preguntas-frecuentes">Preguntas frecuentes</a></li>
    <li><a href="/seguimiento">Seguir mi pedido</a></li>
    <li><a href="/contacto">Contacto y ayuda</a></li></ul>
  <div class="pie"><a class="btn btn-b" href="/catalogo">Ver productos</a></div>
</div>`;
}

function pie() {
  const col = (t, items) => `<div><h4>${t}</h4><ul>${
    items.map(([u, x]) => `<li><a href="${u}">${x}</a></li>`).join('')}</ul></div>`;
  return `<footer class="ft"><div class="w">
  <div class="cols">
    <div><img class="marca" src="/assets/marca/dermafol-logotipo.png" alt="Dermafol" width="150" height="50">
      <p class="kick">Cuidado capilar con respaldo clínico para mujeres de 30 en adelante.</p></div>
    ${col('Productos', [['/producto/combo-dermafol-360', 'Combo Dermafol 360°'],
      ['/producto/suplemento-capilar', 'Suplemento Capilar'],
      ['/producto/roll-on-dermoestimulante', 'Roll-On'],
      ['/combos', 'Combos y ahorro'],
      ['/suscripciones', 'Suscripciones']])}
    ${col('Empresa', [['/nosotros', 'Sobre nosotros'],
      ['/guias', 'Guías y contenido'],
      ['/preguntas-frecuentes', 'Preguntas frecuentes']])}
    ${col('Soporte', [['/contacto', 'Contacto y ayuda'],
      ['/seguimiento', 'Seguir mi pedido'],
      ['/cuenta', 'Mi cuenta'],
      ['/politicas/envios', 'Envíos y entregas'],
      ['/politicas/devoluciones', 'Cambios y devoluciones']])}
  </div>
  <div class="legal">
    <span>© ${new Date().getFullYear()} Dermafol · Una marca de VERA &amp; CO</span>
    <span><a href="/politicas/privacidad">Privacidad</a> · <a href="/politicas/datos">Tratamiento de datos</a> · <a href="/politicas/terminos">Términos</a></span>
  </div>
</div></footer>`;
}

/** El script mínimo compartido: menú y contador del carrito. */
const SCRIPT = `<script>
(function(){
  var m=document.getElementById('menu');
  function abrir(v){ m.classList.toggle('on',v); m.setAttribute('aria-hidden',String(!v));
    document.body.style.overflow=v?'hidden':'';
    var b=document.querySelector('[data-menu]'); if(b) b.setAttribute('aria-expanded',String(v)); }
  document.addEventListener('click',function(e){
    if(!e.target.closest) return;
    if(e.target.closest('[data-menu]')) abrir(true);
    if(e.target.closest('[data-menu-cerrar]')) abrir(false);
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') abrir(false); });
  // El contador del carrito se pinta en el cliente: la cabecera es la misma
  // respuesta cacheada para todo el mundo y el carrito es de cada visitante.
  try{
    var c=JSON.parse(localStorage.getItem('dermafol_carrito')||'[]');
    var n=c.reduce(function(s,l){return s+(l.cant||0)},0);
    var e=document.querySelector('[data-carrito-n]');
    if(e&&n>0){ e.textContent=n>9?'9+':String(n); e.hidden=false; }
  }catch(err){}
})();
</script>`;

/**
 * Arma el documento completo.
 *
 * `extraCss` y `extraJs` existen para que una página cargue solo lo suyo —el
 * carrito no necesita el CSS del catálogo— y el armazón no engorde con estilos
 * que la mayoría de las páginas no usa.
 */
export function documento({ titulo, descripcion, ruta = '/', cuerpo, extraCss = '', extraJs = '', noindex = false }) {
  return `<!DOCTYPE html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${titulo}</title>
<meta name="description" content="${String(descripcion || '').replace(/"/g, '&quot;')}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="icon" type="image/png" sizes="32x32" href="/assets/marca/dermafol-icono-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/marca/dermafol-icono-192.png">
<link rel="apple-touch-icon" href="/assets/marca/dermafol-icono-180.png">
${FUENTE}
<style>${TOKENS}${extraCss}</style>
</head>
<body>
<div class="ann">Envío gratis a toda Colombia · <a href="/catalogo">Ver productos →</a></div>
${cabecera(ruta)}
<main>${cuerpo}</main>
${pie()}
${SCRIPT}${extraJs}
</body>
</html>`;
}
