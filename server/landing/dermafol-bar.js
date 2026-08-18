/**
 * Funnel de la barra Dermafol para piel madura — mercado de EE. UU., en inglés.
 *
 * Misma arquitectura que la variante C de Dermafol 360° (`dermafol.js`): móvil
 * primero, secciones en orden de venta, sticky bar y planes que empujan al
 * `data-ds-offer` del runtime. Lo que cambia es el eje.
 *
 * EL EJE, Y POR QUÉ NO ES EL DEL EMPAQUE
 * ---------------------------------------
 * El empaque del producto promete "combatir el olor asociado al envejecimiento"
 * con Persimon. El informe de mercado (Referencias/Informe_Mercado_Piel_Madura_
 * 50plus.docx) desmonta esa promesa con tres hechos que no se pueden ignorar en
 * EE. UU.:
 *
 *   1. Gallagher et al. 2008 (Monell + UPenn, Br J Dermatol) replicaron el
 *      estudio japonés del 2-nonenal con dos técnicas analíticas y no lo
 *      detectaron en ningún sujeto. El original (Haze 2001) lo pagó Shiseido.
 *   2. Mitro et al. 2012 (PLOS ONE) midió agrado del olor corporal por edad: el
 *      grupo de 75-95 salió el MENOS desagradable de los seis. La premisa
 *      comercial de la categoría es falsa según la mejor evidencia disponible.
 *   3. "Neutraliza el 2-nonenal" es un claim de mecanismo fisiológico. Ante la
 *      FDA eso convierte un cosmético en medicamento no aprobado
 *      (FD&C §201(g)(1)). Es la vía rápida a una warning letter.
 *
 * Lo que sí se sostiene, y sobre lo que está escrita esta página, es la otra
 * mitad del informe: una revisión sistemática con protocolo registrado
 * (Lichterfeld-Kottner 2020, 63 artículos, PROSPERO CRD42018100792) establece
 * que los limpiadores syndet y los productos de pH ~4-5,5 mejoran la barrera
 * cutánea en piel madura frente al jabón alcalino. Ese es el claim más
 * defendible del proyecto entero, y aquí es el titular.
 *
 * REGLA DE COPY (informe §27, manual de claims)
 * ---------------------------------------------
 * Todo claim se redacta como RESULTADO PERCIBIDO, nunca como MECANISMO.
 *   Sí:  "leaves skin feeling comfortable", "formulated for mature skin",
 *        "helps control body odor", "skin-friendly pH".
 *   No:  "neutralizes 2-nonenal", "restores the skin barrier", "antibacterial",
 *        "hypoallergenic", "100% natural", "clean", "paraben-free",
 *        "relieves itching", "treats xerosis".
 * El persimmon aparece descrito con su etiqueta in vitro explícita y sin
 * vincularlo jamás al 2-nonenal. Esa honestidad es, según el informe, el
 * movimiento que ninguna marca de la categoría se atreve a hacer.
 */

/* Las imágenes viven en public/assets/ y las sirve el CDN de Vercel con
   cache inmutable (ver la cabecera de /assets/(.*) en vercel.json). */
const A = '/assets';

const IMG = {
  hero:        `${A}/bar-hero.jpg`,        // barra + caja sobre travertino
  ingredients: `${A}/bar-ingredients.jpg`, // flat lay con caqui y avena
  gift:        `${A}/bar-gift.jpg`,        // set de regalo con la tarjeta
  lather:      `${A}/bar-lather.jpg`,      // macro de espuma
  woman:       `${A}/bar-woman.jpg`,       // retrato mujer ~60
  man:         `${A}/bar-man.jpg`,         // retrato hombre ~65
};

/**
 * Checkout: Shopify, no el de DropStudio.
 *
 * Los CTA no abren el modal del runtime — mandan al carrito nativo de Shopify
 * (`/cart/add?...&return_to=/cart`) y desde ahí el cliente pasa al checkout de
 * Shopify. Consecuencia que hay que tener presente: los pedidos caen en Shopify
 * y **no** en el módulo Pedidos del panel, así que el CPA y el ROAS de T-003 van
 * a salir en cero. Lo que sí se sigue midiendo aquí es el embudo hasta el clic,
 * porque cada CTA lleva `data-ds-cta` y el runtime lo escucha en fase de captura
 * sin hacer `preventDefault`: registra `cta_click`, dispara AddToCart e
 * InitiateCheckout, y deja que el navegador siga al carrito.
 *
 * ⚠️ MONEDA. La tienda sólo tiene el mercado Colombia y su moneda base es COP,
 * así que el carrito cobra en pesos (95.900 / 227.900 / 339.900) mientras esta
 * página está escrita en dólares. Antes de mandar tráfico de EE. UU. hay que
 * abrir un mercado Estados Unidos en USD con precios fijos de 24 / 57 / 85;
 * si no, el visitante ve $24 y el carrito le pide 95.900.
 */
const SHOP = 'https://dermafol.co';

/** Variantes del producto en Shopify, indexadas por cantidad de barras. */
const VARIANT = { 1: '47897745064041', 3: '47897745096809', 5: '47897745129577' };

/** Añade la variante al carrito y deja al cliente en el carrito nativo. */
const cart = (qty) => `${SHOP}/cart/add?id=${VARIANT[qty]}&quantity=1&return_to=/cart`;

/* Paleta: la misma base del sistema Dermafol, con el acento corrido hacia el
   taupe del empaque de la barra en vez del cobre del suplemento. */
const C = {
  tinta: '#2e2e2e', suave: '#6d6d6d', acento: '#8b7362',
  crema: '#f7f4f2', bruma: '#eae4e0', linea: '#e6e0dc',
  bien: '#3f7d58', mal: '#c46a6a',
};

const money = (n) => `$${Number(n).toFixed(2).replace(/\.00$/, '')}`;

/* ── Contenido ────────────────────────────────────────────────────────── */

/**
 * Las tres capas del problema (informe §1.1). La tercera es la que ninguna
 * marca nombra y la que el corpus de cuidadores documenta como causa raíz:
 * la persona deja de lavarse bien porque no alcanza o porque tiene miedo de
 * caerse, no porque no le importe.
 */
const LAYERS = [
  {
    tag: 'What the mirror shows',
    h: 'Skin that feels tight the moment you step out.',
    p: 'After 50 the skin produces fewer lipids and holds less water. The shower you have taken your whole life starts leaving it tight, dry and papery.',
    no: ['Regular bar soap', 'Foaming body wash', 'Longer, hotter showers'],
    si: 'A pH 5.5 syndet bar cleans without the alkalinity that dries',
  },
  {
    tag: 'What nobody explains',
    h: 'Your body\'s natural scent changes over a lifetime.',
    p: 'The chemistry of skin scent shifts with age — several independent labs agree on that, even while they disagree on which compounds. It is biology, not hygiene, and it deserves a straight answer instead of a whisper.',
    no: ['Heavier perfume', 'Scrubbing harder', 'Washing twice a day'],
    si: 'A bar that cleans thoroughly and leaves no heavy fragrance behind',
  },
  {
    tag: 'What nobody asks about',
    h: 'Reaching your own back gets harder than anyone admits.',
    p: 'Shoulders stiffen. Grip weakens. A wet floor stops feeling safe. The most common reason a shower stops doing its job is not indifference — it is reach, grip and fear of falling.',
    no: ['A slippery bar', 'Bottles with stiff caps', 'Bath oils on a wet floor'],
    si: 'A bar shaped to hold when wet, with a draining dish included',
  },
];

/** Comparativa. Columnas cortas porque tienen que caber en 390 px. */
const COMPARE = {
  cols: ['Bar<br>soap', 'Body<br>wash', 'Anti-<br>bacterial', 'Dermafol<br>Bar'],
  rows: [
    ['Skin-friendly pH (5.5, not 9–10)', 0, 1, 0, 1],
    ['Syndet base, not saponified soap', 0, 1, 0, 1],
    ['Glycerin and lipids left in the bar', 0, 0, 0, 1],
    ['No heavy fragrance', 0, 0, 0, 1],
    ['Formulated specifically for skin 50+', 0, 0, 0, 1],
    ['Shaped to grip when wet', 0, 0, 0, 1],
  ],
};

/**
 * Ingredientes. Cada línea describe qué hace el ingrediente EN LA BARRA, sin
 * prometer un efecto fisiológico. El persimmon lleva su etiqueta in vitro
 * explícita: es el ingrediente que más tentación da de exagerar y el único que
 * el informe marca como "úsalo como firma de origen, nunca vinculado al
 * 2-nonenal".
 */
const INGREDIENTS = [
  ['Sodium Cocoyl Isethionate', 'The syndet base. A synthetic detergent pressed into a bar, so it cleans at pH 5.5 instead of the pH 9–10 of traditional saponified soap.'],
  ['Niacinamide', 'One of the most studied ingredients in cosmetic skincare. Here it supports a smooth, even-looking skin surface.'],
  ['Ectoin', 'A natural osmolyte used in cosmetics for its water-binding behavior. It helps the bar leave skin feeling cushioned rather than stripped.'],
  ['Ceramides', 'Lipids naturally present in the outer layer of skin, and less abundant in mature skin. Included so the wash gives some back instead of only taking away.'],
  ['Panthenol', 'A humectant that leaves skin feeling soft and comfortable after rinsing.'],
  ['Colloidal Oatmeal', 'A finely milled oat ingredient used for generations on dry, uncomfortable skin for its soft, soothing feel.'],
  ['Jojoba Oil', 'A cushioning lipid that keeps the lather rich, so the bar rinses clean without that squeaky, over-washed finish.'],
  ['Persimmon Extract', 'Our signature, described honestly: persimmon tannins show deodorizing activity <b>in laboratory testing</b> against ammonia and sulfur compounds. That testing was done in vitro, not on human skin, and we will not stretch it further than that.'],
];

/**
 * ⚠️ TESTIMONIOS DE PLANTILLA — NO PUBLICAR ASÍ.
 *
 * Son estructuras de ejemplo, no clientes reales. En EE. UU. publicar
 * testimonios inventados no es una zona gris: la FTC Rule on Consumer Reviews
 * and Testimonials (16 CFR Part 465, en vigor desde octubre de 2024) prohíbe
 * expresamente las reseñas de consumidores que no existen, con multa civil por
 * infracción. Reemplázalos por clientes reales y verificables antes de mandar
 * un solo dólar de tráfico.
 *
 * El registro de voz está tomado del corpus de 58 citas del informe (§3):
 * objetos concretos —la almohada, el cuello de la camisa, el sillón—, verbos de
 * residuo y "no es falta de higiene". Sirve como guion para la entrevista al
 * cliente real, no como texto final.
 */
const TESTIMONIALS = [
  { n: '[Real customer]', m: '62 · Placeholder, FL', c: 'Dry, tight skin',
    t: 'Template copy — replace with a verified customer quote. Structure to aim for: the specific symptom before, the moment it changed, and the concrete object where they noticed it.',
    data: [['Week 1', 'No tight feeling'], ['Week 3', 'Less flaking'], ['60 days', 'Guarantee']] },
  { n: '[Real customer]', m: '58 · Placeholder, TX', c: 'Sensitive to fragrance',
    t: 'Template copy — replace with a verified customer quote. Structure to aim for: what they had tried before and why it failed for them.',
    data: [['Week 2', 'Shins settled'], ['Week 4', 'Collar test'], ['60 days', 'Guarantee']] },
  { n: '[Real customer]', m: '67 · Placeholder, CA', c: 'Bought it as a gift',
    t: 'Template copy — replace with a verified customer quote. Structure to aim for: the gift-giver angle, and that the card made the conversation possible without anyone feeling accused.' },
  { n: '[Real customer]', m: '71 · Placeholder, AZ', c: 'Reach and grip',
    t: 'Template copy — replace with a verified customer quote. Structure to aim for: the bar holds when wet, the dish keeps it from melting.' },
];

/**
 * FAQ. Las seis primeras salen de las ocho objeciones documentadas del informe
 * (§21). La tercera es deliberadamente la respuesta más honesta de la página:
 * el informe es explícito en que aceptar en voz alta que el olor mayor no es
 * peor —sólo distinto— es el movimiento que más diferencia a una marca en esta
 * categoría, y el que ninguna competencia se atreve a hacer.
 */
const FAQ = [
  ['Is this just an expensive bar of soap?',
   'It is not soap, technically. Traditional soap is made by saponifying oils with an alkali, which lands it at pH 9–10 — well above skin\'s own. This is a syndet bar: synthetic detergents pressed into bar form at pH 5.5. A systematic review of 63 studies (Lichterfeld-Kottner et al., <i>International Journal of Nursing Studies</i>, 2020) found syndet and pH-adjusted cleansers outperform standard soap on dryness in aging skin. That is the entire reason this product exists.'],

  ['Is this one of those products that tells older people they smell?',
   'No, and we want to be direct about it. The best available research points the other way: in a controlled study of body odor across age groups (Mitro et al., <i>PLOS ONE</i>, 2012), the oldest group\'s odor was rated the <b>least</b> intense and the least unpleasant of all six. The idea that a single compound makes older people smell bad comes from one 2001 study funded by the company that then created the category — and an independent lab (Gallagher et al., <i>British Journal of Dermatology</i>, 2008) could not detect that compound in any subject. We sell a better bar for skin that got drier. We are not in the shame business.'],

  ['Will it dry my skin out like the last one did?',
   'That is the failure mode we designed against. Glycerin, jojoba and ceramides stay in the bar so the lather stays cushioned, and the pH sits at 5.5 rather than 9–10. The American Academy of Dermatology also recommends short lukewarm showers and moisturizer within three minutes of stepping out — the bar does its part, the routine does the rest.'],

  ['Does it have fragrance?',
   'Only a trace, kept deliberately low and low-allergen. The AAD recommends fragrance-free or minimally fragranced cleansers for dry, mature skin, and a heavy perfume would work against the point. This bar is designed to leave skin smelling clean, not to leave it smelling of something else.'],

  ['How long does one bar last?',
   'About four to six weeks of daily use for one person. It is formulated and pressed specifically not to turn to mush in the dish — a common and fair complaint about bars in this category — and every order ships with a draining dish, which is most of the battle.'],

  ['I have eczema, psoriasis or another skin condition. Can I use it?',
   'This is a cosmetic cleanser, not a treatment for any medical condition, and we will not claim otherwise. If you are managing a diagnosed skin condition, ask your dermatologist before changing your routine — and bring the ingredient list, which is on the carton and on this page in full.'],

  ['Is it a good gift?',
   'It is the most common reason people buy it, and we built for that on purpose. Every order includes two printed guides, and the 3-bar set arrives gift-ready with a card written to be read without anyone feeling accused. More on that below.'],

  ['What if it does not work for me?',
   '60 days, and you keep the bar. Send one email and we refund the order in full — no return shipping, no form, no questions. In a category where most people have already been disappointed once, asking for anything more would be unreasonable.'],
];

/**
 * Señales de alarma médicas (informe §2.6). Ninguna marca de la categoría las
 * publica. Van aquí por tres razones que apuntan al mismo sitio: un cambio de
 * olor puede ser un signo clínico tratable y venderle jabón a alguien con
 * cetoacidosis es indefendible; protege legalmente; y es exactamente la
 * información que el hijo cuidador está buscando y no encuentra.
 */
const RED_FLAGS = [
  'A sudden or marked change in body odor, rather than a gradual one',
  'A fruity or acetone-like smell — this one is urgent',
  'An ammonia-like or bleach-like smell',
  'A sweetish, musty smell alongside confusion or yellowing skin — urgent',
  'Odor from one skin fold, with redness or brown patches',
  'Odor coming from a wound or a sore',
  'Odor with weight loss, fever or new confusion',
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
.s.bruma{background:${C.bruma}}
.s.tinta{background:${C.tinta};color:#fff}
.eye{font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:${C.acento};margin-bottom:9px}
.s.tinta .eye{color:#d9c5b4}
h1{font-size:29px}
h2{font-size:24px}
h3{font-size:17px}
.kick{color:${C.suave};font-size:15.5px;margin-top:10px}
.s.tinta .kick{color:rgba(255,255,255,.74)}
.c{text-align:center}
.pic{border-radius:16px;overflow:hidden;border:1px solid ${C.linea};background:${C.crema}}
.s.tinta .pic{border-color:rgba(255,255,255,.14)}
.src{font-size:11px;color:#9b938d;line-height:1.45;margin-top:10px}
.s.tinta .src{color:rgba(255,255,255,.5)}
.src i{font-style:italic}

.bar{background:${C.bruma};text-align:center;padding:9px 14px;font-size:12.5px;line-height:1.35}
.bar b{font-weight:700}
.nav{border-bottom:1px solid ${C.linea};padding:13px 0;text-align:center}
.nav .lg{font-size:19px;font-weight:700;letter-spacing:-.02em;color:${C.tinta}}
.nav .lg span{color:${C.acento}}

/* Hero: titular y producto arriba, botón sin bajar */
.hero{padding:18px 0 30px}
.stars{color:#c9a227;letter-spacing:.5px;font-size:12.5px}
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

.doc{background:#fff;border:1px solid ${C.linea};border-radius:18px;padding:22px}
.doc q{font-size:16.5px;line-height:1.5;display:block;margin-bottom:14px;font-style:italic}
.doc .nm{font-weight:700;font-size:14.5px}
.doc .pr{font-size:13px;color:${C.suave}}

.ing{background:#fff;border:1px solid ${C.linea};border-radius:14px;padding:15px 17px;margin-bottom:9px}
.ing .n{font-weight:700;font-size:15px;margin-bottom:4px}
.ing .d{font-size:13.5px;color:${C.suave};line-height:1.5}
.ing.sig{border-color:${C.acento};background:#fdfbf9}
.ing.sig .n{color:${C.acento}}

.tl{display:grid;gap:11px}
.tl .card{border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:18px;background:rgba(255,255,255,.05)}
.tl .wk{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#d9c5b4;margin-bottom:7px}
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
.tst .datos b{display:block;font-size:15px;font-weight:700;color:${C.bien}}
.tst .datos span{font-size:9.5px;color:${C.suave};line-height:1.2;display:block}
.tst q{font-size:14.5px;line-height:1.55;flex:1;display:block;margin-bottom:13px}
.tst .who{padding-top:11px;border-top:1px solid ${C.linea};display:flex;align-items:center;gap:10px}
.tst .av{width:36px;height:36px;border-radius:50%;background:${C.bruma};display:grid;place-items:center;
  font-weight:700;font-size:14px;flex:0 0 auto}
.tst .nm{font-weight:700;font-size:13.5px}
.tst .mt{font-size:11.5px;color:${C.suave}}
.hint{text-align:center;font-size:11.5px;color:${C.suave};margin-top:2px}

/* Bloque de la conversación: el activo que el informe dice que nadie tiene */
.talk{background:#fff;border:1px solid ${C.linea};border-radius:18px;padding:22px;margin-top:18px}
.talk ul{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:12px}
.talk li{display:flex;gap:12px;align-items:flex-start}
.talk .num{flex:0 0 auto;width:25px;height:25px;border-radius:8px;background:${C.bruma};color:${C.acento};
  display:grid;place-items:center;font-weight:700;font-size:12px}
.talk .tx{font-size:14px;line-height:1.5}
.talk .tx b{display:block;margin-bottom:2px}
.talk .tx span{color:${C.suave}}

.flags{background:#fff;border:1px solid ${C.linea};border-left:3px solid ${C.mal};border-radius:14px;padding:20px}
.flags ul{list-style:none;padding:0;margin:12px 0 0;display:grid;gap:7px}
.flags li{font-size:13.5px;line-height:1.45;color:${C.suave};display:flex;gap:8px}
.flags li::before{content:'•';color:${C.mal};font-weight:700;flex:0 0 auto}

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

.guar{background:${C.bruma};border-radius:18px;padding:22px;text-align:center}
.guar .ic2{width:46px;height:46px;border-radius:50%;background:${C.tinta};color:#fff;display:grid;
  place-items:center;font-size:21px;margin:0 auto 13px}
.guar p{font-size:14.5px;color:#4a4a4a;margin-top:8px}

.faq details{background:#fff;border:1px solid ${C.linea};border-radius:13px;margin-bottom:8px}
.faq summary{padding:15px 17px;font-weight:600;font-size:14.5px;cursor:pointer;list-style:none;
  display:flex;justify-content:space-between;gap:12px;align-items:center;line-height:1.35}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'+';font-size:19px;color:${C.acento};font-weight:400;flex:0 0 auto}
.faq details[open] summary::after{content:'−'}
.faq .a{padding:0 17px 15px;color:${C.suave};font-size:14px;line-height:1.6}
.faq .a i{font-style:italic}

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
footer .lg{font-size:17px;font-weight:700;color:#fff;margin-bottom:10px}
footer .fine{margin-top:14px;font-size:11px;opacity:.7;line-height:1.6;text-align:left}

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
  .planes{grid-template-columns:repeat(3,1fr)}
  .riel{display:grid;grid-template-columns:repeat(4,1fr);overflow:visible;margin:0;padding:0}
  .tst{flex:auto}
  .hint{display:none}
  .ings{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .ing{margin-bottom:0}
  .ing.sig{grid-column:1/-1}
  .duo{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:center}
  .tabla table{font-size:14px}
  .tabla thead th{font-size:12px}
  .tabla tbody td.q{font-size:14.5px}
  .sticky{display:none}
}
`;

/* ── Bloques ──────────────────────────────────────────────────────────── */

const tick = '<span class="ic">✓</span>';
const logo = '<span class="lg">Dermaf<span>ó</span>l</span>';

const photo = (src, alt, w, h, extra = '') =>
  `<img class="pic" src="${src}" alt="${alt}" width="${w}" height="${h}" ${extra}>`;

const hero = (o) => `
<div class="bar">Free shipping on every order · <b>60-day money-back guarantee</b></div>
<nav class="nav">${logo}</nav>

<section class="hero"><div class="w"><div class="grid">
  <div>
    <div class="rate"><span class="stars">★★★★★</span> Formulated for skin 50 and over</div>
    <h1>Your skin changed after 50.<br><span class="em">Your soap didn't.</span></h1>
    <p class="sub">Regular bar soap sits at pH 9–10. Mature skin does not. Dermafol is a pH 5.5 syndet bar built for skin that feels tight, dry and thinner than it used to.</p>
  </div>
  <div class="heropic">${photo(IMG.hero, 'The Dermafol cleansing bar for mature skin, resting against its carton on a stone ledge', 1280, 955, 'fetchpriority="high"')}</div>
  <div>
    <a href="${cart(3)}" class="cta" data-ds-cta>GET MY BAR<span class="sub2">${money(o.price)} · Free shipping · 60-day guarantee</span></a>
    <ul class="ticks" style="margin:16px 0 0">
      <li>${tick}Skin that doesn't feel tight when you step out</li>
      <li>${tick}A clean, fresh finish without heavy perfume</li>
      <li>${tick}A bar that grips when wet — dish included</li>
    </ul>
    <div class="badges"><span>pH 5.5</span><span>Syndet, not soap</span><span>Free shipping</span><span>60-day guarantee</span></div>
  </div>
</div></div></section>

<section style="padding:0 0 38px"><div class="w"><div class="stats">
  <div><b>5.5</b><span>Bar pH, close to skin's own</span></div>
  <div><b>9–10</b><span>Where regular soap sits</span></div>
  <div><b>63</b><span>Studies in the review behind this bar</span></div>
  <div><b>60 days</b><span>Guarantee, and you keep the bar</span></div>
</div>
<p class="src">Systematic review: Lichterfeld-Kottner et al., <i>International Journal of Nursing Studies</i>, 2020 (63 articles; protocol PROSPERO CRD42018100792), which found syndet and pH-adjusted cleansers outperform standard soap on dryness in aging skin.</p>
</div></section>`;

const problem = () => `
<section class="s crema"><div class="w">
  <div class="c" style="margin-bottom:24px">
    <div class="eye">Let's be straight about it</div>
    <h2>It isn't hygiene.<br>It's biology.</h2>
    <p class="kick">Three things change after 50. Nobody sits you down and explains any of them, and only one of them is about washing more.</p>
  </div>
  ${LAYERS.map((c) => `
  <div class="causa">
    <div class="tag">${c.tag}</div>
    <h3>${c.h}</h3>
    <p class="d">${c.p}</p>
    <div class="cols">
      <div class="lbl">What doesn't fix it</div>
      <ul>${c.no.map((x) => `<li>${x}</li>`).join('')}</ul>
      <div class="lbl">What does</div>
      <div class="si">${c.si}</div>
    </div>
  </div>`).join('')}
</div></section>`;

const compare = (o) => `
<section class="s"><div class="w">
  <div class="c" style="margin-bottom:22px">
    <div class="eye">Why the last one didn't work</div>
    <h2>Compare it to what's in your shower now</h2>
    <p class="kick">Most of the shelf was formulated for skin thirty years younger than yours.</p>
  </div>
  <div class="tabla"><table>
    <thead><tr><th></th>${COMPARE.cols.map((c, i) =>
      `<th class="${i === COMPARE.cols.length - 1 ? 'mio' : ''}">${c}</th>`).join('')}</tr></thead>
    <tbody>${COMPARE.rows.map((f) => `
      <tr><td class="q">${f[0]}</td>${f.slice(1).map((v, i) =>
        `<td class="${i === 3 ? 'mio' : ''}">${v ? '<span class="si2">✓</span>' : '<span class="no2">✕</span>'}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table></div>
  <a href="${cart(3)}" class="cta" data-ds-cta style="margin-top:22px">SWITCH MY BAR<span class="sub2">${money(o.price)} · Free shipping</span></a>
</div></section>`;

const mechanism = () => `
<section class="s crema"><div class="w">
  <div class="c" style="margin-bottom:22px">
    <div class="eye">What makes it different</div>
    <h2>Three formulation decisions, and what each one is for</h2>
  </div>
  <div style="margin-bottom:18px">${photo(IMG.lather, 'Close-up of the Dermafol bar building a rich, creamy lather', 1080, 806, 'loading="lazy"')}</div>
  <div class="mech">
    <div class="card"><div class="n">1</div><h3>A syndet bar, not soap</h3>
      <p>Traditional soap is saponified oils and lands at pH 9–10. This is a synthetic-detergent bar pressed at pH 5.5 — the single change with the most evidence behind it for mature skin.</p></div>
    <div class="card"><div class="n">2</div><h3>The good stuff stays in</h3>
      <p>Glycerin, jojoba and ceramides are left in the bar rather than stripped out, so the lather cushions instead of squeaks and skin feels comfortable after rinsing.</p></div>
    <div class="card"><div class="n">3</div><h3>Clean, then nothing</h3>
      <p>It washes odor away during the shower and leaves almost no fragrance behind. Heavy perfume irritates dry skin, and covering something up was never the goal.</p></div>
  </div>
</div></section>`;

const authority = () => `
<section class="s"><div class="w">
  <div class="c" style="margin-bottom:20px"><div class="eye">What the guidance actually says</div><h2>We didn't invent this brief</h2></div>
  <div class="doc">
    <q>For adults in their 60s and 70s, the American Academy of Dermatology recommends short, lukewarm showers rather than daily hot ones; a gentle, fragrance-free cleanser; patting dry while leaving some moisture on the skin; and moisturizer within the first three minutes.</q>
    <div class="nm">American Academy of Dermatology</div>
    <div class="pr">Public skin-care guidance for adults 60+</div>
  </div>
  <p class="src">This bar is built to be the cleanser half of that routine. The AAD does not endorse Dermafol or any brand — we are citing published public guidance, not a partnership.</p>
</div></section>`;

const ingredients = () => `
<section class="s crema"><div class="w">
  <div class="c" style="margin-bottom:20px">
    <div class="eye">Every ingredient, and its job</div>
    <h2>Nothing in here without a reason we can say out loud</h2>
  </div>
  <div style="margin-bottom:18px">${photo(IMG.ingredients, 'The Dermafol bar surrounded by persimmon, oats and jojoba oil', 1080, 806, 'loading="lazy"')}</div>
  <div class="ings">${INGREDIENTS.map(([n, d], i) => `
    <div class="ing${i === INGREDIENTS.length - 1 ? ' sig' : ''}"><div class="n">${n}</div><div class="d">${d}</div></div>`).join('')}</div>
</div></section>`;

const social = (o) => `
<section class="s"><div class="w">
  <div class="c" style="margin-bottom:20px"><div class="eye">In their words</div><h2>What people tell us</h2></div>
  <div class="riel">${TESTIMONIALS.map((t) => `
    <div class="tst">
      <div class="stars">★★★★★</div>
      ${t.data ? `<div class="datos">${t.data.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>` : ''}
      <q>${t.t}</q>
      <div class="who"><div class="av">${t.n.charAt(1) || '·'}</div>
        <div><div class="nm">${t.n}</div><div class="mt">${t.m} · ${t.c}</div></div></div>
    </div>`).join('')}</div>
  <p class="hint">Swipe for more →</p>
  <div class="duo" style="margin-top:24px">
    ${photo(IMG.woman, 'A woman in her sixties drying her forearm after a shower', 1080, 806, 'loading="lazy"')}
    ${photo(IMG.man, 'A man in his sixties buttoning his shirt collar at the bathroom mirror', 1080, 806, 'loading="lazy"')}
  </div>
  <a href="${cart(3)}" class="cta" data-ds-cta style="margin-top:22px">TRY IT FOR 60 DAYS<span class="sub2">${money(o.price)} · Keep the bar if it's not for you</span></a>
</div></section>`;

const timeline = () => `
<section class="s tinta"><div class="w">
  <div class="c" style="margin-bottom:22px"><div class="eye">What to expect</div><h2>A small promise you can actually check</h2></div>
  <div class="tl">
    <div class="card"><div class="wk">First wash</div><h3>No tight feeling</h3><p>The clearest early signal. You step out of the shower and your skin doesn't feel like it's pulling.</p></div>
    <div class="card"><div class="wk">Weeks 1–2</div><h3>Shins and forearms settle</h3><p>The places dryness shows first are the places it eases first. Less flaking, less roughness under your hand.</p></div>
    <div class="card"><div class="wk">Weeks 3–4</div><h3>Check the shirt collar</h3><p>Not a mirror test — an object test. The collar of a shirt at the end of a long day, and the pillowcase in the morning. Those tell you more than we can.</p></div>
  </div>
</div></section>`;

/**
 * El bloque de la conversación. El informe (§3.2, §28.5) es contundente: en los
 * foros de cuidadores la pregunta que encabeza los hilos no es "¿qué producto
 * compro?" sino "how can I bring this up without causing major drama?". Vienen
 * buscando un guion, no un jabón, y ninguna marca de la categoría se lo da.
 * Aquí las dos guías impresas son ese guion, y son también la razón por la que
 * el set de 3 se regala mejor que una barra suelta.
 */
const conversation = () => `
<section class="s crema"><div class="w">
  <div class="c" style="margin-bottom:20px">
    <div class="eye">If you're buying this for someone else</div>
    <h2>The hardest part was never the soap</h2>
    <p class="kick">It's saying something to someone you love without them feeling accused. Every order ships with the words to do it.</p>
  </div>
  <div style="margin-bottom:18px">${photo(IMG.gift, 'The Dermafol gift set: carton, bar, draining dish and printed card', 1080, 806, 'loading="lazy"')}</div>
  <div class="talk">
    <h3>Two printed guides, in large type, in every box</h3>
    <ul>
      <li><span class="num">1</span><div class="tx"><b>The 50+ Body Care Guide</b><span>One page, large type, high contrast. What changes in skin after 50, the shower routine the AAD actually recommends, and the medical warning signs on this page — the ones that mean call a doctor, not buy a soap.</span></div></li>
      <li><span class="num">2</span><div class="tx"><b>How To Talk About This</b><span>A card written to be read without anyone feeling judged. It explains the biology first, so the person receiving it gets an explanation rather than a hint. You don't have to say anything — that's the point.</span></div></li>
    </ul>
  </div>
  <div class="flags" style="margin-top:14px">
    <h3>When it isn't cosmetic — see a doctor</h3>
    <p class="kick" style="margin-top:6px;font-size:14px">A change in body odor can be a treatable medical sign, and no soap should be standing between someone and a diagnosis. Talk to a physician if you notice:</p>
    <ul>${RED_FLAGS.map((f) => `<li>${f}</li>`).join('')}</ul>
  </div>
</div></section>`;

const offer = (list) => {
  const [one, three, five] = [list[0], list[1] || list[0], list[2] || list[1] || list[0]];
  const unit = one.price;
  return `
<section class="s" id="oferta"><div class="w">
  <div class="c" style="margin-bottom:24px">
    <div class="eye">Choose your set</div>
    <h2>One bar lasts four to six weeks</h2>
    <p class="kick">Every order ships free, with both guides and a draining dish.</p>
  </div>

  <div class="planes">
    <div class="plan" data-plan="0" data-qty="1">
      <div class="top"><div class="q">1 bar</div><div class="price"><b>${money(one.price)}</b></div></div>
      <p class="desc">Try it once. Same 60-day guarantee as every other option.</p>
    </div>
    <div class="plan best" data-plan="1" data-qty="3">
      <span class="badge">Most popular · gift ready</span>
      <div class="top"><div class="q">3 bars</div><div class="price"><b>${money(three.price)}</b><s>${money(unit * 3)}</s></div></div>
      <div class="save">${money(three.price / 3)} each · save ${money(unit * 3 - three.price)}</div>
      <p class="desc">Four to five months for one person, or one to keep and two to give. Arrives gift-ready with the card.</p>
    </div>
    <div class="plan" data-plan="2" data-qty="5">
      <div class="top"><div class="q">5 bars</div><div class="price"><b>${money(five.price)}</b><s>${money(unit * 5)}</s></div></div>
      <div class="save">${money(five.price / 5)} each · save ${money(unit * 5 - five.price)}</div>
      <p class="desc">Best value per bar. For a household of two, or a year of not thinking about it.</p>
    </div>
  </div>

  <ul class="stack">
    <li><div class="d">Dermafol Cleansing Bar · 4.23 oz<small>pH 5.5 syndet bar, formulated for mature skin</small></div><b>${money(unit)}</b></li>
    <li><div class="d">The 50+ Body Care Guide<small>Printed, large type, with the medical warning signs</small></div><b class="free">Included</b></li>
    <li><div class="d"><i>How To Talk About This</i> card<small>The conversation, written so nobody feels accused</small></div><b class="free">Included</b></li>
    <li><div class="d">Draining soap dish<small>So the bar lasts the four to six weeks it should</small></div><b class="free">Included</b></li>
    <li><div class="d">Shipping<small>Free on every order, 3–5 business days</small></div><b class="free">Free</b></li>
  </ul>

  <div class="total">
    <div class="r"><span>3 bars at full price</span><s>${money(unit * 3)}</s></div>
    <div class="r"><span>Today</span><b>${money(three.price)}</b></div>
  </div>

  <a href="${cart(3)}" class="cta" data-ds-cta>GET THE 3-BAR SET<span class="sub2">Free shipping · 60-day guarantee · Keep the bar</span></a>
</div></section>

<section class="s crema"><div class="w"><div class="guar">
  <div class="ic2">✓</div>
  <h3>60 days. And you keep the bar.</h3>
  <p>Most people who buy this have already been let down by something that promised the same thing. So we're not asking for faith: use it for two months, and if your skin doesn't feel better, email us and we refund the whole order. No return shipping, no form, no questions.</p>
</div></div></section>`;
};

const faqs = () => `
<section class="s"><div class="w">
  <div class="c" style="margin-bottom:20px"><div class="eye">Straight answers</div><h2>The questions people actually ask</h2></div>
  <div class="faq">${FAQ.map(([q, a], i) => `
    <details${i === 0 ? ' open' : ''}><summary>${q}</summary><div class="a">${a}</div></details>`).join('')}</div>
</div></section>`;

const close = (o) => `
<section class="s crema"><div class="w ps">
  <div class="eye">One last thing</div>
  <p>There is a version of this product that sells much faster than ours. It tells you that people your age smell, that there's a compound responsible, and that a bar of soap will fix it before anyone notices.</p>
  <p>We looked into that claim properly. An independent lab couldn't find the compound in a single subject, and the best study of how people actually perceive age and body odor found the oldest group was rated the least unpleasant of all. So we're not going to sell you that story.</p>
  <p>What we'll sell you is a better-built bar. Your skin makes fewer lipids than it did at 30 and holds less water, and the soap in most showers is alkaline enough to make that worse every single day. Changing it is a small thing that you'll feel the first time you step out of the shower.</p>
  <p>Sixty days, and you keep the bar either way.</p>
  <p class="sign">— The Dermafol team</p>
  <a href="${cart(3)}" class="cta" data-ds-cta style="margin-top:20px">GET MY BAR<span class="sub2">${money(o.price)} · Free shipping · 60-day guarantee</span></a>
</div></section>

<div class="sticky" id="sticky"><div class="in">
  <div class="pz"><b>${money(o.price)}</b></div>
  <a href="${cart(3)}" data-ds-cta>ORDER NOW</a>
</div></div>

<footer><div class="w">
  <div class="lg">Dermafól</div>
  <p>Body care formulated for mature skin.</p>
  <p class="fine">Dermafol Cleansing Bar is a cosmetic product. It is intended to cleanse skin and is not intended to diagnose, treat, cure or prevent any disease. Statements on this page describe the product's cosmetic performance and the published research that informed how it was formulated; they are not claims that the product produces a physiological effect. If you are managing a diagnosed skin condition, or you notice a sudden change in body odor, speak with a physician.</p>
  <p style="margin-top:10px;font-size:11px;opacity:.7">© 2026 Dermafol. All rights reserved.</p>
</div></footer>`;

/* ── Página ───────────────────────────────────────────────────────────── */

export function renderDermafolBarFunnel(offers = []) {
  const list = offers.length ? offers : [
    { id: '', name: '1 bar', qty: 1, price: 24 },
    { id: '', name: '3 bars', qty: 3, price: 57 },
    { id: '', name: '5 bars', qty: 5, price: 85 },
  ];
  const o = list[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Dermafol Cleansing Bar | Your skin changed after 50. Your soap didn't.</title>
<meta name="description" content="A pH 5.5 syndet cleansing bar formulated for mature skin. Cleans without the alkalinity that leaves skin tight and dry. Free shipping and a 60-day guarantee.">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="image" href="${IMG.hero}" fetchpriority="high">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${hero(o)}
${problem()}
${compare(o)}
${mechanism()}
${authority()}
${ingredients()}
${social(o)}
${timeline()}
${conversation()}
${offer(list)}
${faqs()}
${close(o)}
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

  // Elegir un plan reapunta TODOS los CTA a la variante de Shopify que toca,
  // incluido el de la barra fija. Si no se reapuntaran, alguien que elige el
  // pack de 5 y luego baja al botón del cierre acabaría comprando el de 3.
  var CART = ${JSON.stringify({ 1: cart(1), 3: cart(3), 5: cart(5) })};
  function aim(qty){
    var href = CART[qty] || CART[3];
    document.querySelectorAll('a[data-ds-cta]').forEach(function(a){ a.href = href; });
  }

  document.querySelectorAll('.plan').forEach(function(p){
    p.addEventListener('click', function(){
      document.querySelectorAll('.plan').forEach(function(x){ x.classList.remove('best'); });
      p.classList.add('best');
      aim(p.dataset.qty);
    });
  });
})();
</script>
</body>
</html>`;
}

export const DERMAFOL_BAR_SLUG = 'dermafol-bar';
