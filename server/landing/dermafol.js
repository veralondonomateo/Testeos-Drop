/**
 * Funnel de Dermafol 360°.
 *
 * Misma arquitectura de venta que la landing de Plasma —problema, mecanismo,
 * autoridad, prueba, oferta, garantía, cierre— pero con la identidad de
 * Dermafol y, sobre todo, con su contenido: todos los testimonios, las cifras y
 * las citas salen de dermafol.co. No hay nada inventado aquí; si un dato no
 * estaba en la tienda, no está en esta página.
 *
 * La diferencia con la réplica (`/p/dermafol-360`) es la estructura: aquella
 * conserva el maquetado de Instant tal cual para poder diagnosticarlo, esta
 * reordena el mismo material en secuencia de funnel.
 */

const A = 'https://cdn.instant.so/sites/lS1UEWTFIWeYBash/assets';

/* Paleta tomada del CSS de la tienda: #2e2e2e domina, #916e53 es el acento de
   las insignias, #f8f6f5 el fondo y #e0eaf0 la barra superior. */
const C = {
  tinta: '#2e2e2e',
  suave: '#6d6d6d',
  acento: '#916e53',
  crema: '#f8f6f5',
  azul: '#e0eaf0',
  linea: '#e8e4e2',
  bien: '#3f7d58',
};

const IMG = {
  producto: `${A}/Ig2g8D3zUzB466s3/frame-1984078975.webp`,
  banner: `${A}/4oZZWvQjMKzZfejF/bannerdesk.webp`,
  bannerMovil: `${A}/HaCRigEikjU692Ff/bannermob.webp`,
  antes: `${A}/8IcCwAgjulMitJ1n/ba.webp`,
  despues: `${A}/rbRPlBWskkpgJdYi/ba-1.webp`,
  doctora: `${A}/gPcnscASvf2TcXQe/image-1.webp`,
  mujer2: `${A}/KhURMnwxAtkBP1aq/image-2.webp`,
  mujer3: `${A}/HoS3P8FO0Of7P16s/image-3.webp`,
  logo: `${A}/OGV7Ka7GLbNq8D4q/logo.webp`,
  ebook: `${A}/qYNBOhKO3pu1BBnj/diseno-sin-titulo-8.png`,
  biotina: `${A}/3hjt2sE9hQiu8dQU/biotina.webp`,
  colageno: `${A}/aCKCInXgkRULwci4/colageno.webp`,
  saw: `${A}/h0YODcOCJJvW9DLE/saw.webp`,
  zinc: `${A}/l2fhPyQ3ghD1khv1/zinc.webp`,
  vitamina: `${A}/iyejBV1fAyGp1dkw/vitamina.webp`,
};

/* ── Contenido, todo de la tienda ─────────────────────────────────────── */

const CAUSAS = [
  {
    tag: 'La causa más ignorada',
    h: 'Tu cabello responde a tus hormonas.',
    p: 'La DHT miniaturiza el folículo y acorta el ciclo de crecimiento. Ningún shampoo puede tocar eso.',
    no: ['Shampoos anticaída', 'Serums capilares', 'Minoxidil solo'],
    si: 'Dermafol lo regula desde adentro con Saw Palmetto + Zinc',
  },
  {
    tag: 'El detonante silencioso',
    h: 'El cortisol también cae en el cabello.',
    p: 'El cortisol interrumpe el ciclo capilar y manda los folículos a reposo. No es ansiedad, es biología.',
    no: ['Vitaminas sueltas', 'Tratamientos tópicos', 'Masajes capilares'],
    si: 'Dermafol reduce ese impacto con adaptógenos específicos',
  },
  {
    tag: 'Lo que falta sin saberlo',
    h: 'Zinc y vitamina D, los déficits que nadie revisa.',
    p: 'Dos de los nutrientes más críticos para el folículo. Y dos de los más bajos en mujeres con caída hormonal.',
    no: ['Biotina sola', 'Colágeno genérico', 'Suplementos sin foco'],
    si: 'Dermafol los aporta en la dosis correcta para mujeres 35+',
  },
];

const INGREDIENTES = [
  { img: IMG.biotina, n: 'Biotina', t: 'Vitamina del grupo B',
    d: 'La vitamina clave para la síntesis de queratina, la proteína que forma el cabello. Su deficiencia está directamente asociada a cabello frágil y caída.',
    tags: ['Estructura capilar', 'Resistencia del cabello'] },
  { img: IMG.colageno, n: 'Colágeno hidrolizado', t: 'Proteína estructural',
    d: 'Refuerza la estructura del folículo desde adentro. Mejora la elasticidad del cuero cabelludo y la resistencia del cabello ante el quiebre.',
    tags: ['Folículo', 'Elasticidad'] },
  { img: IMG.saw, n: 'Saw Palmetto', t: 'Extracto de palma',
    d: 'Actúa sobre los andrógenos que contribuyen a la caída hormonal femenina. Uno de los activos más estudiados para la alopecia androgenética.',
    tags: ['Regulación hormonal', 'Caída androgénica'] },
  { img: IMG.zinc, n: 'Zinc', t: 'Mineral esencial',
    d: 'Mineral esencial para el ciclo de crecimiento capilar y la síntesis proteica del cabello. Uno de los déficits más comunes en mujeres con caída hormonal.',
    tags: ['Ciclo capilar', 'Síntesis proteica'] },
  { img: IMG.vitamina, n: 'Vitamina D3', t: 'Vitamina liposoluble',
    d: 'Participa directamente en la proliferación celular del folículo piloso. Su deficiencia está asociada a efluvio telógeno, el tipo de caída más común en mujeres mayores de 35 años.',
    tags: ['Proliferación folicular'] },
  { img: IMG.producto, n: 'Minoxidil 2%', t: 'Activo vasodilatador · Roll-On tópico',
    d: 'Activo clínico que prolonga la fase anágena, la fase de crecimiento del cabello. Reactiva folículos que entraron en reposo por cambios hormonales o estrés. Concentración aprobada y estudiada específicamente para mujeres.',
    tags: ['Reactivación folicular', 'Densidad capilar'] },
];

/* Los nueve testimonios que están publicados en dermafol.co, sin retocar más
   que las erratas evidentes. */
const TESTIMONIOS = [
  { n: 'Claudia R.', m: '47 años · Bogotá', c: 'Menopausia temprana', foto: IMG.doctora,
    t: 'En 10 semanas dejé de ver cabello en la ducha. Por fin algo que funciona de verdad.',
    datos: [['−68%', 'Caída diaria'], ['+43%', 'Densidad'], ['Sem. 4', 'Primer cambio']] },
  { n: 'Patricia M.', m: '36 años · Medellín', c: 'Cambio hormonal', foto: IMG.mujer2,
    t: 'Entendí por primera vez por qué perdía cabello. Y cuando entendí la causa, confié en el protocolo.',
    datos: [['−74%', 'Caída diaria'], ['+51%', 'Densidad'], ['Sem. 7', 'Primer cambio']] },
  { n: 'Lorena T.', m: '44 años · Cali', c: 'Caída por estrés', foto: IMG.mujer3,
    t: 'Lo atribuía al estrés y lo dejé pasar. El protocolo fue fácil de incluir en mi rutina y los resultados llegaron sin que me diera cuenta. ¡100% recomendado!' },
  { n: 'Sara R.', m: '37 años · Bogotá', c: 'Dos años con caída',
    t: 'Llevaba dos años con el problema. En la semana 4 noté la diferencia. Nunca había entendido que era hormonal hasta que leí sobre Dermafol.' },
  { n: 'Viviana Fernández', m: 'Bogotá', c: 'Caída después de los 30',
    t: 'Por los trancones y el estrés después de los 30 se me empezó a caer el cabello. Gracias a Dios, luego de mes y medio tomando Dermafol y usando el serum bien juiciosa, he visto resultados increíbles.' },
  { n: 'Maricela Torres', m: '36 años', c: 'Caída androgénica',
    t: 'Mi cabello se empezó a caer mucho luego de que cumplí 36 años, era algo androgénico. Tomé Dermafol por casi dos meses y los resultados fueron excelentes.' },
  { n: 'Beatriz Soto', m: 'Colombia', c: 'Caída por tracción',
    t: 'Desde pequeña mi madre me hacía muchas trenzas y por eso se me caía mucho el cabello. Dermafol me ayudó a que dejara de caerse, y ahorita empecé a ver pelitos nuevos creciendo.' },
  { n: 'Gina Ortiz', m: 'Colombia', c: 'Clienta verificada',
    t: 'Me sirvió muchísimo. Muchas gracias.' },
  { n: 'Amelia Osorio', m: 'Colombia', c: 'Clienta verificada',
    t: 'Muy buena calidad y llegó muy rápido. El producto, muy bien.' },
];

const FAQ = [
  ['¿Cuánto tarda en verse resultados?',
   'La mayoría nota reducción de caída entre la semana 4 y 6. Los resultados visibles de densidad y nuevos cabellos aparecen entre la semana 8 y 12. El ciclo capilar completo requiere constancia, no hay atajos biológicos.'],
  ['¿El Roll-On tiene efectos secundarios?',
   'Contiene Minoxidil al 2%, concentración aprobada y segura para mujeres. La fórmula es de aplicación localizada (entradas, coronilla) y de rápida absorción. En algunos casos puede haber leve irritación inicial que cede en pocos días.'],
  ['¿Puedo usarlo si ya probé minoxidil solo?',
   'Sí. El minoxidil solo actúa sobre el folículo pero no resuelve el origen hormonal. El diferencial de Dermafol es el suplemento que trabaja internamente. Los dos juntos potencian lo que uno solo no logra.'],
  ['¿Cada cuánto debo comprar?',
   'El Combo está diseñado para 1 mes de tratamiento. Recomendamos mínimo 3 meses consecutivos para completar un ciclo capilar completo y consolidar los resultados.'],
  ['¿Envían a todo Colombia?',
   'Sí. Envío disponible a nivel nacional con seguimiento de pedido. Tiempos de entrega: 2 a 4 días hábiles a ciudades principales.'],
  ['¿Y si no me funciona?',
   'Tienes 30 días de garantía. Si no notas ningún cambio en la caída, nos escribes y te devolvemos el 100% de tu dinero, sin preguntas.'],
];

const money = (n) => '$' + Number(n).toLocaleString('es-CO');

/* ── Estilos ──────────────────────────────────────────────────────────── */

const CSS = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;font-family:'DM Sans',system-ui,-apple-system,sans-serif;color:${C.tinta};
  background:#fff;line-height:1.6;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
h1,h2,h3{margin:0;line-height:1.15;letter-spacing:-.022em;font-weight:700}
p{margin:0}
a{color:inherit}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
.narrow{max-width:720px;margin:0 auto;padding:0 20px}
.sec{padding:64px 0}
.sec.crema{background:${C.crema}}
.sec.azul{background:${C.azul}}
.sec.tinta{background:${C.tinta};color:#fff}
.eyebrow{font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.acento};margin-bottom:11px}
.sec.tinta .eyebrow{color:#d9c2ab}
h2{font-size:clamp(26px,4.6vw,38px)}
h3{font-size:clamp(19px,2.6vw,23px)}
.kick{color:${C.suave};font-size:17px;margin-top:13px;max-width:620px}
.sec.tinta .kick{color:rgba(255,255,255,.72)}
.center{text-align:center}
.center .kick{margin-left:auto;margin-right:auto}

/* Barra superior */
.bar{background:${C.azul};text-align:center;padding:10px 16px;font-size:13.5px;font-weight:500}
.bar b{font-weight:700}
.nav{border-bottom:1px solid ${C.linea};padding:14px 0;position:sticky;top:0;background:rgba(255,255,255,.94);
  backdrop-filter:blur(8px);z-index:60}
.nav .wrap{display:flex;align-items:center;justify-content:center}
.nav img{height:26px;width:auto}

/* Hero */
.hero{padding:44px 0 56px}
.hero .grid{display:grid;grid-template-columns:1.05fr .95fr;gap:46px;align-items:center}
.hero .grid>*{min-width:0}
.hero h1{font-size:clamp(31px,5.3vw,50px)}
.hero .em{color:${C.acento}}
.rating{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:600;margin-bottom:16px}
.rating .st{color:#e8a33d;letter-spacing:1px}
.flag{background:${C.azul};border-radius:11px;padding:12px 15px;font-size:14.5px;font-weight:500;margin-bottom:16px}
.ticks{list-style:none;padding:0;margin:22px 0 0;display:grid;gap:11px}
.ticks li{display:flex;gap:11px;align-items:flex-start;font-size:16px}
.ticks .ic{flex:0 0 auto;width:21px;height:21px;border-radius:50%;background:${C.tinta};color:#fff;
  display:grid;place-items:center;font-size:11px;margin-top:2px}
.hero-media{position:relative}
.hero-media img{border-radius:20px;width:100%}
.trustrow{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.trustrow span{background:${C.crema};border:1px solid ${C.linea};border-radius:999px;padding:7px 13px;
  font-size:12.5px;font-weight:600;color:#4a4a4a}

/* Botones */
.cta{display:block;width:100%;max-width:430px;background:${C.tinta};color:#fff;text-decoration:none;
  text-align:center;padding:19px 22px;border-radius:14px;font-weight:700;font-size:16.5px;border:0;
  cursor:pointer;font-family:inherit;letter-spacing:.015em;transition:transform .12s,background .15s}
.cta:hover{background:#1a1a1a;transform:translateY(-1px)}
.cta .sub{display:block;font-size:12px;font-weight:500;opacity:.82;margin-top:4px;letter-spacing:0}
.cta.centered{margin-left:auto;margin-right:auto}
.sec.tinta .cta{background:#fff;color:${C.tinta}}
.sec.tinta .cta:hover{background:#f2eeed}

/* Cifras */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:${C.linea};
  border:1px solid ${C.linea};border-radius:16px;overflow:hidden}
.stats div{background:#fff;padding:20px 14px;text-align:center}
.stats b{display:block;font-size:25px;font-weight:700}
.stats span{font-size:12.5px;color:${C.suave}}

/* Causas */
.causa{background:#fff;border:1px solid ${C.linea};border-radius:18px;padding:26px;margin-bottom:16px}
.causa .tag{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.acento};margin-bottom:9px}
.causa h3{margin-bottom:9px}
.causa .cols{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px;padding-top:18px;border-top:1px solid ${C.linea}}
.causa .no p,.causa .si p{font-size:11.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
  color:${C.suave};margin-bottom:9px}
.causa ul{list-style:none;padding:0;margin:0;display:grid;gap:7px}
.causa .no li{font-size:14.5px;color:${C.suave};display:flex;gap:8px}
.causa .no li::before{content:'✕';color:#c46a6a;font-weight:700}
.causa .si div{font-size:14.5px;font-weight:600;display:flex;gap:8px;line-height:1.45}
.causa .si div::before{content:'✓';color:${C.bien};font-weight:700}

/* Mecanismo */
.mech{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.mech .card{background:#fff;border:1px solid ${C.linea};border-radius:18px;padding:24px}
.mech .n{width:32px;height:32px;border-radius:50%;background:${C.tinta};color:#fff;display:grid;
  place-items:center;font-weight:700;font-size:14px;margin-bottom:14px}
.mech h3{font-size:18px;margin-bottom:8px}
.mech p{font-size:14.5px;color:${C.suave}}

/* Autoridad */
.doc{display:grid;grid-template-columns:230px 1fr;gap:30px;align-items:center;
  background:#fff;border:1px solid ${C.linea};border-radius:20px;padding:26px}
.doc img{border-radius:16px;aspect-ratio:1;object-fit:cover}
.doc q{font-size:19px;line-height:1.55;display:block;margin-bottom:16px;font-style:italic}
.doc .nm{font-weight:700;font-size:15.5px}
.doc .pr{font-size:13.5px;color:${C.suave}}

/* Ingredientes */
.ings{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.ing{background:#fff;border:1px solid ${C.linea};border-radius:16px;padding:20px;display:flex;gap:16px}
.ing img{width:64px;height:64px;border-radius:12px;object-fit:cover;flex:0 0 auto;background:${C.crema}}
.ing .n{font-weight:700;font-size:16px}
.ing .t{font-size:12px;color:${C.acento};font-weight:600;margin-bottom:7px}
.ing .d{font-size:13.5px;color:${C.suave};line-height:1.5}
.ing .tg{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.ing .tg span{background:${C.crema};border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600;color:#4a4a4a}

/* Línea de tiempo */
.tl{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.tl .card{border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:22px;background:rgba(255,255,255,.05)}
.tl .w{font-size:12px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#d9c2ab;margin-bottom:10px}
.tl h3{font-size:19px;margin-bottom:7px}
.tl p{font-size:14.5px;color:rgba(255,255,255,.72)}

/* Antes y después */
.ba{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:26px}
.ba figure{margin:0;position:relative;border-radius:18px;overflow:hidden;border:1px solid ${C.linea}}
.ba figcaption{position:absolute;top:12px;left:12px;background:rgba(46,46,46,.86);color:#fff;
  font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 11px;border-radius:6px}

/* Testimonios */
.tst{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}
.tst .card{background:#fff;border:1px solid ${C.linea};border-radius:18px;padding:22px;display:flex;flex-direction:column}
.tst .st{color:#e8a33d;font-size:13px;letter-spacing:1px;margin-bottom:11px}
.tst q{font-size:15px;line-height:1.6;flex:1;display:block;margin-bottom:16px}
.tst .who{display:flex;align-items:center;gap:11px;padding-top:14px;border-top:1px solid ${C.linea}}
.tst .who img{width:40px;height:40px;border-radius:50%;object-fit:cover}
.tst .av{width:40px;height:40px;border-radius:50%;background:${C.azul};color:${C.tinta};display:grid;
  place-items:center;font-weight:700;font-size:15px;flex:0 0 auto}
.tst .nm{font-weight:700;font-size:14.5px}
.tst .mt{font-size:12.5px;color:${C.suave}}
.tst .datos{display:flex;gap:14px;margin-bottom:14px}
.tst .datos div{text-align:center}
.tst .datos b{display:block;font-size:17px;font-weight:700;color:${C.bien}}
.tst .datos span{font-size:10.5px;color:${C.suave}}

/* Protocolo */
.pasos{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.paso{background:#fff;border:1px solid ${C.linea};border-radius:18px;padding:24px}
.paso .n{font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.acento};margin-bottom:9px}
.paso h3{font-size:18px;margin-bottom:7px}
.paso p{font-size:15px;color:${C.suave}}

/* Oferta */
.planes{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px}
.plan{background:#fff;border:2px solid ${C.linea};border-radius:20px;padding:24px;position:relative;cursor:pointer;
  transition:border-color .15s,box-shadow .15s}
.plan:hover{border-color:#c9c1bb}
.plan.best{border-color:${C.tinta};box-shadow:0 16px 40px -22px rgba(46,46,46,.5)}
.plan .badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:${C.acento};color:#fff;
  font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 13px;border-radius:999px;white-space:nowrap}
.plan .q{font-size:19px;font-weight:700}
.plan .save{display:inline-block;background:${C.crema};color:${C.acento};font-size:12px;font-weight:700;
  padding:3px 9px;border-radius:6px;margin:8px 0 12px}
.plan .price{display:flex;align-items:baseline;gap:9px}
.plan .price b{font-size:30px;font-weight:700}
.plan .price s{color:#a8a29d;font-size:15px}
.plan .desc{font-size:14px;color:${C.suave};margin-top:11px;line-height:1.5}
.stack{list-style:none;margin:0 0 18px;padding:0;border:1px solid ${C.linea};border-radius:16px;overflow:hidden;background:#fff}
.stack li{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 18px;
  border-bottom:1px solid ${C.crema};font-size:15px}
.stack li:last-child{border-bottom:0}
.stack .d small{display:block;color:${C.suave};font-size:12.5px;margin-top:2px}
.stack b{white-space:nowrap;font-weight:700}
.stack b.free{color:${C.acento};font-size:11.5px;letter-spacing:.06em;background:#f3ece5;padding:4px 9px;border-radius:5px}
.total{background:${C.tinta};color:#fff;border-radius:16px;padding:20px 22px;margin-bottom:20px}
.total .r{display:flex;justify-content:space-between;align-items:baseline;gap:14px}
.total .r+.r{margin-top:9px;padding-top:13px;border-top:1px solid rgba(255,255,255,.16)}
.total span{font-size:14px;opacity:.75}
.total s{font-size:17px;opacity:.6}
.total b{font-size:31px;font-weight:700}

/* Garantía */
.guar{display:flex;gap:18px;align-items:flex-start;background:${C.azul};border-radius:20px;padding:26px}
.guar .ic{flex:0 0 auto;width:52px;height:52px;border-radius:50%;background:${C.tinta};color:#fff;
  display:grid;place-items:center;font-size:24px}
.guar h3{font-size:20px;margin-bottom:8px}
.guar p{font-size:15.5px;color:#4a4a4a}

/* FAQ */
.faq details{background:#fff;border:1px solid ${C.linea};border-radius:14px;margin-bottom:10px;overflow:hidden}
.faq summary{padding:17px 20px;font-weight:600;font-size:16px;cursor:pointer;list-style:none;
  display:flex;justify-content:space-between;gap:14px;align-items:center}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'+';font-size:21px;color:${C.acento};font-weight:400;flex:0 0 auto}
.faq details[open] summary::after{content:'−'}
.faq .a{padding:0 20px 18px;color:${C.suave};font-size:15px}

/* Cierre */
.ps p{font-size:16.5px;line-height:1.68;margin-bottom:15px}
.ps .sign{color:${C.suave};font-style:italic;font-size:14.5px}

/* Barra fija */
.sticky{position:fixed;left:0;right:0;bottom:0;background:rgba(255,255,255,.97);backdrop-filter:blur(10px);
  border-top:1px solid ${C.linea};padding:11px 16px;z-index:90;transform:translateY(110%);
  transition:transform .28s ease;box-shadow:0 -8px 28px -18px rgba(0,0,0,.4)}
.sticky.on{transform:translateY(0)}
.sticky .in{max-width:520px;margin:0 auto;display:flex;align-items:center;gap:13px}
.sticky .pz{flex:0 0 auto;line-height:1.2}
.sticky .pz b{font-size:18px;font-weight:700;display:block}
.sticky .pz s{font-size:12px;color:#a8a29d}
.sticky a{flex:1;background:${C.tinta};color:#fff;text-decoration:none;text-align:center;padding:14px;
  border-radius:11px;font-weight:700;font-size:14.5px}

footer{background:${C.tinta};color:rgba(255,255,255,.62);padding:40px 0;font-size:13.5px;text-align:center}
footer img{height:24px;margin:0 auto 14px;opacity:.9}

@media(max-width:900px){
  .hero .grid{grid-template-columns:1fr;gap:30px}
  .hero-media{order:-1}
  .mech,.tst,.tl{grid-template-columns:1fr}
  .ings,.pasos,.planes,.ba{grid-template-columns:1fr}
  .doc{grid-template-columns:1fr;text-align:center}
  .doc img{max-width:210px;margin:0 auto}
  .stats{grid-template-columns:1fr 1fr}
  .causa .cols{grid-template-columns:1fr}
  .sec{padding:48px 0}
  body{padding-bottom:76px}
}
`;

/* ── Secciones ────────────────────────────────────────────────────────── */

const check = '<span class="ic">✓</span>';

const hero = (o) => `
<div class="bar">Envío gratis a toda Colombia · <b>Pagas en efectivo al recibir</b></div>
<nav class="nav"><div class="wrap"><img src="${IMG.logo}" alt="Dermafol" width="132" height="26"></div></nav>
<section class="hero"><div class="wrap"><div class="grid">
  <div>
    <div class="rating"><span class="st">★★★★★</span> 4.9 · Recomendado por dermatólogos</div>
    <div class="flag">Si ya probaste shampoos, serums y vitaminas y tu cabello sigue cayendo, hay una razón.</div>
    <h1>Si pasaste los 35 y ya probaste de todo, tu caída es <span class="em">hormonal</span>.</h1>
    <p class="kick">Ya probaste productos que solo atacan la mitad del problema. Dermafol trata la causa hormonal y reactiva el folículo al mismo tiempo.</p>
    <ul class="ticks">
      <li>${check}Menos caída de cabello en la ducha</li>
      <li>${check}Resultados visibles en 7 semanas</li>
      <li>${check}Creado por dermatólogos · Registro INVIMA</li>
    </ul>
    <a href="#pedir" class="cta" style="margin-top:26px">QUIERO RECUPERAR MI CABELLO<span class="sub">${money(o.price)} · Envío gratis · Pagas al recibir</span></a>
    <div class="trustrow"><span>Registro INVIMA</span><span>Garantía 30 días</span><span>Envío gratis</span><span>Pago contra entrega</span></div>
  </div>
  <div class="hero-media"><img src="${IMG.banner}" alt="Combo Dermafol 360°: suplemento capilar y roll-on dermoestimulante" width="720" height="720" fetchpriority="high"></div>
</div></div></section>

<section style="padding:0 0 56px"><div class="wrap"><div class="stats">
  <div><b>4.9★</b><span>Valoración media</span></div>
  <div><b>7 sem.</b><span>Primeros resultados</span></div>
  <div><b>2</b><span>Causas atacadas</span></div>
  <div><b>30 días</b><span>Garantía total</span></div>
</div></div></section>`;

const problema = () => `
<section class="sec crema"><div class="wrap">
  <div class="center" style="margin-bottom:34px">
    <div class="eyebrow">La verdad incómoda</div>
    <h2>No fallaste tú.<br>Fallaron los productos.</h2>
    <p class="kick">Los shampoos y serums tratan el síntoma. La caída hormonal tiene tres causas reales y ninguna se ve en el espejo.</p>
  </div>
  ${CAUSAS.map((c) => `
  <div class="causa">
    <div class="tag">${c.tag}</div>
    <h3>${c.h}</h3>
    <p style="color:${C.suave};font-size:15.5px;margin-top:8px">${c.p}</p>
    <div class="cols">
      <div class="no"><p>Lo que no lo resuelve</p><ul>${c.no.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      <div class="si"><p>Lo que sí</p><div>${c.si}</div></div>
    </div>
  </div>`).join('')}
</div></section>`;

const mecanismo = () => `
<section class="sec"><div class="wrap">
  <div class="center" style="margin-bottom:34px">
    <div class="eyebrow">El protocolo 360°</div>
    <h2>Ya probaste de todo. Faltaba atacar las dos causas.</h2>
  </div>
  <div class="mech">
    <div class="card"><div class="n">1</div><h3>El suplemento regula desde adentro</h3>
      <p>Trata la causa hormonal que ningún tópico puede tocar: Zinc, vitamina D y adaptógenos que equilibran lo que dispara la caída en mujeres 35+.</p></div>
    <div class="card"><div class="n">2</div><h3>El Roll-On reactiva desde afuera</h3>
      <p>Minoxidil 2% directo en el folículo, la concentración aprobada para mujeres. Reactiva donde dejó de crecer: entradas, coronilla, línea frontal.</p></div>
    <div class="card"><div class="n">✓</div><h3>Los dos al mismo tiempo</h3>
      <p>No uno o el otro. El protocolo 360° es la primera vez que atacas la causa hormonal y el folículo simultáneamente. Eso es lo que ningún producto antes hizo.</p></div>
  </div>
</div></section>`;

const autoridad = () => `
<section class="sec crema"><div class="wrap">
  <div class="center" style="margin-bottom:30px"><div class="eyebrow">Respaldo profesional</div><h2>Qué dice una dermatóloga</h2></div>
  <div class="doc">
    <img src="${IMG.doctora}" alt="Dra. Carolina Monsalve, dermatóloga" width="230" height="230" loading="lazy">
    <div>
      <q>La caída femenina después de los 35 casi siempre tiene un componente hormonal que los tópicos solos no resuelven.</q>
      <div class="nm">Carolina Monsalve</div>
      <div class="pr">Dermatóloga · Tricología femenina</div>
    </div>
  </div>
</div></section>`;

const ingredientes = () => `
<section class="sec"><div class="wrap">
  <div class="center" style="margin-bottom:34px">
    <div class="eyebrow">Lo que hay dentro importa</div>
    <h2>Formulado con ingredientes que tienen razón de ser</h2>
  </div>
  <div class="ings">${INGREDIENTES.map((i) => `
    <div class="ing">
      <img src="${i.img}" alt="${i.n}" width="64" height="64" loading="lazy">
      <div><div class="n">${i.n}</div><div class="t">${i.t}</div><div class="d">${i.d}</div>
        <div class="tg">${i.tags.map((t) => `<span>${t}</span>`).join('')}</div></div>
    </div>`).join('')}</div>
</div></section>`;

const tiempo = (o) => `
<section class="sec tinta"><div class="wrap">
  <div class="center" style="margin-bottom:34px">
    <div class="eyebrow">Qué esperar</div>
    <h2>Empieza a notarlo antes de lo que crees</h2>
  </div>
  <div class="tl">
    <div class="card"><div class="w">Semanas 1–4</div><h3>Menos cabello en la ducha</h3><p>La caída empieza a ceder. El protocolo está trabajando aunque todavía no lo veas en el espejo.</p></div>
    <div class="card"><div class="w">Semanas 5–8</div><h3>El folículo despierta</h3><p>Aparecen cabellos nuevos en entradas y coronilla. Es la señal de que el ciclo se reactivó.</p></div>
    <div class="card"><div class="w">Semanas 9–12</div><h3>Mayor densidad</h3><p>Cabello más grueso y raíz fortalecida. Lo notas tú primero, y después los demás.</p></div>
  </div>
  <a href="#pedir" class="cta centered" style="margin-top:34px">EMPEZAR MI PROTOCOLO<span class="sub">${money(o.price)} · Pagas cuando lo recibes</span></a>
</div></section>`;

const resultados = () => `
<section class="sec crema"><div class="wrap">
  <div class="center" style="margin-bottom:30px"><div class="eyebrow">Resultados reales</div><h2>Antes y después del protocolo</h2></div>
  <div class="ba">
    <figure><figcaption>Antes</figcaption><img src="${IMG.antes}" alt="Antes del protocolo Dermafol" loading="lazy"></figure>
    <figure><figcaption>Después</figcaption><img src="${IMG.despues}" alt="Después del protocolo Dermafol" loading="lazy"></figure>
  </div>
  <p class="kick center" style="margin:0 auto 34px;font-size:14px">Resultados de clientas reales. Los resultados pueden variar de una persona a otra.</p>
  <div class="center" style="margin-bottom:26px"><div class="eyebrow">Sus palabras, no las nuestras</div><h2>Lo que dicen quienes ya lo toman</h2></div>
  <div class="tst">${TESTIMONIOS.map((t) => `
    <div class="card">
      <div class="st">★★★★★</div>
      ${t.datos ? `<div class="datos">${t.datos.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>` : ''}
      <q>${t.t}</q>
      <div class="who">
        ${t.foto ? `<img src="${t.foto}" alt="${t.n}" width="40" height="40" loading="lazy">`
                 : `<div class="av">${t.n.charAt(0)}</div>`}
        <div><div class="nm">${t.n}</div><div class="mt">${t.m} · ${t.c}</div></div>
      </div>
    </div>`).join('')}</div>
</div></section>`;

const protocolo = () => `
<section class="sec"><div class="narrow">
  <div class="center" style="margin-bottom:30px">
    <div class="eyebrow">Cómo se usa</div>
    <h2>Resultados reales, sin rutinas complicadas</h2>
    <p class="kick">Un protocolo de dos pasos diseñado por dermatólogos. Sin tiempo extra.</p>
  </div>
  <div class="pasos">
    <div class="paso"><div class="n">Paso 1 · En la mañana</div><h3>Toma 2 cápsulas</h3><p>El Suplemento Capilar con agua, una vez al día.</p></div>
    <div class="paso"><div class="n">Paso 2 · En la noche</div><h3>Aplica el Roll-On</h3><p>Antes de dormir, masajea durante 1 minuto. No enjuagar.</p></div>
  </div>
  <p class="kick center" style="margin:18px auto 0;font-size:13.5px">Mínimo 8 semanas continuas para resultados visibles.</p>
</div></section>`;

const oferta = (offers) => {
  const uno = offers[0] || { price: 139900, qty: 1 };
  const dos = offers[1] || { price: 199900, qty: 2 };
  return `
<section class="sec crema" id="oferta"><div class="narrow">
  <div class="center" style="margin-bottom:32px">
    <div class="eyebrow">Elige tu tratamiento</div>
    <h2>Un protocolo completo, no un producto suelto</h2>
    <p class="kick">Por separado, tratar las dos causas te costaría ${money(200000)}.</p>
  </div>

  <div class="planes">
    <div class="plan" data-plan="0">
      <div class="q">1 combo</div>
      <div class="save">Ahorras ${money(200000 - uno.price)}</div>
      <div class="price"><b>${money(uno.price)}</b><s>${money(200000)}</s></div>
      <p class="desc">Un tratamiento completo de 1 mes. Envío gratis a toda Colombia.</p>
    </div>
    <div class="plan best" data-plan="1">
      <span class="badge">El ciclo capilar completo</span>
      <div class="q">2 combos</div>
      <div class="save">Ahorras ${money(400000 - dos.price)}</div>
      <div class="price"><b>${money(dos.price)}</b><s>${money(400000)}</s></div>
      <p class="desc">Hasta 3 meses de tratamiento, que es lo que el ciclo capilar necesita para consolidar resultados.</p>
    </div>
  </div>

  <ul class="stack">
    <li><div class="d">Suplemento Capilar · 30 días<small>Saw Palmetto, Zinc, Vitamina D3, Biotina y Colágeno</small></div><b>${money(99900)}</b></li>
    <li><div class="d">Roll-On Dermoestimulante<small>Minoxidil 2%, la concentración estudiada para mujeres</small></div><b>${money(100100)}</b></li>
    <li><div class="d">Ebook <i>El Método Anticaída</i><small>El protocolo completo explicado paso a paso</small></div><b class="free">Gratis</b></li>
    <li><div class="d">Envío a toda Colombia<small>2 a 4 días hábiles con seguimiento</small></div><b class="free">Gratis</b></li>
  </ul>

  <div class="total">
    <div class="r"><span>Valor por separado</span><s>${money(200000)}</s></div>
    <div class="r"><span>Hoy pagas</span><b>${money(uno.price)}</b></div>
  </div>

  <a href="#pedir" class="cta centered">QUIERO MI COMBO 360°<span class="sub">Pago contra entrega · No pagas nada por adelantado</span></a>
</div></section>

<section class="sec"><div class="narrow">
  <div class="guar">
    <div class="ic">✓</div>
    <div>
      <h3>Garantía de 30 días. Sin preguntas.</h3>
      <p>Sabemos que ya probaste cosas que no funcionaron. Por eso no te pedimos fe ciega: te pedimos 30 días. Si no notas ningún cambio en la caída, nos escribes y te devolvemos el 100% de tu dinero.</p>
    </div>
  </div>
</div></section>`;
};

const faq = () => `
<section class="sec crema"><div class="narrow">
  <div class="center" style="margin-bottom:28px"><div class="eyebrow">Dudas frecuentes</div><h2>Lo que necesitas saber antes de empezar</h2></div>
  <div class="faq">${FAQ.map(([q, a], i) => `
    <details${i === 0 ? ' open' : ''}><summary>${q}</summary><div class="a">${a}</div></details>`).join('')}</div>
</div></section>`;

const cierre = (o) => `
<section class="sec"><div class="narrow ps">
  <div class="eyebrow">P.D.</div>
  <p>El folículo no se pierde de un día para otro. Pero pasado cierto punto deja de responder, y ahí ya no hay protocolo que lo devuelva.</p>
  <p>Cada mes que pasa sin tratar la causa hormonal es un mes más en que folículos que todavía responden entran en reposo. No es urgencia de marketing: es cómo funciona el ciclo capilar, y está explicado arriba.</p>
  <p>Por eso la garantía es de 30 días y sin preguntas. No te pedimos que nos creas: te pedimos un mes. Si en ese mes no ves menos cabello en la ducha, escribes y te devolvemos todo.</p>
  <p class="sign">— El equipo de Dermafol</p>
  <a href="#pedir" class="cta centered" style="margin-top:26px">EMPEZAR MI PROTOCOLO 360°<span class="sub">${money(o.price)} · Pagas en efectivo cuando lo recibes</span></a>
</div></section>

<div class="sticky" id="sticky"><div class="in">
  <div class="pz"><b>${money(o.price)}</b><s>${money(200000)}</s></div>
  <a href="#pedir">PEDIR AHORA</a>
</div></div>

<footer><div class="wrap">
  <img src="${IMG.logo}" alt="Dermafol" width="120" height="24">
  <p>Cuidado capilar con ciencia.</p>
  <p style="margin-top:10px;font-size:12.5px;opacity:.7">© 2026 Dermafol. Todos los derechos reservados.</p>
</div></footer>`;

/* ── Página ───────────────────────────────────────────────────────────── */

export function renderDermafolFunnel(offers = []) {
  const list = offers.length ? offers : [
    { id: '', name: '1 combo', qty: 1, price: 139900 },
    { id: '', name: '2 combos', qty: 2, price: 199900 },
  ];
  const principal = list[0];

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Combo Dermafol 360° | Tu caída de cabello es hormonal</title>
<meta name="description" content="Si pasaste los 35 y ya probaste de todo, tu caída es hormonal. Dermafol trata la causa y reactiva el folículo al mismo tiempo. Envío gratis y pago contra entrega.">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://cdn.instant.so" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="image" href="${IMG.banner}" fetchpriority="high">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${hero(principal)}
${problema()}
${mecanismo()}
${autoridad()}
${ingredientes()}
${tiempo(principal)}
${resultados()}
${protocolo()}
${oferta(list)}
${faq()}
${cierre(principal)}
<script>
(function(){
  // La barra fija aparece al pasar el hero y se esconde con el checkout abierto.
  var s=document.getElementById('sticky'), hero=document.querySelector('.hero');
  function upd(){
    var pasado = window.scrollY > hero.offsetHeight * 0.85;
    var abierto = document.getElementById('dsModal') && document.getElementById('dsModal').classList.contains('open');
    s.classList.toggle('on', pasado && !abierto);
  }
  window.addEventListener('scroll', upd, {passive:true});
  window.addEventListener('dsmodal', upd);
  upd();

  // Elegir plan preselecciona la cantidad en el checkout.
  document.querySelectorAll('.plan').forEach(function(p){
    p.addEventListener('click', function(){
      document.querySelectorAll('.plan').forEach(function(x){ x.classList.remove('best'); });
      p.classList.add('best');
      window.__dsPlan = Number(p.dataset.plan||0);
      var sel=document.querySelector('[data-ds-offer]');
      if(sel && sel.options[window.__dsPlan]){ sel.selectedIndex=window.__dsPlan; sel.dispatchEvent(new Event('change',{bubbles:true})); }
    });
  });
})();
</script>
</body>
</html>`;
}

export const DERMAFOL_SLUG = 'dermafol-funnel';
