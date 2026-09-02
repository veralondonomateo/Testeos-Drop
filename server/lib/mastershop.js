/**
 * Envío de pedidos a Mastershop, la plataforma que hace los despachos.
 *
 * El pedido se guarda primero en la base y sólo después se empuja aquí. Si
 * Mastershop está caído o rechaza algo, la venta ya está registrada y se puede
 * reintentar: lo que no se puede perder es el pedido, no el despacho.
 *
 * La API documenta listar y consultar, pero no crear. El esquema de creación
 * (`POST /api/orders`) se sacó de sus propios errores de validación el
 * 25-ago-2026; si algún día cambia, esos errores vuelven a ser la referencia.
 */

const API = 'https://prod.api.mastershop.com/api';

/**
 * Las variantes del Kit Dermafol en Mastershop.
 *
 * Cada cantidad es una variante distinta, no una cantidad de la misma: pedir
 * "2 combos" es una unidad de la variante «2 UNIDADES», y mandarlo como
 * `quantity: 2` de la de una unidad despacharía otra cosa y cobraría otro flete.
 */
const VARIANTES = {
  1: { idVariant: 553915, sku: 'DERMAFOL-1U', nombre: 'Kit Dermafol - 1 UNIDAD' },
  2: { idVariant: 553916, sku: 'DERMAFOL-2U', nombre: 'Kit Dermafol - 2 UNIDADES' },
  3: { idVariant: 691239, sku: 'DERMAFOL-3U', nombre: 'Kit Dermafol - 3 UNIDADES' },
};

const ID_PRODUCTO = 176017;
const PESO_KG = 0.5;

/** Sólo se despacha automáticamente el contra entrega; ver `puedeEnviarse`. */
const PAGOS = { cod: 'cod' };

/**
 * Parte el nombre en nombre y apellido. Mastershop pide los dos por separado y
 * además el completo, y ninguno puede ir vacío.
 */
/**
 * Mastershop sólo admite letras y espacios en los nombres. Acepta tildes y ñ
 * —comprobado— pero rechaza apóstrofos, guiones, puntos y cifras, y con eso
 * tumba el pedido entero.
 *
 * Lo que no es letra se cambia por un espacio en vez de borrarlo: así
 * "Gómez-Ruiz" queda "Gómez Ruiz" y no "GómezRuiz", que es un apellido que no
 * existe. Al final se juntan los espacios sobrantes.
 */
const limpiarNombre = (s) => String(s || '')
  .replace(/[^\p{L}\s]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function partirNombre(completo) {
  const partes = limpiarNombre(completo).split(' ').filter(Boolean);
  if (!partes.length) return null;
  if (partes.length === 1) return { first: partes[0], last: partes[0], full: partes[0] };
  // Con tres o más palabras, la primera es el nombre y el resto el apellido.
  // No hay forma de acertar siempre —"Ana María Gómez Ruiz"— y equivocarse en
  // el corte no impide la entrega; dejarlo vacío sí.
  return { first: partes[0], last: partes.slice(1).join(' '), full: partes.join(' ') };
}

/** Sólo dígitos, que es lo que espera la transportadora. */
const soloDigitos = (s) => String(s || '').replace(/\D/g, '');

/**
 * Deja una dirección con los caracteres que la API admite.
 *
 * Acepta letras —con tildes y ñ—, números, espacio y `. , - #`. Rechaza
 * `( ) / : ; & '` y los símbolos de grado, y cuando encuentra uno tumba el
 * pedido entero con "Contiene caracteres no válidos".
 *
 * Costó pedidos reales por dos vías: direcciones que la clienta escribe con
 * barra ("Villavento 4 / mz 11 casa 27") y —peor, porque era culpa nuestra— el
 * campo `address2`, que se arma con el municipio, y el listado oficial trae
 * decenas con paréntesis: "Comuneros (Dosquebradas)", "La Fuente (Tocancipá)".
 * Cualquiera que eligiera uno de esos municipios no se podía despachar.
 *
 * Lo que sobra se cambia por un espacio y no se borra: "mz 11/casa 27" tiene
 * que quedar "mz 11 casa 27" y no "mz 11casa 27", que es una dirección que el
 * repartidor no entiende.
 */
const limpiarDireccion = (s) => String(s || '')
  .replace(/[^\p{L}\p{N} .,\-#]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Por qué un pedido no puede despacharse solo, o null si sí puede.
 *
 * Se comprueba antes de armar el cuerpo para que el motivo quede escrito en la
 * base y se pueda ver en el panel, en vez de descubrirlo en un error de la API.
 */
export function puedeEnviarse(o) {
  if (o.is_demo) return 'pedido de demostración';
  if (o.status === 'cancelled') return 'pedido cancelado';
  if (!PAGOS[o.payment_method]) return `pago "${o.payment_method}" se coordina a mano`;
  if (!VARIANTES[o.qty]) return `no hay variante para ${o.qty} unidades`;
  if (!partirNombre(o.customer_name)) return 'sin nombre';
  if (soloDigitos(o.phone).length !== 10) return 'teléfono que no tiene 10 dígitos';
  if (!String(o.department || '').trim()) return 'sin departamento';
  if (!String(o.city || '').trim()) return 'sin ciudad';
  // Se mide la dirección ya limpia: si de "///" no queda nada utilizable, el
  // pedido no puede despacharse aunque el campo viniera lleno.
  if (limpiarDireccion(o.address).length < 6) return 'dirección demasiado corta';
  return null;
}

/**
 * El cuerpo que espera `POST /api/orders`.
 *
 * `zip`, `company` y `address2` son obligatorios para la API aunque la propia
 * plataforma los guarde vacíos en los pedidos que ya le entran por otras vías.
 * Se rellenan con algo estable y reconocible en vez de inventar datos del
 * cliente: si un día aparecen en una guía, se entiende de dónde salieron.
 */
export function armarPedido(o) {
  const v = VARIANTES[o.qty];
  const n = partirNombre(o.customer_name);
  const tel = soloDigitos(o.phone);
  const direccion = {
    first_name: n.first,
    last_name: n.last,
    full_name: n.full,
    company: 'Dermafol',
    address1: limpiarDireccion(o.address),
    address2: limpiarDireccion(`${o.city} ${o.department}`),
    city: String(o.city).trim(),
    state: String(o.department).trim(),
    zip: '000000',
    country: 'CO',
    phone: tel,
  };
  return {
    // El código del pedido viaja como `id_order` y vuelve como
    // `externalOrderId`, que es por donde se comprueba si ya se mandó.
    id_order: o.code,
    shipping_address: direccion,
    billing_address: direccion,
    order_transaction: {
      total: o.total,
      currency: 'COP',
      payment_method: PAGOS[o.payment_method],
    },
    customer: {
      first_name: n.first,
      last_name: n.last,
      full_name: n.full,
      phone: tel,
      email: String(o.email || '').trim(),
      documentType: 'CC',
      // Mastershop agrupa clientes por este número, no por teléfono. Con un
      // relleno fijo —lo primero que se probó— todos los pedidos se pegaban al
      // mismo cliente: el segundo llegó con la dirección correcta pero atado al
      // comprador del primero, y su confirmación por WhatsApp habría salido al
      // número equivocado.
      //
      // Va el celular porque es lo que identifica a cada persona de forma única
      // en esta operación y además es un dato suyo de verdad, no un número
      // inventado. El checkout no pide cédula; si algún día se necesita la real,
      // se pide en el formulario y se cambia aquí.
      documentNumber: tel,
    },
    order_items: [{
      id_product: ID_PRODUCTO,
      id_variant: v.idVariant,
      quantity: 1,
      sku: v.sku,
      name: v.nombre,
      weight: PESO_KG,
      price: o.total,
    }],
  };
}

/**
 * Cuánto puede tardar cada llamada.
 *
 * La función de Vercel se corta a los 15 s y el despacho corre dentro de la
 * misma petición del checkout, después de guardar el pedido y de reportar la
 * compra a Meta. Con dos llamadas de 12 s el checkout se pasaba del límite y el
 * cliente veía un error por un pedido que sí había quedado guardado.
 *
 * 3,5 s cubre de sobra lo que tarda la API —las pruebas iban por debajo del
 * segundo— y deja margen para todo lo demás.
 */
const TIEMPO_MAX = 7_000;

async function pedir(ruta, opciones = {}) {
  const key = process.env.MASTERSHOP_API_KEY;
  if (!key) throw new Error('falta MASTERSHOP_API_KEY');
  const r = await fetch(`${API}${ruta}`, {
    ...opciones,
    headers: { 'ms-api-key': key, 'content-type': 'application/json', ...(opciones.headers || {}) },
    signal: AbortSignal.timeout(TIEMPO_MAX),
  });
  const cuerpo = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, cuerpo };
}

/**
 * Si Mastershop ya tiene este pedido. Segunda barrera contra duplicados: la
 * primera es la marca en nuestra base, pero un despacho repetido cuesta un
 * flete y un paquete, así que se paga la consulta extra.
 */
export async function yaExiste(code) {
  const { ok, cuerpo } = await pedir(`/orders?externalOrderId=${encodeURIComponent(code)}`);
  if (!ok || !cuerpo) return null;
  // Devuelve el idOrder y no un booleano para poder guardarlo: si el pedido ya
  // estaba allá y aquí no se anota su número, queda un pedido sin forma de
  // rastrear desde el panel, que es la mitad del problema que esto resuelve.
  if (cuerpo.idOrder) return cuerpo.idOrder;
  if (Array.isArray(cuerpo) && cuerpo.length) return cuerpo[0].idOrder ?? true;
  return null;
}

/**
 * Manda el pedido. Devuelve `{ enviado, idOrder, motivo }` y nunca lanza: quien
 * llama está en medio de un checkout y un fallo aquí no puede tumbarlo.
 */
export async function enviarPedido(o, { comprobarDuplicado = true } = {}) {
  const motivo = puedeEnviarse(o);
  if (motivo) return { enviado: false, motivo };

  try {
    // La comprobación cuesta un viaje de red. En el primer intento, dentro del
    // checkout, se salta: el pedido acaba de nacer y `createOrder` ya frena los
    // reenvíos del formulario, así que no puede estar allá todavía. Ahorrarla
    // deja todo el presupuesto de tiempo para la creación, que es lo que se
    // estaba agotando. En los reintentos sí se comprueba siempre, porque ahí el
    // pedido bien puede haberse creado en un intento que se cortó a mitad.
    const existente = comprobarDuplicado ? await yaExiste(o.code) : null;
    if (existente) {
      return {
        enviado: false, duplicado: true, motivo: 'ya estaba en Mastershop',
        idOrder: typeof existente === 'number' ? existente : null,
      };
    }
    const { ok, status, cuerpo } = await pedir('/orders', {
      method: 'POST',
      body: JSON.stringify(armarPedido(o)),
    });
    if (!ok) {
      const detalle = cuerpo?.error || cuerpo?.message || `HTTP ${status}`;
      const campos = Array.isArray(cuerpo?.data)
        ? ' · ' + cuerpo.data.map((e) => `${(e.path || []).join('.')}: ${e.message}`).join('; ')
        : '';
      return { enviado: false, motivo: `${detalle}${campos}`.slice(0, 400) };
    }
    const idOrder = cuerpo?.idOrder ?? cuerpo?.data?.idOrder ?? null;
    return { enviado: true, idOrder, respuesta: cuerpo };
  } catch (e) {
    return { enviado: false, motivo: String(e?.message || e).slice(0, 200) };
  }
}

export const _test = { partirNombre, soloDigitos, VARIANTES };
