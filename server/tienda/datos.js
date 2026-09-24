/**
 * El catálogo y los textos de la tienda, en un solo sitio.
 *
 * Los precios y las composiciones salen de las landings que ya venden, para que
 * la tienda y el anuncio no se contradigan: una clienta que llega por el
 * anuncio y luego abre el catálogo tiene que ver lo mismo.
 *
 * Lo que todavía no existe —historia de la empresa, NIT, artículos— va marcado
 * con `PENDIENTE` y se pinta como tal. Es deliberado: un dato inventado en una
 * página de "Nosotros" es más caro de arreglar que un hueco visible, porque
 * nadie se acuerda de que era falso.
 */

export const PENDIENTE = 'PENDIENTE';

/** Lo que la empresa todavía no nos ha dado. Se pinta como aviso, no como dato. */
export const EMPRESA = {
  razonSocial: PENDIENTE,
  nit: PENDIENTE,
  direccion: PENDIENTE,
  ciudad: 'Bogotá, Colombia',
  whatsapp: PENDIENTE,
  correo: PENDIENTE,
  horario: 'Lunes a viernes, 8:00 a 18:00 · Sábados, 9:00 a 13:00',
  invima: PENDIENTE,
};

export const PRODUCTOS = [
  {
    slug: 'combo-dermafol-360',
    // El kit no tiene ficha propia en la tienda: su página es la landing que
    // lleva meses convirtiendo. Duplicarla sería competir contra el dato que ya
    // tenemos, y la copia nueva empezaría de cero.
    enlace: '/p/dermafol-360-v2',
    nombre: 'Combo Dermafol 360°',
    tagline: 'El protocolo completo: por dentro y por fuera',
    precio: 139900,
    antes: 200000,
    destacado: true,
    categoria: 'combos',
    imagen: '/assets/tienda/kit-caja.jpg',
    galeria: ['/assets/tienda/kit-caja.jpg', '/assets/dermafol/combo-880.webp',
      '/assets/tienda/suplemento-abierto.jpg', '/assets/tienda/aplicando-rollon.jpg'],
    resumen: 'Suplemento de 60 cápsulas y Roll-On de 25 ml. Trata la causa hormonal desde adentro y reactiva el folículo desde afuera, que es lo que ninguno de los dos hace solo.',
    contiene: ['Suplemento Capilar · 60 cápsulas · 30 días', 'Roll-On Dermoestimulante · 25 ml'],
    activos: ['Saw Palmetto', 'Zinc', 'Vitamina D3', 'Biotina', 'Colágeno hidrolizado', 'Trichogen'],
    modoUso: [
      ['Cada mañana', 'Toma 2 cápsulas del suplemento con agua, una vez al día.'],
      ['Cada noche', 'Aplica el Roll-On antes de dormir y masajea un minuto. No hay que enjuagar.'],
      ['Constancia', 'El ciclo capilar necesita entre 8 y 12 semanas. Los primeros cambios se notan antes.'],
    ],
    variantes: [
      { qty: 1, etiqueta: '1 mes', precio: 139900, antes: 200000 },
      { qty: 2, etiqueta: '2 meses', precio: 199900, antes: 400000, nota: 'El más elegido' },
      { qty: 3, etiqueta: '3 meses', precio: 249900, antes: 600000, nota: 'Ciclo completo' },
      { qty: 6, etiqueta: '6 meses', precio: 429900, antes: 1200000, nota: 'Mejor precio por mes' },
    ],
  },
  {
    slug: 'suplemento-capilar',
    nombre: 'Suplemento Capilar',
    tagline: 'Regula la causa hormonal desde adentro',
    precio: 120000,
    antes: 0,
    categoria: 'suplementos',
    imagen: '/assets/tienda/suplemento-abierto.jpg',
    galeria: ['/assets/tienda/suplemento-abierto.jpg', '/assets/tienda/kit-caja.jpg'],
    resumen: '60 cápsulas para 30 días. Saw Palmetto, Zinc, Vitamina D3, Biotina y Colágeno hidrolizado, en la dosis pensada para mujeres de 30 en adelante.',
    contiene: ['60 cápsulas · tratamiento de 30 días'],
    activos: ['Saw Palmetto', 'Zinc', 'Vitamina D3', 'Biotina', 'Colágeno hidrolizado'],
    modoUso: [
      ['Dosis', 'Dos cápsulas al día con agua, preferiblemente con una comida.'],
      ['Cuándo', 'A la misma hora cada día. La constancia pesa más que el momento.'],
    ],
    variantes: [{ qty: 1, etiqueta: '1 frasco', precio: 120000, antes: 0 }],
  },
  {
    slug: 'roll-on-dermoestimulante',
    nombre: 'Roll-On Dermoestimulante',
    tagline: 'Reactiva el folículo desde afuera',
    precio: 80000,
    antes: 0,
    categoria: 'topicos',
    // La portada es fotografía de producto; la de estilo de vida va después en
    // la galería. Un anuncio recortado como portada se nota, y lo que la
    // clienta quiere ver primero en una ficha es el frasco.
    imagen: '/assets/dermafol/combo-880.webp',
    galeria: ['/assets/dermafol/combo-880.webp', '/assets/tienda/aplicando-rollon.jpg'],
    resumen: 'Tónico capilar de 25 ml con Trichogen, un complejo botánico sin minoxidil. Se aplica directamente en entradas, coronilla y línea frontal.',
    contiene: ['Tónico capilar · 25 ml'],
    activos: ['Trichogen'],
    modoUso: [
      ['Aplicación', 'Una vez al día sobre el cuero cabelludo seco, en la zona a tratar.'],
      ['Masaje', 'Un minuto con las yemas. No se enjuaga.'],
    ],
    aviso: 'Sin minoxidil. En embarazo y lactancia, consulta con tu médico antes de empezar.',
    variantes: [{ qty: 1, etiqueta: '1 unidad', precio: 80000, antes: 0 }],
  },
];

export const productoPorSlug = (s) => PRODUCTOS.find((p) => p.slug === s) || null;

/** Los combos que ya se venden en las landings, con su ahorro real calculado. */
export const COMBOS = PRODUCTOS[0].variantes.map((v) => ({
  ...v,
  porMes: Math.round(v.precio / v.qty),
  ahorro: v.antes - v.precio,
}));

export const FAQ = [
  ['¿Cuánto tarda en verse resultados?',
    'La mayoría nota reducción de caída entre la semana 4 y 6. La densidad y los cabellos nuevos aparecen entre la semana 8 y 12. El ciclo capilar completo requiere constancia; no hay atajos biológicos.'],
  ['¿Puedo usarlo si estoy embarazada o lactando?',
    'Consúltalo antes con tu médico. El Roll-On no lleva minoxidil, pero en embarazo y lactancia no recomendamos empezar ningún tratamiento capilar por tu cuenta.'],
  ['¿Y si no me funciona?',
    'Tienes 90 días de garantía. Si no notas ningún cambio en la caída, nos escribes y te devolvemos el 100% de tu dinero, sin preguntas y sin devolver los frascos.'],
  ['¿Tengo que pagar por adelantado?',
    'No. Pagas en efectivo al domiciliario cuando recibas el pedido en tu casa.'],
  ['¿Envían a todo Colombia?',
    'Sí, a nivel nacional con seguimiento. La entrega toma de 2 a 4 días hábiles a ciudades principales.'],
  ['¿Sirve si mi caída es por estrés y no hormonal?',
    'Sí. El suplemento incluye activos que reducen el impacto del cortisol en el ciclo capilar, que es la vía por la que el estrés provoca la caída.'],
  ['¿El Roll-On tiene efectos secundarios?',
    'No lleva minoxidil, así que no arrastra sus contraindicaciones. Como con cualquier tópico, en pieles sensibles puede haber una leve irritación al principio: prueba primero en una zona pequeña. Si el enrojecimiento persiste, suspende y consulta a un dermatólogo.'],
  ['Ya probé minoxidil y lo dejé. ¿Esto es distinto?',
    'Sí, en dos cosas. El Roll-On no lleva minoxidil —usa Trichogen, un complejo botánico—, así que no arrastra sus contraindicaciones ni la irritación que hace que muchas lo abandonen. Y el minoxidil, además, nunca tocó la causa hormonal: eso lo trabaja el suplemento desde adentro.'],
];

/** Testimonios reales, verificados contra el muro de la landing. */
export const TESTIMONIOS = [
  { foto: '/assets/testimonios/t01.jpg', nombre: 'María Fernanda', ciudad: 'Bogotá',
    texto: 'Lo que más me preocupaba era ver cuánto cabello quedaba en el cepillo. Después de varias semanas siento que se me cae muchísimo menos y el cabello se ve más lleno.' },
  { foto: '/assets/testimonios/t02.jpg', nombre: 'Claudia', ciudad: 'Medellín',
    texto: 'Me gustó que no fuera solamente una vitamina, sino que trajera también el roll on. Ahora siento esa zona mucho más cubierta. La verdad le tenía menos fe, pero ha funcionado.' },
  { foto: '/assets/testimonios/t06.jpg', nombre: 'Diana', ciudad: 'Pereira',
    texto: 'Ya había probado shampoos, ampollas y vitaminas por separado y nada me había servido. Este tratamiento sí me ayudó un montón.' },
];

/** Guías: la estructura está lista; los textos los escribe la marca. */
/**
 * Las guías del blog.
 *
 * Una guía con `enlace` no se redacta aquí: ya existe como página publicada y
 * la tarjeta lleva directamente a ella. Es el caso del listicle, que está
 * escrito, maquetado y con sus fotos — repetirlo como borrador en esta lista
 * sería tener el mismo artículo dos veces, uno de ellos peor.
 */
export const GUIAS = [
  { slug: 'siete-razones-caida-despues-de-los-35',
    titulo: '7 razones por las que la caída no se detiene después de los 35',
    resumen: 'Por qué el shampoo no llega a la causa, qué es la DHT y por qué doce semanas '
      + 'no son lo mismo que cuatro. Con testimonios de clientas reales.',
    imagen: '/assets/listicle/hero-espejo.jpg', minutos: 4,
    enlace: '/p/dermafol-listicle', destacada: true },
  { slug: 'por-que-se-cae-el-cabello-despues-de-los-30',
    titulo: 'Por qué se cae el cabello después de los 30',
    resumen: 'La DHT, el cortisol y los déficits que nadie revisa. Las tres causas de la caída femenina y por qué el shampoo no llega a ninguna.',
    imagen: '/assets/tienda/suplemento-abierto.jpg', minutos: 6, cuerpo: PENDIENTE },
  { slug: 'como-leer-tu-linea-de-particion',
    titulo: 'Cómo leer tu línea de partición',
    resumen: 'Qué mirar, cada cuánto fotografiarla y qué cambios son normales entre una semana y otra.',
    imagen: '/assets/tienda/mujer-producto.jpg', minutos: 4, cuerpo: PENDIENTE },
  { slug: 'las-12-semanas-del-ciclo-capilar',
    titulo: 'Las 12 semanas del ciclo capilar',
    resumen: 'Qué esperar en cada etapa del tratamiento y por qué abandonar al mes es abandonar en el primer tercio.',
    // El recorte limpio, sin el titular de la creatividad: al llevarla a 7:5 la
    // frase quedaba partida a la mitad dentro de la tarjeta.
    imagen: '/assets/tienda/antes-despues-limpio.jpg', minutos: 5, cuerpo: PENDIENTE },
];

export const guiaPorSlug = (s) => GUIAS.find((g) => g.slug === s) || null;

export const POLITICAS = [
  ['privacidad', 'Política de privacidad'],
  ['datos', 'Tratamiento de datos personales'],
  ['envios', 'Envíos y entregas'],
  ['devoluciones', 'Cambios y devoluciones'],
  ['terminos', 'Términos y condiciones'],
];

export const politicaPorSlug = (s) => POLITICAS.find(([u]) => u === s) || null;

/** Formato de pesos colombianos, sin decimales, que es como se escriben aquí. */
export const pesos = (n) => '$' + Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
