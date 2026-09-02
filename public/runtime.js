/**
 * DropStudio · runtime de landing
 * ────────────────────────────────
 * Se inyecta automáticamente en toda página publicada en /p/:slug.
 * Se encarga de: identidad de sesión, captura de UTMs, eventos de embudo
 * y el envío del pedido al backend, sin tocar el HTML de la landing.
 */
(function () {
  'use strict';

  var CTX = window.__DS__ || {};
  if (!CTX.pageId) return;

  /* ── Sesión y atribución ───────────────────────────────────────────── */

  var qs = new URLSearchParams(location.search);
  var STORE = 'ds_session_id';

  function sessionId() {
    try {
      var s = sessionStorage.getItem(STORE);
      if (!s) {
        s = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem(STORE, s);
      }
      return s;
    } catch (e) {
      return 's' + Date.now().toString(36);
    }
  }

  var SID = sessionId();
  var DEVICE = /iPad|Tablet/i.test(navigator.userAgent) ? 'tablet'
    : /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

  var UTM = {
    utm_source: qs.get('utm_source') || (document.referrer ? hostOf(document.referrer) : ''),
    utm_medium: qs.get('utm_medium') || '',
    utm_campaign: qs.get('utm_campaign') || '',
    utm_content: qs.get('utm_content') || qs.get('ad_id') || '',
  };

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  /* ── Identificadores de Meta ───────────────────────────────────────────
     `_fbp` y `_fbc` son las dos señales que más pesan al emparejar un evento
     de servidor con la persona que hizo clic en el anuncio. Sin ellas la API
     de Conversiones recibe el evento pero Meta no sabe a qué clic atribuirlo,
     que es justo lo que hacía que un pedido no apareciera en Ads Manager.
     ──────────────────────────────────────────────────────────────────── */

  function cookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : '';
  }

  // El píxel escribe `_fbc` solo si la landing se abre con `fbclid`. Cuando la
  // persona navega dentro del sitio ese parámetro se pierde, así que en la
  // primera visita se guarda a mano con el formato que Meta espera.
  (function persistFbc() {
    var fbclid = qs.get('fbclid');
    if (!fbclid || cookie('_fbc')) return;
    var val = 'fb.1.' + Date.now() + '.' + fbclid;
    try {
      document.cookie = '_fbc=' + val + ';path=/;max-age=' + (90 * 86400) + ';SameSite=Lax';
    } catch (e) { /* sin cookies, seguimos con lo que haya */ }
  })();

  var fbIds = function () {
    return { fbp: cookie('_fbp'), fbc: cookie('_fbc') };
  };

  /* ── Envío de eventos ──────────────────────────────────────────────── */

  var sent = {};

  /* ── Píxel de Meta ─────────────────────────────────────────────────── */

  // Cada evento lleva su propio eventID. Hoy sólo sirve para no duplicar si
  // el usuario recarga; mañana permite deduplicar contra la API de
  // Conversiones sin tocar esta parte.
  // El id tiene que ser el MISMO en el navegador y en el servidor para que Meta
  // cuente una sola vez. Por eso se deriva de la sesión y el tipo, sin la hora:
  // dos llamadas al mismo evento en la misma sesión son el mismo hecho.
  function eventId(name) {
    return name + '_' + SID;
  }

  // Un desarrollo en local no puede mandar eventos al píxel real: en el conjunto
  // de datos apareció una compra con host 127.0.0.1, o sea alguien corriendo el
  // servidor contra la base de producción. Esa compra no existe y el algoritmo
  // aprende de ella igual.
  var ES_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)
    || /\.local$/.test(location.hostname);

  function meta(event, params, id) {
    if (CTX.preview || ES_LOCAL || !CTX.meta_pixel || typeof window.fbq !== 'function') return;
    try {
      window.fbq('track', event, params || {}, { eventID: id || eventId(event) });
    } catch (e) { /* que un fallo del píxel nunca rompa el checkout */ }
  }

  function track(type, value, meta_event) {
    if (CTX.preview) return;                  // el preview del panel no ensucia métricas
    var ids = fbIds();
    var payload = JSON.stringify({
      type: type, page_id: CTX.pageId, session_id: SID, variant: CTX.variant,
      device: DEVICE, utm_source: UTM.utm_source, utm_campaign: UTM.utm_campaign,
      utm_content: UTM.utm_content,
      value: value || 0,
      // Lo que necesita el servidor para repetir el evento por la API de
      // Conversiones y que Meta lo deduplique contra el del navegador.
      meta_event: meta_event || '', meta_event_id: meta_event ? eventId(meta_event) : '',
      fbp: ids.fbp, fbc: ids.fbc, source_url: location.href,
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track/event', new Blob([payload], { type: 'application/json' }));
        return;
      }
    } catch (e) { /* cae al fetch */ }
    fetch('/api/track/event', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: payload, keepalive: true,
    }).catch(function () {});
  }

  function once(type, value, meta_event) {
    if (sent[type]) return;
    sent[type] = true;
    track(type, value, meta_event);
  }

  // PageView y ViewContent salen por navegador (arriba, en el <head>) y también
  // por servidor, con el mismo event_id. El píxel del head ya los disparó, así
  // que aquí sólo se pide el envío server-side de los dos.
  once('pageview', 0, 'PageView,ViewContent');

  /* ── Profundidad de scroll ─────────────────────────────────────────── */

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      var p = window.scrollY / h;
      if (p >= 0.5) once('scroll_50');
      if (p >= 0.9) once('scroll_90');
    });
  }, { passive: true });

  /* ── Hasta dónde baja cada visita ──────────────────────────────────── */

  /**
   * Informa qué secciones alcanzó la persona y cuánto tiempo estuvo.
   *
   * Antes sólo existía "llegó al 50% de la página", y con una página de 18.000
   * píxeles ese umbral no dice nada: el 97,7% no lo alcanzaba y no había forma
   * de saber si se iban en el titular, en el precio o en los testimonios.
   *
   * Se usa scroll y no IntersectionObserver a propósito: el observador no
   * dispara en todos los contextos y aquí el dato tiene que llegar siempre.
   * Una sección cuenta como vista cuando su borde superior entra en la pantalla,
   * y sólo se informa una vez por visita.
   */
  var secciones = [].slice.call(document.querySelectorAll('[data-seccion]'));
  var vistas = {};
  var masProfunda = 0;
  var inicio = Date.now();

  function medirProfundidad() {
    var alto = window.innerHeight || 0;
    for (var i = 0; i < secciones.length; i++) {
      var s = secciones[i];
      var n = Number(s.getAttribute('data-seccion') || 0);
      if (vistas[n]) continue;
      // El borde de arriba entró en pantalla: la sección empezó a verse.
      if (s.getBoundingClientRect().top < alto * 0.9) {
        vistas[n] = true;
        if (n > masProfunda) masProfunda = n;
        track('seccion', n);
      }
    }
  }

  if (secciones.length) {
    var pendiente = false;
    window.addEventListener('scroll', function () {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () { pendiente = false; medirProfundidad(); });
    }, { passive: true });

    // Repaso cada segundo y medio además del scroll. No es redundancia
    // gratuita: hay navegadores donde el evento de scroll no llega —se
    // comprobó— y entonces la medición entera se perdería en silencio, que es
    // la peor forma de fallar para algo cuyo trabajo es contar. Se apaga sola
    // cuando ya se vieron todas las secciones.
    var reloj = setInterval(function () {
      medirProfundidad();
      if (masProfunda >= secciones.length) clearInterval(reloj);
    }, 1500);

    medirProfundidad();   // lo que ya se ve al abrir
  }

  /**
   * Al irse: cuántos segundos estuvo y hasta qué sección llegó.
   *
   * El tiempo separa dos cosas que en el embudo se ven iguales: quien rebota en
   * tres segundos porque el anuncio prometía otra cosa, y quien lee dos minutos
   * y aun así no compra. Son problemas distintos y se arreglan distinto.
   */
  var salidaEnviada = false;
  function anotarSalida() {
    if (salidaEnviada) return;
    salidaEnviada = true;
    track('salida', Math.min(3600, Math.round((Date.now() - inicio) / 1000)));
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') anotarSalida();
  });
  window.addEventListener('pagehide', anotarSalida);

  /* ── Clics en CTA / apertura de checkout ───────────────────────────── */

  /**
   * Si el formulario de pedido está a la vista ahora mismo.
   *
   * `checkout_open` se disparaba a los 60 ms del clic sin comprobar nada, así
   * que salía idéntico a `cta_click` todos los días y ese peldaño del embudo
   * no medía nada: era el mismo evento contado dos veces.
   *
   * Se mira el formulario y no el modal por su id porque cada landing lo abre
   * a su manera —clase `open` aquí, otra cosa allá—, pero todas tienen un
   * `[data-ds-form]` y sólo ocupa espacio en pantalla cuando el checkout está
   * realmente abierto.
   */
  function checkoutAbierto() {
    var f = document.querySelector('[data-ds-form]');
    if (!f) return false;
    var r = f.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('a[href="#pedir"], [data-ds-cta]') : null;
    if (!el) return;
    track('cta_click', 0, 'AddToCart');

    var o = (CTX.offers || [])[0];
    var carrito = {
      content_ids: [CTX.productId || ''],
      content_type: 'product',
      num_items: o ? o.qty : 1,
      value: o ? o.price : (CTX.product ? CTX.product.price : 0),
      currency: 'COP'
    };

    // Esta página no tiene carrito: el CTA lleva directo al formulario. Aun así
    // se manda AddToCart, porque es el peldaño que Ads Manager espera entre ver
    // el producto y empezar el checkout. Sin él esa columna sale en cero y el
    // embudo parece roto cuando no lo está.
    // Sin `once()` a propósito: ese helper además registra el evento en la base,
    // y aquí ya lo cuenta `cta_click`. Duplicarlo inflaría el embudo del panel.
    if (!sent.add_to_cart) {
      sent.add_to_cart = true;
      meta('AddToCart', carrito);
    }

    // Los 60 ms le dan tiempo al modal a abrirse; la comprobación es la que
    // decide. Si el clic no abrió nada —el enlace no llevaba a ningún sitio, un
    // script se cayó antes— no hay checkout que contar.
    setTimeout(function () {
      if (sent.checkout_open || !checkoutAbierto()) return;
      once('checkout_open', 0, 'InitiateCheckout');
      meta('InitiateCheckout', carrito);
    }, 60);
  }, true);

  /* ── Envío del pedido ──────────────────────────────────────────────── */

  var form = document.querySelector('[data-ds-form]');
  if (!form) return;

  // La validación del navegador se apaga a propósito. Los campos llevan
  // `required`, así que al pulsar enviar con alguno vacío el navegador frenaba
  // el submit y sacaba su propia burbuja —"Selecciona un elemento de la lista"—
  // antes de que corriera la nuestra. Resultado: los avisos escritos para esta
  // tienda no aparecían nunca y el teléfono corto o la dirección incompleta se
  // explicaban con un texto genérico del sistema.
  form.setAttribute('novalidate', '');

  var submitBtn = form.querySelector('[data-ds-submit]') || form.querySelector('button');
  var offers = CTX.offers || [];
  var busy = false;

  /**
   * La oferta que la persona tiene elegida ahora mismo.
   *
   * Conviven dos maneras de pintarla: un grupo de radios, donde las opciones se
   * ven todas a la vez, y el <select> de las landings anteriores. Se leen igual
   * porque de ambos sale el mismo trío —id, cantidad y precio— y el pedido no
   * tiene por qué saber cuál de los dos vio quien lo hizo.
   *
   * Se relee en cada envío: si el formulario se restauró, la referencia que se
   * capturó al cargar podría apuntar a un nodo que ya no está en la página.
   */
  function currentOffer() {
    // Los radios primero, y sólo el marcado: `[data-ds-offer]` a secas
    // devolvería el primero del grupo, que es justo el que no hay que cobrar
    // cuando la persona eligió otro.
    var radio = form.querySelector('input[type="radio"][data-ds-offer]:checked');
    if (radio) return offerFromNode(radio, radio.value);

    var offerSel = form.querySelector('select[data-ds-offer]');
    if (!offerSel) return offers[0] || null;
    var byId = offers.filter(function (o) { return o.id === offerSel.value; })[0];
    if (byId) return byId;
    var opt = offerSel.selectedOptions && offerSel.selectedOptions[0];
    if (!opt) return offers[0] || null;
    return offerFromNode(opt, opt.textContent.trim());
  }

  /** La oferta del catálogo si el id cuadra; si no, lo que diga el propio nodo. */
  function offerFromNode(node, nombre) {
    var byId = offers.filter(function (o) { return o.id === node.value; })[0];
    if (byId) return byId;
    return {
      id: node.value, name: String(nombre || '').trim(),
      qty: Number(node.dataset.qty || 1), price: Number(node.dataset.price || 0),
    };
  }

  function value(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? String(el.value || '').trim() : '';
  }

  function markInvalid(el, on) {
    if (!el) return;
    // En una casilla el borde rojo no se ve —es de 17 px— así que el aviso lo
    // da su recuadro con la clase `mal`, que pone `bloqueDe`.
    if (el.type === 'checkbox') return;
    el.style.borderColor = on ? '#d03b3b' : '';
  }

  /**
   * Qué le falta a un campo, en palabras. Devuelve null si está bien.
   *
   * Es la única definición de las reglas: antes vivían duplicadas en `validate`
   * y en `cuantosFaltan`, y se contradecían en cuanto se tocaba una.
   *
   * El teléfono pide diez dígitos exactos —los celulares colombianos los
   * tienen— y la dirección un mínimo de seis caracteres, porque "cra 5" o "mi
   * casa" llegan al transportador como una entrega que hay que adivinar y se
   * devuelven.
   */
  /**
   * El celular en los diez dígitos que espera la transportadora, o '' si no
   * hay forma de sacarlos.
   *
   * Mucha gente tiene el número guardado con el indicativo y el autocompletado
   * lo mete tal cual. Exigir diez dígitos a secas rechazaba "+57 300 123 4567",
   * que es un número perfectamente bueno, con un aviso que decía que estaba
   * mal. Se le quita el 57 de delante, o el 0 de la marcación antigua, en vez
   * de mandar a la persona a corregir algo que no está mal.
   */
  function telefonoCol(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length === 12 && d.indexOf('57') === 0) d = d.slice(2);
    else if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return d.length === 10 ? d : '';
  }

  function problema(name) {
    // La casilla de compromiso no tiene texto que validar: o está marcada o no.
    // Va aquí y no en `validate` para que el contador del botón, el aviso y el
    // envío usen todos la misma regla, que es de lo que sirve tener un único
    // sitio donde se decide si un campo está bien.
    if (name === 'compromiso') {
      var c = form.querySelector('[name="compromiso"]');
      return !c || c.checked ? null : 'Marca la casilla para confirmar que recibirás tu pedido';
    }
    var v = value(name);
    if (name === 'phone') {
      return telefonoCol(v) ? null : 'Tu número de teléfono no está correcto. Ej: 3053765678';
    }
    if (name === 'address') {
      return v.length >= 6 ? null : 'Pon tu dirección más completa para que logremos hacer la entrega';
    }
    if (v) return null;
    if (name === 'customer_name') return 'Escribe tu nombre y apellido';
    if (name === 'department') return 'Elige tu departamento';
    if (name === 'city') return 'Elige tu ciudad';
    return 'Completa este dato';
  }

  /** El bloque que envuelve al campo, donde cabe el aviso debajo. */
  function bloqueDe(el) {
    return (el.closest && el.closest('.dsx-f, .dsx-cmt, .field')) || el.parentElement;
  }

  function mostrarAviso(el, texto) {
    var b = bloqueDe(el);
    if (!b) return;
    var p = b.querySelector('.dsx-err');
    if (!p) {
      p = document.createElement('p');
      p.className = 'dsx-err';
      // Con estilo propio para que el aviso también se vea en las landings
      // que no traen la regla en su CSS.
      p.style.cssText = 'margin:4px 0 0;font-size:11px;line-height:1.35;color:#c0392b';
      b.appendChild(p);
    }
    p.textContent = texto;
    p.style.display = 'block';
    b.classList.add('mal');
  }

  function ocultarAviso(el) {
    var b = bloqueDe(el);
    if (!b) return;
    var p = b.querySelector('.dsx-err');
    if (p) p.style.display = 'none';
    b.classList.remove('mal');
  }

  function validate() {
    // El número se deja escrito ya normalizado antes de enviarlo: lo que se
    // guarda y lo que llega a la transportadora son los diez dígitos, no lo que
    // vino del autocompletado.
    var tel = form.querySelector('[name="phone"]');
    if (tel) {
      var limpio = telefonoCol(tel.value);
      if (limpio) tel.value = limpio;
    }

    var primero = null;
    REQUERIDOS.forEach(function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (!el) return;
      var falla = problema(name);
      markInvalid(el, !!falla);
      if (falla) {
        mostrarAviso(el, falla);
        if (!primero) primero = el;
      } else {
        ocultarAviso(el);
      }
    });
    if (primero) {
      primero.focus();
      primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  /* ── Cuántos datos faltan ──────────────────────────────────────────── */

  /**
   * El pie del modal es fijo: al abrirlo se ven los dos botones y sólo los
   * primeros campos, así que el formulario parece de dos casillas y hay quien
   * pulsa creyendo que ya terminó.
   *
   * El aviso va dentro del subtítulo del botón —no en una línea aparte— porque
   * ahí no cuesta ni un píxel de alto, que es justo lo que falta, y está donde
   * mira quien va a pulsar. El texto principal del botón no se toca: sigue
   * siendo la llamada a la acción.
   */
  // Dos listas y no una: `DATOS` son las casillas que la clienta rellena y
  // `REQUERIDOS` es todo lo que hace falta para enviar. La casilla de
  // compromiso está en la segunda pero no en la primera a propósito — el
  // contador de `checkout_abandon` mide cuántos datos alcanzó a escribir, y si
  // el denominador pasara de 5 a 6 las cifras de antes y de después dejarían de
  // poder compararse justo cuando hace falta comparar.
  var DATOS = ['customer_name', 'phone', 'department', 'city', 'address'];
  var REQUERIDOS = DATOS.concat(['compromiso']);
  var subOriginal = null;

  function cuantosFaltan() {
    return DATOS.filter(function (name) { return !!problema(name); }).length;
  }

  function pintarFaltan() {
    // Se relee en cada pasada: mientras se envía, el botón cambia de contenido
    // y una referencia guardada apuntaría a un nodo que ya no está.
    var sub = submitBtn && submitBtn.querySelector('span');
    if (!sub) return;
    if (subOriginal === null) subOriginal = sub.innerHTML;
    var n = cuantosFaltan();
    // Con los datos completos pero la casilla sin marcar, un "te falta 1 dato"
    // manda a buscar un campo vacío que no existe. Se nombra lo que falta.
    if (!n) {
      sub.innerHTML = problema('compromiso') ? 'Marca la casilla para continuar' : subOriginal;
      return;
    }
    sub.textContent = n === 1 ? 'Te falta 1 dato por completar'
      : 'Te faltan ' + n + ' datos por completar';
  }

  /** Sigue lo que se escribe en un campo para actualizar aviso y contador. */
  function vigilarCampo(name) {
    var el = form.querySelector('[name="' + name + '"]');
    if (!el) return;
    // `change` además de `input` porque los desplegables de departamento y
    // ciudad no emiten `input` en todos los navegadores.
    ['input', 'change'].forEach(function (ev) {
      el.addEventListener(ev, function () {
        markInvalid(el, false);
        // El aviso se retira en cuanto el dato queda bien, no antes: si se
        // borrase al primer tecleo, quien escribe un teléfono corto vería
        // desaparecer la explicación justo mientras la necesita.
        if (!problema(name)) ocultarAviso(el);
        pintarFaltan();
      });
    });
  }

  REQUERIDOS.forEach(vigilarCampo);
  window.addEventListener('dsmodal', pintarFaltan);
  pintarFaltan();

  /* ── Departamentos y municipios ────────────────────────────────────── */

  /**
   * Rellena los dos desplegables con el listado oficial: 32 departamentos y
   * 8.193 municipios. La ciudad depende del departamento y arranca bloqueada.
   *
   * El listado se pide la primera vez que se abre el checkout, no al cargar la
   * página: son 54 KB comprimidos que no le sirven de nada al 96% que nunca
   * llega al formulario.
   */
  var selDept = form.querySelector('[data-ds-dept]');
  var selCity = form.querySelector('[data-ds-city]');
  var ubicaciones = null;
  var pidiendo = false;

  function opciones(sel, lista, vacio) {
    var frag = document.createDocumentFragment();
    var o = document.createElement('option');
    o.value = ''; o.textContent = vacio;
    frag.appendChild(o);
    for (var i = 0; i < lista.length; i++) {
      var x = document.createElement('option');
      x.value = lista[i]; x.textContent = lista[i];
      frag.appendChild(x);
    }
    sel.innerHTML = '';
    sel.appendChild(frag);
  }

  function pintarCiudades() {
    if (!ubicaciones || !selCity) return;
    var lista = ubicaciones[selDept.value] || [];
    // Las dos casillas van una al lado de la otra y son estrechas: si la de
    // ciudad dijera "Elige tu departamento" se leería igual que la de al lado
    // y parecería repetida. Bloqueada explica qué falta; suelta, sólo invita.
    opciones(selCity, lista, lista.length ? 'Elige…' : 'Primero el departamento');
    selCity.disabled = !lista.length;
    pintarFaltan();
  }

  function cargarUbicaciones() {
    if (!selDept || ubicaciones || pidiendo) return;
    pidiendo = true;
    fetch('/co.json')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        ubicaciones = d;
        opciones(selDept, Object.keys(d), 'Elige…');
        selDept.addEventListener('change', pintarCiudades);
        pintarCiudades();
      })
      .catch(function () {
        // Si el listado no llega, los desplegables quedarían vacíos y sin
        // salida. Se convierten en casillas de texto: es peor dato, pero deja
        // comprar, que es lo que no se puede perder.
        pidiendo = false;
        [selDept, selCity].forEach(function (sel) {
          if (!sel) return;
          var t = document.createElement('input');
          t.type = 'text'; t.name = sel.name; t.id = sel.id; t.required = true;
          t.placeholder = sel === selDept ? 'Departamento' : 'Ciudad';
          t.className = sel.className;
          sel.parentNode.replaceChild(t, sel);
        });
        selDept = selCity = null;
        // Los nuevos nodos necesitan sus propios oyentes: los del desplegable
        // se fueron con él.
        ['department', 'city'].forEach(vigilarCampo);
        pintarFaltan();
      });
  }

  window.addEventListener('dsmodal', cargarUbicaciones);
  if (checkoutAbierto()) cargarUbicaciones();

  /* ── Abandono del checkout ─────────────────────────────────────────── */

  /**
   * Quien abrió el formulario y se fue sin pedir, y hasta dónde llegó.
   *
   * Sin esto el embudo se corta justo donde está el agujero: 15 de cada 26 que
   * abren el checkout no lo terminan y no había ni un dato de por qué. El
   * número de campos completos viaja en `value`, así que 0 es "abrió y cerró
   * sin escribir nada" y 4 es "se atascó en el último" — que son dos problemas
   * distintos y se arreglan distinto.
   *
   * Se anota al irse de la página, no al cerrar el modal: cerrarlo y seguir
   * leyendo no es abandonar, y quien se va con el formulario abierto —lo más
   * común— no dispara ningún cierre que escuchar.
   */
  var maxCampos = 0;
  var pedidoHecho = false;

  function recordarAvance() {
    var llenos = REQUERIDOS.length - cuantosFaltan();
    if (llenos > maxCampos) maxCampos = llenos;
  }

  function anotarAbandono() {
    if (!sent.checkout_open || pedidoHecho || sent.checkout_abandon) return;
    sent.checkout_abandon = true;
    recordarAvance();
    track('checkout_abandon', maxCampos);
  }

  REQUERIDOS.forEach(function (name) {
    var el = form.querySelector('[name="' + name + '"]');
    if (el) el.addEventListener('input', recordarAvance);
  });

  // Los dos: `visibilitychange` es el que sí llega en móvil cuando se cambia de
  // app o se cierra la pestaña, y `pagehide` cubre la navegación normal. El
  // propio evento se manda con sendBeacon, que sobrevive a la descarga.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') anotarAbandono();
  });
  window.addEventListener('pagehide', anotarAbandono);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    if (!validate()) return;

    var offer = currentOffer();
    var originalLabel = submitBtn ? submitBtn.innerHTML : '';
    busy = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '.7';
      submitBtn.innerHTML = 'Enviando tu pedido…';
    }

    fetch('/api/track/order', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        page_id: CTX.pageId,
        product_id: CTX.productId,
        test_id: CTX.testId,
        variant: CTX.variant,
        session_id: SID,
        device: DEVICE,
        customer_name: value('customer_name'),
        phone: value('phone'),
        email: value('email'),
        department: value('department'),
        city: value('city'),
        address: value('address'),
        notes: value('notes'),
        offer_name: offer ? offer.name : '',
        qty: offer ? offer.qty : 1,
        subtotal: offer ? offer.price : (CTX.product ? CTX.product.price : 0),
        total: offer ? offer.price : (CTX.product ? CTX.product.price : 0),
        payment_method: 'cod',
        utm_source: UTM.utm_source,
        utm_medium: UTM.utm_medium,
        utm_campaign: UTM.utm_campaign,
        utm_content: UTM.utm_content,
        // Las mismas señales que van en cada evento. Sin ellas la compra llega
        // a Meta pero sin poder atribuirla al clic que la originó, que es lo
        // que hace que un pedido no aparezca en la campaña que lo trajo.
        fbp: fbIds().fbp, fbc: fbIds().fbc, source_url: location.href,
      }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'No pudimos registrar tu pedido');
        // Un reenvío del formulario no es una compra nueva: el servidor devolvió
        // el pedido que ya existía y su Purchase ya salió con el primer envío.
        if (res.data.duplicate) { showSuccess(res.data, offer); return; }

        // Purchase al tomar el pedido. En contra entrega el cliente todavía no
        // ha pagado, pero Meta necesita la señal ya: esperar a la entrega la
        // retrasa días y deja al algoritmo sin nada con que aprender.
        //
        // El `eventID` es el código del pedido, el mismo que usa el servidor al
        // mandar este evento por la API de Conversiones. Así Meta reconoce que
        // son el mismo hecho y cuenta una sola compra, no dos.
        meta('Purchase', {
          content_ids: [CTX.productId || ''],
          content_type: 'product',
          content_name: offer ? offer.name : '',
          num_items: offer ? offer.qty : 1,
          value: res.data.total || (offer ? offer.price : 0),
          currency: 'COP',
          order_id: res.data.code || ''
        }, res.data.code || undefined);
        showSuccess(res.data, offer);
      })
      .catch(function (err) {
        busy = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '';
          submitBtn.innerHTML = originalLabel;
        }
        showError(err.message);
      });
  });

  function showError(msg) {
    var box = form.querySelector('[data-ds-error]');
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('data-ds-error', '');
      box.style.cssText = 'background:#fdeaea;color:#a01c1c;border:1px solid #f3c7c7;border-radius:10px;'
        + 'padding:12px 14px;font-size:13px;margin-bottom:14px;line-height:1.45';
      form.insertBefore(box, form.firstChild);
    }
    box.textContent = msg;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /**
   * Confirmación del pedido.
   *
   * No se reemplaza el contenido del formulario: se esconden sus hijos y se
   * añade el panel al lado. Machacar el innerHTML dejaba colgando las
   * referencias que ya habían capturado el <select> de ofertas y el botón —el
   * script de la landing incluido—, y sobre todo dejaba el mensaje pegado: al
   * cerrar el modal y volver a tocar "pedir", la persona veía "¡Pedido
   * confirmado!" en vez del formulario y creía que ya había comprado.
   */
  var hijosOcultos = [];

  function ocultarFormulario() {
    hijosOcultos = [];
    for (var i = 0; i < form.children.length; i++) {
      var n = form.children[i];
      if (n.hasAttribute('data-ds-done')) continue;
      hijosOcultos.push([n, n.style.display]);
      n.style.display = 'none';
    }
  }

  /** Devuelve el formulario a su estado original para poder pedir otra vez. */
  function restaurarFormulario() {
    var panel = form.querySelector('[data-ds-done]');
    if (panel) panel.remove();
    for (var i = 0; i < hijosOcultos.length; i++) hijosOcultos[i][0].style.display = hijosOcultos[i][1];
    hijosOcultos = [];
    busy = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = ''; }
    form.removeAttribute('data-ds-hecho');
  }

  // La landing avisa cada vez que el modal se abre o se cierra. Si se vuelve a
  // abrir con un pedido ya enviado, se devuelve el formulario limpio.
  window.addEventListener('dsmodal', function () {
    var m = document.getElementById('dsModal');
    if (m && m.classList.contains('open') && form.getAttribute('data-ds-hecho')) restaurarFormulario();
  });

  function showSuccess(data, offer) {
    var price = offer ? offer.price : 0;
    var money = '$' + String(price).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // La cantidad va escrita en la confirmación porque el reclamo caro no es el
    // que se resuelve por chat: es el que aparece en la puerta, cuando llegan
    // dos cajas y la clienta creía haber pedido una y rechaza la entrega.
    var q = offer ? Number(offer.qty || 1) : 1;
    var cuantos = q + (q === 1 ? ' combo' : ' combos');
    pedidoHecho = true;
    ocultarFormulario();
    form.setAttribute('data-ds-hecho', '1');
    var panel = document.createElement('div');
    panel.setAttribute('data-ds-done', '');
    panel.innerHTML = ''
      + '<div style="text-align:center;padding:8px 0 4px">'
      + '  <div style="width:64px;height:64px;border-radius:50%;background:#eaf5ee;display:flex;'
      + '       align-items:center;justify-content:center;margin:0 auto 18px">'
      + '    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#0ca30c" stroke-width="2.4"'
      + '         stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.5 5.5L20 7"/></svg>'
      + '  </div>'
      + '  <div style="font-size:22px;line-height:1.2;margin-bottom:8px">¡Pedido confirmado!</div>'
      + '  <p style="font-size:13.5px;color:#6E5A5B;line-height:1.55;margin-bottom:18px">'
      + '    Te llamaremos en las próximas horas para confirmar la entrega.<br>'
      + '    Recibes <b>' + cuantos + '</b> y pagas <b>' + money + '</b> en efectivo.</p>'
      + '  <div style="border:1px dashed #ECDFD9;border-radius:12px;padding:14px;background:#FBF6F2">'
      + '    <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6E5A5B">Número de pedido</div>'
      + '    <div style="font-size:20px;font-weight:700;letter-spacing:.05em;margin-top:4px">' + (data.code || '—') + '</div>'
      + '  </div>'
      // La guía se promete como regalo en el checkout, así que se entrega aquí
      // mismo y no por un correo posterior: prometer algo que llega "después"
      // es exactamente lo que hace dudar a quien paga contra entrega.
      + '  <a href="/guia-anticaida.pdf" target="_blank" rel="noopener" data-ds-guia'
      + '     style="display:block;margin-top:14px;padding:12px;border-radius:12px;border:1.5px solid #916e53;'
      + '     color:#916e53;font-size:13.5px;font-weight:700;text-decoration:none">'
      + '    Descargar tu guía anticaída'
      + '    <span style="display:block;font-size:11px;font-weight:400;color:#6E5A5B;margin-top:2px">'
      + '      9 páginas · tuya desde ya</span></a>'
      + '</div>';
    form.appendChild(panel);
    // El evento `order` lo registra el backend al crear el pedido — no se duplica aquí.
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
