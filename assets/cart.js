/* Kialo bebé — Carrito local (sin backend).
   Guarda los productos elegidos en localStorage y, al pedir, arma UN solo
   mensaje de WhatsApp con el listado, cantidades y total.
   Se incluye en: index.html (home), productos/index.html (catálogo) y
   productos/<slug>/index.html (fichas, generadas por generar.mjs).

   Cómo se agrega un producto: cualquier botón con la clase .js-add-cart y
   estos data-*:  data-codigo, data-nombre, data-precio, data-foto
*/
(function () {
  'use strict';

  var KEY = 'kialo_cart_v1';
  var WA_DEFAULT = '51955105631';           // fallback; las páginas pueden setear window.KIALO_WA
  var SITE = 'https://kialobebe.com';

  function waNum() { return (window.KIALO_WA || WA_DEFAULT); }
  function money(n) { return 'S/ ' + (Math.round(Number(n) * 100) / 100); }

  /* ---------- estado ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function save(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    render();
  }
  var cart = load();

  function count() { return cart.reduce(function (s, it) { return s + it.qty; }, 0); }
  function total() { return cart.reduce(function (s, it) { return s + it.precio * it.qty; }, 0); }

  function add(item) {
    var found = cart.filter(function (it) { return it.codigo === item.codigo; })[0];
    if (found) found.qty += 1;
    else cart.push({ codigo: item.codigo, nombre: item.nombre, precio: Number(item.precio) || 0, foto: item.foto || '', qty: 1 });
    save(cart);
  }
  function setQty(codigo, qty) {
    cart = cart.map(function (it) { return it.codigo === codigo ? Object.assign({}, it, { qty: qty }) : it; })
               .filter(function (it) { return it.qty > 0; });
    save(cart);
  }
  function remove(codigo) { cart = cart.filter(function (it) { return it.codigo !== codigo; }); save(cart); }
  function clear() { cart = []; save(cart); }

  /* ---------- mensaje de WhatsApp ---------- */
  function pedidoText() {
    var lineas = cart.map(function (it) {
      var sub = money(it.precio * it.qty);
      return '• *' + it.codigo + '* — ' + it.nombre + '  ×' + it.qty + '  ·  ' + sub;
    }).join('\n');
    return '¡Hola Kialo bebé! 💛 Quiero pedir estos productos:\n\n' +
      lineas + '\n\nTotal: *' + money(total()) + '*\n\n(desde ' + SITE + ')';
  }
  function pedir() {
    if (!cart.length) return;
    var url = 'https://wa.me/' + waNum() + '?text=' + encodeURIComponent(pedidoText());
    window.open(url, '_blank', 'noopener');
  }

  /* ---------- UI ---------- */
  var els = {};
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function injectStyles() {
    // Iconos de línea (blancos) embebidos como data-URI → una sola definición, sin emojis.
    var CART = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='9' cy='21' r='1'/%3E%3Ccircle cx='20' cy='21' r='1'/%3E%3Cpath d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'/%3E%3C/svg%3E\")";
    var CHECK = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6L9 17l-5-5'/%3E%3C/svg%3E\")";
    var css = ''
      + '.p-actions{display:flex;gap:8px;align-items:stretch}'
      + '.p-actions .p-buy{flex:1;width:auto}'
      + '.k-cartbtn{flex:0 0 auto;width:46px;display:inline-flex;align-items:center;justify-content:center;'
      + 'background-color:#9B6FC9;background-image:' + CART + ';background-repeat:no-repeat;background-position:center;background-size:22px;'
      + 'color:transparent;font-size:0;border:none;border-radius:14px;cursor:pointer;'
      + 'box-shadow:0 8px 18px rgba(155,111,201,.30);transition:transform .12s ease,box-shadow .15s ease}'
      + '.k-cartbtn:hover{box-shadow:0 10px 22px rgba(155,111,201,.45)}'
      + '.k-cartbtn:active{transform:scale(.94)}'
      + '.k-cartbtn.added{background-color:#6CB94E;background-image:' + CHECK + ';box-shadow:0 8px 18px rgba(108,185,78,.4)}'
      /* FAB */
      + '.k-fab{position:fixed;right:18px;bottom:18px;z-index:90;width:60px;height:60px;border:none;border-radius:50%;'
      + 'background-color:#9B6FC9;background-image:' + CART + ';background-repeat:no-repeat;background-position:center;background-size:27px;'
      + 'color:transparent;font-size:0;cursor:pointer;box-shadow:0 12px 28px rgba(155,111,201,.45);'
      + 'display:none;align-items:center;justify-content:center;transition:transform .15s ease}'
      + '.k-fab:active{transform:scale(.92)}'
      + '.k-fab.show{display:inline-flex}'
      + '.k-fab .k-badge{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;padding:0 5px;border-radius:999px;'
      + 'background:#F0655A;color:#fff;font-family:"Fredoka",sans-serif;font-weight:600;font-size:.8rem;'
      + 'display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.25)}'
      /* overlay + panel */
      + '.k-back{position:fixed;inset:0;background:rgba(40,33,30,.5);backdrop-filter:blur(2px);z-index:95;display:none}'
      + '.k-back.open{display:block}'
      + '.k-panel{position:fixed;right:0;bottom:0;z-index:96;width:min(100vw,420px);max-height:86vh;background:#FBF6EC;'
      + 'border-radius:22px 22px 0 0;box-shadow:0 -12px 40px rgba(0,0,0,.22);transform:translateY(100%);'
      + 'transition:transform .26s ease;display:flex;flex-direction:column;font-family:"Nunito",sans-serif}'
      + '@media(min-width:560px){.k-panel{right:18px;bottom:18px;border-radius:22px;max-height:80vh}}'
      + '.k-panel.open{transform:translateY(0)}'
      + '.k-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 10px}'
      + '.k-head h3{margin:0;font-family:"Fredoka",sans-serif;color:#3B4756;font-size:1.15rem}'
      + '.k-close{border:none;background:#efe6d3;color:#3B4756;width:34px;height:34px;border-radius:50%;font-size:1.1rem;cursor:pointer}'
      + '.k-list{overflow-y:auto;padding:4px 14px;flex:1}'
      + '.k-empty{text-align:center;color:#8a8377;padding:34px 10px;font-size:.95rem}'
      + '.k-item{display:flex;gap:11px;align-items:center;padding:10px 4px;border-bottom:1px solid #ece3d2}'
      + '.k-item img{width:52px;height:52px;object-fit:cover;border-radius:11px;background:#efe6d3;flex:0 0 auto}'
      + '.k-it-info{flex:1;min-width:0}'
      + '.k-it-name{font-weight:700;color:#3B4756;font-size:.9rem;line-height:1.2;display:block;'
      + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
      + '.k-it-cod{font-size:.72rem;color:#a49a88;font-family:monospace}'
      + '.k-it-price{color:#F0655A;font-weight:700;font-size:.9rem;margin-top:2px}'
      + '.k-qty{display:flex;align-items:center;gap:7px;flex:0 0 auto}'
      + '.k-qty button{width:28px;height:28px;border:none;border-radius:8px;background:#efe6d3;color:#3B4756;'
      + 'font-size:1rem;font-weight:700;cursor:pointer;line-height:1}'
      + '.k-qty span{min-width:18px;text-align:center;font-weight:700;color:#3B4756}'
      + '.k-foot{padding:12px 18px 18px;border-top:1px solid #ece3d2}'
      + '.k-total{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:11px;font-family:"Fredoka",sans-serif}'
      + '.k-total b{color:#3B4756;font-size:1.05rem}.k-total .k-t{color:#F0655A;font-size:1.35rem;font-weight:700}'
      + '.k-send{width:100%;background:#25D366;color:#fff;border:none;border-radius:15px;padding:14px;font-family:"Fredoka",sans-serif;'
      + 'font-weight:600;font-size:1.02rem;cursor:pointer;box-shadow:0 10px 24px rgba(37,211,102,.32);display:flex;'
      + 'align-items:center;justify-content:center;gap:8px}'
      + '.k-send:active{transform:scale(.98)}'
      + '.k-clear{display:block;margin:9px auto 0;background:none;border:none;color:#b06;color:#c05b56;font-size:.82rem;'
      + 'cursor:pointer;text-decoration:underline}';
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }

  var WA_ICO = '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" style="flex:0 0 auto">'
    + '<path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';

  function injectDom() {
    var fab = document.createElement('button');
    fab.className = 'k-fab';
    fab.setAttribute('aria-label', 'Ver carrito');
    fab.innerHTML = '<span class="k-badge">0</span>';
    fab.addEventListener('click', open);

    var back = document.createElement('div');
    back.className = 'k-back';
    back.addEventListener('click', close);

    var panel = document.createElement('div');
    panel.className = 'k-panel';
    panel.innerHTML =
      '<div class="k-head"><h3>🛒 Tu pedido</h3><button class="k-close" aria-label="Cerrar">✕</button></div>' +
      '<div class="k-list"></div>' +
      '<div class="k-foot">' +
        '<div class="k-total"><b>Total</b><span class="k-t">S/ 0</span></div>' +
        '<button class="k-send">' + WA_ICO + 'Pedir todo por WhatsApp</button>' +
        '<button class="k-clear">Vaciar carrito</button>' +
      '</div>';

    document.body.appendChild(fab);
    document.body.appendChild(back);
    document.body.appendChild(panel);

    panel.querySelector('.k-close').addEventListener('click', close);
    panel.querySelector('.k-send').addEventListener('click', pedir);
    panel.querySelector('.k-clear').addEventListener('click', function () {
      if (cart.length && confirm('¿Vaciar el carrito?')) clear();
    });

    els.fab = fab; els.back = back; els.panel = panel;
    els.badge = fab.querySelector('.k-badge');
    els.list = panel.querySelector('.k-list');
    els.total = panel.querySelector('.k-t');
  }

  function render() {
    if (!els.fab) return;
    var c = count();
    els.badge.textContent = c;
    els.fab.classList.toggle('show', c > 0);
    if (!cart.length) els.back.classList.contains('open') && close();
    els.total.textContent = money(total());

    if (!cart.length) {
      els.list.innerHTML = '<div class="k-empty">Tu carrito está vacío.<br>Agrega productos con el botón 🛒</div>';
      return;
    }
    els.list.innerHTML = cart.map(function (it) {
      var img = it.foto ? '/assets/img/productos/' + esc(it.foto) : '';
      return '<div class="k-item" data-cod="' + esc(it.codigo) + '">' +
        (img ? '<img src="' + img + '" alt="' + esc(it.nombre) + '" loading="lazy">' : '<img alt="">') +
        '<div class="k-it-info">' +
          '<span class="k-it-name">' + esc(it.nombre) + '</span>' +
          '<span class="k-it-cod">' + esc(it.codigo) + '</span>' +
          '<div class="k-it-price">' + money(it.precio * it.qty) + '</div>' +
        '</div>' +
        '<div class="k-qty">' +
          '<button data-act="dec" aria-label="Quitar uno">−</button>' +
          '<span>' + it.qty + '</span>' +
          '<button data-act="inc" aria-label="Agregar uno">+</button>' +
        '</div>' +
      '</div>';
    }).join('');

    els.list.querySelectorAll('.k-qty button').forEach(function (b) {
      b.addEventListener('click', function () {
        var cod = b.closest('.k-item').getAttribute('data-cod');
        var it = cart.filter(function (x) { return x.codigo === cod; })[0];
        if (!it) return;
        setQty(cod, it.qty + (b.getAttribute('data-act') === 'inc' ? 1 : -1));
      });
    });
  }

  function open() { els.back.classList.add('open'); els.panel.classList.add('open'); }
  function close() { els.back.classList.remove('open'); els.panel.classList.remove('open'); }

  /* delegación: cualquier .js-add-cart */
  function onAddClick(e) {
    var btn = e.target.closest ? e.target.closest('.js-add-cart') : null;
    if (!btn) return;
    e.preventDefault();
    add({
      codigo: btn.getAttribute('data-codigo'),
      nombre: btn.getAttribute('data-nombre'),
      precio: btn.getAttribute('data-precio'),
      foto: btn.getAttribute('data-foto')
    });
    btn.classList.add('added');
    setTimeout(function () { btn.classList.remove('added'); }, 700);
  }

  function init() {
    injectStyles();
    injectDom();
    document.addEventListener('click', onAddClick);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* API pública por si se quiere usar desde otra parte */
  window.KialoCart = { add: add, remove: remove, setQty: setQty, clear: clear, open: open, close: close,
    items: function () { return cart.slice(); }, count: count, total: total };
})();
