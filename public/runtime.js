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

  /* ── Clics en CTA / apertura de checkout ───────────────────────────── */

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

    setTimeout(function () {
      if (sent.checkout_open) return;
      once('checkout_open', 0, 'InitiateCheckout');
      meta('InitiateCheckout', carrito);
    }, 60);
  }, true);

  /* ── Envío del pedido ──────────────────────────────────────────────── */

  var form = document.querySelector('[data-ds-form]');
  if (!form) return;

  var submitBtn = form.querySelector('[data-ds-submit]') || form.querySelector('button');
  var offers = CTX.offers || [];
  var busy = false;

  function currentOffer() {
    // Se relee en cada envío: si el formulario se restauró, la referencia que
    // se capturó al cargar podría apuntar a un nodo que ya no está en la página.
    var offerSel = form.querySelector('[data-ds-offer]');
    if (!offerSel) return offers[0] || null;
    var byId = offers.filter(function (o) { return o.id === offerSel.value; })[0];
    if (byId) return byId;
    var opt = offerSel.selectedOptions && offerSel.selectedOptions[0];
    if (!opt) return offers[0] || null;
    return {
      id: opt.value, name: opt.textContent.trim(),
      qty: Number(opt.dataset.qty || 1), price: Number(opt.dataset.price || 0),
    };
  }

  function value(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? String(el.value || '').trim() : '';
  }

  function markInvalid(el, on) {
    if (!el) return;
    el.style.borderColor = on ? '#d03b3b' : '';
  }

  function validate() {
    var required = ['customer_name', 'phone', 'department', 'city', 'address'];
    var firstBad = null;
    required.forEach(function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      var v = value(name);
      var bad = !v || (name === 'phone' && v.replace(/\D/g, '').length < 7);
      markInvalid(el, bad);
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      firstBad.focus();
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  var REQUERIDOS = ['customer_name', 'phone', 'department', 'city', 'address'];
  var subOriginal = null;

  function cuantosFaltan() {
    return REQUERIDOS.filter(function (name) {
      var v = value(name);
      return !v || (name === 'phone' && v.replace(/\D/g, '').length < 7);
    }).length;
  }

  function pintarFaltan() {
    // Se relee en cada pasada: mientras se envía, el botón cambia de contenido
    // y una referencia guardada apuntaría a un nodo que ya no está.
    var sub = submitBtn && submitBtn.querySelector('span');
    if (!sub) return;
    if (subOriginal === null) subOriginal = sub.innerHTML;
    var n = cuantosFaltan();
    if (!n) { sub.innerHTML = subOriginal; return; }
    sub.textContent = n === 1 ? 'Te falta 1 dato por completar'
      : 'Te faltan ' + n + ' datos por completar';
  }

  REQUERIDOS.forEach(function (name) {
    var el = form.querySelector('[name="' + name + '"]');
    if (el) el.addEventListener('input', function () { markInvalid(el, false); pintarFaltan(); });
  });
  window.addEventListener('dsmodal', pintarFaltan);
  pintarFaltan();

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
      + '    Pagas <b>' + money + '</b> en efectivo cuando lo recibas.</p>'
      + '  <div style="border:1px dashed #ECDFD9;border-radius:12px;padding:14px;background:#FBF6F2">'
      + '    <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6E5A5B">Número de pedido</div>'
      + '    <div style="font-size:20px;font-weight:700;letter-spacing:.05em;margin-top:4px">' + (data.code || '—') + '</div>'
      + '  </div>'
      + '</div>';
    form.appendChild(panel);
    // El evento `order` lo registra el backend al crear el pedido — no se duplica aquí.
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ── Pago por transferencia ────────────────────────────────────────── */

  /**
   * El botón de transferencia convive con el de contra entrega, no lo
   * reemplaza. Toma el pedido por la misma ruta —mismo Purchase, misma guarda
   * de duplicados— y además abre WhatsApp con los datos ya escritos, para que
   * la clienta no los repita y quien atiende no los tenga que pedir.
   *
   * Va aparte del `submit` a propósito, aunque repita parte del cuerpo: contra
   * entrega es lo que sostiene la venta hoy y no se toca. Si esto falla, aquel
   * sigue exactamente igual.
   */
  var WA_NUMERO = '573226979106';

  function urlWhatsApp(data, offer) {
    var q = offer ? offer.qty : 1;
    var ciudad = [value('city'), value('department')].filter(Boolean).join(', ');
    var texto = [
      '¡Hola! 💛 Quiero hacer mi compra por transferencia',
      '',
      '🧴 Producto: ' + ((CTX.product && CTX.product.name) || 'Combo Dermafol 360°'),
      '📦 Cantidad: ' + q + (q === 1 ? ' combo' : ' combos'),
      '💰 Total: $' + Number((offer && offer.price) || 0).toLocaleString('es-CO'),
      '🧾 Pedido: ' + (data.code || '—'),
      '',
      '👤 Nombre: ' + value('customer_name'),
      '📱 Celular: ' + value('phone'),
      '📍 Ciudad: ' + ciudad,
      '🏠 Dirección: ' + value('address'),
      '',
      '¿Me compartes los datos para transferir? 🙏✨',
    ].join('\n');
    // Directo a api.whatsapp.com, no a wa.me. El acortador redirige a este mismo
    // destino pero por el camino se come los caracteres de más de dos bytes:
    // `%F0%9F%92%9B` (💛) llega como `%EF%BF%BD`, el rombo de interrogación.
    // Comprobado con los dos: por aquí los emojis llegan enteros.
    return 'https://api.whatsapp.com/send?phone=' + WA_NUMERO
      + '&text=' + encodeURIComponent(texto);
  }

  function exitoTransferencia(data, url) {
    ocultarFormulario();
    form.setAttribute('data-ds-hecho', '1');
    var panel = document.createElement('div');
    panel.setAttribute('data-ds-done', '');
    panel.innerHTML = ''
      + '<div style="text-align:center;padding:8px 0 4px">'
      + '  <div style="width:64px;height:64px;border-radius:50%;background:#e7f6ec;display:flex;'
      + '       align-items:center;justify-content:center;margin:0 auto 18px">'
      + '    <svg viewBox="0 0 24 24" width="32" height="32" fill="#25D366"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1112 20z"/></svg>'
      + '  </div>'
      + '  <div style="font-size:22px;line-height:1.2;margin-bottom:8px">¡Ya casi!</div>'
      + '  <p style="font-size:13.5px;color:#6E5A5B;line-height:1.55;margin-bottom:18px">'
      + '    Guardamos tu pedido <b>' + (data.code || '') + '</b>.<br>'
      + '    Te abrimos WhatsApp para pasarte los datos de la transferencia.</p>'
      + '  <a href="' + url + '" target="_blank" rel="noopener" '
      + '     style="display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;'
      + '     color:#fff;font-weight:700;font-size:15px;padding:15px;border-radius:12px;min-height:52px">'
      + '     ABRIR WHATSAPP</a>'
      + '  <p style="font-size:12px;color:#8b7a7b;margin-top:12px">Si no se abre solo, toca el botón.</p>'
      + '</div>';
    form.appendChild(panel);
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-ds-transfer]') : null;
    if (!btn || !form.contains(btn)) return;
    e.preventDefault();
    if (busy) return;
    if (!validate()) return;

    var offer = currentOffer();
    var etiqueta = btn.innerHTML;
    busy = true;
    btn.disabled = true;
    btn.style.opacity = '.7';
    btn.innerHTML = 'Preparando tu pedido…';

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
        notes: 'Pago por transferencia · se coordina por WhatsApp',
        offer_name: offer ? offer.name : '',
        qty: offer ? offer.qty : 1,
        subtotal: offer ? offer.price : (CTX.product ? CTX.product.price : 0),
        total: offer ? offer.price : (CTX.product ? CTX.product.price : 0),
        payment_method: 'online',
        utm_source: UTM.utm_source,
        utm_medium: UTM.utm_medium,
        utm_campaign: UTM.utm_campaign,
        utm_content: UTM.utm_content,
        fbp: fbIds().fbp, fbc: fbIds().fbc, source_url: location.href,
      }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'No pudimos registrar tu pedido');
        var url = urlWhatsApp(res.data, offer);

        // El Purchase sólo si el pedido es nuevo. Si el servidor devolvió uno
        // que ya existía, su compra ya se contó y aquí sólo hay que llevar a la
        // persona a WhatsApp.
        if (!res.data.duplicate) {
          meta('Purchase', {
            content_ids: [CTX.productId || ''],
            content_type: 'product',
            content_name: offer ? offer.name : '',
            num_items: offer ? offer.qty : 1,
            value: res.data.total || (offer ? offer.price : 0),
            currency: 'COP',
            order_id: res.data.code || '',
          }, res.data.code || undefined);
        }

        // A WhatsApp de inmediato: una pantalla intermedia con un botón "abrir
        // WhatsApp" es un clic de más justo donde la persona ya decidió comprar.
        // No hay que esperar al píxel: el servidor ya mandó la compra por la API
        // de Conversiones antes de responder, así que la venta está contada aunque
        // la baliza del navegador se corte al salir.
        window.location.href = url;

        // Red de seguridad: si a los 800 ms seguimos aquí, la navegación no
        // ocurrió —bloqueada, o sin WhatsApp instalado— y entonces sí se pinta la
        // confirmación con el enlace para abrirlo a mano.
        setTimeout(function () { exitoTransferencia(res.data, url); }, 800);
      })
      .catch(function (err) {
        busy = false;
        btn.disabled = false;
        btn.style.opacity = '';
        btn.innerHTML = etiqueta;
        showError(err.message);
      });
  }, true);
})();
