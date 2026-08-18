/**
 * Funnel de Dermafol 360°.
 *
 * Escrito móvil primero: los estilos base son los del teléfono y las media
 * queries sólo agrandan. La versión anterior hacía lo contrario y en un celular
 * la primera pantalla entera era una foto de estilo de vida — sin producto, sin
 * titular y sin botón.
 *
 * Todas las imágenes son las piezas de funnel que ya existen en la tienda
 * (cdn.shopify.com), no capturas del maquetado de Instant: traen el producto,
 * el antes y después, los ingredientes y las cifras. Se piden al CDN de Shopify
 * con `?width=` para no bajar 2400px en un teléfono.
 *
 * El contenido —testimonios, citas, cifras— sale íntegro de dermafol.co.
 */

const SH = 'https://cdn.shopify.com/s/files/1/0663/4966/2313/files';
const IN = 'https://cdn.instant.so/sites/lS1UEWTFIWeYBash/assets';

/** Imagen del CDN de Shopify a un ancho concreto, con juego para pantallas 2×. */
const img = (n, w) => `${SH}/${n}?width=${w}`;
const srcset = (n, w) => `${SH}/${n}?width=${w} 1x, ${SH}/${n}?width=${w * 2} 2x`;

const IMG = {
  hero:        'Funnel_1.webp',   // producto + "Son tus hormonas"
  antesDespues:'Funnel_2.webp',   // antes/después con el producto
  ingredientes:'Funnel_3.webp',   // activos alrededor del frasco
  protocolo:   'Funnel_4.webp',   // los dos pasos del día
  testimonios: 'Funnel_5.webp',   // clientas + producto
  cifras:      'Funnel_7.webp',   // 92% / 90% / 88%
  producto:    'Combo_Dermafol_360.webp', // caja + frasco + roll-on, fondo limpio
};
const LOGO = `${IN}/OGV7Ka7GLbNq8D4q/logo.webp`;

/* Paleta del CSS de la tienda. */
const C = {
  tinta: '#2e2e2e', suave: '#6d6d6d', acento: '#916e53',
  crema: '#f8f6f5', azul: '#e0eaf0', linea: '#e8e4e2',
  bien: '#3f7d58', mal: '#c46a6a',
};

const money = (n) => '$' + Number(n).toLocaleString('es-CO');

/* ── Contenido ────────────────────────────────────────────────────────── */

const CAUSAS = [
  { tag: 'La causa más ignorada', h: 'Tu cabello responde a tus hormonas.',
    p: 'La DHT miniaturiza el folículo y acorta el ciclo de crecimiento. Ningún shampoo puede tocar eso.',
    no: ['Shampoos anticaída', 'Serums capilares', 'Minoxidil solo'],
    si: 'Dermafol lo regula desde adentro con Saw Palmetto + Zinc' },
  { tag: 'El detonante silencioso', h: 'El cortisol también cae en el cabello.',
    p: 'El cortisol interrumpe el ciclo capilar y manda los folículos a reposo. No es ansiedad, es biología.',
    no: ['Vitaminas sueltas', 'Tratamientos tópicos', 'Masajes capilares'],
    si: 'Dermafol reduce ese impacto con adaptógenos específicos' },
  { tag: 'Lo que falta sin saberlo', h: 'Zinc y vitamina D, los déficits que nadie revisa.',
    p: 'Dos de los nutrientes más críticos para el folículo. Y dos de los más bajos en mujeres con caída hormonal.',
    no: ['Biotina sola', 'Colágeno genérico', 'Suplementos sin foco'],
    si: 'Dermafol los aporta en la dosis correcta para mujeres 35+' },
];

/** Comparativa. Las columnas son cortas a propósito: tienen que caber en 390px. */
const COMPARA = {
  cols: ['Shampoo', 'Minoxidil', 'Vitaminas', 'Dermafol<br>360°'],
  filas: [
    ['Frena la causa hormonal (DHT)', 0, 0, 0, 1],
    ['Reactiva el folículo dormido', 0, 1, 0, 1],
    ['Aporta Zinc y Vitamina D3', 0, 0, 1, 1],
    ['Actúa por dentro y por fuera', 0, 0, 0, 1],
    ['Formulado para mujeres 35+', 0, 0, 0, 1],
    ['Registro INVIMA', 0, 1, 0, 1],
  ],
};

const INGREDIENTES = [
  ['Saw Palmetto', 'Actúa sobre los andrógenos que contribuyen a la caída hormonal femenina. Uno de los activos más estudiados para la alopecia androgenética.'],
  ['Zinc', 'Esencial para el ciclo de crecimiento capilar y la síntesis proteica. Uno de los déficits más comunes en mujeres con caída hormonal.'],
  ['Vitamina D3', 'Participa en la proliferación celular del folículo. Su deficiencia se asocia al efluvio telógeno, la caída más común después de los 35.'],
  ['Biotina', 'La vitamina clave para la síntesis de queratina, la proteína que forma el cabello. Su falta se asocia a cabello frágil y quebradizo.'],
  ['Colágeno hidrolizado', 'Refuerza la estructura del folículo y mejora la elasticidad del cuero cabelludo.'],
  ['Minoxidil 2%', 'Prolonga la fase de crecimiento y reactiva folículos en reposo. La concentración aprobada y estudiada para mujeres.'],
];

/**
 * Testimonios: sólo los reales de Judge.me en dermafol.co (6, promedio 4,67).
 *
 * Antes había cuatro inventados —Claudia R., Patricia M., Lorena T., Sara R.—
 * con cifras de eficacia que nadie midió ("−68% caída", "+43% densidad"), y el
 * encabezado anunciaba "4.9 ★ · +500 opiniones". Eso es publicidad engañosa: el
 * Estatuto del Consumidor (Ley 1480 de 2011, art. 30) exige que un testimonio
 * corresponda a un cliente real y verificable, y Meta rechaza los antes/después
 * y las cifras de resultado sin sustento en salud y belleza.
 *
 * `foto` es la imagen que la propia clienta adjuntó a su reseña. Para añadir
 * una nueva: cópiala de Judge.me, no la inventes.
 */
const TESTIMONIOS = [
  { n: 'Viviana Fernández', m: 'Bogotá', c: 'foto enviada por ella', e: 5,
    foto: 'https://review-images.judgeme.com/dermafol/1777379449__img_6339__original.jpeg?quality=80&width=560',
    t: 'Soy de Bogotá y por los trancones y el estrés después de los 30 se me empezó a caer el cabello. Gracias a Dios, luego de mes y medio tomando Dermafol y usando el serum bien juiciosa, he visto resultados increíbles.' },
  { n: 'Maricela Torres', m: '36 años', c: 'foto enviada por ella', e: 5,
    foto: 'https://review-images.judgeme.com/dermafol/1777344908__capturadepantalla2026-04-24alas103312am__original.png?quality=80&width=560',
    t: 'Mi cabello se empezó a caer mucho luego de que cumplí 36 años, era algo androgénico. Tomé Dermafol por casi dos meses y los resultados fueron excelentes.' },
  { n: 'Beatriz Soto', m: 'Caída por tracción', c: 'foto enviada por ella', e: 4,
    foto: 'https://review-images.judgeme.com/dermafol/1777345010__capturadepantalla2026-04-24alas103247am__original.png?quality=80&width=560',
    t: 'Desde pequeña mi madre me hacía muchas trenzas y por eso se me caía mucho el cabello. Dermafol me ayudó a que dejara de caerse, y ahorita empecé a ver pelitos nuevos creciendo.' },
  { n: 'Carolina Gómez', m: 'Caída por estrés', c: 'Clienta verificada', e: 5,
    t: 'Me encantó mucho el producto, me sirvió mucho. Yo sufría de caída del cabello por el estrés de mi trabajo.' },
  { n: 'Gina Ortiz', m: 'Colombia', c: 'Clienta verificada', e: 5,
    t: 'Me sirvió muchísimo. Muchas gracias.' },
  { n: 'Amelia Osorio', m: 'Colombia', c: 'Clienta verificada', e: 4,
    t: 'Muy buena calidad. Llegó muy rápido y yo ese día no estaba en la casa, pero el producto muy bien.' },
];

const FAQ = [
  ['¿Cuánto tarda en verse resultados?', 'La mayoría nota reducción de caída entre la semana 4 y 6. La densidad y los cabellos nuevos aparecen entre la semana 8 y 12. El ciclo capilar completo requiere constancia, no hay atajos biológicos.'],
  ['¿El Roll-On tiene efectos secundarios?', 'Contiene Minoxidil al 2%, concentración aprobada y segura para mujeres. Es de aplicación localizada y rápida absorción. En algunos casos puede haber leve irritación inicial que cede en pocos días.'],
  ['¿Puedo usarlo si ya probé minoxidil solo?', 'Sí. El minoxidil actúa sobre el folículo pero no resuelve el origen hormonal. El diferencial de Dermafol es el suplemento que trabaja internamente. Juntos potencian lo que uno solo no logra.'],
  ['¿Cada cuánto debo comprar?', 'El Combo está diseñado para 1 mes. Recomendamos mínimo 3 meses consecutivos para completar un ciclo capilar y consolidar los resultados.'],
  ['¿Envían a todo Colombia?', 'Sí, a nivel nacional con seguimiento. Entrega de 2 a 4 días hábiles a ciudades principales, y pagas en efectivo al recibir.'],
  ['¿Y si no me funciona?', 'Tienes 30 días de garantía. Si no notas ningún cambio en la caída, nos escribes y te devolvemos el 100% de tu dinero, sin preguntas.'],
];

/* ── Estilos, base móvil ──────────────────────────────────────────────── */

const CSS = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;padding:0 0 78px;font-family:'DM Sans',system-ui,-apple-system,sans-serif;
  color:${C.tinta};background:#fff;line-height:1.55;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block;height:auto}
h1,h2,h3{margin:0;line-height:1.16;letter-spacing:-.022em;font-weight:700}
p{margin:0}
a{color:inherit;text-decoration:none}
.w{max-width:560px;margin:0 auto;padding:0 18px}
.s{padding:40px 0}
.s.crema{background:${C.crema}}
.s.azul{background:${C.azul}}
.s.tinta{background:${C.tinta};color:#fff}
.eye{font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:${C.acento};margin-bottom:9px}
.s.tinta .eye{color:#d9c2ab}
h1{font-size:29px}
h2{font-size:24px}
h3{font-size:17px}
.kick{color:${C.suave};font-size:15.5px;margin-top:10px}
.s.tinta .kick{color:rgba(255,255,255,.74)}
.c{text-align:center}
.pic{border-radius:16px;overflow:hidden;border:1px solid ${C.linea};background:${C.crema}}
.s.tinta .pic{border-color:rgba(255,255,255,.14)}

.bar{background:${C.azul};text-align:center;padding:9px 14px;font-size:12.5px;line-height:1.35}
.bar b{font-weight:700}
.nav{border-bottom:1px solid ${C.linea};padding:11px 0;text-align:center}
.nav img{height:22px;width:auto;margin:0 auto}

/* Hero: titular y producto arriba, botón sin bajar */
.hero{padding:18px 0 30px}
.stars{color:#e8a33d;letter-spacing:.5px;font-size:12.5px}
.rate{display:flex;align-items:center;gap:7px;justify-content:center;font-size:12.5px;font-weight:600;margin-bottom:12px}
.hero h1{text-align:center}
.hero .em{color:${C.acento}}
.hero .sub{text-align:center;color:${C.suave};font-size:15px;margin-top:9px}
.heropic{margin:14px 0}
.ticks{list-style:none;padding:0;margin:0 0 18px;display:grid;gap:8px}
.ticks li{display:flex;gap:9px;align-items:flex-start;font-size:15px;line-height:1.4}
.ic{flex:0 0 auto;width:19px;height:19px;border-radius:50%;background:${C.tinta};color:#fff;
  display:grid;place-items:center;font-size:10px;margin-top:2px}
.badges{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:14px}
.badges span{background:${C.crema};border:1px solid ${C.linea};border-radius:999px;padding:6px 11px;
  font-size:11.5px;font-weight:600;color:#4a4a4a}

.cta{display:block;width:100%;background:${C.tinta};color:#fff;text-align:center;padding:17px 16px;
  border-radius:13px;font-weight:700;font-size:15.5px;border:0;cursor:pointer;font-family:inherit;
  letter-spacing:.015em;min-height:56px}
.cta:active{background:#1a1a1a}
.cta .sub2{display:block;font-size:11.5px;font-weight:500;opacity:.84;margin-top:3px;letter-spacing:0}
.s.tinta .cta{background:#fff;color:${C.tinta}}

.stats{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:${C.linea};
  border:1px solid ${C.linea};border-radius:14px;overflow:hidden}
.stats div{background:#fff;padding:15px 10px;text-align:center}
.stats b{display:block;font-size:22px;font-weight:700}
.stats span{font-size:11.5px;color:${C.suave};line-height:1.3;display:block;margin-top:2px}

.causa{background:#fff;border:1px solid ${C.linea};border-radius:16px;padding:20px;margin-bottom:12px}
.causa .tag{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.acento};margin-bottom:7px}
.causa p.d{color:${C.suave};font-size:14.5px;margin-top:7px}
.causa .cols{margin-top:15px;padding-top:15px;border-top:1px solid ${C.linea}}
.causa .lbl{font-size:10.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:${C.suave};margin-bottom:7px}
.causa ul{list-style:none;padding:0;margin:0 0 13px;display:grid;gap:5px}
.causa ul li{font-size:14px;color:${C.suave};display:flex;gap:7px}
.causa ul li::before{content:'✕';color:${C.mal};font-weight:700}
.causa .si{font-size:14px;font-weight:600;display:flex;gap:7px;line-height:1.4}
.causa .si::before{content:'✓';color:${C.bien};font-weight:700}

/* Comparativa: cabe en 390px porque las celdas son sólo iconos */
.tabla{border:1px solid ${C.linea};border-radius:16px;overflow:hidden;background:#fff}
.tabla table{width:100%;border-collapse:collapse;font-size:12.5px;table-layout:fixed}
.tabla th,.tabla td{padding:11px 6px;text-align:center;border-bottom:1px solid ${C.crema}}
.tabla thead th{padding:10px 3px;background:${C.crema};font-size:10.5px;font-weight:700;line-height:1.25;color:${C.suave};
  text-transform:uppercase;letter-spacing:.03em;vertical-align:bottom}
.tabla thead th.mio{background:${C.tinta};color:#fff}
.tabla tbody td.q{text-align:left;font-size:13px;font-weight:600;line-height:1.3;padding-left:12px}
.tabla th:first-child,.tabla td.q{width:36%}
.tabla thead th:not(:first-child){width:16%}
.tabla td.mio{background:#fbf9f8}
.tabla tr:last-child th,.tabla tr:last-child td{border-bottom:0}
.si2{color:${C.bien};font-weight:700;font-size:15px}
.no2{color:#c9c4c0;font-weight:700;font-size:15px}

.mech{display:grid;gap:12px}
.mech .card{background:#fff;border:1px solid ${C.linea};border-radius:16px;padding:20px}
.mech .n{width:29px;height:29px;border-radius:50%;background:${C.tinta};color:#fff;display:grid;
  place-items:center;font-weight:700;font-size:13px;margin-bottom:11px}
.mech p{font-size:14.5px;color:${C.suave};margin-top:6px}

.doc{background:#fff;border:1px solid ${C.linea};border-radius:18px;padding:22px;text-align:center}
.doc q{font-size:16.5px;line-height:1.5;display:block;margin-bottom:14px;font-style:italic}
.doc .nm{font-weight:700;font-size:14.5px}
.doc .pr{font-size:13px;color:${C.suave}}

.ing{background:#fff;border:1px solid ${C.linea};border-radius:14px;padding:15px 17px;margin-bottom:9px}
.ing .n{font-weight:700;font-size:15px;margin-bottom:4px}
.ing .d{font-size:13.5px;color:${C.suave};line-height:1.5}

.tl{display:grid;gap:11px}
.tl .card{border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:18px;background:rgba(255,255,255,.05)}
.tl .wk{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#d9c2ab;margin-bottom:7px}
.tl p{font-size:14px;color:rgba(255,255,255,.74);margin-top:5px}

/* Testimonios en carril con arrastre */
.riel{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 18px 14px;
  margin:0 -18px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.riel::-webkit-scrollbar{display:none}
.tst{flex:0 0 82%;scroll-snap-align:center;background:#fff;border:1px solid ${C.linea};
  border-radius:16px;padding:18px;display:flex;flex-direction:column}
.tst .stars{margin-bottom:9px}
.tst .datos{display:flex;gap:10px;margin-bottom:11px}
.tst .datos div{text-align:center;flex:1}
.tst .datos b{display:block;font-size:16px;font-weight:700;color:${C.bien}}
.tst .datos span{font-size:9.5px;color:${C.suave};line-height:1.2;display:block}
.tst q{font-size:14.5px;line-height:1.55;flex:1;display:block;margin-bottom:13px}
.tst .who{padding-top:11px;border-top:1px solid ${C.linea};display:flex;align-items:center;gap:10px}
.tst .av{width:36px;height:36px;border-radius:50%;background:${C.azul};display:grid;place-items:center;
  font-weight:700;font-size:14px;flex:0 0 auto}
.tst .nm{font-weight:700;font-size:13.5px}
.tst .mt{font-size:11.5px;color:${C.suave}}
.hint{text-align:center;font-size:11.5px;color:${C.suave};margin-top:2px}

.planes{display:grid;gap:11px;margin-bottom:16px}
.plan{background:#fff;border:2px solid ${C.linea};border-radius:16px;padding:18px;position:relative;cursor:pointer}
.plan.best{border-color:${C.tinta}}
.plan .badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:${C.acento};color:#fff;
  font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:4px 11px;
  border-radius:999px;white-space:nowrap}
.plan .top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.plan .q{font-size:17px;font-weight:700}
.plan .price b{font-size:23px;font-weight:700}
.plan .price s{color:#a8a29d;font-size:13px;margin-left:6px}
.plan .save{display:inline-block;background:${C.crema};color:${C.acento};font-size:11px;font-weight:700;
  padding:3px 8px;border-radius:5px;margin-top:7px}
.plan .desc{font-size:13.5px;color:${C.suave};margin-top:8px;line-height:1.45}

.stack{list-style:none;margin:0 0 14px;padding:0;border:1px solid ${C.linea};border-radius:16px;
  overflow:hidden;background:#fff}
.stack li{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 15px;
  border-bottom:1px solid ${C.crema};font-size:14px}
.stack li:last-child{border-bottom:0}
.stack .d small{display:block;color:${C.suave};font-size:11.5px;margin-top:2px}
.stack b{white-space:nowrap;font-weight:700;font-size:14px}
.stack b.free{color:${C.acento};font-size:10.5px;letter-spacing:.05em;background:#f3ece5;padding:4px 8px;border-radius:5px}
.total{background:${C.tinta};color:#fff;border-radius:16px;padding:17px 19px;margin-bottom:16px}
.total .r{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.total .r+.r{margin-top:8px;padding-top:11px;border-top:1px solid rgba(255,255,255,.16)}
.total span{font-size:13px;opacity:.75}
.total s{font-size:15px;opacity:.6}
.total b{font-size:27px;font-weight:700}

.guar{background:${C.azul};border-radius:18px;padding:22px;text-align:center}
.guar .ic2{width:46px;height:46px;border-radius:50%;background:${C.tinta};color:#fff;display:grid;
  place-items:center;font-size:21px;margin:0 auto 13px}
.guar p{font-size:14.5px;color:#4a4a4a;margin-top:8px}

.faq details{background:#fff;border:1px solid ${C.linea};border-radius:13px;margin-bottom:8px}
.faq summary{padding:15px 17px;font-weight:600;font-size:14.5px;cursor:pointer;list-style:none;
  display:flex;justify-content:space-between;gap:12px;align-items:center;line-height:1.35}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'+';font-size:19px;color:${C.acento};font-weight:400;flex:0 0 auto}
.faq details[open] summary::after{content:'−'}
.faq .a{padding:0 17px 15px;color:${C.suave};font-size:14px}

.ps p{font-size:15.5px;line-height:1.62;margin-bottom:13px}
.ps .sign{color:${C.suave};font-style:italic;font-size:14px}

.sticky{position:fixed;left:0;right:0;bottom:0;background:rgba(255,255,255,.98);
  border-top:1px solid ${C.linea};padding:9px 14px calc(9px + env(safe-area-inset-bottom));z-index:90;
  transform:translateY(115%);transition:transform .26s ease;box-shadow:0 -6px 24px -16px rgba(0,0,0,.45)}
.sticky.on{transform:translateY(0)}
.sticky .in{max-width:520px;margin:0 auto;display:flex;align-items:center;gap:11px}
.sticky .pz{flex:0 0 auto;line-height:1.15}
.sticky .pz b{font-size:16.5px;font-weight:700;display:block}
.sticky .pz s{font-size:11px;color:#a8a29d}
.sticky a{flex:1;background:${C.tinta};color:#fff;text-align:center;padding:14px 10px;border-radius:11px;
  font-weight:700;font-size:14px;min-height:48px;display:flex;align-items:center;justify-content:center}

footer{background:${C.tinta};color:rgba(255,255,255,.6);padding:30px 0;font-size:12.5px;text-align:center}
footer img{height:21px;margin:0 auto 11px;opacity:.9}

/* De tablet en adelante */
@media(min-width:700px){
  body{padding-bottom:0}
  .w{max-width:1020px;padding:0 24px}
  .s{padding:60px 0}
  h1{font-size:42px} h2{font-size:32px} h3{font-size:20px}
  .kick{font-size:17px}
  .hero{padding:38px 0 52px}
  .hero .grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;text-align:left}
  .hero .grid>*{min-width:0}
  .hero h1,.hero .sub,.rate{text-align:left;justify-content:flex-start}
  .heropic{margin:0}
  .badges{justify-content:flex-start}
  .cta{max-width:420px}
  .stats{grid-template-columns:repeat(4,1fr)}
  .stats b{font-size:26px}
  .mech,.tl{grid-template-columns:repeat(3,1fr)}
  .planes{grid-template-columns:1fr 1fr}
  .riel{display:grid;grid-template-columns:repeat(3,1fr);overflow:visible;margin:0;padding:0}
  .tst{flex:auto}
  .hint{display:none}
  .doc{display:grid;grid-template-columns:1fr;gap:0;text-align:center}
  .ings{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .ing{margin-bottom:0}
  .tabla table{font-size:14px}
  .tabla thead th{font-size:12px}
  .tabla tbody td.q{font-size:14.5px}
  .sticky{display:none}
}
`;

/* ── Bloques ──────────────────────────────────────────────────────────── */

const tick = '<span class="ic">✓</span>';
const foto = (n, w, alt, extra = '') =>
  `<img class="pic" src="${img(n, w)}" srcset="${srcset(n, w)}" alt="${alt}" width="${w}" height="${w}" ${extra}>`;

const hero = (o) => `
<div class="bar">Envío gratis a toda Colombia · <b>Pagas en efectivo al recibir</b></div>
<nav class="nav"><img src="${LOGO}" alt="Dermafol" width="110" height="22"></nav>

<section class="hero"><div class="w"><div class="grid">
  <div>
    <div class="rate"><span class="stars">★★★★★</span> 4.67 · 6 reseñas verificadas</div>
    <h1>Tu cabello no se cae por tu edad.<br><span class="em">Son tus hormonas.</span></h1>
    <p class="sub">Ya probaste productos que solo atacan la mitad del problema. Dermafol trata la causa hormonal y reactiva el folículo al mismo tiempo.</p>
  </div>
  <div class="heropic">${foto(IMG.hero, 560, 'Combo Dermafol 360°: suplemento capilar con Saw Palmetto, Zinc y Vitamina D3, y Roll-On con Minoxidil 2%', 'fetchpriority="high"')}</div>
  <div>
    <a href="#pedir" class="cta">QUIERO RECUPERAR MI CABELLO<span class="sub2">${money(o.price)} · Envío gratis · Pagas al recibir</span></a>
    <ul class="ticks" style="margin:16px 0 0">
      <li>${tick}Menos cabello en la ducha</li>
      <li>${tick}Raíz más fuerte semana a semana</li>
      <li>${tick}Más densidad visible en entradas y coronilla</li>
    </ul>
    <div class="badges"><span>Registro INVIMA</span><span>Garantía 30 días</span><span>Envío gratis</span></div>
  </div>
</div></div></section>

<section style="padding:0 0 38px"><div class="w"><div class="stats">
  <div><b>92%</b><span>Lo recomendaría a otras mujeres</span></div>
  <div><b>90%</b><span>Menos caída en las primeras 4 semanas</span></div>
  <div><b>88%</b><span>Más densidad al completar 8 semanas</span></div>
  <div><b>30 días</b><span>Garantía total</span></div>
</div></div></section>`;

const problema = () => `
<section class="s crema"><div class="w">
  <div class="c" style="margin-bottom:24px">
    <div class="eye">La verdad incómoda</div>
    <h2>No fallaste tú.<br>Fallaron los productos.</h2>
    <p class="kick">Los shampoos y serums tratan el síntoma. La caída hormonal tiene tres causas reales y ninguna se ve en el espejo.</p>
  </div>
  ${CAUSAS.map((c) => `
  <div class="causa">
    <div class="tag">${c.tag}</div>
    <h3>${c.h}</h3>
    <p class="d">${c.p}</p>
    <div class="cols">
      <div class="lbl">Lo que no lo resuelve</div>
      <ul>${c.no.map((x) => `<li>${x}</li>`).join('')}</ul>
      <div class="lbl">Lo que sí</div>
      <div class="si">${c.si}</div>
    </div>
  </div>`).join('')}
</div></section>`;

const comparativa = (o) => `
<section class="s"><div class="w">
  <div class="c" style="margin-bottom:22px">
    <div class="eye">Por qué lo otro no funcionó</div>
    <h2>Compáralo con lo que ya probaste</h2>
    <p class="kick">Cada producto resuelve un pedazo. Ninguno los dos a la vez.</p>
  </div>
  <div class="tabla"><table>
    <thead><tr><th></th>${COMPARA.cols.map((c, i) =>
      `<th class="${i === COMPARA.cols.length - 1 ? 'mio' : ''}">${c}</th>`).join('')}</tr></thead>
    <tbody>${COMPARA.filas.map((f) => `
      <tr><td class="q">${f[0]}</td>${f.slice(1).map((v, i) =>
        `<td class="${i === 3 ? 'mio' : ''}">${v ? '<span class="si2">✓</span>' : '<span class="no2">✕</span>'}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table></div>
  <a href="#pedir" class="cta" style="margin-top:22px">QUIERO EL PROTOCOLO COMPLETO<span class="sub2">${money(o.price)} · Pagas al recibir</span></a>
</div></section>`;

const mecanismo = () => `
<section class="s crema"><div class="w">
  <div class="c" style="margin-bottom:22px">
    <div class="eye">El protocolo 360°</div>
    <h2>Ya probaste de todo. Faltaba atacar las dos causas.</h2>
  </div>
  <div style="margin-bottom:18px">${foto(IMG.protocolo, 560, 'Dos pasos al día: cápsulas en la mañana y Roll-On en la noche', 'loading="lazy"')}</div>
  <div class="mech">
    <div class="card"><div class="n">1</div><h3>Regula desde adentro</h3>
      <p>El suplemento trata la causa hormonal que ningún tópico puede tocar: Saw Palmetto, Zinc y Vitamina D3 para equilibrar lo que dispara la caída en mujeres 35+.</p></div>
    <div class="card"><div class="n">2</div><h3>Reactiva desde afuera</h3>
      <p>Minoxidil 2% directo en el folículo. Reactiva donde dejó de crecer: entradas, coronilla y línea frontal.</p></div>
    <div class="card"><div class="n">✓</div><h3>Los dos al mismo tiempo</h3>
      <p>No uno o el otro. Es la primera vez que atacas la causa hormonal y el folículo simultáneamente.</p></div>
  </div>
</div></section>`;

const autoridad = () => `
<section class="s"><div class="w">
  <div class="c" style="margin-bottom:20px"><div class="eye">Respaldo profesional</div><h2>Qué dice una dermatóloga</h2></div>
  <div class="doc">
    <q>La caída femenina después de los 35 casi siempre tiene un componente hormonal que los tópicos solos no resuelven.</q>
    <div class="nm">Carolina Monsalve</div>
    <div class="pr">Dermatóloga · Tricología femenina</div>
  </div>
</div></section>`;

const ingredientes = () => `
<section class="s crema"><div class="w">
  <div class="c" style="margin-bottom:20px">
    <div class="eye">Ingredientes con respaldo</div>
    <h2>No agregamos nada que no tenga un papel claro</h2>
  </div>
  <div style="margin-bottom:18px">${foto(IMG.ingredientes, 560, 'Activos del Combo Dermafol 360°', 'loading="lazy"')}</div>
  <div class="ings">${INGREDIENTES.map(([n, d]) => `
    <div class="ing"><div class="n">${n}</div><div class="d">${d}</div></div>`).join('')}</div>
</div></section>`;

const resultados = (o) => `
<section class="s"><div class="w">
  <div class="c" style="margin-bottom:20px"><div class="eye">Resultados reales</div><h2>Antes y después del protocolo</h2></div>
  <div style="margin-bottom:14px">${foto(IMG.antesDespues, 560, 'Antes y después del protocolo Dermafol en 10 semanas', 'loading="lazy"')}</div>
  <p class="kick c" style="font-size:12.5px;margin-bottom:30px">Resultados de clientas reales. Pueden variar de una persona a otra.</p>

  <div class="c" style="margin-bottom:18px"><div class="eye">Sus palabras, no las nuestras</div><h2>4.67 ★ · 6 reseñas verificadas</h2></div>
  <div class="riel">${TESTIMONIOS.map((t) => `
    <div class="tst">
      ${t.foto ? `<img src="${t.foto}" alt="Foto que ${t.n} envió con su reseña" width="560" height="420" loading="lazy" decoding="async" style="width:calc(100% + 36px);margin:-18px -18px 14px;aspect-ratio:4/3;object-fit:cover;border-radius:16px 16px 0 0;display:block">` : ''}
      <div class="stars">${'★'.repeat(t.e)}${'☆'.repeat(5 - t.e)}</div>
      <q>${t.t}</q>
      <div class="who"><div class="av">${t.n.charAt(0)}</div>
        <div><div class="nm">${t.n}</div><div class="mt">${t.m} · ${t.c}</div></div></div>
    </div>`).join('')}</div>
  <p class="hint">Desliza para ver más →</p>
  <div style="margin-top:24px">${foto(IMG.testimonios, 560, 'Clientas de Dermafol y el Combo 360°', 'loading="lazy"')}</div>
  <a href="#pedir" class="cta" style="margin-top:22px">EMPEZAR MI PROTOCOLO<span class="sub2">${money(o.price)} · Garantía de 30 días</span></a>
</div></section>`;

const tiempo = () => `
<section class="s tinta"><div class="w">
  <div class="c" style="margin-bottom:22px"><div class="eye">Qué esperar</div><h2>Empieza a notarlo antes de lo que crees</h2></div>
  <div class="tl">
    <div class="card"><div class="wk">Semanas 1–4</div><h3>Menos cabello en la ducha</h3><p>La caída empieza a ceder. El protocolo trabaja aunque todavía no lo veas en el espejo.</p></div>
    <div class="card"><div class="wk">Semanas 5–8</div><h3>El folículo despierta</h3><p>Aparecen cabellos nuevos en entradas y coronilla. El ciclo se reactivó.</p></div>
    <div class="card"><div class="wk">Semanas 9–12</div><h3>Mayor densidad</h3><p>Cabello más grueso y raíz fortalecida. Lo notas tú primero, después los demás.</p></div>
  </div>
</div></section>`;

/**
 * Los planes se pintan desde las ofertas reales del producto, no fijos.
 *
 * El precio tachado de cada plan es `qty × 200.000`, el valor de comprar el
 * suplemento (120.000) y el roll-on (80.000) por separado tantas veces como
 * meses lleve el plan. Es el mismo desglose que muestra la lista de abajo.
 *
 * El índice de cada tarjeta es su `data-plan`, y el script del pie lo usa para
 * mover el <select> del checkout: por eso el orden aquí tiene que ser el mismo
 * que el de los <option>, que salen de `offers` ordenadas por `sort`.
 */
const oferta = (list) => {
  const uno = list[0];
  const suelto = (o) => 200000 * (o.qty || 1);
  // El plan recomendado es el del medio cuando hay tres; con dos, el segundo.
  const best = list.length >= 3 ? 1 : Math.min(1, list.length - 1);
  const glosa = {
    1: 'Tratamiento completo de 1 mes. Envío gratis a toda Colombia.',
    2: 'Dos meses seguidos, el mínimo para que el folículo responda.',
    3: 'Tres meses: el ciclo capilar completo, que es lo que consolida el resultado.',
  };
  return `
<section class="s crema" id="oferta"><div class="w">
  <div class="c" style="margin-bottom:24px">
    <div class="eye">Elige tu tratamiento</div>
    <h2>Un protocolo completo, no un producto suelto</h2>
    <p class="kick">Por separado, tratar las dos causas te costaría ${money(200000)}.</p>
  </div>
  <div style="margin-bottom:20px">${foto(IMG.producto, 480, 'Combo Dermafol 360° con su empaque', 'loading="lazy"')}</div>

  <div class="planes">
    ${list.map((o, i) => `
    <div class="plan${i === best ? ' best' : ''}" data-plan="${i}">
      ${i === best ? '<span class="badge">El más elegido</span>' : ''}
      <div class="top"><div class="q">${o.qty} combo${o.qty > 1 ? 's' : ''}</div>
        <div class="price"><b>${money(o.price)}</b><s>${money(suelto(o))}</s></div></div>
      <div class="save">Ahorras ${money(suelto(o) - o.price)}</div>
      <p class="desc">${glosa[o.qty] || `Tratamiento de ${o.qty} meses. Envío gratis a toda Colombia.`}</p>
    </div>`).join('')}
  </div>

  <ul class="stack">
    <li><div class="d">Suplemento Capilar · 30 días<small>Saw Palmetto, Zinc, Vitamina D3, Biotina y Colágeno</small></div><b>${money(120000)}</b></li>
    <li><div class="d">Roll-On Dermoestimulante<small>Minoxidil 2%, la concentración estudiada para mujeres</small></div><b>${money(80000)}</b></li>
    <li><div class="d">Ebook <i>El Método Anticaída</i><small>El protocolo explicado paso a paso</small></div><b class="free">Gratis</b></li>
    <li><div class="d">Envío a toda Colombia<small>2 a 4 días hábiles con seguimiento</small></div><b class="free">Gratis</b></li>
  </ul>

  <div class="total">
    <div class="r"><span>Valor por separado</span><s>${money(200000)}</s></div>
    <div class="r"><span>Hoy pagas</span><b>${money(uno.price)}</b></div>
  </div>

  <a href="#pedir" class="cta">QUIERO MI COMBO 360°<span class="sub2">Pago contra entrega · No pagas nada por adelantado</span></a>
</div></section>

<section class="s"><div class="w"><div class="guar">
  <div class="ic2">✓</div>
  <h3>Garantía de 30 días. Sin preguntas.</h3>
  <p>Sabemos que ya probaste cosas que no funcionaron. Por eso no te pedimos fe ciega: te pedimos 30 días. Si no notas ningún cambio en la caída, nos escribes y te devolvemos el 100%.</p>
</div></div></section>`;
};

const faqs = () => `
<section class="s crema"><div class="w">
  <div class="c" style="margin-bottom:20px"><div class="eye">Dudas frecuentes</div><h2>Lo que necesitas saber antes de empezar</h2></div>
  <div class="faq">${FAQ.map(([q, a], i) => `
    <details${i === 0 ? ' open' : ''}><summary>${q}</summary><div class="a">${a}</div></details>`).join('')}</div>
</div></section>`;

const cierre = (o) => `
<section class="s"><div class="w ps">
  <div class="eye">P.D.</div>
  <p>El folículo no se pierde de un día para otro. Pero pasado cierto punto deja de responder, y ahí ya no hay protocolo que lo devuelva.</p>
  <p>Cada mes que pasa sin tratar la causa hormonal es un mes más en que folículos que todavía responden entran en reposo. No es urgencia de marketing: es cómo funciona el ciclo capilar.</p>
  <p>Por eso la garantía es de 30 días. No te pedimos que nos creas: te pedimos un mes. Si en ese mes no ves menos cabello en la ducha, escribes y te devolvemos todo.</p>
  <p class="sign">— El equipo de Dermafol</p>
  <a href="#pedir" class="cta" style="margin-top:20px">EMPEZAR MI PROTOCOLO 360°<span class="sub2">${money(o.price)} · Pagas en efectivo al recibir</span></a>
</div></section>

<div class="sticky" id="sticky"><div class="in">
  <div class="pz"><b>${money(o.price)}</b><s>${money(200000)}</s></div>
  <a href="#pedir">PEDIR AHORA</a>
</div></div>

<footer><div class="w">
  <img src="${LOGO}" alt="Dermafol" width="105" height="21">
  <p>Cuidado capilar con ciencia.</p>
  <p style="margin-top:8px;font-size:11.5px;opacity:.7">© 2026 Dermafol. Todos los derechos reservados.</p>
</div></footer>`;

/* ── Página ───────────────────────────────────────────────────────────── */

export function renderDermafolFunnel(offers = []) {
  const list = offers.length ? offers : [
    { id: '', name: '1 combo', qty: 1, price: 139900 },
    { id: '', name: '2 combos', qty: 2, price: 199900 },
  ];
  const o = list[0];

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Combo Dermafol 360° | Tu cabello no se cae por tu edad</title>
<meta name="description" content="Tu caída de cabello no es por la edad, es hormonal. Dermafol trata la causa y reactiva el folículo al mismo tiempo. Envío gratis y pago contra entrega en Colombia.">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="image" href="${img(IMG.hero, 560)}" imagesrcset="${srcset(IMG.hero, 560)}" fetchpriority="high">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${hero(o)}
${problema()}
${comparativa(o)}
${mecanismo()}
${autoridad()}
${ingredientes()}
${resultados(o)}
${tiempo()}
${oferta(list)}
${faqs()}
${cierre(o)}
<script>
(function(){
  var s=document.getElementById('sticky'), hero=document.querySelector('.hero');
  function upd(){
    var m=document.getElementById('dsModal');
    s.classList.toggle('on', window.scrollY > hero.offsetHeight*0.7 && !(m && m.classList.contains('open')));
  }
  window.addEventListener('scroll', upd, {passive:true});
  window.addEventListener('dsmodal', upd);
  upd();

  document.querySelectorAll('.plan').forEach(function(p){
    p.addEventListener('click', function(){
      document.querySelectorAll('.plan').forEach(function(x){ x.classList.remove('best'); });
      p.classList.add('best');
      var sel=document.querySelector('[data-ds-offer]');
      var i=Number(p.dataset.plan||0);
      if(sel && sel.options[i]){ sel.selectedIndex=i; sel.dispatchEvent(new Event('change',{bubbles:true})); }
    });
  });
})();
</script>
</body>
</html>`;
}

export const DERMAFOL_SLUG = 'dermafol-funnel';
