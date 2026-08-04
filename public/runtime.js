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

  /* ── Envío de eventos ──────────────────────────────────────────────── */

  var sent = {};

  function track(type, value) {
    if (CTX.preview) return;                  // el preview del panel no ensucia métricas
    var payload = JSON.stringify({
      type: type, page_id: CTX.pageId, session_id: SID, variant: CTX.variant,
      device: DEVICE, utm_source: UTM.utm_source, utm_campaign: UTM.utm_campaign,
      value: value || 0,
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

  function once(type, value) {
    if (sent[type]) return;
    sent[type] = true;
    track(type, value);
  }

  once('pageview');

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
    track('cta_click');
    setTimeout(function () { once('checkout_open'); }, 60);
  }, true);

  /* ── Envío del pedido ──────────────────────────────────────────────── */

  var form = document.querySelector('[data-ds-form]');
  if (!form) return;

  var submitBtn = form.querySelector('[data-ds-submit]') || form.querySelector('button');
  var offerSel = form.querySelector('[data-ds-offer]');
  var offers = CTX.offers || [];
  var busy = false;

  function currentOffer() {
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

  ['customer_name', 'phone', 'department', 'city', 'address'].forEach(function (name) {
    var el = form.querySelector('[name="' + name + '"]');
    if (el) el.addEventListener('input', function () { markInvalid(el, false); });
  });

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
      }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'No pudimos registrar tu pedido');
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

  function showSuccess(data, offer) {
    var price = offer ? offer.price : 0;
    var money = '$' + String(price).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    form.innerHTML = ''
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
    // El evento `order` lo registra el backend al crear el pedido — no se duplica aquí.
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
