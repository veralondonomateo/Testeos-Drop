(() => {
  'use strict';
  const { plans, gifts, bonus, assetBase } = window.DERMAFOL_BRAND;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const money = n => '$' + n.toLocaleString('es-CO');
  const state = { qty: 3, payment: 'cod', revealed: new Set() };
  const cart = $('#cart');
  let lastFocus, toastTimer, cities, previousOverflow = '';
  const lock = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>';
  const check = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  const image = g => `<img src="${assetBase}/${g.id}.webp" alt="${g.name}" width="200" height="200" loading="lazy">`;
  function toast(text) { $('.toast').textContent = text; $('.toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('.toast').classList.remove('show'), 3500); }
  function sync() {
    const plan = plans.find(p => p.qty === state.qty);
    const prepaid = state.payment === 'online';
    const giftTotal = plan.giftValue + (prepaid ? bonus.value : 0);
    $$('[data-total]').forEach(e => e.textContent = money(plan.price));
    $$('[data-gift-value]').forEach(e => e.textContent = money(giftTotal));
    $('[data-cart-count]').textContent = state.qty;
    $('[data-plan-label]').textContent = `${state.qty} ${state.qty === 1 ? 'kit' : 'kits'} · ${plan.gifts + (prepaid ? 1 : 0)} regalos`;
    $$('[data-quick-plan]').forEach(b => { const active = Number(b.dataset.quickPlan) === state.qty; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    $$('[name=plan]').forEach(r => r.checked = Number(r.value) === state.qty);
    $$('[data-plan-card]').forEach(c => c.classList.toggle('selected', Number(c.dataset.planCard) === state.qty));
    $('#cart-qty').value = state.qty;
    $$('[name=payment],[name=cart-payment]').forEach(r => r.checked = r.value === state.payment);
    $('[data-bonus]').classList.toggle('active', prepaid);
    $('[data-bonus-label]').textContent = prepaid ? '+1 regalo por pagar anticipado · INCLUIDO' : 'Se desbloquea con pago anticipado';
    $('.bonus-icon').innerHTML = prepaid ? check : lock;
    $('[data-progress-label]').textContent = `${plan.gifts} de 5 regalos desbloqueados`;
    $('[data-progress]').value = plan.gifts;
    $('[data-progress]').setAttribute('aria-label', `${plan.gifts} de 5 regalos desbloqueados`);
    $('[data-upsell]').textContent = state.qty === 3 ? 'Ya tienes todos los regalos de tu plan.' : state.qty === 1 ? 'Con 2 kits sumas perfume capilar y scrunchie.' : 'Con 3 kits sumas termoprotector y reparador de puntas.';
    $('[data-cart-gifts]').innerHTML = gifts.map(g => `<div class="gift ${g.level > state.qty ? 'locked' : ''}"><div class="gift-image">${image(g)}${g.level > state.qty ? `<span class="lock">${lock}</span>` : ''}</div><span class="gift-name">${g.name}</span><del>${money(g.value)}</del><strong>${g.level > state.qty ? 'CON ' + g.level + ' KITS' : 'INCLUIDO'}</strong></div>`).join('');
    $('[data-cart-bonus]').innerHTML = `${image(bonus)}<div><b>${bonus.name}</b><del>${money(bonus.value)}</del><strong>${prepaid ? '+1 regalo por pagar anticipado · INCLUIDO' : 'Paga anticipado para desbloquearlo'}</strong><small>Color según disponibilidad</small></div>`;
    $('[data-pay-note]').textContent = prepaid ? 'Pago anticipado elegido · gorro de satín incluido.' : 'Pagas al recibir. Sin pago previo.';
    $$('[data-reveal]').forEach((card,i) => {
      const eligible = gifts[i].level <= state.qty;
      if (!eligible) state.revealed.delete(i);
      card.classList.toggle('unavailable', !eligible);
      card.classList.toggle('revealed', eligible && state.revealed.has(i));
      card.setAttribute('aria-pressed', String(eligible && state.revealed.has(i)));
      card.setAttribute('aria-label', eligible ? (state.revealed.has(i) ? gifts[i].name + ', incluido' : 'Descubrir regalo ' + (i+1)) : 'Regalo bloqueado: disponible con ' + gifts[i].level + ' kits');
      card.querySelector('.card-instruction').textContent = eligible ? 'Toca para descubrir' : 'Con ' + gifts[i].level + ' kits';
    });
    $('[data-game-status]').textContent = `${state.revealed.size} de ${plan.gifts} regalos descubiertos`;
    const message = $('.form-message'); if (message) message.textContent = '';
  }
  $$('[data-quick-plan]').forEach(b => b.addEventListener('click', () => { state.qty = Number(b.dataset.quickPlan); sync(); }));
  $$('[name=plan]').forEach(r => r.addEventListener('change', () => { state.qty = Number(r.value); sync(); }));
  $('#cart-qty').addEventListener('change', e => { state.qty = Number(e.target.value); sync(); });
  $$('[name=payment],[name=cart-payment]').forEach(r => r.addEventListener('change', () => { state.payment = r.value; sync(); }));
  $$('[data-reveal]').forEach((card,i) => card.addEventListener('click', () => {
    if (gifts[i].level > state.qty) { toast('Este regalo se incluye al elegir ' + gifts[i].level + ' kits.'); return; }
    state.revealed.add(i); sync();
  }));
  $('[data-reveal-all]').addEventListener('click', () => { gifts.forEach((g,i) => { if(g.level <= state.qty) state.revealed.add(i); }); sync(); });
  function openCart() {
    if(cart.open) return;
    lastFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    sync(); cart.showModal(); document.body.style.overflow = 'hidden'; $('.close-cart').focus();
  }
  $$('[data-open-cart]').forEach(b => b.addEventListener('click', openCart));
  $('.close-cart').addEventListener('click', () => cart.close());
  cart.addEventListener('click', e => { const r = cart.getBoundingClientRect(); if(e.target === cart && (e.clientX < r.left || e.clientX > r.right)) cart.close(); });
  cart.addEventListener('close', () => { document.body.style.overflow = previousOverflow; if(lastFocus?.isConnected) lastFocus.focus({ preventScroll: true }); });
  const stages = $$('[data-stage]');
  function showStage(index, focus = false) {
    stages.forEach((b,i) => { const active = i === index; b.setAttribute('aria-selected', String(active)); b.tabIndex = active ? 0 : -1; $('#stage-'+i).hidden = !active; });
    if(focus) stages[index].focus();
  }
  stages.forEach((b,i) => {
    b.addEventListener('click', () => showStage(i));
    b.addEventListener('keydown', e => { const n = e.key === 'ArrowRight' ? (i+1)%4 : e.key === 'ArrowLeft' ? (i+3)%4 : e.key === 'Home' ? 0 : e.key === 'End' ? 3 : null; if(n !== null){ e.preventDefault(); showStage(n,true); } });
  });
  const heroAlts = { 'kit-caja': 'Kit Dermafol: suplemento, Roll-On y caja', 'suplemento-abierto': 'Suplemento Dermafol de 60 cápsulas', 'aplicando-rollon': 'Aplicación del Roll-On Dermafol' };
  $$('[data-hero]').forEach((b,i) => b.addEventListener('click', () => {
    const name = b.dataset.hero, img = $('.hero-photo'); img.src = assetBase + '/' + name + '-960.webp'; img.srcset = `${assetBase}/${name}-480.webp 480w, ${assetBase}/${name}-960.webp 960w`; img.alt = heroAlts[name];
    $$('[data-hero]').forEach(btn => { btn.classList.toggle('active',btn === b); btn.setAttribute('aria-pressed',String(btn === b)); });
    $('.visual-foot>span:last-child').textContent = '0' + (i+1) + ' / 03';
  }));
  $$('.reel-play').forEach(b => b.addEventListener('click', async () => {
    const v = b.previousElementSibling, s = v.querySelector('source');
    if(!s.src) { s.src = s.dataset.src; v.load(); }
    $$('video').forEach(other => { if(other !== v) other.pause(); });
    try { await v.play(); b.hidden = true; } catch { toast('No pudimos reproducir el video. Vuelve a intentarlo.'); }
  }));
  let addressLoading = false;
  async function loadAddresses() {
    if(cities || addressLoading) return; addressLoading = true;
    try {
      const r = await fetch('/co.json'); if(!r.ok) throw new Error('Direcciones no disponibles');
      cities = await r.json(); const dept = $('[name=department]');
      Object.keys(cities).sort((a,b) => a.localeCompare(b,'es')).forEach(name => dept.add(new Option(name,name)));
    } catch {
      ['department','city'].forEach(name => { const old = $(`[name=${name}]`), input = document.createElement('input'); input.name = name; input.required = true; input.placeholder = name === 'department' ? 'Tu departamento' : 'Tu ciudad'; old.replaceWith(input); });
    } finally { addressLoading = false; }
  }
  $('[name=department]').addEventListener('change', e => {
    const c = $('[name=city]'); if(c.tagName !== 'SELECT') return;
    c.replaceChildren(new Option('Elige…','')); c.disabled = !e.target.value;
    (cities?.[e.target.value] || []).slice().sort((a,b) => a.localeCompare(b,'es')).forEach(name => c.add(new Option(name,name)));
  });
  $('#continue-checkout').addEventListener('click', () => {
    const f = $('#brand-checkout'); f.hidden = false; loadAddresses(); f.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    $('[name=customer_name]').focus({ preventScroll: true });
  });
  // Deliberately independent of data-ds-form. A draft preview must NEVER call
  // /api/track/order or a payment provider, even if somebody changes its status.
  $('#brand-checkout').addEventListener('submit', e => {
    e.preventDefault();
    const phone = $('[name=phone]').value.replace(/\D/g,'').replace(/^57(?=\d{10}$)/,'');
    if(!/^\d{10}$/.test(phone)) { $('.form-message').textContent = 'Revisa el celular: debe tener 10 dígitos.'; $('[name=phone]').focus(); return; }
    const p = plans.find(p => p.qty === state.qty);
    $('.form-message').textContent = `Prueba completada: ${p.qty} ${p.qty===1?'kit':'kits'}, ${money(p.price)}, ${p.gifts+(state.payment==='online'?1:0)} regalos y ${state.payment==='online'?'pago anticipado':'contraentrega'}. No se creó ningún pedido ni se realizó un cobro.`;
  });
  if('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => $('.sticky-buy').classList.toggle('visible', !e.isIntersecting && e.boundingClientRect.bottom < 0), { threshold:0 }).observe($('.hero'));
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const obs = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in-view'); obs.unobserve(e.target); } }), {threshold:.08});
      $$('.section-heading,.editorial,.guarantee,.final-cta').forEach(e => { e.classList.add('reveal-on-scroll'); obs.observe(e); });
    }
  }
  sync();
})();
