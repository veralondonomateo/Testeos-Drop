/**
 * Landing de alta conversión — Plasma · Remolacha Orgánica
 * ────────────────────────────────────────────────────────
 * Estructura de respuesta directa para público 50+ con pago contra entrega:
 *
 *   1. Promesa + producto + reversión de riesgo (hero)
 *   2. Cifras de confianza
 *   3. Problema — que el lector se reconozca
 *   4. Mecanismo — por qué funciona
 *   5. Beneficios — qué cambia en su vida
 *   6. Autoridad médica con rostro
 *   7. Prueba social con fotos reales
 *   8. Diferenciación frente a "comer remolacha"
 *   9. Oferta con anclaje de precio y regalos
 *  10. Fricción: cómo se toma y cómo se paga
 *  11. Garantía
 *  12. Objeciones (FAQ) + cierre
 *
 * Las imágenes se sirven desde /assets (no van embebidas) para que la página
 * cargue rápido en datos móviles, que es donde vive este tráfico.
 */

const A = '/assets';

/* ── Iconos ───────────────────────────────────────────────────────────── */

const check = (stroke = 'currentColor') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>`;

const ICON = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M6 6L5 3H2"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S9 3 6.5 4.5 8 7 12 7zM12 7s3-4 5.5-2.5S16 7 12 7z"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5a2 2 0 012-2h12a2 2 0 012 2v16l-8-4-8 4z"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5M9 13h6M9 17h6"/></svg>',
  vesselNarrow: '<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="1.4"><circle cx="24" cy="24" r="19"/><circle cx="20" cy="20" r="2.3" fill="#fff"/><circle cx="30" cy="28" r="1.6" fill="#fff"/><circle cx="24" cy="31" r="1.3" fill="#fff"/></svg>',
  vesselActive: '<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="1.4"><circle cx="24" cy="24" r="12" stroke-dasharray="2 3"/><path d="M24 6v4M24 38v4M6 24h4M38 24h4M11 11l3 3M34 34l3 3M37 11l-3 3M14 34l-3 3"/></svg>',
  vesselOpen: '<svg viewBox="0 0 48 48" fill="none" stroke="#fff" stroke-width="1.4"><circle cx="24" cy="24" r="19"/><circle cx="18" cy="19" r="2" fill="#fff"/><circle cx="28" cy="18" r="2.4" fill="#fff"/><circle cx="22" cy="30" r="2.1" fill="#fff"/><circle cx="31" cy="27" r="1.8" fill="#fff"/></svg>',
  pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M8.5 8.5l7 7"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="5" width="17" height="16" rx="2.4"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 8.5v7a2 2 0 01-1 1.7l-7 4a2 2 0 01-2 0l-7-4a2 2 0 01-1-1.7v-7a2 2 0 011-1.7l7-4a2 2 0 012 0l7 4a2 2 0 011 1.7z"/><path d="M3.3 7.4L12 12.3l8.7-4.9M12 21.5v-9.2"/></svg>',
  form: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6.6 3.5h3l1.6 4-2 1.4a12 12 0 005.9 5.9l1.4-2 4 1.6v3a1.6 1.6 0 01-1.7 1.6A16.5 16.5 0 015 5.2 1.6 1.6 0 016.6 3.5z"/></svg>',
  cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
};

const stars = `<div class="stars" aria-label="5 de 5 estrellas">${ICON.star.repeat(5)}</div>`;

/* ── Contenido ────────────────────────────────────────────────────────── */

const PAIN = [
  'Te falta el aire al subir escaleras o al caminar rápido',
  'Sientes las manos y los pies fríos casi todo el tiempo',
  'A media mañana ya estás cansado y necesitas café para seguir',
  'Cada control médico te deja con la presión en la cabeza',
  'Ya tomas varias pastillas y no quieres sumar más química',
];

const BENEFITS = [
  ['Camina y sube escaleras sin cansarte tanto', 'Tu cuerpo recibe más oxígeno y te sientes con más fuerza.'],
  ['Más energía durante todo el día', 'Sin café, sin nervios y sin palpitaciones.'],
  ['Ayuda a cuidar tu corazón y tu presión', 'De forma natural, como lo hace la comida sana.'],
  ['Hecho con remolacha orgánica de verdad', 'Natural, sin químicos y fácil de tomar cada día.'],
];

const DIFFERENCE = [
  ['Una tableta y listo', 'Nada de cocinar, licuar ni manchar la cocina cada día.'],
  ['La dosis justa, siempre igual', 'Cada tableta trae la cantidad correcta. Con la fruta, nunca sabes cuánto comer.'],
  ['Tu cuerpo la aprovecha mejor', 'Lleva pimienta negra, que ayuda a que se absorba más que la remolacha sola.'],
  ['Concentrada y sin sabor amargo', 'Toda la fuerza de la remolacha, sin el sabor que a nadie le gusta.'],
];

/**
 * Testimonios. IMPORTANTE: son plantillas de estructura.
 * En Colombia un testimonio publicitario debe corresponder a un cliente real y
 * verificable (Estatuto del Consumidor, Ley 1480 de 2011, art. 30). Reemplaza
 * nombre, ciudad, edad y texto por los de tus clientes reales antes de pautar.
 */
const TESTIMONIALS = [
  {
    img: `${A}/testimonio2.jpg`,
    alt: 'Cliente con su frasco de Plasma en la cocina de su casa',
    text: 'Lo compré porque quería cuidar mi corazón de forma más natural. Después de unas semanas me siento con más energía para caminar y ya no termino tan cansado al subir escaleras. Es muy fácil de tomar y ya hace parte de mi rutina.',
    name: 'Carlos M.', place: 'Bogotá', age: '58 años',
  },
  {
    img: `${A}/testimonio3.jpg`,
    alt: 'Clienta sosteniendo Plasma en el balcón de su apartamento',
    text: 'Mi esposo y yo empezamos a tomarlo al mismo tiempo. Nos gustó porque es una opción natural y práctica. En mi caso me siento con más ánimo durante el día y he sido mucho más constante con mis caminatas.',
    name: 'Patricia G.', place: 'Bogotá', age: '62 años',
  },
  {
    img: `${A}/testimonio1.jpg`,
    alt: 'Clienta con su frasco de Plasma en la sala de su casa',
    text: 'Empecé por recomendación de mi hija. Lo que más noto es que llego al final del día sin ese cansancio pesado de antes. Ahora salgo a caminar con mis vecinas tres veces por semana y las sigo sin quedarme atrás.',
    name: 'Gloria E.', place: 'Medellín', age: '61 años',
  },
  {
    img: `${A}/testimonio4.jpg`,
    alt: 'Cliente con su frasco de Plasma durante el desayuno',
    text: 'A mi edad uno ya toma suficientes pastillas. Esta es una sola al día y es de remolacha, nada raro. Llevo dos frascos y mi señora dice que me ve con mejor color y más ánimo en las mañanas.',
    name: 'Hernán R.', place: 'Bucaramanga', age: '67 años',
  },
];

const HOW_TO_TAKE = [
  [ICON.pill, 'Una tableta al día', 'Con el desayuno y un vaso de agua. Nada más que recordar.'],
  [ICON.calendar, 'Todos los días, sin saltarte', 'La constancia es lo que hace la diferencia — no la dosis.'],
  [ICON.box, 'Un frasco te dura 30 días', 'Por eso te enviamos 2: para que completes el ciclo completo.'],
];

const HOW_TO_PAY = [
  [ICON.form, 'Haces tu pedido', 'Solo tu nombre, tu celular y tu dirección. Sin tarjeta, sin datos bancarios.'],
  [ICON.phone, 'Te llamamos a confirmar', 'Verificamos la dirección contigo antes de despachar.'],
  [ICON.cash, 'Pagas cuando lo recibes', 'En efectivo, al mensajero, en la puerta de tu casa.'],
];

const FAQ = [
  ['¿En cuánto tiempo noto algo?',
    'Muchas personas sienten más energía en la primera o segunda semana. Lo ideal es tomarlo constante 30 días — por eso te enviamos 2 frascos.', true],
  ['¿Tengo que pagar algo por adelantado?',
    'No. No pides tarjeta ni transferencia. Pagas en efectivo únicamente cuando el mensajero te entrega el pedido en tu casa.'],
  ['¿Cuánto se demora en llegar?',
    'En las ciudades principales, entre 1 y 3 días hábiles. En municipios y zonas rurales, entre 3 y 5 días hábiles. Te llamamos antes de despachar.'],
  ['¿Puedo tomarlo con mis pastillas?',
    'Es un apoyo natural, no reemplaza tu tratamiento. Consulta a tu médico para integrarlo, sobre todo si tomas medicamentos para la presión.'],
  ['¿Tiene efectos secundarios?',
    'Es un alimento: remolacha y pimienta negra. Puede teñir la orina de rojizo — es normal e inofensivo.'],
  ['¿Y si no estoy cuando llegue el mensajero?',
    'No hay problema. Te contactamos para reprogramar la entrega en un horario que te sirva, sin costo adicional.'],
  ['¿Y si no me funciona?',
    'Tienes 30 días de garantía. Si no te sientes mejor, nos escribes y te devolvemos el 100% de tu dinero.'],
];

/* ── Piezas reutilizables ─────────────────────────────────────────────── */

const cta = (label, sub, extraClass = '') =>
  `<a href="#pedir" class="btn ${extraClass}">${label}${sub ? `<span class="sub">${sub}</span>` : ''}</a>`;

const bulletList = (items) => `<ul class="bul">${items.map(([t, d]) => `
      <li><span class="bic">${check('#fff')}</span><div><div class="bt">${t}</div><div class="bd">${d}</div></div></li>`).join('')}
    </ul>`;

const stepCards = (steps, cls) => `<div class="${cls}">${steps.map(([ico, t, d], i) => `
      <div class="how-step">
        <div class="how-n">${i + 1}</div>
        <div class="how-ico">${ico}</div>
        <div class="how-t">${t}</div>
        <div class="how-d">${d}</div>
      </div>`).join('')}
    </div>`;

/* ── Estilos ──────────────────────────────────────────────────────────── */

const CSS = `
:root{
  /* Rojo de marca como único acento. Todo lo demás es gris neutro:
     los tonos cafés hacían ver la página sucia y barata. */
  --red:#B01E1E; --red-deep:#8E1717;
  --ink:#17171A;        /* negro neutro, no marrón */
  --ink-2:#43434A;
  --muted:#78787F;      /* gris, no beige */
  --paper:#F7F7F6;      /* casi blanco, apenas cálido */
  --line:#E7E7E4;       /* hairline neutra */
  --white:#fff;
  --wrap:22px; --site:620px;
}
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{
  font-family:'Questrial',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  background:var(--white);color:var(--ink);line-height:1.55;
  -webkit-font-smoothing:antialiased;overflow-x:hidden;
}
img{max-width:100%;height:auto;display:block}
h1,h2,h3{font-weight:400;letter-spacing:-.015em;line-height:1.14}
a{color:inherit}

/* Contenedor: bandas de color a sangre, contenido centrado */
.announce,nav,.wrap,.mech,.final,.pay,footer{
  padding-left:max(var(--wrap),calc((100% - var(--site))/2));
  padding-right:max(var(--wrap),calc((100% - var(--site))/2));
}

.eyebrow{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--red)}
.eyebrow.on-red{color:#F3C9C0}

.btn{display:block;width:100%;text-align:center;background:var(--red);color:#fff;
  text-decoration:none;font-weight:700;font-size:15px;letter-spacing:.03em;
  padding:18px;border-radius:13px;border:none;cursor:pointer;
  box-shadow:0 10px 22px -8px rgba(168,30,30,.55);transition:transform .15s,background .15s}
.btn:hover{background:#8f1919;transform:translateY(-1px)}
.btn .sub{display:block;font-weight:400;font-size:11px;letter-spacing:.06em;opacity:.9;margin-top:4px;text-transform:uppercase}
.btn.on-red{background:#fff;color:var(--red)}
.btn.on-red:hover{background:#f4e7e4}

.announce{background:var(--ink);color:#EDEDEB;font-size:11px;letter-spacing:.12em;text-align:center;padding:9px 16px;text-transform:uppercase}
nav{display:flex;align-items:center;justify-content:space-between;padding-top:16px;padding-bottom:16px;border-bottom:1px solid var(--line)}
.brand{font-size:23px;letter-spacing:.14em}
.brand b{color:var(--red);font-weight:700}
.nav-ico{display:flex;gap:18px}
.nav-ico svg{width:21px;height:21px}

/* HERO */
.hero{padding-top:34px;padding-bottom:30px;text-align:center}
h1{font-size:34px;margin:14px 0 12px}
h1 em{font-style:normal;color:var(--red)}
.lede{color:var(--muted);font-size:15.5px;max-width:34ch;margin:0 auto}
.bottle-img{width:192px;max-width:60%;margin:22px auto 14px;filter:drop-shadow(0 18px 26px rgba(0,0,0,.16))}
.seals{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:16px auto 14px;max-width:340px}
.seal{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--red-deep);
  border:1px solid var(--line);background:var(--paper);padding:7px 11px;border-radius:20px;display:flex;align-items:center;gap:5px}
.seal svg{width:12px;height:12px}
.cardio-badge{display:inline-flex;align-items:center;gap:8px;background:var(--paper);border:1px solid var(--line);
  border-radius:24px;padding:9px 15px;font-size:12px;font-weight:700;margin:6px auto 20px}
.cardio-badge svg{width:16px;height:16px;color:var(--red)}
.micro{font-size:12px;color:var(--muted);margin-top:12px}

/* CIFRAS */
.stats{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.stat{background:var(--paper);padding:24px 16px;text-align:center}
.stat .n{font-size:27px;color:var(--red);font-weight:700}
.stat .l{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:4px}

/* SECCIONES */
.sec{padding-top:48px;padding-bottom:48px}
.sec h2{font-size:27px;margin-bottom:6px}
.sec .kick{color:var(--muted);font-size:14px;margin-bottom:24px;max-width:52ch}

/* PROBLEMA — en blanco, para que contraste con la banda de cifras de arriba */
.problem{background:var(--white)}
ul.pain{list-style:none;display:flex;flex-direction:column;gap:2px;margin-bottom:22px}
ul.pain li{display:flex;gap:13px;align-items:flex-start;padding:13px 0;border-bottom:1px solid var(--line);font-size:14.5px;line-height:1.45}
ul.pain li:last-child{border-bottom:none}
.pain-mark{flex:0 0 22px;width:22px;height:22px;border-radius:6px;border:1.5px solid var(--red);
  display:flex;align-items:center;justify-content:center;color:var(--red);margin-top:1px}
.pain-mark svg{width:13px;height:13px}
.pain-close{background:var(--white);border:1px solid var(--line);border-left:3px solid var(--red);
  border-radius:12px;padding:16px 18px;font-size:14px;line-height:1.55}
.pain-close b{color:var(--red)}

/* MECANISMO */
.mech{background:var(--red);color:#fff;padding-top:48px;padding-bottom:44px;text-align:center}
.mech h2{font-size:26px;margin:12px 0 6px}
.mech .sub{color:#f0c7bf;font-size:13.5px;max-width:44ch;margin:0 auto 24px}
.steps{display:flex;flex-direction:column;gap:14px;text-align:left}
.step{display:flex;align-items:center;gap:15px;border:1px solid rgba(255,255,255,.22);border-radius:14px;padding:15px;background:rgba(255,255,255,.05)}
.step svg{width:44px;height:44px;flex:0 0 44px}
.step .t{font-weight:700;font-size:14.5px}
.step .d{font-size:12.5px;color:#f2cfc8;margin-top:3px;line-height:1.45}

/* BENEFICIOS */
ul.bul{list-style:none;display:flex;flex-direction:column;gap:18px}
ul.bul li{display:flex;gap:14px;align-items:flex-start}
.bic{flex:0 0 36px;width:36px;height:36px;border-radius:10px;background:var(--red);
  display:flex;align-items:center;justify-content:center}
.bic svg{width:19px;height:19px}
.bt{font-weight:700;font-size:15.5px;line-height:1.25}
.bd{font-size:13px;color:var(--muted);margin-top:3px;line-height:1.5}

/* AUTORIDAD MÉDICA */
.auth{background:var(--paper);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.doc{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;
  box-shadow:0 1px 3px rgba(0,0,0,.05)}
.doc-photo{width:100%;aspect-ratio:1/1;object-fit:cover;object-position:center 22%}
.doc-body{padding:22px}
.doc-body q{quotes:none;font-size:16px;line-height:1.55;display:block}
.doc-meta{display:flex;align-items:center;gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}
.doc-meta .nm{font-weight:700;font-size:14.5px}
.doc-meta .pr{font-size:12.5px;color:var(--muted);margin-top:2px;line-height:1.4}
.doc-verified{flex:0 0 34px;width:34px;height:34px;border-radius:50%;background:#EAF5EE;
  display:flex;align-items:center;justify-content:center;color:#2E7D4F}
.doc-verified svg{width:17px;height:17px}

/* BANDA CTA — clara, separada sólo por hairlines */
.ctaband{background:var(--white);text-align:center;padding:44px var(--wrap);
  border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.ctaband h3{font-size:22px;margin-bottom:8px;font-weight:400}
.ctaband p{font-size:13.5px;color:var(--muted);margin-bottom:22px;max-width:42ch;margin-left:auto;margin-right:auto}
.ctaband .btn{max-width:420px;margin:0 auto}

/* SOCIAL */
.join{position:relative;border-radius:18px;overflow:hidden}
.join img{width:100%}
.join-ov{position:absolute;left:0;right:0;bottom:0;padding:26px 20px 22px;color:#fff;
  background:linear-gradient(to top,rgba(12,12,14,.88) 12%,rgba(12,12,14,.34) 55%,rgba(12,12,14,0))}
.join-eyebrow{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#f2c9c1}
.join-t{font-size:22px;line-height:1.16;margin-top:7px}
.join-sub{font-size:12.5px;color:#f3d7d2;margin-top:6px}

/* TESTIMONIOS */
.rev{display:flex;flex-direction:column;gap:16px;margin-top:22px}
.rcard{border:1px solid var(--line);border-radius:16px;background:#fff;overflow:hidden;
  box-shadow:0 1px 2px rgba(0,0,0,.04)}
.rcard img{width:100%;aspect-ratio:4/3;object-fit:cover}
.rbody{padding:18px}
.rtop{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.stars{color:#C9A227;display:flex;gap:2px}
.stars svg{width:14px;height:14px}
.verif{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;letter-spacing:.05em;
  text-transform:uppercase;color:#2E7D4F;background:#EAF5EE;border-radius:20px;padding:5px 9px;white-space:nowrap}
.verif svg{width:11px;height:11px}
.rtext{font-size:13.5px;line-height:1.55}
.rmeta{display:flex;align-items:center;gap:10px;margin-top:14px;padding-top:13px;border-top:1px solid var(--line)}
.ava{width:34px;height:34px;border-radius:50%;background:var(--paper);border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--red);font-size:13px;flex:0 0 34px}
.rname{font-size:12.5px;font-weight:700}
.rloc{font-size:11.5px;color:var(--muted)}
.disc{font-size:11.5px;color:var(--muted);line-height:1.5;margin-top:18px;text-align:center}

/* REGALOS */
.gifts-box{background:var(--paper);border:1px dashed var(--red);border-radius:18px;padding:24px}
.gifts-box .top{display:flex;align-items:center;gap:9px;color:var(--red);font-weight:700;font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:16px}
.gifts-box .top svg{width:18px;height:18px}
.gift-grid{display:flex;flex-direction:column}
.gift{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-top:1px solid var(--line)}
.gift:first-child{border-top:none;padding-top:0}
.gift .ph{flex:0 0 52px;width:52px;height:52px;border-radius:11px;background:#fff;border:1px solid var(--line);
  display:flex;align-items:center;justify-content:center;color:var(--red)}
.gift .ph svg{width:26px;height:26px}
.gift .gt{font-weight:700;font-size:14.5px}
.gift .gd{font-size:12.5px;color:var(--muted);margin-top:2px;line-height:1.45}
.gift .free{font-size:11px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.05em;margin-top:4px;display:inline-block}

/* OFERTA */
.offer{background:var(--red);color:#fff;border-radius:20px;padding:30px 24px;text-align:center}
.offer .tag{display:inline-block;background:#fff;color:var(--red);font-weight:700;font-size:11px;letter-spacing:.09em;text-transform:uppercase;padding:7px 13px;border-radius:20px;margin-bottom:14px}
.offer h3{font-size:27px}
.price{margin:16px 0 6px;display:flex;align-items:baseline;justify-content:center;gap:10px}
.price .now{font-size:40px;font-weight:700}
.price .was{font-size:17px;color:#f0c0b8;text-decoration:line-through}
.price-sub{font-size:12.5px;color:#f6d7d1;text-transform:uppercase;letter-spacing:.08em;margin-bottom:22px}
ul.inc{list-style:none;text-align:left;display:flex;flex-direction:column;gap:11px;margin-bottom:20px}
ul.inc li{display:flex;gap:11px;font-size:13.5px;align-items:flex-start;line-height:1.4}
ul.inc svg{width:18px;height:18px;flex:0 0 18px;margin-top:1px}
.offer .total{font-size:12.5px;color:#f6d7d1;margin-bottom:20px}
.offer .total b{color:#fff}

/* CÓMO TOMARLO / CÓMO PAGAR */
.how{display:flex;flex-direction:column;gap:14px}
.how-step{background:var(--white);border:1px solid var(--line);border-radius:16px;padding:22px 20px;position:relative}
.how-n{position:absolute;top:18px;right:20px;font-size:30px;font-weight:700;color:var(--line);line-height:1}
.how-ico{width:42px;height:42px;border-radius:12px;background:var(--paper);color:var(--red);
  display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.how-ico svg{width:21px;height:21px}
.how-t{font-weight:700;font-size:15.5px;margin-bottom:4px}
.how-d{font-size:13px;color:var(--muted);line-height:1.5}

/* Pago contra entrega: sección clara sobre gris casi blanco */
.pay{background:var(--paper);padding-top:48px;padding-bottom:48px;
  border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.pay h2{font-size:27px;margin-bottom:6px}
.pay .kick{color:var(--muted);font-size:14px;margin-bottom:24px;max-width:48ch}

/* GARANTÍA */
.guarantee{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;
  background:var(--paper);border:1px solid var(--line);border-radius:20px;padding:34px 24px}
.g-seal{width:84px;height:84px;border-radius:50%;background:#fff;border:2px solid var(--red);
  display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--red);flex:0 0 84px}
.g-seal .n{font-size:26px;font-weight:700;line-height:1}
.g-seal .d{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;margin-top:2px}
.guarantee h3{font-size:22px}
.guarantee p{font-size:14px;color:var(--muted);line-height:1.6;max-width:44ch}

/* ANTES / DESPUÉS */
.ba-img{width:100%;border-radius:16px;margin:16px 0 2px}
.cap{font-size:11px;color:var(--muted);text-align:center;margin-top:6px}
.ba .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}
.ba .card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:17px 15px}
.ba .lbl{font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;margin-bottom:12px}
.ba .before .lbl{color:var(--muted)}
.ba .after .lbl{color:var(--red)}
.ba ul{list-style:none;display:flex;flex-direction:column;gap:11px}
.ba li{font-size:12.5px;display:flex;gap:8px;line-height:1.35}
.ba li span{font-weight:700}
.ba .after li span{color:var(--red)}
.ba .before li span{color:#C2C2C6}

/* FAQ */
.faq{--site:760px}
.faq details{border-bottom:1px solid var(--line)}
.faq summary{list-style:none;cursor:pointer;padding:17px 0;font-weight:700;font-size:14.5px;display:flex;justify-content:space-between;gap:12px;align-items:center}
.faq summary::-webkit-details-marker{display:none}
.faq summary .pm{color:var(--red);font-size:22px;transition:transform .2s;flex:0 0 auto}
.faq details[open] summary .pm{transform:rotate(45deg)}
.faq .ans{font-size:13.5px;color:var(--muted);padding:0 0 17px;line-height:1.6}

/* CIERRE */
.final{background:var(--red-deep);color:#fff;padding-top:52px;padding-bottom:52px;text-align:center}
.final h2{font-size:27px;margin-bottom:12px}
.final .scarce{font-size:12.5px;color:#f0c7bf;max-width:40ch;margin:0 auto 22px;line-height:1.55}
.final ul{list-style:none;display:inline-flex;flex-direction:column;gap:9px;text-align:left;margin-bottom:24px}
.final li{font-size:13px;display:flex;gap:9px;align-items:center}
.final li svg{width:16px;height:16px;flex:0 0 16px}
.final .btn{max-width:440px;margin:0 auto}

footer{background:var(--ink);color:#A9A9AE;text-align:center;padding-top:30px;padding-bottom:30px}
footer .fb{font-size:20px;color:#fff;letter-spacing:.14em;margin-bottom:8px}
footer .fb b{color:#e88;font-weight:700}
footer p{font-size:10.5px;line-height:1.6;max-width:60ch;margin:0 auto;color:#84848B}

/* MODAL */
.modal-overlay{position:fixed;inset:0;background:rgba(15,15,17,.5);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);
  display:none;align-items:flex-start;justify-content:center;padding:22px 14px;z-index:100;overflow-y:auto}
.modal-overlay.open{display:flex}
.modal{background:#fff;border-radius:20px;width:100%;max-width:400px;padding:22px 22px 26px;
  box-shadow:0 30px 70px -20px rgba(0,0,0,.28);animation:pop .2s ease}
@keyframes pop{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}
.modal-head h3{font-size:22px;margin-top:2px}
.modal-head .k{font-size:12.5px;color:var(--muted);margin-top:4px}
.modal-close{flex:0 0 34px;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:#fff;
  cursor:pointer;color:var(--ink);font-size:20px;line-height:1;display:flex;align-items:center;justify-content:center}
.modal-close:hover{background:var(--paper)}
.order .sum{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:13px 15px;margin-bottom:20px}
.order .sum .l{font-weight:700;font-size:13.5px}
.order .sum .l small{display:block;font-weight:400;color:var(--muted);font-size:11.5px;margin-top:2px}
.order .sum .p{text-align:right;flex:0 0 auto}
.order .sum .p b{font-size:19px;color:var(--red)}
.order .sum .p s{display:block;font-size:11.5px;color:var(--muted)}
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;font-weight:700;margin-bottom:6px}
.field input,.field select{width:100%;border:1px solid var(--line);border-radius:10px;padding:13px 14px;font-family:inherit;font-size:16px;color:var(--ink);background:#fff;outline:none}
.field input:focus,.field select:focus{border-color:var(--red)}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.order .btn{margin-top:8px}
.order .trust{display:flex;align-items:center;justify-content:center;gap:7px;font-size:11.5px;color:var(--muted);margin-top:14px}
.order .trust svg{width:14px;height:14px;color:var(--red)}

/* CTA FIJO */
.sticky-cta{position:fixed;left:50%;bottom:14px;transform:translateX(-50%) translateY(24px);
  width:calc(100% - 28px);max-width:420px;z-index:90;opacity:0;pointer-events:none;
  transition:opacity .25s ease,transform .25s ease}
.sticky-cta.visible{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}
.sticky-cta .btn{padding:15px;font-size:14.5px;box-shadow:0 14px 34px -6px rgba(124,20,20,.6)}

/* ═════════ ESCRITORIO ═════════ */
@media (min-width:900px){
  :root{--site:1120px;--wrap:40px}

  nav{padding-top:22px;padding-bottom:22px}
  .brand{font-size:26px}

  .hero{display:grid;grid-template-columns:1.05fr .95fr;column-gap:56px;align-items:center;
    text-align:left;padding-top:72px;padding-bottom:72px}
  .hero>*{grid-column:1}
  .hero .bottle-img{grid-column:2;grid-row:1/span 20;align-self:center;width:100%;max-width:340px;margin:0 auto}
  h1{font-size:54px}
  .hero .lede{max-width:44ch;margin:0;font-size:17px}
  .hero .seals{justify-content:flex-start;margin-left:0;margin-right:0;max-width:none}
  .hero .cardio-badge{margin-left:0;margin-right:auto}
  .hero .btn{display:inline-block;width:auto;padding:19px 40px;font-size:16px}

  .stats{grid-template-columns:repeat(4,1fr);gap:0;background:var(--paper);
    padding-left:max(var(--wrap),calc((100% - var(--site))/2));
    padding-right:max(var(--wrap),calc((100% - var(--site))/2))}
  .stat+.stat{border-left:1px solid var(--line)}
  .stat{padding:34px 20px}
  .stat .n{font-size:34px}

  .sec{padding-top:80px;padding-bottom:80px}
  .sec h2{font-size:38px}
  .sec .kick{font-size:16px;margin-bottom:36px}

  ul.pain{display:grid;grid-template-columns:1fr 1fr;column-gap:40px;margin-bottom:28px}
  ul.pain li{font-size:15.5px}
  .pain-close{font-size:15px;padding:20px 24px;max-width:70ch}

  .mech{padding-top:80px;padding-bottom:76px}
  .mech h2{font-size:40px}
  .mech .sub{font-size:16px;margin-bottom:40px}
  .steps{flex-direction:row;gap:20px}
  .step{flex:1;flex-direction:column;align-items:flex-start;gap:16px;padding:26px 24px}

  ul.bul{display:grid;grid-template-columns:1fr 1fr;column-gap:44px;row-gap:28px}
  .bt{font-size:17px}
  .bd{font-size:14px}

  /* El médico va a dos columnas: rostro grande a la izquierda */
  .doc{display:grid;grid-template-columns:300px 1fr;align-items:stretch;max-width:900px;margin:0 auto;border-radius:22px}
  .doc-photo{height:100%;aspect-ratio:auto;min-height:340px}
  .doc-body{padding:40px;display:flex;flex-direction:column;justify-content:center}
  .doc-body q{font-size:21px;line-height:1.5}
  .doc-meta{margin-top:24px;padding-top:20px}

  .ctaband{padding:56px 40px}
  .ctaband h3{font-size:30px}
  .ctaband p{font-size:15px;margin-bottom:26px}

  .join{border-radius:22px}
  .join img{max-height:460px;object-fit:cover}
  .join-ov{padding:44px 44px 38px}
  .join-t{font-size:32px;max-width:16ch}
  .join-sub{font-size:15px}

  .rev{display:grid;grid-template-columns:1fr 1fr;gap:22px}
  .rcard img{aspect-ratio:16/10}
  .rbody{padding:24px}
  .rtext{font-size:14.5px}

  .gifts-box{padding:34px 40px;border-radius:22px}
  .gift-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}
  .gift{border-top:0;padding:0}

  .offer{max-width:720px;margin:0 auto;padding:48px 56px;border-radius:26px}
  .offer h3{font-size:38px}
  .price .now{font-size:54px}
  ul.inc li{font-size:14.5px}
  .offer .btn{max-width:420px;margin-left:auto;margin-right:auto}

  .how{flex-direction:row;gap:20px}
  .how-step{flex:1;padding:28px 26px}
  .pay{padding-top:80px;padding-bottom:80px}
  .pay h2{font-size:38px}
  .pay .kick{font-size:16px;margin-bottom:36px}

  .guarantee{flex-direction:row;text-align:left;gap:28px;padding:44px 48px;max-width:900px;margin:0 auto}
  .g-seal{width:108px;height:108px;flex-basis:108px}
  .g-seal .n{font-size:34px}
  .guarantee h3{font-size:26px}
  .guarantee p{font-size:15px;max-width:56ch}

  .ba-img{max-width:720px;margin-left:auto;margin-right:auto;border-radius:22px}
  .ba .grid{max-width:820px;margin-left:auto;margin-right:auto;gap:20px}
  .ba .card{padding:26px 24px}
  .ba li{font-size:14px}

  .faq summary{font-size:17px;padding:22px 0}
  .faq .ans{font-size:15px;padding-bottom:22px}

  .final{padding-top:84px;padding-bottom:84px}
  .final h2{font-size:40px}
  .final .scarce{font-size:15px}
  .final li{font-size:15px}

  footer{padding-top:44px;padding-bottom:44px}
  footer p{font-size:12px}

  .modal-overlay{align-items:center;padding:32px}
  .modal{max-width:460px;padding:32px 36px 36px}
}

@media (min-width:1280px){
  .hero{column-gap:80px}
  .hero .bottle-img{max-width:400px}
  h1{font-size:60px}
}

@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

/* ── Secciones ────────────────────────────────────────────────────────────
   Cada sección es una función independiente. Una variante sólo declara en qué
   orden las quiere y qué copy sobreescribe — el diseño no cambia entre
   variantes, así el testeo aísla el ángulo y no el maquetado.
   ──────────────────────────────────────────────────────────────────────── */

const SECTIONS = {

  stats: () => `
<div class="stats">
  <div class="stat"><div class="n">2040mg</div><div class="l">Máxima potencia</div></div>
  <div class="stat"><div class="n">INVIMA</div><div class="l">Registro sanitario</div></div>
  <div class="stat"><div class="n">30 días</div><div class="l">Garantía total</div></div>
  <div class="stat"><div class="n">100%</div><div class="l">Natural · sin receta</div></div>
</div>`,

  problem: (v) => `
<div class="wrap sec problem">
  <div class="eyebrow">${v.problem.eyebrow}</div>
  <h2>${v.problem.h2}</h2>
  <p class="kick">${v.problem.kick}</p>
  <ul class="pain">
    ${(v.problem.items || PAIN).map((p) => `<li><span class="pain-mark">${check()}</span>${p}</li>`).join('\n    ')}
  </ul>
  <p class="pain-close">${v.problem.close}</p>
</div>`,

  mech: () => `
<div class="mech">
  <div class="eyebrow on-red">La molécula que importa</div>
  <h2>Óxido nítrico:<br>tu circulación, en flujo</h2>
  <p class="sub">Con la edad, tu cuerpo produce menos. La remolacha ayuda a recuperarlo.</p>
  <div class="steps">
    <div class="step">${ICON.vesselNarrow}<div><div class="t">Vaso sanguíneo estrecho</div><div class="d">Menos óxido nítrico = menos flujo de oxígeno y nutrientes.</div></div></div>
    <div class="step">${ICON.vesselActive}<div><div class="t">Se activa el óxido nítrico</div><div class="d">Los nitratos de la remolacha se convierten en óxido nítrico.</div></div></div>
    <div class="step">${ICON.vesselOpen}<div><div class="t">Vaso abierto y sano</div><div class="d">Mejor circulación, apoyo a una presión saludable y más energía.</div></div></div>
  </div>
</div>`,

  benefits: (v) => `
<div class="wrap sec">
  <div class="eyebrow">${v.benefits.eyebrow}</div>
  <h2>${v.benefits.h2}</h2>
  <p class="kick">${v.benefits.kick}</p>
  ${bulletList(BENEFITS)}
</div>`,

  auth: (v) => `
<div class="wrap sec auth">
  <div class="eyebrow">Respaldo profesional</div>
  <h2>${v.auth.h2}</h2>
  <p class="kick">${v.auth.kick}</p>
  <div class="doc">
    <img class="doc-photo" src="${A}/dr-direr.jpg" alt="Dr. Andrés Direr, cardiólogo" width="420" height="420" loading="lazy">
    <div class="doc-body">
      <q>La remolacha es una de las mejores fuentes naturales de nitratos, que el cuerpo convierte
      en óxido nítrico. La recomiendo como apoyo a la circulación, siempre acompañada de buena
      alimentación, actividad física y del control médico de cada paciente.</q>
      <div class="doc-meta">
        <div class="doc-verified">${check()}</div>
        <div>
          <div class="nm">Dr. Andrés Direr</div>
          <div class="pr">Cardiólogo · Universidad de La Sabana · Colombia</div>
        </div>
      </div>
    </div>
  </div>
</div>`,

  ctaband: (v) => `
<div class="ctaband">
  <h3>${v.ctaband.h3}</h3>
  <p>${v.ctaband.p}</p>
  ${cta(v.hero.cta === 'QUIERO MI 2×1' ? v.hero.cta : `${v.hero.cta} — $99.900`, 'Lleva 2 · Paga 1')}
</div>`,

  join: () => `
<div class="wrap" style="padding-top:48px;padding-bottom:0">
  <div class="join">
    <img src="${A}/join.jpg" alt="Persona mayor tomando Plasma en su cocina" loading="lazy">
    <div class="join-ov">
      <div class="join-eyebrow">Cada día son más</div>
      <div class="join-t">Únete a quienes ya cuidan su corazón</div>
      <div class="join-sub">Un gesto natural cada mañana. Empieza hoy.</div>
    </div>
  </div>
</div>`,

  difference: () => `
<div class="wrap sec">
  <div class="eyebrow">La diferencia</div>
  <h2>¿Por qué no solo comer remolacha?</h2>
  <p class="kick">Porque lo que cuida tu corazón es tomarla <b>todos los días</b>… y así es fácil de verdad.</p>
  ${bulletList(DIFFERENCE)}
</div>`,

  testimonials: (v) => `
<div class="wrap sec" style="background:var(--paper);border-top:1px solid var(--line);border-bottom:1px solid var(--line)">
  <div class="eyebrow">Historias reales</div>
  <h2>${v.testimonials.h2}</h2>
  <p class="kick">Clientes reales en Colombia, con su frasco en la mano.</p>
  <div class="rev">
    ${TESTIMONIALS.map((t) => `<article class="rcard">
      <img src="${t.img}" alt="${t.alt}" loading="lazy">
      <div class="rbody">
        <div class="rtop">
          ${stars}
          <span class="verif">${check()}Compra verificada</span>
        </div>
        <div class="rtext">“${t.text}”</div>
        <div class="rmeta">
          <div class="ava">${t.name[0]}</div>
          <div><div class="rname">${t.name}</div><div class="rloc">${t.place} · ${t.age}</div></div>
        </div>
      </div>
    </article>`).join('\n    ')}
  </div>
  <p class="disc">Testimonios de clientes. Los resultados pueden variar de una persona a otra.</p>
</div>`,

  ba: () => `
<div class="wrap sec ba">
  <div class="eyebrow">Antes y después</div>
  <h2>Del cansancio al control</h2>
  <img class="ba-img" src="${A}/before-after.jpg" alt="Comparación antes y después" loading="lazy">
  <div class="grid">
    <div class="card before"><div class="lbl">Antes</div><ul>
      <li><span>—</span>Sin aire en las escaleras</li>
      <li><span>—</span>Manos y pies fríos</li>
      <li><span>—</span>Nervios en cada control</li>
      <li><span>—</span>Cansado de tantas pastillas</li>
    </ul></div>
    <div class="card after"><div class="lbl">Después</div><ul>
      <li><span>✓</span>Caminas sin ahogarte</li>
      <li><span>✓</span>Manos tibias otra vez</li>
      <li><span>✓</span>Tranquilidad cada día</li>
      <li><span>✓</span>Un apoyo natural que sostienes</li>
    </ul></div>
  </div>
</div>`,

  gifts: () => `
<div class="wrap" style="padding-bottom:8px">
  <div class="gifts-box">
    <div class="top">${ICON.gift}2 regalos de bienvenida</div>
    <div class="gift-grid">
      <div class="gift">
        <div class="ph">${ICON.book}</div>
        <div><div class="gt">Recetario “Cocina para tu Corazón”</div><div class="gd">30 recetas fáciles y económicas que apoyan tu circulación y presión saludable.</div><span class="free">Gratis · incluido</span></div>
      </div>
      <div class="gift">
        <div class="ph">${ICON.pdf}</div>
        <div><div class="gt">Guía PDF “7 Hábitos para un Corazón Fuerte”</div><div class="gd">Cuidados cardiovasculares simples que puedes empezar hoy mismo.</div><span class="free">Gratis · incluido</span></div>
      </div>
    </div>
  </div>
</div>`,

  offer: (v) => `
<div class="wrap sec" style="padding-top:24px">
  <div class="offer">
    <span class="tag">Oferta de lanzamiento</span>
    <h3>Lleva 2, paga 1</h3>
    <div class="price"><span class="now">$99.900</span><span class="was">$200.000</span></div>
    <div class="price-sub">Envío gratis · Pago contra entrega</div>
    <ul class="inc">
      <li>${check('#fff')}<span><b>2 frascos</b> de Plasma — Remolacha Orgánica — pagas 1, te llevas 2 <b>(ahorras $100.000)</b></span></li>
      <li>${check('#fff')}<span>🎁 <b>GRATIS</b> — Recetario “Cocina para tu Corazón” (30 recetas)</span></li>
      <li>${check('#fff')}<span>🎁 <b>GRATIS</b> — Guía PDF “7 Hábitos para un Corazón Fuerte”</span></li>
      <li>${check('#fff')}<span><b>Envío GRATIS</b> a toda Colombia</span></li>
      <li>${check('#fff')}<span><b>Pago contra entrega</b> — sin tarjeta, pagas al recibir</span></li>
      <li>${check('#fff')}<span><b>Fácil:</b> 1 tableta al día, sin cocinar ni licuar</span></li>
      <li>${check('#fff')}<span>Garantía de <b>30 días</b> o te devolvemos tu dinero</span></li>
    </ul>
    <div class="total">Valor total <s>$260.000</s> · <b>Hoy $99.900</b></div>
    ${cta(v.offer.cta, 'Sin tarjeta · Pagas al recibir', 'on-red')}
  </div>
</div>`,

  howtake: () => `
<div class="wrap sec">
  <div class="eyebrow">Así de simple</div>
  <h2>Cómo se toma</h2>
  <p class="kick">Sin preparar nada, sin licuar y sin cambiar tu rutina.</p>
  ${stepCards(HOW_TO_TAKE, 'how')}
</div>`,

  pay: () => `
<div class="pay">
  <div class="eyebrow">Compra sin riesgo</div>
  <h2>Cómo funciona el pago contra entrega</h2>
  <p class="kick">No pagas nada por adelantado. Ni tarjeta, ni transferencia, ni datos bancarios.</p>
  ${stepCards(HOW_TO_PAY, 'how')}
</div>`,

  guarantee: () => `
<div class="wrap sec">
  <div class="guarantee">
    <div class="g-seal"><span class="n">30</span><span class="d">Días</span></div>
    <div>
      <h3>Garantía de satisfacción total</h3>
      <p>Tómalo 30 días. Si no te sientes con más energía, nos escribes y te devolvemos
      el <b>100% de tu dinero</b> — sin preguntas incómodas y sin devolver los regalos.</p>
    </div>
  </div>
</div>`,

  faq: () => `
<div class="wrap sec faq">
  <div class="eyebrow">Dudas frecuentes</div>
  <h2>Antes de pedir</h2>
  <div style="margin-top:8px">
    ${FAQ.map(([q, a, open]) => `<details${open ? ' open' : ''}><summary>${q}<span class="pm">+</span></summary><div class="ans">${a}</div></details>`).join('\n    ')}
  </div>
</div>`,

  final: (v) => `
<div class="final">
  <div class="eyebrow on-red">Última llamada</div>
  <h2>${v.final.h2}</h2>
  <p class="scarce">⏳ Stock limitado de este lote orgánico. Al agotarse, vuelve el precio de $200.000.</p>
  <ul>
    <li>${check('#fff')}2 frascos por $99.900 (antes $200.000)</li>
    <li>${check('#fff')}Recetario + guía cardiovascular gratis</li>
    <li>${check('#fff')}Envío gratis · Garantía 30 días</li>
  </ul>
  ${cta('PEDIR AHORA — $99.900', 'Pagas al recibir', 'on-red')}
</div>`,
};

/* ── Variantes ────────────────────────────────────────────────────────────
   Cada una prueba un ángulo distinto. Mismo producto, misma oferta, mismo
   diseño: lo único que cambia es con qué argumento se abre y en qué orden
   llega la información.
   ──────────────────────────────────────────────────────────────────────── */

const ORDER_BASE = ['stats', 'problem', 'mech', 'benefits', 'auth', 'ctaband', 'join',
  'difference', 'testimonials', 'ba', 'gifts', 'offer', 'howtake', 'pay', 'guarantee', 'faq', 'final'];

export const VARIANTS = {
  A: {
    code: 'A',
    slug: 'plasma-corazon',
    name: 'Mecanismo — óxido nítrico',
    angle: 'Científico',
    hypothesis: 'Explicar el mecanismo (óxido nítrico) genera suficiente credibilidad para '
      + 'convertir a tráfico frío que desconfía de los suplementos.',
    title: 'Plasma — Remolacha Orgánica para tu corazón | Pago contra entrega',
    description: 'Remolacha orgánica de máxima potencia, 2040 mg. Una tableta al día para más energía y mejor circulación. Envío gratis y pago contra entrega en toda Colombia.',
    hero: {
      eyebrow: 'Salud del corazón · 100% natural',
      h1: 'Fuerza concentrada para tu <em>corazón</em>',
      lede: 'Remolacha orgánica de máxima potencia. Una tableta al día para más energía y mejor circulación.',
      cta: 'QUIERO CUIDAR MI CORAZÓN',
      ctaSub: 'Lleva 2 · Paga 1 · Envío gratis',
      micro: 'Pagas cuando lo recibes en tu casa.',
      badge: 'Recomendado por cardiólogos',
    },
    problem: {
      eyebrow: '¿Te suena familiar?',
      h2: 'Si te pasa esto, no es solo "la edad"',
      kick: 'Muchas de estas señales tienen que ver con una circulación que ya no fluye como antes.',
      close: 'Si te reconoces en <b>dos o más</b>, sigue leyendo: hay algo natural y sencillo que puedes empezar mañana mismo.',
    },
    benefits: { eyebrow: 'Lo que cambia', h2: 'Vuelve a sentirte con energía', kick: 'Cuatro razones claras para empezar hoy.' },
    auth: { h2: 'Qué dice un cardiólogo', kick: 'No es un remedio milagroso. Es un apoyo natural, y así lo explica un especialista.' },
    testimonials: { h2: 'Lo que dicen quienes ya lo toman' },
    ctaband: { h3: 'Empieza hoy, paga cuando lo recibas', p: 'Sin tarjeta, sin datos bancarios y con envío gratis a toda Colombia.' },
    offer: { cta: 'SÍ, LO QUIERO' },
    final: { h2: 'Empieza hoy por tu corazón' },
    sticky: 'QUIERO CUIDAR MI CORAZÓN — $99.900',
    order: ORDER_BASE,
  },

  B: {
    code: 'B',
    slug: 'plasma-energia',
    name: 'Energía — vida cotidiana',
    angle: 'Beneficio',
    hypothesis: 'Abrir con el beneficio cotidiano (subir escaleras sin ahogarse) y poner la '
      + 'prueba social arriba convierte mejor que explicar el mecanismo, porque el dolor se '
      + 'reconoce antes de que aparezca la ciencia.',
    title: 'Plasma — Más energía cada día, de forma natural | Pago contra entrega',
    description: 'Una tableta de remolacha orgánica al día para caminar más y cansarte menos. Envío gratis y pago contra entrega en toda Colombia.',
    hero: {
      eyebrow: 'Más energía cada día · 100% natural',
      h1: 'Vuelve a subir escaleras <em>sin quedarte sin aire</em>',
      lede: 'Una tableta de remolacha orgánica al día. Para caminar más, cansarte menos y sentirte como antes.',
      cta: 'QUIERO SENTIRME CON ENERGÍA',
      ctaSub: 'Lleva 2 · Paga 1 · Envío gratis',
      micro: 'Sin tarjeta. Pagas cuando lo recibes.',
      badge: 'Miles de colombianos ya lo toman',
    },
    problem: {
      eyebrow: 'El día a día',
      h2: 'Cansarte a media mañana no debería ser normal',
      kick: 'Si tu cuerpo ya no rinde como antes, casi siempre hay una razón — y tiene arreglo.',
      items: [
        'Llegas a media mañana sin fuerzas y necesitas café para seguir',
        'Te falta el aire al subir escaleras o al caminar rápido',
        'Ya no le sigues el paso a tus nietos como quisieras',
        'Sientes las manos y los pies fríos casi todo el tiempo',
        'Dejaste de salir a caminar porque terminas agotado',
      ],
      close: 'No es la edad: es la circulación. Y eso <b>sí</b> se puede apoyar de forma natural.',
    },
    benefits: { eyebrow: 'Lo que vas a notar', h2: 'Cómo se siente tener energía otra vez', kick: 'Esto es lo que reportan quienes lo toman a diario.' },
    auth: { h2: '¿Y esto tiene respaldo médico?', kick: 'Sí. Un cardiólogo explica por qué la remolacha ayuda a la circulación.' },
    testimonials: { h2: 'Personas como tú, con más energía' },
    ctaband: { h3: 'Empieza hoy, paga cuando lo recibas', p: 'Sin tarjeta, sin datos bancarios y con envío gratis a toda Colombia.' },
    offer: { cta: 'QUIERO MIS 2 FRASCOS' },
    final: { h2: 'Recupera tu energía, empieza hoy' },
    sticky: 'QUIERO SENTIRME CON ENERGÍA — $99.900',
    // Prueba social arriba, mecanismo después
    order: ['stats', 'testimonials', 'problem', 'benefits', 'ctaband', 'mech', 'auth',
      'difference', 'ba', 'gifts', 'offer', 'howtake', 'pay', 'guarantee', 'faq', 'final'],
  },

  C: {
    code: 'C',
    slug: 'plasma-cardiologo',
    name: 'Autoridad — respaldo médico',
    angle: 'Autoridad',
    hypothesis: 'Con público 50+ que ya toma medicamentos, el freno principal es la desconfianza. '
      + 'Abrir con el cardiólogo y el registro INVIMA debería bajar la resistencia y subir la '
      + 'tasa de entrega, aunque el CPA suba un poco.',
    title: 'Plasma — El apoyo natural que recomiendan los cardiólogos | INVIMA',
    description: 'Remolacha orgánica 2040 mg con registro INVIMA. Un apoyo natural a la circulación, recomendado por cardiólogos. Pago contra entrega en Colombia.',
    hero: {
      eyebrow: 'Respaldado por cardiólogos · Registro INVIMA',
      h1: 'El apoyo natural que un <em>cardiólogo</em> recomienda',
      lede: 'Remolacha orgánica de 2040 mg. Un solo ingrediente, sin química, para acompañar el cuidado de tu corazón.',
      cta: 'QUIERO EMPEZAR HOY',
      ctaSub: 'Lleva 2 · Paga 1 · Envío gratis',
      micro: 'No reemplaza tu tratamiento. Consulta a tu médico.',
      badge: 'Registro sanitario INVIMA',
    },
    problem: {
      eyebrow: 'La duda de siempre',
      h2: '¿Puedo tomarlo si ya tomo pastillas?',
      kick: 'Es la pregunta que más nos hacen. Y la respuesta importa.',
      items: [
        'Ya tomas medicamentos y no quieres sumar más química',
        'Te da desconfianza lo que se vende por internet',
        'Quieres algo natural, pero que de verdad tenga respaldo',
        'No sabes si es compatible con tu tratamiento actual',
        'Prefieres algo aprobado antes que una promesa milagrosa',
      ],
      close: 'Plasma es <b>un alimento concentrado</b>, no un medicamento: remolacha y pimienta negra, con registro INVIMA. Consulta a tu médico para integrarlo a tu rutina.',
    },
    benefits: { eyebrow: 'Por qué funciona', h2: 'Qué hace la remolacha por tu circulación', kick: 'Cuatro efectos documentados de los nitratos naturales.' },
    auth: { h2: 'Qué dice un cardiólogo', kick: 'No es un remedio milagroso. Es un apoyo natural, y así lo explica un especialista.' },
    testimonials: { h2: 'Lo que dicen quienes ya lo toman' },
    ctaband: { h3: 'Un apoyo natural, con respaldo', p: 'Registro INVIMA, garantía de 30 días y pago contra entrega.' },
    offer: { cta: 'SÍ, QUIERO EMPEZAR' },
    final: { h2: 'Cuida tu corazón con respaldo' },
    sticky: 'QUIERO EMPEZAR HOY — $99.900',
    // El médico entra de inmediato, antes que cualquier argumento de venta
    order: ['stats', 'auth', 'problem', 'mech', 'benefits', 'ctaband', 'testimonials',
      'difference', 'join', 'ba', 'gifts', 'offer', 'howtake', 'pay', 'guarantee', 'faq', 'final'],
  },

  D: {
    code: 'D',
    slug: 'plasma-oferta',
    name: 'Oferta — 2×1 directo',
    angle: 'Precio',
    hypothesis: 'Para tráfico que ya conoce el producto (retargeting) o es sensible al precio, '
      + 'poner la oferta arriba y acortar la página debería subir la conversión y bajar el CPA, '
      + 'a costa de un ticket promedio menor.',
    title: 'Plasma — Lleva 2 frascos, paga solo 1 | Envío gratis contra entrega',
    description: '2 frascos de remolacha orgánica por $99.900 (antes $200.000). Envío gratis, pago contra entrega y garantía de 30 días.',
    hero: {
      eyebrow: 'Oferta de lanzamiento · Envío gratis',
      h1: 'Lleva 2 frascos, <em>paga solo 1</em>',
      lede: 'Remolacha orgánica de máxima potencia para tu corazón. Pagas $99.900 al recibir, con garantía de 30 días.',
      cta: 'QUIERO MI 2×1',
      ctaSub: '$99.900 · Antes $200.000',
      micro: 'Sin tarjeta. Pagas en efectivo al recibir.',
      badge: 'Ahorras $100.000 hoy',
    },
    problem: {
      eyebrow: 'Por qué dos frascos',
      h2: 'Un mes no alcanza para notar la diferencia',
      kick: 'La remolacha funciona por constancia, no por dosis. Por eso la oferta es de dos.',
      items: [
        'Un frasco te dura 30 días — apenas el primer ciclo',
        'Los resultados se sostienen con el uso continuo',
        'Comprar de a uno te sale al doble por frasco',
        'Con dos frascos completas 60 días sin interrupciones',
        'Si no te sirve, tienes 30 días de garantía igual',
      ],
      close: 'Por eso hoy pagas <b>un frasco y te llevas dos</b>: para que completes el ciclo que sí se nota.',
    },
    benefits: { eyebrow: 'Lo que incluye', h2: 'Qué te llevas por $99.900', kick: 'Además de los dos frascos.' },
    auth: { h2: 'Con respaldo de un cardiólogo', kick: 'Para que sepas que no es una promesa vacía.' },
    testimonials: { h2: 'Quienes ya aprovecharon la oferta' },
    ctaband: { h3: 'Aprovecha el 2×1 antes de que suba', p: 'Al agotarse este lote, el precio vuelve a $200.000.' },
    offer: { cta: 'QUIERO MI 2×1 AHORA' },
    final: { h2: 'Lleva 2, paga 1 — solo hoy' },
    sticky: 'LLEVA 2, PAGA 1 — $99.900',
    // Página corta y directa: la oferta arriba, sin join, ba ni howtake
    order: ['stats', 'offer', 'testimonials', 'problem', 'benefits', 'mech', 'auth',
      'guarantee', 'pay', 'gifts', 'difference', 'faq', 'final'],
  },
};

export const VARIANT_CODES = Object.keys(VARIANTS);

/* ── Documento ────────────────────────────────────────────────────────── */

export function renderPlasmaLanding(offers = [], variantCode = 'A') {
  const v = VARIANTS[variantCode] || VARIANTS.A;

  const offerOptions = offers.map((o) =>
    `<option value="${o.id}" data-qty="${o.qty}" data-price="${o.price}"${o.is_default ? ' selected' : ''}>${o.name}</option>`
  ).join('\n            ');

  const body = v.order.map((key) => (SECTIONS[key] ? SECTIONS[key](v) : '')).join('\n');

  // La fuente y el frasco del hero se sirven desde este mismo dominio y se
  // precargan. Antes la fuente venía de Google: eso costaba DNS + TLS a
  // fonts.googleapis.com, esperar su CSS, y otra vez DNS + TLS a
  // fonts.gstatic.com antes de poder pintar una letra — media docena de viajes
  // en la ruta crítica, que en 4G son cientos de milisegundos de pantalla en
  // blanco. El subconjunto latino pesa 20 KB y cubre todo el español.
  //
  // Este comentario va aquí y no dentro del HTML: la landing se sirve millones
  // de veces y no tiene por qué cargar con la explicación.
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${v.title}</title>
<meta name="description" content="${v.description}">
<meta name="robots" content="noindex">
<link rel="preload" href="${A}/questrial-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${A}/bottle.png" as="image" fetchpriority="high">
<link rel="preconnect" href="https://connect.facebook.net">
<style>
@font-face{font-family:'Questrial';font-style:normal;font-weight:400;font-display:swap;
src:url(${A}/questrial-latin.woff2) format('woff2');
unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
${CSS}</style>
</head>
<body data-variant="${v.code}">

<div class="announce">Envío GRATIS · Pago contra entrega</div>

<nav>
  <div class="brand">PLAS<b>MA</b></div>
  <div class="nav-ico">${ICON.search}${ICON.cart}</div>
</nav>

<div class="wrap hero">
  <div class="eyebrow">${v.hero.eyebrow}</div>
  <h1>${v.hero.h1}</h1>
  <p class="lede">${v.hero.lede}</p>
  <img class="bottle-img" src="${A}/bottle.png" alt="Frasco de Plasma — Remolacha Orgánica, 2040 mg" width="440" height="828" fetchpriority="high">
  <div class="seals">
    <span class="seal">${check()}Registro INVIMA</span>
    <span class="seal">2040 mg</span>
    <span class="seal">Sin químicos</span>
    <span class="seal">Garantía 30 días</span>
  </div>
  <div class="cardio-badge">${ICON.heart}${v.hero.badge}</div>
  <a href="#pedir" class="btn" id="heroCta">${v.hero.cta}<span class="sub">${v.hero.ctaSub}</span></a>
  <p class="micro">${v.hero.micro}</p>
</div>
${body}

<footer>
  <div class="fb">PLAS<b>MA</b></div>
  <p>Suplemento dietario. No reemplaza un tratamiento médico ni está destinado a diagnosticar,
  tratar, curar o prevenir enfermedades. Consulta a tu médico, especialmente si tomas medicamentos
  para la presión arterial.</p>
</footer>

<div class="sticky-cta" id="stickyCta">
  <a href="#pedir" class="btn">${v.sticky}</a>
</div>

<div class="modal-overlay" id="orderModal" role="dialog" aria-modal="true" aria-labelledby="omTitle">
  <div class="modal">
    <div class="modal-head">
      <div>
        <div class="eyebrow">Último paso</div>
        <h3 id="omTitle">Completa tu pedido</h3>
        <div class="k">Sin tarjeta. Pagas en efectivo al recibir.</div>
      </div>
      <button class="modal-close" id="omClose" aria-label="Cerrar">&times;</button>
    </div>
    <form class="order" data-ds-form>
      <div class="sum">
        <div class="l">Plasma — Lleva 2, Paga 1<small>2 frascos + recetario + guía</small></div>
        <div class="p"><b>$99.900</b><s>$200.000</s></div>
      </div>
      <div class="field"><label for="f-name">Nombre y apellido</label><input id="f-name" type="text" name="customer_name" autocomplete="name" required placeholder="Tu nombre completo"></div>
      <div class="field"><label for="f-phone">Celular / WhatsApp</label><input id="f-phone" type="tel" name="phone" autocomplete="tel" inputmode="tel" required placeholder="Ej: 300 000 0000"></div>
      <div class="row2">
        <div class="field"><label for="f-dept">Departamento</label><input id="f-dept" type="text" name="department" autocomplete="address-level1" required placeholder="Departamento"></div>
        <div class="field"><label for="f-city">Ciudad</label><input id="f-city" type="text" name="city" autocomplete="address-level2" required placeholder="Ciudad"></div>
      </div>
      <div class="field"><label for="f-addr">Dirección de entrega</label><input id="f-addr" type="text" name="address" autocomplete="street-address" required placeholder="Calle, número, barrio"></div>
      <div class="field"><label for="f-offer">Cantidad</label>
        <select id="f-offer" name="offer_id" data-ds-offer>
            ${offerOptions}
        </select>
      </div>
      <button class="btn" type="submit" data-ds-submit>CONFIRMAR MI PEDIDO<span class="sub">Pago contra entrega · Envío gratis</span></button>
      <div class="trust">${ICON.shield}Compra protegida · Garantía de 30 días</div>
    </form>
  </div>
</div>

<script>
(function(){
  var m=document.getElementById('orderModal');
  var sticky=document.getElementById('stickyCta');
  var heroCta=document.getElementById('heroCta');
  var pastHero=false, modalOpen=false;
  function updateSticky(){ sticky.classList.toggle('visible', pastHero && !modalOpen); }
  function openM(e){ if(e)e.preventDefault(); m.classList.add('open'); document.body.style.overflow='hidden'; modalOpen=true; updateSticky(); }
  function closeM(){ m.classList.remove('open'); document.body.style.overflow=''; modalOpen=false; updateSticky(); }
  document.querySelectorAll('a[href="#pedir"]').forEach(function(a){ a.addEventListener('click', openM); });
  document.getElementById('omClose').addEventListener('click', closeM);
  m.addEventListener('click', function(e){ if(e.target===m) closeM(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeM(); });
  if('IntersectionObserver' in window && heroCta){
    new IntersectionObserver(function(en){ pastHero=!en[0].isIntersecting; updateSticky(); },{threshold:0}).observe(heroCta);
  } else { pastHero=true; updateSticky(); }
})();
</script>
</body>
</html>`;
}
