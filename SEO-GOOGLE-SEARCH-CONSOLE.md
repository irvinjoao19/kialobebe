# Guía: dar de alta kialobebe.com en Google Search Console

Objetivo: que Google **indexe** rápido las páginas del catálogo (home + 36 productos) y
poder ver en qué búsquedas apareces y en qué **posición**.

Estado técnico (ya hecho ✅): `sitemap.xml` (40 URLs), `robots.txt` apuntando al sitemap,
página HTML por producto con JSON-LD y Open Graph, dominio `kialobebe.com` en GitHub Pages
con DNS en Namecheap. Solo falta este trámite.

> Tiempo: ~10 min de clics + espera de propagación DNS (minutos a pocas horas).
> Cuenta: usa tu cuenta de Google (gongorairvin@gmail.com u otra que quieras de dueña).

---

## Parte 1 — Crear la propiedad y verificarla

Tienes **dos formas** de verificar. Elige UNA:

### Opción A — Propiedad "Dominio" (recomendada) · verifica por DNS en Namecheap
Cubre todo: `http`, `https`, `www` y sin `www`, todos los subdominios. Es la más completa.

1. Entra a **https://search.google.com/search-console** e inicia sesión.
2. Arriba a la izquierda, menú de propiedades → **"Añadir propiedad"**.
3. Elige la columna **"Dominio"** → escribe `kialobebe.com` (sin `https://`, sin `www`) → **Continuar**.
4. Google te muestra un **registro TXT** tipo `google-site-verification=XXXXXXXX...`. **Cópialo.**
5. En otra pestaña, entra a **Namecheap** → **Domain List** → botón **Manage** de `kialobebe.com`
   → pestaña **Advanced DNS**.
6. **Add New Record**:
   - **Type:** `TXT Record`
   - **Host:** `@`
   - **Value:** pega el `google-site-verification=...` completo
   - **TTL:** `Automatic`
   - Guarda (✔).
7. Vuelve a Search Console → **Verificar**.
   - Si dice que no lo encuentra, es propagación DNS: espera 15–60 min (a veces más) y dale **Verificar** otra vez.

> ⚠️ No borres ese registro TXT después; Google revalida de vez en cuando.
> ⚠️ No toca ni reemplaza tus registros que apuntan a GitHub Pages (son de otro tipo, A/CNAME). Solo **agregas** un TXT nuevo.

### Opción B — Propiedad "Prefijo de URL" · verifica subiendo un archivo (la más rápida para ti)
Como controlas el repo, esta es muy cómoda. Solo cubre exactamente `https://kialobebe.com/`.

1. En Search Console → **Añadir propiedad** → columna **"Prefijo de la URL"** → escribe
   `https://kialobebe.com/` → **Continuar**.
2. En "Verificación" elige **"Archivo HTML"**. Descarga el archivo `googXXXXXXXX.html`.
3. Copia ese archivo a la **raíz del repo del catálogo** (junto a `index.html`).
4. `git add googXXXXXXXX.html && git commit -m "chore: verificación Google Search Console" && git push`.
5. Espera 1–2 min a que GitHub Pages publique. Comprueba abriendo
   `https://kialobebe.com/googXXXXXXXX.html` en el navegador (debe cargar).
6. Vuelve a Search Console → **Verificar**.

> Recomendación: **Opción A** (dominio) por ser más completa. Si la propagación DNS te frustra,
> la **Opción B** te verifica en minutos.

---

## Parte 2 — Enviar el sitemap

Ya verificada la propiedad:

1. En el menú izquierdo de Search Console → **Sitemaps**.
2. En "Añadir un sitemap nuevo" escribe solo: `sitemap.xml` → **Enviar**.
   (La URL completa queda `https://kialobebe.com/sitemap.xml`.)
3. Debe quedar en estado **"Correcto"** y detectar ~**40 URLs** (puede tardar un rato en procesar).

---

## Parte 3 — Forzar la indexación de las páginas clave

No esperes a que Google pase solo; pídeselo:

1. Arriba, en la barra **"Inspección de URL"**, pega `https://kialobebe.com/` → Enter.
2. Cuando cargue, botón **"Solicitar indexación"**.
3. Repite con las páginas más importantes, p. ej.:
   - `https://kialobebe.com/productos/`
   - 2–3 productos estrella (los que más vende tu esposa).

> No hace falta pedir indexación de las 40; con la home + catálogo + el sitemap, Google recorre el resto.

---

## Parte 4 — Qué mirar después (los días siguientes)

- **Páginas** (antes "Cobertura"): cuántas URLs están **indexadas** vs excluidas y por qué.
- **Rendimiento**: **impresiones** (cuántas veces apareciste), **clics**, **posición media**
  y **qué búsquedas** (queries) te traen gente. Aquí es donde ves tu *posicionamiento*.
- **Experiencia / Core Web Vitals**: velocidad y usabilidad móvil (tu sitio es liviano, debería ir bien).

> Realista: la indexación tarda **de días a 2–3 semanas** en asentarse. Salir bien posicionado
> para búsquedas competidas ("ropa de bebé Perú") lleva meses; para tu marca ("Kialo bebé")
> deberías aparecer rápido una vez indexado.

---

## Extra (opcional)

- **Bing Webmaster Tools** (https://www.bing.com/webmasters): puedes **importar** todo desde
  Search Console en 2 clics y también apareces en Bing. Cubre otro pedazo de tráfico.
- Cada vez que publiques productos nuevos con "🚀 Enviar datos", `generar.mjs` regenera el
  `sitemap.xml`. Google lo re-lee solo cada cierto tiempo; no tienes que reenviarlo cada vez.

---

## Checklist rápido

- [ ] Propiedad creada y **verificada** (Opción A o B)
- [ ] Sitemap `sitemap.xml` enviado y en estado "Correcto"
- [ ] Indexación solicitada para home + catálogo + 2-3 productos
- [ ] (Opcional) Bing Webmaster Tools importado
