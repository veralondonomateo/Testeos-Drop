/**
 * Las páginas de la tienda.
 *
 * Cada una devuelve solo su cuerpo; el armazón —cabecera, pie, tokens— lo pone
 * `documento()`. Lo que se repite entre páginas vive aquí arriba como ayudante,
 * para que añadir una sección no signifique copiar un bloque de HTML y que dos
 * copias se separen a la tercera edición.
 */

import { documento } from './layout.js';
import {
  PRODUCTOS, productoPorSlug, COMBOS, FAQ, TESTIMONIOS, GUIAS, guiaPorSlug,
  POLITICAS, politicaPorSlug, EMPRESA, PENDIENTE, pesos,
} from './datos.js';

/* ── Ayudantes ───────────────────────────────────────────────────────── */

const esc = (s) => String(s ?? '').replace(/[<>&"]/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/** Un dato que la marca todavía no ha entregado, visible como tal. */
const pend = (txt) => `<span class="pend" title="Falta este dato">${esc(txt || 'Por definir')}</span>`;
const oPend = (v, txt) => (!v || v === PENDIENTE ? pend(txt) : esc(v));

const encabezado = (eyebrow, titulo, lede) => `<section class="sec pagina-top"><div class="w">
  ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
  <h1>${esc(titulo)}</h1>
  ${lede ? `<p class="lede" style="max-width:640px;margin-top:14px">${esc(lede)}</p>` : ''}
</div></section>`;

const urlProducto = (p) => p.enlace || `/producto/${p.slug}`;

const tarjetaProducto = (p) => `<article class="prod card">
  <a href="${urlProducto(p)}" class="foto"><img src="${p.imagen}" alt="${esc(p.nombre)}" width="700" height="700" loading="lazy"${p.encuadre ? ` style="object-position:${p.encuadre}"` : ''}></a>
  <div class="cuerpo">
    ${p.destacado ? '<span class="tag">Más vendido</span>' : ''}
    <h3><a href="${urlProducto(p)}">${esc(p.nombre)}</a></h3>
    <p class="kick">${esc(p.tagline)}</p>
    <div class="precio"><b>${pesos(p.precio)}</b>${p.antes ? `<s>${pesos(p.antes)}</s>` : ''}</div>
    <button class="btn btn-b btn-s" type="button" data-add="${p.slug}">Añadir al carrito</button>
  </div>
</article>`;

const bloqueFaq = (items, titulo = 'Preguntas frecuentes') => `<section class="sec"><div class="w-s">
  <p class="eyebrow">Dudas frecuentes</p><h2>${esc(titulo)}</h2>
  <div style="margin-top:24px">${items.map(([q, a]) =>
    `<details class="qa"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
</div></section>`;

const bloqueGarantia = () => `<section class="sec"><div class="w">
  <div class="gar">
    <img src="/assets/dermafol/combo-880.webp" alt="Combo Dermafol 360°" width="880" height="880" loading="lazy">
    <div>
      <h2>Garantía de 90 días.<br>Sin preguntas.</h2>
      <p class="lede">Sabemos que ya probaste cosas que no funcionaron. Por eso no te pedimos fe ciega, te pedimos 90 días.</p>
      <p><b>Si no notas ningún cambio en la caída, escríbenos y te devolvemos el 100% de tu dinero.</b> No tienes que devolver los frascos ni justificar nada.</p>
    </div>
  </div>
</div></section>`;

const bloqueTestimonios = () => `<section class="sec crema"><div class="w">
  <p class="eyebrow">Sus palabras, no las nuestras</p>
  <h2>Lo que nos escriben por WhatsApp</h2>
  <div class="g3" style="margin-top:26px">${TESTIMONIOS.map((t) => `<figure class="testi card">
    <img src="${t.foto}" alt="Foto que ${esc(t.nombre)} envió con su testimonio" width="420" height="420" loading="lazy">
    <figcaption><div class="est">★★★★★</div><p>“${esc(t.texto)}”</p>
      <cite>${esc(t.nombre)} · ${esc(t.ciudad)}</cite></figcaption></figure>`).join('')}</div>
  <p class="nota">Clientas reales que autorizaron publicar su testimonio y su foto. Los resultados son individuales y pueden variar.</p>
</div></section>`;

const franja = () => `<div class="franja"><div class="pista">${
  Array(2).fill('<span>Formulación clínica</span><span>Minoxidil 2%</span><span>Envío gratis</span><span>Pago contra entrega</span><span>Garantía de 90 días</span><span>Para mujeres 30+</span>').join('')
}</div></div>`;

/* ── CSS propio de la tienda ─────────────────────────────────────────── */

const CSS = `
.pend{background:#FDF3E3;border:1px dashed #E0C79A;border-radius:6px;padding:1px 7px;
  font-size:.92em;color:#8A6A32;font-style:normal}
.crema{background:var(--crema)}
.pagina-top{padding-bottom:0}
.nota{font-size:12.5px;color:var(--tinta-tenue);margin:18px 0 0}
/* Muro de fotos reales. Doce y no veinte: con más, la página pesa de más y
   nadie las mira todas; con menos, no se lee como un muro. */
/* Las dos vías del protocolo, una al lado de la otra: el argumento entero de
   la marca es que hacen falta las dos, y verlas separadas lo dice sin texto. */
.dos{display:grid;gap:16px}
.dos>div{border-left:2px solid var(--arcilla);padding-left:15px}
.dos b{display:block;font-size:15px;margin-bottom:4px}
.dos p{font-size:14.5px;color:var(--tinta-suave);margin:0;line-height:1.6}
@media(min-width:560px){ .dos{grid-template-columns:1fr 1fr;gap:22px} }
.muro{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:24px 0 0}
.muro img{aspect-ratio:1/1;object-fit:cover;border-radius:10px;background:var(--crema);width:100%}
@media(min-width:720px){ .muro{grid-template-columns:repeat(6,1fr);gap:9px} }

/* ── Portada ──────────────────────────────────────────────────────────
   La referencia manda el orden: primero lo que se lee —valoración, titular,
   promesa, píldoras—, después la imagen, y el botón al final en móvil. En
   escritorio el botón sube a la columna de texto, porque ahí la imagen va al
   lado y no entre medias. */
.hero-wrap{padding:14px 0 0}
.hero{display:grid;grid-template-columns:1fr;gap:0;
  background:linear-gradient(180deg,var(--crema),#fff 78%);
  border-radius:18px;padding:24px 20px 22px;
  margin:0;border:1px solid var(--linea)}
.hero h1{margin:12px 0 10px;font-size:clamp(27px,6.4vw,38px)}
.hero .lede{margin:0 0 18px}
.hero .pills{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 4px}
/* En móvil las píldoras van compactas: a tamaño normal cada una se llevaba
   una línea entera y empujaba la foto fuera de la primera pantalla. */
.hero .pills .pill{padding:6px 12px;font-size:12px}
.hero .bajo{display:flex;flex-wrap:wrap;gap:5px 16px;margin:12px 0 0;
  font-size:12px;color:var(--tinta-suave)}
.rate{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--tinta-suave)}
.rate b{color:var(--tinta)}
.rate .av{display:inline-flex}
.rate .av img{width:26px;height:26px;border-radius:50%;object-fit:cover;
  border:2px solid #fff;margin-right:-9px}

/* La imagen y la prueba: la mujer manda y el antes/después se apoya en ella,
   como en la referencia. Nada se recorta — la foto entra entera. */
.hero .im{position:relative;margin:20px 0 0;display:flex;justify-content:center}
.hero .im .mujer{width:min(78%,300px);height:auto;display:block;border-radius:18px}
.hero .prueba{position:absolute;right:0;bottom:6px;width:min(42%,158px);margin:0;
  background:#fff;border:1px solid var(--linea);border-radius:13px;padding:7px;
  box-shadow:0 12px 30px -16px rgba(46,46,46,.3)}
.hero .prueba img{width:100%;border-radius:8px;display:block;aspect-ratio:1/1;object-fit:cover}
.hero .prueba figcaption{font-size:9.5px;line-height:1.3;color:var(--tinta-tenue);
  margin-top:6px;text-align:center}

.cta-pc{display:none}
.cta-mov{margin-top:20px}

@media(min-width:900px){
  /* Dos columnas: texto a la izquierda con su botón, imagen a la derecha.
     La imagen no se recorta ni se estira: se le da alto y ella manda el suyo. */
  .hero{grid-template-columns:1.02fr 1fr;align-items:center;gap:36px;
    padding:clamp(34px,3.4vw,54px);margin:14px 0 0}
  .hero h1{font-size:clamp(34px,3.1vw,44px);margin:14px 0 12px}
  .hero .pills .pill{padding:8px 15px;font-size:13px}
  .hero .im{margin:0;justify-content:flex-end;align-items:flex-end}
  .hero .im .mujer{width:auto;max-height:440px;max-width:100%;border-radius:18px}
  .hero .prueba{width:150px;right:-6px;bottom:14px}
  .cta-pc{display:block;margin-top:22px}
  .cta-mov{display:none}
}
/* ── Guías ────────────────────────────────────────────────────────────
   La guía que ya está escrita se lleva una banda entera: foto a un lado,
   texto al otro, y en móvil una encima de la otra sin recortar nada. */
.etiqueta{display:inline-block;background:var(--crema);border:1px solid var(--linea);
  border-radius:999px;padding:4px 11px;font-size:11px;font-weight:700;
  letter-spacing:.06em;text-transform:uppercase;color:var(--tinta-suave);
  margin:0 0 10px}
.guia-grande{display:grid;grid-template-columns:1fr;gap:0;text-decoration:none;
  background:#fff;border:1px solid var(--linea);border-radius:var(--radio);
  overflow:hidden;color:inherit}
.guia-grande .im img{width:100%;height:auto;display:block;aspect-ratio:7/5;object-fit:cover}
.guia-grande .tx{padding:22px 20px 24px}
.guia-grande h2{font-size:clamp(21px,4.6vw,27px);line-height:1.2;margin:0 0 10px}
.guia-grande p{font-size:15px;color:var(--tinta-suave);margin:0}
.guia-grande .meta{display:block;margin-top:14px;font-size:13px;font-weight:600;color:var(--tinta)}
@media(min-width:900px){
  /* Dos columnas de igual peso: la foto no se estira para rellenar, se recorta
     por el centro, que es donde está la clienta. */
  .guia-grande{grid-template-columns:1.05fr 1fr;align-items:stretch}
  .guia-grande .im img{height:100%;aspect-ratio:auto;min-height:320px;object-position:center}
  .guia-grande .tx{padding:clamp(28px,3vw,44px);align-self:center}
  .guia-grande h2{font-size:clamp(25px,2.3vw,32px)}
}

/* ── Rejilla y carrusel de producto ──────────────────────────────────
   En móvil los productos van en riel horizontal: apilados hacia abajo
   obligaban a recorrer toda la página para ver tres cosas, y el tercero no
   existía para quien no bajaba. El riel los enseña de un vistazo. */
.riel-prod{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;
  -webkit-overflow-scrolling:touch;padding:2px 20px 6px;margin:26px calc(50% - 50vw) 0;width:100vw}
.riel-prod::-webkit-scrollbar{display:none}
.riel-prod>*{flex:0 0 78%;max-width:300px;scroll-snap-align:center}
.riel-nota{font-size:12px;color:var(--tinta-tenue);margin:10px 0 0;display:flex;align-items:center;gap:6px}
@media(min-width:720px){
  .riel-prod{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;
    overflow:visible;margin:26px 0 0;width:auto;padding:0}
  .riel-prod>*{max-width:none}
  .riel-nota{display:none}
}
.prod{display:flex;flex-direction:column}
/* Las tres fotos son cuadradas y ya traen su propio fondo de estudio, así que
   llenan la baldosa de borde a borde. Antes iban sobre un marco crema con
   relleno: eso anidaba dos fondos —el mío y el de la foto— y el resultado era
   un recuadro sucio alrededor de cada producto. */
.prod .foto{display:block;overflow:hidden;background:var(--crema)}
.prod .foto img{aspect-ratio:1/1;object-fit:cover;width:100%;
  transition:transform .4s ease}
.prod:hover .foto img{transform:scale(1.04)}
.prod .cuerpo{padding:16px;display:flex;flex-direction:column;gap:7px;flex:1}
.prod h3{font-size:16.5px}
.prod h3 a{text-decoration:none}
.prod .kick{font-size:13.5px;color:var(--tinta-suave);margin:0;flex:1}
.prod .precio{display:flex;align-items:baseline;gap:9px;margin:2px 0 8px}
.prod .precio b{font-size:19px}
.prod .precio s{color:var(--tinta-tenue);font-size:13.5px}
.tag{align-self:flex-start;background:var(--verde);color:#fff;font-size:10px;font-weight:700;
  letter-spacing:.07em;text-transform:uppercase;padding:3px 9px;border-radius:5px}

/* franja */
/* La franja en movimiento necesita aire por arriba: pegada a la portada
   parecía parte de ella y las dos cosas se veían apelmazadas. */
.franja{background:var(--tinta);color:#fff;overflow:hidden;padding:12px 0;margin-top:36px}
.pista{display:flex;gap:34px;white-space:nowrap;animation:corre 34s linear infinite;width:max-content}
.pista span{font-size:11.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;opacity:.88}
.pista span::after{content:'✦';margin-left:34px;opacity:.5}
@keyframes corre{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* garantía */
.gar{display:grid;grid-template-columns:1fr;gap:0;border:1px solid var(--linea);
  border-radius:var(--radio);overflow:hidden}
.gar img{width:100%;height:100%;object-fit:cover;background:var(--crema)}
.gar>div{padding:clamp(24px,3.5vw,44px)}
@media(min-width:800px){ .gar{grid-template-columns:1fr 1.15fr;align-items:center} }

/* testimonios */
.testi{margin:0;display:flex;flex-direction:column}
.testi img{aspect-ratio:1/1;object-fit:cover;background:var(--crema)}
.testi figcaption{padding:16px}
.testi .est{color:#E8A13A;font-size:13px;letter-spacing:2px;margin-bottom:7px}
.testi p{font-size:14.5px;line-height:1.6;margin:0 0 10px}
.testi cite{font-style:normal;font-size:13px;font-weight:600;color:var(--tinta-suave)}

/* ficha de producto */
.ficha{display:grid;grid-template-columns:1fr;gap:26px;margin-top:18px}
.ficha .gal{display:grid;gap:9px}
.ficha .gal .pri{border-radius:var(--radio);overflow:hidden;background:var(--crema)}
.ficha .gal .pri img{aspect-ratio:1/1;object-fit:cover;width:100%}
.ficha .mini{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.ficha .mini button{padding:0;border:1.5px solid var(--linea);border-radius:var(--radio-s);
  overflow:hidden;background:var(--crema);cursor:pointer}
.ficha .mini button[aria-current]{border-color:var(--tinta)}
.ficha .mini img{aspect-ratio:1/1;object-fit:cover}
.ficha .precio{display:flex;align-items:baseline;gap:11px;margin:14px 0}
.ficha .precio b{font-size:30px;letter-spacing:-.03em}
.ficha .precio s{color:var(--tinta-tenue)}
.vars{display:grid;gap:9px;margin:0 0 18px}
.var{display:flex;justify-content:space-between;align-items:center;gap:14px;width:100%;
  border:1.5px solid var(--linea);border-radius:var(--radio-s);padding:13px 15px;
  background:#fff;cursor:pointer;font-family:inherit;text-align:left;color:inherit}
.var[aria-pressed="true"]{border-color:var(--tinta);background:var(--crema)}
.var .q{font-weight:700;font-size:15px}
.var .q em{display:block;font-style:normal;font-weight:500;font-size:12px;color:var(--tinta-suave);margin-top:2px}
.var .p{text-align:right;white-space:nowrap}
.var .p b{display:block;font-size:16px}
.var .p s{font-size:12px;color:var(--tinta-tenue)}
.acor{border-top:1px solid var(--linea);margin-top:22px}
.aviso{background:#FDF3E3;border:1px solid #E7D3AE;border-radius:var(--radio-s);
  padding:12px 14px;font-size:13.5px;color:#7A5C24;margin:0 0 16px}
@media(min-width:900px){ .ficha{grid-template-columns:1.05fr .95fr;gap:44px} }

/* listas y formularios */
.lista{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.lista li{display:flex;gap:10px;align-items:flex-start;font-size:15px}
.lista li::before{content:'✓';color:var(--verde);font-weight:700;flex:0 0 auto}
.pasos{display:grid;gap:14px;margin:16px 0 0}
.paso{display:grid;grid-template-columns:auto 1fr;gap:13px;align-items:start}
.paso .n{width:30px;height:30px;border-radius:50%;background:var(--tinta);color:#fff;
  display:grid;place-items:center;font-size:14px;font-weight:700}
.paso b{display:block;font-size:15px;margin-bottom:2px}
.paso p{margin:0;font-size:14.5px;color:var(--tinta-suave)}
.campo{display:block;margin:0 0 14px}
.campo span{display:block;font-size:12.5px;font-weight:600;color:#4A4A4A;margin:0 0 5px}
.campo input,.campo select,.campo textarea{width:100%;padding:12px 14px;border:1.5px solid var(--linea);
  border-radius:var(--radio-s);font-size:16px;font-family:inherit;background:#fff;color:var(--tinta)}
.campo input:focus,.campo select:focus,.campo textarea:focus{outline:none;border-color:var(--tinta)}
.caja{border:1px solid var(--linea);border-radius:var(--radio);padding:clamp(20px,3vw,30px);background:#fff}
.vacio{text-align:center;padding:50px 20px;color:var(--tinta-suave)}
.vacio h2{margin-bottom:10px}
`;

const JS_ADD = `<script>
(function(){
  // El carrito vive en el navegador. La tienda no tiene sesión y el checkout
  // manda el pedido a la misma ruta que las landings, así que guardar el
  // carrito en el servidor no compraría nada y sí costaría una tabla.
  function leer(){ try{ return JSON.parse(localStorage.getItem('dermafol_carrito')||'[]'); }catch(e){ return []; } }
  function guardar(c){ try{ localStorage.setItem('dermafol_carrito', JSON.stringify(c)); }catch(e){}
    var n=c.reduce(function(s,l){return s+(l.cant||0)},0);
    var e=document.querySelector('[data-carrito-n]');
    if(e){ e.textContent=n>9?'9+':String(n); e.hidden=n===0; } }
  window.dfCarrito={leer:leer,guardar:guardar};
  document.addEventListener('click',function(ev){
    var b=ev.target.closest&&ev.target.closest('[data-add]'); if(!b) return;
    var slug=b.dataset.add, qty=Number(b.dataset.qty||1);
    var c=leer(), l=c.find(function(x){return x.slug===slug&&x.qty===qty});
    if(l) l.cant++; else c.push({slug:slug,qty:qty,cant:1});
    guardar(c);
    var t=b.textContent; b.textContent='Añadido ✓'; b.disabled=true;
    setTimeout(function(){ b.textContent=t; b.disabled=false; },1100);
  });
})();
</script>`;

/* ── Páginas ─────────────────────────────────────────────────────────── */

export function home() {
  const cuerpo = `
<section class="hero-wrap"><div class="w">
  <div class="hero">
    <div class="tx">
      <div class="rate"><span class="av"><img src="/assets/testimonios/t04.jpg" alt=""><img src="/assets/testimonios/t06.jpg" alt=""></span>
        <span><b>4.67</b> · +1.450 clientas en Colombia</span></div>
      <h1>Tu cabello no se cae por tu edad. Son tus hormonas.</h1>
      <p class="lede">Trata la causa desde adentro y reactiva el folículo desde afuera.</p>
      <div class="pills"><span class="pill">Menos caída</span><span class="pill">Resultados en 8 semanas</span><span class="pill">Aprobado por dermatólogos</span></div>
      <div class="cta-pc">
        <a class="btn btn-b" href="/p/dermafol-360-v2">Empieza tu protocolo</a>
        <div class="bajo"><span>✓ Envíos a todo Colombia</span><span>✓ Pagas al recibir</span><span>✓ Garantía de 90 días</span></div>
      </div>
    </div>
    <div class="im">
      <img class="mujer" src="/assets/tienda/hero-mujer.jpg" alt="Mujer de perfil con el cabello suelto" width="878" height="1042" fetchpriority="high">
      <figure class="prueba">
        <img src="/assets/testimonios/t06.jpg" alt="Antes y después del cuero cabelludo de una clienta" width="420" height="420" loading="lazy">
        <figcaption>Antes y después · foto de una clienta</figcaption>
      </figure>
    </div>
    <div class="cta-mov">
      <a class="btn btn-b" href="/p/dermafol-360-v2">Empieza tu protocolo</a>
      <div class="bajo"><span>✓ Envíos a todo Colombia</span><span>✓ Pagas al recibir</span><span>✓ Garantía de 90 días</span></div>
    </div>
  </div>
</div></section>

${franja()}

<section class="sec"><div class="w">
  <p class="eyebrow">Por dónde empezar</p>
  <h2>Tres formas de empezar</h2>
  <p class="lede" style="max-width:580px;margin-top:10px">Si no sabes cuál, empieza por el Combo: trae el suplemento y el Roll-On, que es el protocolo completo.</p>
  <div class="riel-prod">${PRODUCTOS.map(tarjetaProducto).join('')}</div>
  <p class="riel-nota">← Desliza para ver los tres</p>
</div></section>

<section class="sec crema"><div class="w">
  <div class="g2" style="align-items:center">
    <img src="/assets/tienda/kit-caja.jpg" alt="Combo Dermafol 360°: caja, suplemento de 60 cápsulas y Roll-On de 25 ml" style="border-radius:var(--radio)" width="1400" height="1400" loading="lazy">
    <div>
      <p class="eyebrow">Dos frentes, un tratamiento</p>
      <h2>El shampoo trabaja sobre el tallo. La caída empieza en el folículo.</h2>
      <p class="lede" style="margin:14px 0 22px">El folículo está milímetros por debajo de la piel. Ahí no llega nada de lo que te pones encima y se enjuaga. Por eso el protocolo son dos cosas a la vez.</p>
      <div class="dos">
        <div><b>Desde adentro</b><p>Saw Palmetto, Zinc y Vitamina D3 regulan la causa hormonal que miniaturiza el folículo con cada ciclo.</p></div>
        <div><b>Desde afuera</b><p>Minoxidil 2%, la concentración estudiada para mujeres, reactiva el folículo donde dejó de crecer.</p></div>
      </div>
      <a class="btn" style="margin-top:24px" href="/catalogo">Ver los productos</a>
    </div>
  </div>
</div></section>

${bloqueTestimonios()}
${bloqueGarantia()}
${bloqueFaq(FAQ.slice(0, 5), 'Lo que necesitas saber antes de empezar')}

<section class="sec crema"><div class="w">
  <p class="eyebrow">Fotos que nos enviaron ellas</p>
  <h2>Veinte clientas, veinte historias</h2>
  <p class="lede" style="max-width:600px;margin-top:10px">Nos las mandaron por WhatsApp y nos autorizaron a publicarlas. Sin retoques y sin modelos.</p>
  <div class="muro">${Array.from({ length: 12 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return `<img src="/assets/testimonios/t${n}.jpg" alt="Foto enviada por una clienta" width="420" height="420" loading="lazy">`;
  }).join('')}</div>
  <p class="nota">Resultados de clientas reales. Pueden variar de una persona a otra.</p>
  <a class="btn" style="margin-top:18px" href="/p/dermafol-360-v2">Empezar mi protocolo</a>
</div></section>`;
  return documento({
    titulo: 'Dermafol · Cuidado capilar con respaldo clínico',
    descripcion: 'Trata la causa hormonal de la caída del cabello desde adentro y reactiva el folículo desde afuera. Envío gratis y pago contra entrega en Colombia.',
    ruta: '/', cuerpo, extraCss: CSS, extraJs: JS_ADD,
  });
}

export function catalogo() {
  const cuerpo = `
<section style="padding-top:18px"><div class="w">
  <div class="hero" style="grid-template-columns:1fr">
    <div class="tx" style="max-width:640px">
      <div class="rate"><span style="color:#E8A13A;letter-spacing:2px">★★★★★</span><span><b>4.67</b> · Recomendado por dermatólogas</span></div>
      <h1 style="font-size:clamp(26px,3.6vw,38px)">Soluciones con respaldo clínico</h1>
      <p class="lede">para la caída capilar hormonal en mujeres de 30 en adelante.</p>
      <div class="pills" style="margin-top:16px"><span class="pill">Menos caída</span><span class="pill">Regulación hormonal</span><span class="pill">Formulación clínica</span></div>
    </div>
  </div>
</div></section>

<section class="sec" style="padding-top:26px"><div class="w">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:20px">
    <label class="campo" style="margin:0;min-width:190px"><span>Ordenar por</span>
      <select id="orden"><option value="destacado">Destacados</option>
        <option value="precio-asc">Precio: menor a mayor</option>
        <option value="precio-desc">Precio: mayor a menor</option>
        <option value="nombre">Nombre</option></select></label>
    <span style="font-size:13.5px;color:var(--tinta-suave)">${PRODUCTOS.length} productos</span>
  </div>
  <div class="riel-prod" id="rejilla">${PRODUCTOS.map(tarjetaProducto).join('')}</div>
</div></section>

${franja()}
${bloqueGarantia()}
${bloqueFaq(FAQ.slice(0, 5))}`;
  const js = JS_ADD + `<script>
(function(){
  var sel=document.getElementById('orden'), rej=document.getElementById('rejilla');
  if(!sel||!rej) return;
  var orig=[].slice.call(rej.children);
  var precio=function(el){ var b=el.querySelector('.precio b'); return Number((b?b.textContent:'').replace(/[^0-9]/g,''))||0; };
  var nombre=function(el){ var h=el.querySelector('h3'); return h?h.textContent.trim():''; };
  sel.addEventListener('change',function(){
    var v=sel.value, l=orig.slice();
    if(v==='precio-asc') l.sort(function(a,b){return precio(a)-precio(b)});
    if(v==='precio-desc') l.sort(function(a,b){return precio(b)-precio(a)});
    if(v==='nombre') l.sort(function(a,b){return nombre(a).localeCompare(nombre(b),'es')});
    l.forEach(function(x){ rej.appendChild(x); });
  });
})();
</script>`;
  return documento({
    titulo: 'Catálogo · Dermafol',
    descripcion: 'Todos los productos Dermafol: Combo 360°, Suplemento Capilar y Roll-On Dermoestimulante. Envío gratis y pago contra entrega.',
    ruta: '/catalogo', cuerpo, extraCss: CSS, extraJs: js,
  });
}


export function producto(slug) {
  const p = productoPorSlug(slug);
  if (!p || p.enlace) return null;   // el kit vive en su landing, no aquí
  const multi = p.variantes.length > 1;
  const cuerpo = `
<section class="sec" style="padding-bottom:0"><div class="w">
  <nav style="font-size:12.5px;color:var(--tinta-tenue);margin-bottom:6px">
    <a href="/" style="text-decoration:none">Inicio</a> · <a href="/catalogo" style="text-decoration:none">Catálogo</a> · ${esc(p.nombre)}</nav>
  <div class="ficha">
    <div class="gal">
      <div class="pri"><img id="foto" src="${p.galeria[0]}" alt="${esc(p.nombre)}" width="900" height="900"></div>
      ${p.galeria.length > 1 ? `<div class="mini">${p.galeria.map((g, i) =>
        `<button type="button" data-foto="${g}"${i === 0 ? ' aria-current="true"' : ''}><img src="${g}" alt="" width="200" height="200" loading="lazy"></button>`).join('')}</div>` : ''}
    </div>
    <div>
      <div class="rate"><span style="color:#E8A13A;letter-spacing:2px">★★★★★</span><span><b>4.67</b> · +1.450 clientas</span></div>
      <h1 style="font-size:clamp(25px,3.2vw,34px);margin:10px 0 8px">${esc(p.nombre)}</h1>
      <p class="lede" style="margin-bottom:0">${esc(p.tagline)}</p>
      <div class="precio"><b id="pv">${pesos(p.precio)}</b>${p.antes ? `<s id="pa">${pesos(p.antes)}</s>` : ''}</div>
      <p style="font-size:13px;color:var(--verde);font-weight:600;margin:-6px 0 16px">● En stock · Envío gratis · Entrega en 2 a 4 días hábiles</p>
      ${p.aviso ? `<p class="aviso">${esc(p.aviso)}</p>` : ''}
      ${multi ? `<div class="vars">${p.variantes.map((v, i) => `<button class="var" type="button" data-var="${i}" data-qty="${v.qty}" data-precio="${v.precio}" data-antes="${v.antes}" aria-pressed="${i === 0}">
        <span class="q">${esc(v.etiqueta)}${v.nota ? `<em>${esc(v.nota)}</em>` : ''}</span>
        <span class="p"><b>${pesos(v.precio)}</b>${v.antes ? `<s>${pesos(v.antes)}</s>` : ''}</span></button>`).join('')}</div>` : ''}
      <button class="btn btn-b" type="button" data-add="${p.slug}" data-qty="${p.variantes[0].qty}" id="añadir">Añadir al carrito</button>
      <a class="btn btn-b btn-2" style="margin-top:9px" href="/checkout">Comprar ahora</a>
      <p style="font-size:12.5px;color:var(--tinta-suave);text-align:center;margin:12px 0 0">Pagas en efectivo cuando lo recibas · Garantía de 90 días</p>
      <div class="acor">
        <details class="qa" open><summary>Qué incluye</summary><ul class="lista" style="margin-top:11px">${
          p.contiene.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></details>
        <details class="qa"><summary>Modo de uso</summary><div class="pasos">${
          p.modoUso.map(([t, d], i) => `<div class="paso"><span class="n">${i + 1}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></div>`).join('')}</div></details>
        <details class="qa"><summary>Ingredientes activos</summary><p>${p.activos.map(esc).join(' · ')}</p>
          <p style="font-size:13px">La tabla nutricional completa y el registro sanitario: ${oPend(EMPRESA.invima, 'registro INVIMA por confirmar')}.</p></details>
        <details class="qa"><summary>Envíos y devoluciones</summary>
          <p>Envío gratis a toda Colombia, de 2 a 4 días hábiles a ciudades principales. Pagas en efectivo al recibir.</p>
          <p>Garantía de 90 días: si no notas cambios en la caída, te devolvemos el 100%. <a href="/politicas/devoluciones">Ver política completa</a>.</p></details>
      </div>
    </div>
  </div>
</div></section>

${franja()}
${bloqueTestimonios()}
${bloqueFaq(FAQ.slice(0, 6))}`;
  const js = JS_ADD + `<script>
(function(){
  var foto=document.getElementById('foto');
  document.addEventListener('click',function(e){
    var m=e.target.closest&&e.target.closest('[data-foto]');
    if(m&&foto){ foto.src=m.dataset.foto;
      document.querySelectorAll('[data-foto]').forEach(function(x){ x.removeAttribute('aria-current'); });
      m.setAttribute('aria-current','true'); return; }
    var v=e.target.closest&&e.target.closest('[data-var]');
    if(v){ document.querySelectorAll('[data-var]').forEach(function(x){ x.setAttribute('aria-pressed','false'); });
      v.setAttribute('aria-pressed','true');
      var pv=document.getElementById('pv'), pa=document.getElementById('pa'), add=document.getElementById('añadir');
      var n=function(x){ return '$'+Number(x).toLocaleString('es-CO'); };
      if(pv) pv.textContent=n(v.dataset.precio);
      if(pa) pa.textContent=Number(v.dataset.antes)?n(v.dataset.antes):'';
      if(add) add.dataset.qty=v.dataset.qty; }
  });
})();
</script>`;
  return documento({
    titulo: `${p.nombre} · Dermafol`,
    descripcion: p.resumen, ruta: '/catalogo', cuerpo, extraCss: CSS, extraJs: js,
  });
}

export function combos() {
  const cuerpo = `${encabezado('Combos', 'Cuánto tiempo le vas a dar',
    'Por separado, el suplemento cuesta $120.000 y el Roll-On $80.000: $200.000 al mes. Juntos cuestan menos, y entre más meses, menos pagas por mes.')}
<section class="sec"><div class="w">
  <div class="g4">${COMBOS.map((c) => `<div class="card" style="padding:20px;display:flex;flex-direction:column;gap:6px">
    ${c.nota ? `<span class="tag">${esc(c.nota)}</span>` : '<span style="height:19px"></span>'}
    <h3>${esc(c.etiqueta)}</h3>
    <div style="font-size:12.5px;color:var(--tinta-suave)">${c.qty} ${c.qty === 1 ? 'combo' : 'combos'} · ${pesos(c.porMes)}/mes</div>
    <div class="precio" style="margin:8px 0 0"><b style="font-size:22px">${pesos(c.precio)}</b></div>
    <s style="color:var(--tinta-tenue);font-size:13px">${pesos(c.antes)}</s>
    <div style="font-size:13px;color:var(--verde);font-weight:700">Ahorras ${pesos(c.ahorro)}</div>
    <button class="btn btn-b btn-s" style="margin-top:auto" type="button" data-add="combo-dermafol-360" data-qty="${c.qty}">Añadir al carrito</button>
  </div>`).join('')}</div>
  <p class="nota">Cada combo trae el suplemento de 60 cápsulas y el Roll-On de 25 ml por cada mes de tratamiento.</p>
</div></section>
${bloqueGarantia()}
${bloqueFaq(FAQ.slice(0, 4))}`;
  return documento({ titulo: 'Combos y ahorro · Dermafol',
    descripcion: 'Combos de 1, 2, 3 y 6 meses del protocolo Dermafol 360°. Cuánto trae cada uno y cuánto ahorras.',
    ruta: '/combos', cuerpo, extraCss: CSS, extraJs: JS_ADD });
}

export function suscripciones() {
  const cuerpo = `${encabezado('Suscripciones', 'Recíbelo cada mes, sin acordarte',
    'El ciclo capilar no se negocia: la constancia es la mitad del resultado. La suscripción existe para que no dependa de que te acuerdes de volver a pedir.')}
<section class="sec"><div class="w">
  <div class="g2">
    <div class="caja">
      <h3>Cómo funciona</h3>
      <div class="pasos">
        <div class="paso"><span class="n">1</span><div><b>Eliges la frecuencia</b><p>Cada 30, 60 o 90 días. La de 30 días es la que corresponde a un frasco.</p></div></div>
        <div class="paso"><span class="n">2</span><div><b>Te llega solo</b><p>Te avisamos por WhatsApp tres días antes de cada envío, por si quieres mover la fecha.</p></div></div>
        <div class="paso"><span class="n">3</span><div><b>Pagas al recibir</b><p>Igual que una compra normal: en efectivo, cuando el domiciliario te lo entrega.</p></div></div>
      </div>
    </div>
    <div class="caja">
      <h3>Condiciones</h3>
      <ul class="lista" style="margin-top:14px">
        <li>Sin permanencia: cancelas cuando quieras</li>
        <li>Modificas la frecuencia o la dirección desde <a href="/cuenta">Mi cuenta</a></li>
        <li>La garantía de 90 días aplica igual</li>
        <li>Si pausas, no pierdes el precio que tenías</li>
      </ul>
      <p style="margin-top:18px;font-size:14.5px;color:var(--tinta-suave)">El precio de suscripción y el descuento frente a la compra suelta: ${pend('por definir')}.</p>
      <a class="btn btn-b" style="margin-top:14px" href="/contacto">Quiero suscribirme</a>
      <p class="nota" style="text-align:center">Por ahora la suscripción se activa por WhatsApp. El alta automática desde la web llega pronto.</p>
    </div>
  </div>
</div></section>
${bloqueFaq([
  ['¿Puedo cancelar cuando quiera?', 'Sí. No hay permanencia ni penalización. Cancelas desde Mi cuenta o escribiéndonos por WhatsApp.'],
  ['¿Cómo cambio la fecha de envío?', 'Te avisamos tres días antes de cada despacho. Respondiendo a ese mensaje puedes moverla o saltarte el mes.'],
  ['¿El precio cambia con el tiempo?', 'No mientras la suscripción siga activa. Si la cancelas y vuelves más adelante, aplica el precio vigente.'],
], 'Sobre las suscripciones')}`;
  return documento({ titulo: 'Suscripciones · Dermafol',
    descripcion: 'Recibe tu tratamiento Dermafol cada mes sin tener que volver a pedirlo. Sin permanencia y pagando al recibir.',
    ruta: '/suscripciones', cuerpo, extraCss: CSS });
}

export function nosotros() {
  const cuerpo = `${encabezado('Nosotros', 'Cuidado capilar con respaldo, no con promesas',
    'Dermafol nació para tratar la caída capilar femenina por sus dos vías reales: la hormonal y la del folículo.')}
<section class="sec"><div class="w">
  <div class="g2" style="align-items:center">
    <img src="/assets/tienda/mujer-producto.jpg" alt="Clienta con el suplemento Dermafol" style="border-radius:var(--radio)" width="1000" height="1000" loading="lazy">
    <div>
      <h2>Nuestra historia</h2>
      <p class="lede">${pend('Texto de la historia de la marca pendiente de entrega')}</p>
      <h3 style="margin-top:26px">Nuestro propósito</h3>
      <p>${pend('Texto del propósito pendiente')}</p>
    </div>
  </div>
</div></section>
<section class="sec crema"><div class="w">
  <h2>Datos de la empresa</h2>
  <div class="g2" style="margin-top:20px">
    <div class="caja"><ul class="lista" style="gap:13px">
      <li><span><b>Razón social:</b> ${oPend(EMPRESA.razonSocial)}</span></li>
      <li><span><b>NIT:</b> ${oPend(EMPRESA.nit)}</span></li>
      <li><span><b>Dirección:</b> ${oPend(EMPRESA.direccion)}</span></li>
      <li><span><b>Ciudad:</b> ${esc(EMPRESA.ciudad)}</span></li>
      <li><span><b>Registro sanitario:</b> ${oPend(EMPRESA.invima, 'INVIMA por confirmar')}</span></li>
    </ul></div>
    <div class="caja">
      <h3>El equipo</h3>
      <p style="margin-top:10px">${pend('Integrantes y roles pendientes')}</p>
      <h3 style="margin-top:20px">Respaldo profesional</h3>
      <p>Carolina Monsalve · Dermatóloga, tricología femenina.</p>
      <p style="font-size:14.5px;color:var(--tinta-suave)">“La caída femenina después de los 35 casi siempre tiene un componente hormonal que los tópicos solos no resuelven.”</p>
    </div>
  </div>
  <p class="nota">Dermafol es una marca de VERA &amp; CO.</p>
</div></section>`;
  return documento({ titulo: 'Nosotros · Dermafol',
    descripcion: 'Quiénes están detrás de Dermafol, cuál es el propósito de la marca y los datos verificables de la empresa.',
    ruta: '/nosotros', cuerpo, extraCss: CSS });
}

export function guias() {
  // Lo que ya está escrito va arriba y en grande; los borradores, debajo en la
  // rejilla. Mezclarlos al mismo tamaño hacía que el único artículo terminado
  // pareciera uno más de una lista de títulos sin cuerpo.
  const destacadas = GUIAS.filter((g) => g.destacada);
  const resto = GUIAS.filter((g) => !g.destacada);

  const tarjeta = (g) => `<a class="card guia" href="${g.enlace || `/guias/${g.slug}`}" style="text-decoration:none">
  <img src="${g.imagen}" alt="" width="700" height="500" loading="lazy" style="aspect-ratio:7/5;object-fit:cover">
  <div style="padding:17px">
    ${g.enlace ? '<span class="etiqueta">Artículo completo</span>' : ''}
    <h3 style="font-size:17px">${esc(g.titulo)}</h3>
    <p style="font-size:14px;color:var(--tinta-suave);margin:8px 0 0">${esc(g.resumen)}</p>
    <span style="font-size:12px;color:var(--tinta-tenue);display:block;margin-top:10px">${g.minutos} min de lectura</span></div></a>`;

  const grande = (g) => `<a class="guia-grande" href="${g.enlace || `/guias/${g.slug}`}">
  <div class="im"><img src="${g.imagen}" alt="" width="1100" height="800" fetchpriority="high"></div>
  <div class="tx">
    <span class="etiqueta">Artículo completo</span>
    <h2>${esc(g.titulo)}</h2>
    <p>${esc(g.resumen)}</p>
    <span class="meta">${g.minutos} min de lectura · Leer el artículo →</span>
  </div></a>`;

  const cuerpo = `${encabezado('Guías', 'Entender la caída es el primer paso',
    'Contenido educativo sobre caída capilar femenina. Sin promesas y con las fuentes a la vista cuando las hay.')}
${destacadas.length ? `<section class="sec" style="padding-bottom:0"><div class="w">${destacadas.map(grande).join('')}</div></section>` : ''}
${resto.length ? `<section class="sec"><div class="w"><div class="g3">${resto.map(tarjeta).join('')}</div></div></section>` : ''}`;
  return documento({ titulo: 'Guías · Dermafol',
    descripcion: 'Guías sobre caída capilar femenina: causas hormonales, ciclo del folículo y qué esperar de un tratamiento.',
    ruta: '/guias', cuerpo, extraCss: CSS });
}

export function guia(slug) {
  const g = guiaPorSlug(slug);
  if (!g) return null;
  const cuerpo = `
<article class="sec"><div class="w-s">
  <nav style="font-size:12.5px;color:var(--tinta-tenue);margin-bottom:12px"><a href="/guias" style="text-decoration:none">Guías</a> · ${g.minutos} min</nav>
  <h1>${esc(g.titulo)}</h1>
  <p class="lede" style="margin-top:14px">${esc(g.resumen)}</p>
  <img src="${g.imagen}" alt="" style="border-radius:var(--radio);margin:22px 0" width="1000" height="700">
  <p>${pend('Cuerpo del artículo pendiente de redacción')}</p>
  <p style="font-size:13.5px;color:var(--tinta-suave);border-top:1px solid var(--linea);padding-top:16px;margin-top:26px">
    Este contenido es informativo y no reemplaza una consulta médica. Autoría y fuentes: ${pend('por definir')}.</p>
  <a class="btn" style="margin-top:18px" href="/catalogo">Ver los productos</a>
</div></article>`;
  return documento({ titulo: `${g.titulo} · Dermafol`, descripcion: g.resumen,
    ruta: '/guias', cuerpo, extraCss: CSS });
}

export function preguntas() {
  const cuerpo = `${encabezado('Ayuda', 'Preguntas frecuentes',
    'Dudas sobre los productos, la compra, los pagos, los envíos y las devoluciones.')}
${bloqueFaq(FAQ, 'Sobre el tratamiento')}
<section class="sec crema"><div class="w-s">
  <h2>Compras, pagos y envíos</h2>
  <div style="margin-top:22px">
    <details class="qa"><summary>¿Cómo pago?</summary><p>En efectivo al domiciliario, cuando recibes el pedido. No pedimos tarjeta ni transferencia.</p></details>
    <details class="qa"><summary>¿Cuánto cuesta el envío?</summary><p>Nada. El envío es gratis a toda Colombia.</p></details>
    <details class="qa"><summary>¿Cuánto tarda en llegar?</summary><p>De 2 a 4 días hábiles a ciudades principales. A poblaciones alejadas puede tomar algunos días más.</p></details>
    <details class="qa"><summary>¿Puedo devolverlo?</summary><p>Sí, tienes 90 días de garantía. <a href="/politicas/devoluciones">Ver la política completa</a>.</p></details>
    <details class="qa"><summary>¿Cómo sigo mi pedido?</summary><p>Con tu número de pedido en <a href="/seguimiento">Seguimiento</a>, o escribiéndonos por WhatsApp.</p></details>
  </div>
  <p style="margin-top:26px">¿No está tu duda? <a href="/contacto">Escríbenos</a>.</p>
</div></section>`;
  return documento({ titulo: 'Preguntas frecuentes · Dermafol',
    descripcion: 'Respuestas sobre el tratamiento Dermafol, formas de pago, envíos, entregas y devoluciones.',
    ruta: '/preguntas-frecuentes', cuerpo, extraCss: CSS });
}

export function contacto() {
  const cuerpo = `${encabezado('Ayuda', 'Contacto y ayuda', 'Escríbenos y te respondemos en horario laboral.')}
<section class="sec" style="padding-top:26px"><div class="w"><div class="g2">
  <div class="caja">
    <h3>Canales</h3>
    <ul class="lista" style="margin-top:14px;gap:13px">
      <li><span><b>WhatsApp:</b> ${oPend(EMPRESA.whatsapp, 'número por confirmar')}</span></li>
      <li><span><b>Correo:</b> ${oPend(EMPRESA.correo, 'correo por confirmar')}</span></li>
      <li><span><b>Horario:</b> ${esc(EMPRESA.horario)}</span></li>
    </ul>
    <p style="margin-top:20px;font-size:14.5px;color:var(--tinta-suave)">Para seguir un pedido que ya hiciste, es más rápido por <a href="/seguimiento">Seguimiento</a>.</p>
  </div>
  <div class="caja">
    <h3>Formulario de PQRS</h3>
    <p style="font-size:14px;color:var(--tinta-suave);margin:8px 0 16px">Peticiones, quejas, reclamos y sugerencias.</p>
    <form data-pqrs>
      <label class="campo"><span>Nombre completo</span><input name="nombre" required autocomplete="name"></label>
      <label class="campo"><span>Correo o WhatsApp</span><input name="contacto" required></label>
      <label class="campo"><span>Tipo</span><select name="tipo">
        <option>Petición</option><option>Queja</option><option>Reclamo</option><option>Sugerencia</option></select></label>
      <label class="campo"><span>Cuéntanos</span><textarea name="mensaje" rows="4" required></textarea></label>
      <button class="btn btn-b" type="submit">Enviar</button>
      <p class="nota" data-pqrs-aviso hidden></p>
    </form>
  </div>
</div></div></section>`;
  const js = `<script>
(function(){
  var f=document.querySelector('[data-pqrs]'); if(!f) return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var a=f.querySelector('[data-pqrs-aviso]');
    // El envío todavía no tiene destino: falta el correo de la empresa. Antes
    // de tenerlo, decirlo es mejor que fingir que se mandó.
    a.hidden=false;
    a.textContent='El formulario todavía no está conectado a un buzón. Mientras tanto, escríbenos por WhatsApp y te respondemos igual.';
  });
})();
</script>`;
  return documento({ titulo: 'Contacto y ayuda · Dermafol',
    descripcion: 'WhatsApp, correo, horarios de atención y formulario de PQRS de Dermafol.',
    ruta: '/contacto', cuerpo, extraCss: CSS, extraJs: js });
}

export function seguimiento() {
  const cuerpo = `${encabezado('Pedidos', 'Seguimiento de tu pedido',
    'Escribe el número que te dimos al confirmar la compra. Empieza por DS-.')}
<section class="sec" style="padding-top:26px"><div class="w-s">
  <div class="caja">
    <form data-seg>
      <label class="campo"><span>Número de pedido</span>
        <input name="code" placeholder="DS-XXXX" required autocomplete="off" spellcheck="false"></label>
      <button class="btn btn-b" type="submit">Consultar</button>
    </form>
    <div data-seg-r style="margin-top:20px"></div>
  </div>
  <p class="nota">¿No encuentras tu número? Escríbenos por <a href="/contacto">WhatsApp</a> con el nombre y el teléfono del pedido.</p>
</div></section>`;
  const js = `<script>
(function(){
  var f=document.querySelector('[data-seg]'), r=document.querySelector('[data-seg-r]');
  if(!f) return;
  f.addEventListener('submit',async function(e){
    e.preventDefault();
    var code=(f.code.value||'').trim().toUpperCase();
    if(!code) return;
    r.innerHTML='<p style="color:#6D6D6D">Consultando…</p>';
    try{
      var res=await fetch('/api/seguimiento/'+encodeURIComponent(code));
      var d=await res.json();
      if(!res.ok||!d.encontrado){
        r.innerHTML='<p>No encontramos ese pedido. Revisa el número o escríbenos por WhatsApp.</p>'; return;
      }
      r.innerHTML='<div style="border:1px solid var(--linea);border-radius:12px;padding:16px">'
        +'<div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9A9A9A">Pedido '+d.code+'</div>'
        +'<div style="font-size:20px;font-weight:700;margin:6px 0 4px">'+d.estado+'</div>'
        +'<p style="margin:0;font-size:14px;color:#6D6D6D">'+d.detalle+'</p>'
        +(d.guia?('<p style="margin:10px 0 0;font-size:14px">Guía: <b>'+d.guia+'</b>'+(d.transportadora?(' · '+d.transportadora):'')+'</p>'):'')
        +'</div>';
    }catch(err){ r.innerHTML='<p>No pudimos consultar ahora. Intenta en un momento.</p>'; }
  });
})();
</script>`;
  return documento({ titulo: 'Seguimiento de pedidos · Dermafol',
    descripcion: 'Consulta el estado de tu pedido Dermafol con tu número de orden.',
    ruta: '/seguimiento', cuerpo, extraCss: CSS, extraJs: js, noindex: true });
}

export function cuenta() {
  const cuerpo = `${encabezado('Mi cuenta', 'Tu cuenta', 'Tus pedidos, tus direcciones y tus suscripciones.')}
<section class="sec" style="padding-top:26px"><div class="w-s">
  <div class="caja" style="text-align:center">
    <h3>Todavía no hay cuentas</h3>
    <p class="lede" style="margin-top:10px">Compras sin registrarte y pagas al recibir, así que no hace falta crear una cuenta para pedir.</p>
    <p>Para consultar un pedido usa <a href="/seguimiento">Seguimiento</a>. Para cambiar una dirección o una suscripción, escríbenos por <a href="/contacto">WhatsApp</a> y lo hacemos nosotros.</p>
    <a class="btn" style="margin-top:12px" href="/seguimiento">Seguir mi pedido</a>
  </div>
  <p class="nota">El área de cuenta con historial y gestión de suscripciones está en construcción.</p>
</div></section>`;
  return documento({ titulo: 'Mi cuenta · Dermafol', descripcion: 'Accede a tus pedidos y suscripciones Dermafol.',
    ruta: '/cuenta', cuerpo, extraCss: CSS, noindex: true });
}

export function carrito() {
  const cuerpo = `${encabezado('Carrito', 'Tu carrito', '')}
<section class="sec" style="padding-top:20px"><div class="w">
  <div id="carrito-vacio" class="vacio" hidden>
    <h2>Tu carrito está vacío</h2>
    <p class="lede">Empieza por el Combo 360°, que trae el tratamiento completo.</p>
    <a class="btn" href="/catalogo">Ver productos</a>
  </div>
  <div id="carrito-lleno" hidden>
    <div class="g2" style="align-items:start;gap:30px">
      <div id="lineas"></div>
      <aside class="caja">
        <h3>Resumen</h3>
        <div id="resumen" style="margin:14px 0"></div>
        <a class="btn btn-b" href="/checkout">Ir al checkout</a>
        <p class="nota" style="text-align:center">Pagas en efectivo al recibir · Envío gratis</p>
      </aside>
    </div>
  </div>
</div></section>`;
  return documento({ titulo: 'Carrito · Dermafol', descripcion: 'Revisa tu carrito antes de finalizar la compra.',
    ruta: '/carrito', cuerpo, extraCss: CSS, extraJs: JS_ADD + JS_CARRITO, noindex: true });
}


/** El carrito y el checkout se pintan en el cliente: son de cada visitante. */
const JS_CARRITO = `<script>
(function(){
  var CAT=${JSON.stringify(PRODUCTOS.map((p) => ({ slug: p.slug, nombre: p.nombre, imagen: p.imagen,
    variantes: p.variantes.map((v) => ({ qty: v.qty, etiqueta: v.etiqueta, precio: v.precio })) })))};
  function buscar(slug,qty){ var p=CAT.find(function(x){return x.slug===slug}); if(!p) return null;
    var v=p.variantes.find(function(x){return x.qty===qty})||p.variantes[0];
    return {nombre:p.nombre, imagen:p.imagen, etiqueta:v.etiqueta, precio:v.precio, slug:slug, qty:qty}; }
  var pesos=function(n){ return '$'+Number(n||0).toLocaleString('es-CO'); };
  function pintar(){
    var c=(window.dfCarrito?window.dfCarrito.leer():[]).filter(function(l){ return buscar(l.slug,l.qty); });
    var vac=document.getElementById('carrito-vacio'), lle=document.getElementById('carrito-lleno');
    if(!vac||!lle) return;
    if(!c.length){ vac.hidden=false; lle.hidden=true; return; }
    vac.hidden=true; lle.hidden=false;
    var total=0, html='';
    c.forEach(function(l,i){
      var d=buscar(l.slug,l.qty); var sub=d.precio*l.cant; total+=sub;
      html+='<div class="card" style="display:grid;grid-template-columns:84px 1fr auto;gap:13px;padding:13px;margin-bottom:11px;align-items:center">'
        +'<img src="'+d.imagen+'" alt="" width="84" height="84" style="border-radius:9px;aspect-ratio:1;object-fit:cover">'
        +'<div><b style="font-size:15px">'+d.nombre+'</b>'
        +'<div style="font-size:13px;color:#6D6D6D">'+d.etiqueta+'</div>'
        +'<div style="display:flex;align-items:center;gap:9px;margin-top:7px">'
        +'<button class="btn btn-2 btn-s" style="padding:4px 11px" data-menos="'+i+'" aria-label="Quitar uno">−</button>'
        +'<span style="min-width:18px;text-align:center;font-weight:700">'+l.cant+'</span>'
        +'<button class="btn btn-2 btn-s" style="padding:4px 11px" data-mas="'+i+'" aria-label="Añadir uno">+</button></div></div>'
        +'<div style="text-align:right"><b>'+pesos(sub)+'</b>'
        +'<button class="btn btn-2 btn-s" style="display:block;margin-top:8px;padding:4px 11px;font-size:12px" data-quitar="'+i+'">Quitar</button></div></div>';
    });
    document.getElementById('lineas').innerHTML=html;
    var r=document.getElementById('resumen');
    if(r) r.innerHTML='<div style="display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:7px"><span>Productos</span><b>'+pesos(total)+'</b></div>'
      +'<div style="display:flex;justify-content:space-between;font-size:14.5px;margin-bottom:7px"><span>Envío</span><b style="color:#3F7D58">Gratis</b></div>'
      +'<div style="display:flex;justify-content:space-between;border-top:1px solid #E8E4E2;padding-top:10px;margin-top:10px;font-size:18px"><span><b>Total</b></span><b>'+pesos(total)+'</b></div>';
    window.dfTotal=total; window.dfLineas=c;
  }
  document.addEventListener('click',function(e){
    if(!e.target.closest) return;
    var c=window.dfCarrito.leer(), h=false;
    var m=e.target.closest('[data-mas]'); if(m){ c[+m.dataset.mas].cant++; h=true; }
    var n=e.target.closest('[data-menos]'); if(n){ var i=+n.dataset.menos; c[i].cant--; if(c[i].cant<1) c.splice(i,1); h=true; }
    var q=e.target.closest('[data-quitar]'); if(q){ c.splice(+q.dataset.quitar,1); h=true; }
    if(h){ window.dfCarrito.guardar(c); pintar(); }
  });
  pintar();
  window.dfPintarCarrito=pintar;
})();
</script>`;

export function checkout() {
  const cuerpo = `${encabezado('Checkout', 'Finaliza tu pedido', '')}
<section class="sec" style="padding-top:20px"><div class="w">
  <div id="co-vacio" class="vacio" hidden>
    <h2>No hay nada que pagar todavía</h2>
    <a class="btn" href="/catalogo">Ver productos</a>
  </div>
  <form id="co" class="g2" style="align-items:start;gap:30px" hidden novalidate>
    <div class="caja">
      <h3>Tus datos de entrega</h3>
      <div style="margin-top:16px">
        <label class="campo"><span>Nombre y apellido</span><input name="customer_name" autocomplete="name" placeholder="Tu nombre completo"></label>
        <label class="campo"><span>Celular / WhatsApp</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ej: 300 000 0000">
          <small style="display:block;font-size:11.5px;color:var(--arcilla);margin-top:5px">A este WhatsApp te llega el mensaje de confirmación. Confírmalo para que podamos despachar.</small></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <label class="campo"><span>Departamento</span><select name="department" data-ds-dept><option value="">Elige…</option></select></label>
          <label class="campo"><span>Ciudad</span><select name="city" data-ds-city disabled><option value="">Primero el departamento</option></select></label>
        </div>
        <label class="campo"><span>Dirección de entrega</span><input name="address" autocomplete="street-address" placeholder="Calle, número, barrio"></label>
        <label class="campo"><span>Indicaciones para el domiciliario <em style="font-weight:400;color:var(--tinta-tenue)">(opcional)</em></span><input name="notes" placeholder="Torre, apartamento, punto de referencia"></label>
        <label style="display:flex;gap:10px;align-items:flex-start;background:var(--crema);border:1.5px solid var(--linea);border-radius:var(--radio-s);padding:12px 14px;cursor:pointer;font-size:14px">
          <input type="checkbox" name="compromiso" style="width:18px;height:18px;margin:2px 0 0;flex:0 0 auto">
          <span>Me comprometo a recibir mi pedido cuando llegue a mi dirección.</span></label>
        <p class="nota" data-error style="color:#C0392B" hidden></p>
      </div>
    </div>
    <aside class="caja">
      <h3>Tu pedido</h3>
      <div id="co-lineas" style="margin:14px 0"></div>
      <div id="co-total"></div>
      <button class="btn btn-b" type="submit" style="margin-top:14px">Pedir contra entrega</button>
      <p class="nota" style="text-align:center">No pagas nada ahora · Envío gratis · Garantía de 90 días</p>
    </aside>
  </form>
  <div id="co-ok" class="vacio" hidden></div>
</div></section>`;
  return documento({ titulo: 'Checkout · Dermafol', descripcion: 'Finaliza tu pedido Dermafol. Pago contra entrega.',
    ruta: '/checkout', cuerpo, extraCss: CSS,
    // JS_ADD primero: es donde vive `window.dfCarrito`, del que dependen los
    // otros dos. Sin él el checkout leía el carrito vacío y se escondía entero
    // con productos dentro.
    extraJs: JS_ADD + JS_CARRITO + JS_CHECKOUT, noindex: true });
}

const JS_CHECKOUT = `<script>
(function(){
  var f=document.getElementById('co'), vac=document.getElementById('co-vacio'), ok=document.getElementById('co-ok');
  if(!f) return;
  var CAT=${JSON.stringify(PRODUCTOS.map((p) => ({ slug: p.slug, nombre: p.nombre,
    variantes: p.variantes.map((v) => ({ qty: v.qty, etiqueta: v.etiqueta, precio: v.precio })) })))};
  var pesos=function(n){ return '$'+Number(n||0).toLocaleString('es-CO'); };
  function lineas(){ return (window.dfCarrito?window.dfCarrito.leer():[]).map(function(l){
      var p=CAT.find(function(x){return x.slug===l.slug}); if(!p) return null;
      var v=p.variantes.find(function(x){return x.qty===l.qty})||p.variantes[0];
      return {slug:l.slug,qty:l.qty,cant:l.cant,nombre:p.nombre,etiqueta:v.etiqueta,precio:v.precio};
    }).filter(Boolean); }
  function pintar(){
    var ls=lineas();
    if(!ls.length){ vac.hidden=false; f.hidden=true; return; }
    vac.hidden=true; f.hidden=false;
    var total=0, h='';
    ls.forEach(function(l){ var s=l.precio*l.cant; total+=s;
      h+='<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px;margin-bottom:8px">'
        +'<span>'+l.nombre+' · '+l.etiqueta+(l.cant>1?(' × '+l.cant):'')+'</span><b>'+pesos(s)+'</b></div>'; });
    document.getElementById('co-lineas').innerHTML=h;
    document.getElementById('co-total').innerHTML=
      '<div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:7px"><span>Envío</span><b style="color:#3F7D58">Gratis</b></div>'
      +'<div style="display:flex;justify-content:space-between;border-top:1px solid #E8E4E2;padding-top:10px;font-size:19px"><b>Total</b><b>'+pesos(total)+'</b></div>';
    f.dataset.total=total;
  }
  // Departamentos y ciudades, del mismo fichero que usa el checkout de las landings.
  var dep=f.querySelector('[data-ds-dept]'), ciu=f.querySelector('[data-ds-city]');
  fetch('/co.json').then(function(r){return r.json()}).then(function(d){
    var mapa=d.departamentos||d;
    var nombres=Array.isArray(mapa)?mapa.map(function(x){return x.departamento||x.nombre||x}):Object.keys(mapa);
    nombres.sort(function(a,b){return String(a).localeCompare(String(b),'es')});
    nombres.forEach(function(n){ var o=document.createElement('option'); o.value=o.textContent=n; dep.appendChild(o); });
    dep.addEventListener('change',function(){
      ciu.innerHTML='<option value="">Elige…</option>'; ciu.disabled=!dep.value;
      if(!dep.value) return;
      var lista=Array.isArray(mapa)
        ? (mapa.find(function(x){return (x.departamento||x.nombre)===dep.value})||{}).ciudades||[]
        : mapa[dep.value]||[];
      lista.slice().sort(function(a,b){return String(a).localeCompare(String(b),'es')})
        .forEach(function(c){ var o=document.createElement('option'); o.value=o.textContent=c; ciu.appendChild(o); });
    });
  }).catch(function(){
    // Si el listado no carga, dos campos de texto antes que un checkout muerto.
    [dep,ciu].forEach(function(s){ var i=document.createElement('input');
      i.name=s.name; i.placeholder=s.name==='department'?'Departamento':'Ciudad';
      i.className=''; s.parentNode.replaceChild(i,s); });
  });
  function tel(v){ var d=String(v||'').replace(/\\D/g,'');
    if(d.length===12&&d.slice(0,2)==='57') d=d.slice(2);
    if(d.length===11&&d[0]==='0') d=d.slice(1);
    return d.length===10?d:''; }
  f.addEventListener('submit',async function(e){
    e.preventDefault();
    var av=f.querySelector('[data-error]'); av.hidden=true;
    var d=Object.fromEntries(new FormData(f));
    var falla=null;
    if(!String(d.customer_name||'').trim()) falla='Escribe tu nombre y apellido';
    else if(!tel(d.phone)) falla='Tu número de teléfono no está correcto. Ej: 3053765678';
    else if(!String(d.department||'').trim()) falla='Elige tu departamento';
    else if(!String(d.city||'').trim()) falla='Elige tu ciudad';
    else if(String(d.address||'').trim().length<6) falla='Pon tu dirección más completa para que logremos hacer la entrega';
    else if(!f.compromiso.checked) falla='Marca la casilla para confirmar que recibirás tu pedido';
    if(falla){ av.hidden=false; av.textContent=falla; return; }
    var ls=lineas(); if(!ls.length) return;
    var btn=f.querySelector('[type=submit]'); btn.disabled=true; btn.textContent='Enviando tu pedido…';
    // Un pedido por línea: el backend y Mastershop razonan por producto y
    // cantidad, no por carrito, así que se manda en su moneda y no en otra.
    var hechos=[], error=null;
    for(var i=0;i<ls.length;i++){
      var l=ls[i];
      for(var k=0;k<l.cant;k++){
        try{
          var r=await fetch('/api/track/order',{method:'POST',headers:{'content-type':'application/json'},
            body:JSON.stringify({product_id:'prd_dermafol360',customer_name:d.customer_name,phone:tel(d.phone),
              department:d.department,city:d.city,address:d.address,notes:d.notes||'',
              offer_name:l.nombre+' · '+l.etiqueta,qty:l.qty,subtotal:l.precio,total:l.precio,
              payment_method:'cod',source_url:location.href})});
          var j=await r.json();
          if(!r.ok) throw new Error(j.error||'No pudimos registrar tu pedido');
          hechos.push(j.code||'');
        }catch(err){ error=err.message; break; }
      }
      if(error) break;
    }
    if(error){ btn.disabled=false; btn.textContent='Pedir contra entrega';
      av.hidden=false; av.textContent=error; return; }
    window.dfCarrito.guardar([]);
    f.hidden=true; ok.hidden=false;
    ok.innerHTML='<h2>¡Pedido confirmado!</h2>'
      +'<p class="lede">Te escribimos por WhatsApp en las próximas horas para confirmar la entrega.</p>'
      +'<p style="font-size:14px">Número de pedido: <b>'+hechos.filter(Boolean).join(', ')+'</b></p>'
      +'<a class="btn" href="/seguimiento">Seguir mi pedido</a>';
  });
  pintar();
})();
</script>`;

export function politica(slug) {
  const p = politicaPorSlug(slug);
  if (!p) return null;
  const [, titulo] = p;
  const cuerpo = `${encabezado('Políticas', titulo, '')}
<section class="sec" style="padding-top:22px"><div class="w-s">
  <div class="caja">
    <p>${pend('Texto legal pendiente de redacción y revisión')}</p>
    <p style="font-size:14px;color:var(--tinta-suave)">Este documento debe redactarlo o revisarlo alguien con criterio legal antes de publicarse. Hasta entonces se muestra este aviso en vez de un texto de relleno, que en una política tiene consecuencias.</p>
  </div>
  <h3 style="margin-top:30px">Otras políticas</h3>
  <ul class="lista" style="margin-top:12px">${POLITICAS.filter(([u]) => u !== slug)
    .map(([u, t]) => `<li><a href="/politicas/${u}">${esc(t)}</a></li>`).join('')}</ul>
</div></section>`;
  return documento({ titulo: `${titulo} · Dermafol`, descripcion: `${titulo} de Dermafol.`,
    ruta: '/politicas', cuerpo, extraCss: CSS });
}

export function noEncontrada() {
  const cuerpo = `<section class="sec"><div class="w-s vacio">
    <h1>Esta página no existe</h1>
    <p class="lede">Puede que el enlace esté mal o que la hayamos movido.</p>
    <a class="btn" href="/">Ir al inicio</a>
  </div></section>`;
  return documento({ titulo: 'Página no encontrada · Dermafol', descripcion: '',
    ruta: '/', cuerpo, extraCss: CSS, noindex: true });
}
