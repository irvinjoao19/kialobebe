#!/usr/bin/env node
// generar.mjs — Genera páginas SEO estáticas por producto + sitemap.xml
// desde productos.json. Se ejecuta en el flujo de publicar (publicar.sh).
// Sin dependencias: solo Node (fs, path). Uso: node generar.mjs
//
// Produce:
//   productos/<slug>/index.html   → una página real por producto (JSON-LD, OG)
//   sitemap.xml                   → mapa para Google
//   robots.txt                    → permite indexación + apunta al sitemap
//
// El <slug> se deriva del código y DEBE coincidir con slugify() de
// productos/index.html (la página de catálogo enlaza a estas URLs).

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SITE = 'https://kialobebe.com';

// ── Helpers ────────────────────────────────────────────────────────────────
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slugify = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const up = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const jsonEsc = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\n\r]+/g, ' ').trim();

const COLOR_MAP = {
  blanco: '#ffffff', negro: '#2b2b2b', gris: '#9aa0a6', plomo: '#9aa0a6',
  rojo: '#F0655A', coral: '#F0655A', rosa: '#f7a8c4', rosado: '#f7a8c4', fucsia: '#e85a9b',
  amarillo: '#F4C040', mostaza: '#e0a93a', naranja: '#f29b50', naranjado: '#f29b50',
  verde: '#6CB94E', 'verde agua': '#3FB6A8', turquesa: '#3FB6A8', celeste: '#7cc1ec',
  azul: '#3E8FD0', 'azul marino': '#2c3e7a', morado: '#9B6FC9', lila: '#b79be0', violeta: '#9B6FC9',
  beige: '#d8c4a3', crema: '#efe6d3', marron: '#9c6b4a', cafe: '#9c6b4a',
  dorado: '#d4af37', plateado: '#c0c4c9', vino: '#7d2240',
};
const hexDe = c => { const s = String(c).trim(); return s.startsWith('#') ? s.toLowerCase() : (COLOR_MAP[s.toLowerCase()] || '#d9d2c5'); };
const colorLabel = c => (String(c).trim().startsWith('#') ? '' : esc(c));
const fotosDe = p => (Array.isArray(p.fotos) && p.fotos.length) ? p.fotos : (p.foto ? [p.foto] : []);
const tallasDe = p => (Array.isArray(p.tallas) && p.tallas.length) ? p.tallas : (p.talla ? [p.talla] : []);

const WA_SVG = '<svg class="wa-ico" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>';

// ── Página de producto (HTML completo con SEO) ───────────────────────────────
function paginaProducto(p, tienda, categorias) {
  const slug = slugify(p.codigo);
  const url = `${SITE}/productos/${slug}/`;
  const fotos = fotosDe(p);
  const imgAbs = f => `${SITE}/assets/img/productos/${f}`;
  const portada = fotos[0] ? imgAbs(fotos[0]) : `${SITE}/assets/img/brand/hero.jpg`;
  const catNom = (categorias.find(c => c.id === p.categoria) || {}).nombre || '';
  const hayOferta = p.antes && p.antes > p.precio;
  const tallas = tallasDe(p);
  const nombreLimpio = String(p.nombre || '').trim();
  const metaDesc = (p.detalle || p.desc || `${nombreLimpio} — Kialo bebé`).slice(0, 155);
  const wa = num => `https://wa.me/${num}?text=`;
  const agotado = !!p.agotado;
  const pedidoMsg = color => {
    const cod = p.codigo ? (color ? `${p.codigo}-${up(color)}` : p.codigo) : '';
    const colorTxt = color ? color.charAt(0).toUpperCase() + color.slice(1) : '';
    return encodeURIComponent(`¡Hola Kialo bebé! 💛 Quiero este:\n${cod ? `*${cod}* — ` : ''}${p.nombre}${color ? ` (${colorTxt})` : ''} · S/${p.precio}\n${url}\n¿Está disponible?`);
  };
  const consultaMsg = color => {
    const colorTxt = color ? color.charAt(0).toUpperCase() + color.slice(1) : '';
    return encodeURIComponent(`¡Hola Kialo bebé! 💛 Vi que este producto está agotado:\n${p.nombre}${color ? ` (${colorTxt})` : ''} · S/${p.precio}\n${url}\n¿Cuándo vuelve a estar disponible? Me interesa 🙏`);
  };
  const color0 = (p.colores && p.colores.length) ? p.colores[0] : null;

  // JSON-LD Product
  const jsonld = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: p.nombre,
    image: fotos.map(imgAbs),
    description: (p.detalle || p.desc || p.nombre),
    sku: p.codigo,
    brand: { '@type': 'Brand', name: 'Kialo bebé' },
    category: catNom,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'PEN',
      price: String(p.precio),
      availability: agotado ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: SITE + '/productos/' },
      { '@type': 'ListItem', position: 3, name: p.nombre, item: url },
    ],
  };

  const galeria = fotos.length
    ? `<div class="p-main${agotado ? ' agotado' : ''}"><img id="pMain" src="/assets/img/productos/${esc(fotos[0])}" alt="${esc(p.nombre)}" /></div>
       ${fotos.length > 1 ? `<div class="p-thumbs">${fotos.map((f, i) => `<button class="p-thumb${i === 0 ? ' on' : ''}" data-src="/assets/img/productos/${esc(f)}"><img src="/assets/img/productos/${esc(f)}" alt="${esc(p.nombre)} ${i + 1}" loading="lazy" /></button>`).join('')}</div>` : ''}`
    : `<div class="p-main${agotado ? ' agotado' : ''} p-noimg">📷</div>`;

  const specs = [
    tallas.length ? `<div class="spec"><span class="e">📏</span><span><b>Tallas:</b> ${esc(tallas.join(' · '))}</span></div>` : '',
    p.material ? `<div class="spec"><span class="e">🧵</span><span><b>Material:</b> ${esc(p.material)}</span></div>` : '',
    p.genero ? `<div class="spec"><span class="e">👶</span><span><b>Para:</b> ${esc(p.genero)}</span></div>` : '',
  ].join('');

  const colores = (p.colores && p.colores.length) ? `
    <div class="p-colors"><div class="lbl">Colores disponibles:</div><div class="swatches">
      ${p.colores.map((c, i) => `<button type="button" class="sw${i === 0 ? ' on' : ''}" data-color="${esc(c)}" title="${esc(c)}"><span class="dot" style="background:${hexDe(c)}"></span>${colorLabel(c)}</button>`).join('')}
    </div></div>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(nombreLimpio)}${catNom ? ' · ' + esc(catNom) : ''} para bebé · Kialo bebé</title>
<meta name="description" content="${esc(metaDesc)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="product" />
<meta property="og:title" content="${esc(p.nombre)} · Kialo bebé" />
<meta property="og:description" content="${esc(metaDesc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${portada}" />
<meta property="product:price:amount" content="${p.precio}" />
<meta property="product:price:currency" content="PEN" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbLd)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
<style>
  :root{--cream:#FBF6EC;--cream-2:#F3EADA;--card:#fff;--ink:#3B4756;--ink-soft:#74808F;--line:rgba(150,130,100,.16);--coral:#F0655A;--yellow:#F4C040;--green:#6CB94E;--wa:#25D366;--radius:22px;--shadow:0 14px 34px rgba(120,100,70,.12)}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Nunito",sans-serif;background:var(--cream);color:var(--ink);line-height:1.55;-webkit-font-smoothing:antialiased}
  h1,h2,h3,.ff{font-family:"Fredoka",sans-serif;font-weight:600;line-height:1.14}
  img{display:block;max-width:100%}a{color:inherit;text-decoration:none}button{font-family:inherit}
  .wa-ico{width:18px;height:18px;fill:currentColor;flex:none}
  .top{position:sticky;top:0;z-index:40;background:rgba(251,246,236,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
  .top-in{max-width:1120px;margin:0 auto;padding:10px 18px;display:flex;align-items:center;justify-content:space-between;gap:14px}
  .brand{display:flex;align-items:center;gap:10px;font-family:"Fredoka",sans-serif;font-weight:600;font-size:1.14rem}
  .brand img{width:38px;height:38px;border-radius:11px}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-family:"Fredoka",sans-serif;font-weight:600;border:none;border-radius:999px;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}
  .btn:active{transform:scale(.97)}
  .btn-wa{background:var(--wa);color:#fff;font-size:.9rem;padding:9px 16px;box-shadow:0 8px 18px rgba(37,211,102,.3)}
  .navbar{border-top:1px solid var(--line)}
  .navbar-in{max-width:1120px;margin:0 auto;padding:0 18px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
  .navbar-in::-webkit-scrollbar{display:none}
  .navbar a{white-space:nowrap;font-family:"Fredoka",sans-serif;font-weight:500;font-size:.95rem;color:var(--ink-soft);padding:12px;border-bottom:3px solid transparent}
  .navbar a:hover{color:var(--coral);border-bottom-color:var(--coral)}
  .wrap{max-width:1120px;margin:0 auto;padding:0 18px}
  .crumb{font-size:.82rem;color:var(--ink-soft);font-weight:700;padding:18px 0 10px}
  .crumb a:hover{color:var(--coral)}
  .p-grid{display:grid;grid-template-columns:1fr 1fr;gap:34px;padding-bottom:40px;align-items:start}
  .p-gallery{position:sticky;top:78px}
  .p-main{aspect-ratio:1/1;border-radius:var(--radius);overflow:hidden;background:var(--cream-2);box-shadow:var(--shadow)}
  .p-main img{width:100%;height:100%;object-fit:cover}
  .p-noimg{display:flex;align-items:center;justify-content:center;font-size:4rem}
  .p-thumbs{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
  .p-thumb{width:70px;height:70px;border-radius:14px;overflow:hidden;cursor:pointer;border:3px solid transparent;background:#fff;padding:0}
  .p-thumb.on{border-color:var(--coral)}
  .p-thumb img{width:100%;height:100%;object-fit:cover}
  .p-cat{display:inline-block;font-family:"Fredoka",sans-serif;font-weight:500;font-size:.78rem;color:#fff;background:var(--coral);padding:4px 13px;border-radius:999px;margin-bottom:12px}
  .p-cat.nuevo{background:var(--green)}
  .p-cat.agotado{background:#6b7280}
  .p-main.agotado img{filter:grayscale(.5);opacity:.75}
  .p-buy.consultar{background:#6b7280;box-shadow:0 10px 24px rgba(107,114,128,.3)}
  .p-name{font-size:2rem;line-height:1.1}
  .p-price{display:flex;align-items:baseline;gap:11px;margin:16px 0}
  .p-now{font-family:"Fredoka",sans-serif;font-weight:700;font-size:2rem;color:var(--coral)}
  .p-old{font-size:1.1rem;color:var(--ink-soft);text-decoration:line-through}
  .p-save{background:var(--yellow);color:#5a4a12;font-family:"Fredoka",sans-serif;font-weight:600;font-size:.8rem;padding:5px 12px;border-radius:999px}
  .p-detalle{color:var(--ink);font-weight:600;line-height:1.65;margin-bottom:20px}
  .p-specs{display:flex;flex-direction:column;gap:9px;margin-bottom:20px;background:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 8px 20px rgba(120,100,70,.07)}
  .spec{display:flex;gap:10px;align-items:flex-start;font-size:.92rem;color:var(--ink-soft);font-weight:600}
  .spec b{color:var(--ink)}.spec .e{flex:none}
  .p-colors{margin-bottom:22px}
  .p-colors .lbl{font-family:"Fredoka",sans-serif;font-weight:500;font-size:.9rem;color:var(--ink-soft);margin-bottom:9px}
  .swatches{display:flex;gap:13px;flex-wrap:wrap}
  .sw{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:.72rem;color:var(--ink-soft);font-weight:700;background:none;border:none;cursor:pointer;padding:2px}
  .sw .dot{width:34px;height:34px;border-radius:50%;border:2px solid #0001;transition:box-shadow .15s ease,border-color .15s ease}
  .sw.on{color:var(--ink)}.sw.on .dot{border-color:var(--coral);box-shadow:0 0 0 3px #F0655A33}
  .p-buy{width:100%;background:var(--wa);color:#fff;font-size:1.06rem;padding:15px;border-radius:16px;box-shadow:0 10px 24px rgba(37,211,102,.3)}
  .p-back{display:inline-block;margin:22px 0 8px;color:var(--coral);font-family:"Fredoka",sans-serif;font-weight:600}
  footer{margin-top:40px;background:var(--cream-2);padding:30px 18px;text-align:center}
  .f-name{font-family:"Fredoka",sans-serif;font-weight:600;font-size:1.15rem}
  .copy{margin-top:8px;font-size:.78rem;color:var(--ink-soft)}
  @media(max-width:760px){.p-grid{grid-template-columns:1fr;gap:22px}.p-gallery{position:static}.p-name{font-size:1.55rem}.p-now{font-size:1.6rem}}
  @media(prefers-reduced-motion:reduce){*{transition:none}}
</style>
</head>
<body>
  <div class="top">
    <div class="top-in">
      <a class="brand" href="/"><img src="/assets/img/brand/logo.jpg" alt="Kialo bebé" />Kialo bebé</a>
      <a class="btn btn-wa" href="${wa(tienda.whatsapp)}${encodeURIComponent('¡Hola Kialo bebé! 💛 Quiero hacer una consulta')}" target="_blank" rel="noopener">${WA_SVG}WhatsApp</a>
    </div>
    <nav class="navbar"><div class="navbar-in">
      <a href="/productos/">🛍️ Todo</a>
      <a href="/productos/?cat=novedades">✨ Novedades</a>
      <a href="/productos/?oferta=1">🏷️ Ofertas</a>
      <a href="/nosotros/">Nosotros</a>
      <a href="/envios/">Envíos</a>
    </div></nav>
  </div>

  <div class="wrap">
    <nav class="crumb"><a href="/">Inicio</a> › <a href="/productos/">Catálogo</a> › <span>${esc(p.nombre)}</span></nav>
    <div class="p-grid">
      <div class="p-gallery">${galeria}</div>
      <div class="p-info">
        ${p.nuevo ? `<span class="p-cat nuevo">✨ Nuevo</span> ` : ''}${catNom ? `<span class="p-cat">${esc(catNom)}</span>` : ''}
        <h1 class="p-name">${esc(p.nombre)}</h1>
        <div class="p-price"><span class="p-now">S/ ${p.precio}</span>${hayOferta ? `<span class="p-old">S/ ${p.antes}</span><span class="p-save">Ahorra S/ ${p.antes - p.precio}</span>` : ''}</div>
        <p class="p-detalle">${esc(p.detalle || p.desc || '')}</p>
        ${specs ? `<div class="p-specs">${specs}</div>` : ''}
        ${colores}
        <a id="pBuy" class="btn p-buy" target="_blank" rel="noopener" href="${wa(tienda.whatsapp)}${pedidoMsg(color0)}">${WA_SVG}Pedir por WhatsApp</a>
        <a class="p-back" href="/productos/">← Seguir viendo el catálogo</a>
      </div>
    </div>
  </div>

  <footer>
    <div class="f-name">Kialo bebé</div>
    <p class="copy">© 2026 Kialo bebé · Hecho con 💛 en Perú</p>
  </footer>

  <script>
    // Galería: cambiar imagen principal
    var main = document.getElementById('pMain');
    document.querySelectorAll('.p-thumb').forEach(function(t){
      t.addEventListener('click', function(){
        main.src = t.dataset.src;
        document.querySelectorAll('.p-thumb').forEach(function(x){ x.classList.remove('on'); });
        t.classList.add('on');
      });
    });
    // Color elegido → se agrega al mensaje de WhatsApp (CODIGO-COLOR)
    var buy = document.getElementById('pBuy');
    var WA = ${JSON.stringify(wa(tienda.whatsapp))};
    var NOMBRE = ${JSON.stringify(p.nombre)}, CODIGO = ${JSON.stringify(p.codigo || '')}, PRECIO = ${JSON.stringify(String(p.precio))}, URL_PROD = ${JSON.stringify(url)};
    function up(s){ return String(s).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
    document.querySelectorAll('.sw').forEach(function(b){
      b.addEventListener('click', function(){
        document.querySelectorAll('.sw').forEach(function(x){ x.classList.remove('on'); });
        b.classList.add('on');
        var color = b.dataset.color;
        var cod = CODIGO ? (color ? CODIGO + '-' + up(color) : CODIGO) : '';
        var colorTxt = color ? color.charAt(0).toUpperCase() + color.slice(1) : '';
        var msg = '¡Hola Kialo bebé! 💛 Quiero este:\\n' + (cod ? '*' + cod + '* — ' : '') + NOMBRE + (color ? ' (' + colorTxt + ')' : '') + ' · S/' + PRECIO + '\\n' + URL_PROD + '\\n¿Está disponible?';
        buy.href = WA + encodeURIComponent(msg);
      });
    });
  </script>
</body>
</html>`;
}

// ── Generación ───────────────────────────────────────────────────────────────
function main() {
  const data = JSON.parse(readFileSync(join(ROOT, 'productos.json'), 'utf8'));
  const { tienda = {}, categorias = [], productos = [] } = data;
  const productosDir = join(ROOT, 'productos');

  // 1. Limpiar carpetas de productos viejos (que ya no están en el JSON).
  //    Solo tocamos subcarpetas; index.html (el catálogo) se conserva.
  const slugsActuales = new Set(productos.map(p => slugify(p.codigo)));
  if (existsSync(productosDir)) {
    for (const entry of readdirSync(productosDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !slugsActuales.has(entry.name)) {
        rmSync(join(productosDir, entry.name), { recursive: true, force: true });
        console.log(`  · eliminada carpeta obsoleta: productos/${entry.name}/`);
      }
    }
  }

  // 2. Generar una página por producto.
  let n = 0;
  for (const p of productos) {
    if (!p.codigo) { console.warn(`  ! producto sin código, se omite: ${p.nombre}`); continue; }
    const slug = slugify(p.codigo);
    const dir = join(productosDir, slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), paginaProducto(p, tienda, categorias));
    n++;
  }

  // 3. sitemap.xml
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE}/`, priority: '1.0' },
    { loc: `${SITE}/productos/`, priority: '0.9' },
    { loc: `${SITE}/nosotros/`, priority: '0.5' },
    { loc: `${SITE}/envios/`, priority: '0.5' },
    ...productos.filter(p => p.codigo).map(p => ({ loc: `${SITE}/productos/${slugify(p.codigo)}/`, priority: '0.8' })),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${hoy}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

  // 4. robots.txt
  writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

  console.log(`✔ Generadas ${n} páginas de producto + sitemap.xml + robots.txt`);
}

main();
