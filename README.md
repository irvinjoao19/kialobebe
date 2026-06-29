# Kialo bebé — Catálogo web

Catálogo web de **Kialo bebé**, tienda de ropa, accesorios, zapatillas y disfraces
para bebés y niños. Los pedidos se hacen por **WhatsApp**. La tienda también vende
en vivo por **TikTok**.

🔗 **En producción:** https://irvinjoao19.github.io/kialobebe/
(a futuro: dominio propio `kialobebe.com`)

---

## 🧱 Arquitectura

Sitio **estático** (HTML + CSS + JS, sin frameworks ni build). Los datos del catálogo
están **separados del diseño**: el `index.html` lee `productos.json` y genera las
tarjetas dinámicamente. Para cambiar el catálogo se edita el JSON (o el Excel), nunca el HTML.

```
kialobebe/
├── index.html              # La página: diseño + lógica (fetch del JSON, filtros, "Cargar más")
├── productos.json          # Los datos: tienda, categorías y productos
├── README.md               # Este archivo
├── CLAUDE.md               # Contexto para Claude Code
│
├── assets/
│   └── img/
│       ├── brand/          # Imágenes de marca (NO son productos)
│       │   ├── logo.jpg
│       │   └── hero.jpg
│       └── productos/      # TODAS las fotos de productos
│           ├── boina.jpg
│           ├── pantys.jpg
│           └── lentes.jpg
│
└── tools/                  # Herramientas (NO se publican / no afectan la web)
    ├── Kialo_Catalogo.xlsx # Plantilla Excel para llenar el catálogo
    └── convertir.py        # Convierte el Excel en productos.json
```

> **Convención de rutas de fotos:** en `productos.json`, el campo `foto` guarda solo el
> **nombre del archivo** (ej. `"boina.jpg"`). El `index.html` le antepone la carpeta
> base de productos (`assets/img/productos/`) al construir el `<img>`. El logo y el hero
> viven en `assets/img/brand/` y se referencian directo en el HTML.

---

## 📦 productos.json (estructura)

```json
{
  "tienda": { "nombre": "Kialo bebé", "whatsapp": "51955105631", "tiktok": "#", "instagram": "#" },
  "categorias": [
    { "id": "accesorios", "nombre": "Accesorios", "emoji": "🎀", "desc": "Boinas, lentes y más" }
  ],
  "productos": [
    {
      "nombre": "Boina con lazo",
      "categoria": "accesorios",
      "precio": 16,
      "antes": 20,
      "fotos": ["boina.jpg", "boina-2.jpg", "boina-3.jpg"],
      "desc": "Boina tejida con lazo, suave y abrigadora.",
      "detalle": "Texto largo que se muestra al abrir el producto en el modal.",
      "talla": "Talla única · 0 a 12 meses",
      "material": "Tejido acrílico suave",
      "colores": ["blanco", "rojo", "rosa"]
    }
  ]
}
```

Reglas:
- `categoria` debe ser uno de los `id` definidos en `categorias`: `accesorios`, `ropa`, `zapatillas`, `disfraces`.
- `antes`: precio anterior si hay oferta; `null` si no hay descuento (no muestra precio tachado).
- `fotos`: lista de nombres de archivo. La **primera es la portada** (se ve en la tarjeta); las demás aparecen en la galería del modal de detalle. Todas viven en `assets/img/productos/`.
- `desc`: descripción corta (1 línea, se ve en la tarjeta).
- `detalle`: texto largo (se ve al abrir el producto). Si falta, se usa `desc`.
- `talla`, `material`: datos que se muestran en el detalle (opcionales).
- `colores`: lista de colores **por nombre** en español (`"blanco"`, `"rojo"`...). La web traduce el nombre a su color. `[]` si no aplica.

### Detalle de producto (modal)
Al hacer clic en una tarjeta (foto o nombre) se abre un **modal** con: galería de fotos
(miniaturas + flechas + teclas ←/→), descripción larga, talla, material, colores con su
nombre, precio y botón de WhatsApp. Todo se arma desde el JSON; no hay páginas extra que mantener.

---

## ➕ Cómo actualizar el catálogo

**Opción A — con Excel (recomendado para quien no toca código):**
1. Abrir `tools/Kialo_Catalogo.xlsx`, llenar la hoja *Productos* (y *Tienda*).
2. Ejecutar el conversor:
   ```bash
   cd tools
   python3 convertir.py            # genera productos.json
   ```
3. Copiar el `productos.json` generado a la raíz y subir las fotos a `assets/img/productos/`.

**Opción B — editando el JSON directo:** agregar/editar un bloque en `"productos"`.

Luego publicar:
```bash
git add .
git commit -m "Actualiza catálogo"
git push
```
GitHub Pages despliega solo en ~1-2 min.

---

## 🖼️ Fotos (IMPORTANTE para rendimiento)

Con cientos de productos, las fotos pesadas hacen lenta la web. Antes de subir:
- Redimensionar a ~**800px** de ancho.
- Comprimir a ~**100–200 KB**.
- Formato **WebP** de preferencia (pesa la mitad que JPG).

La web ya usa **lazy loading** (`loading="lazy"`) y **paginación** ("Cargar más", 24 a la vez),
así que con fotos livianas escala bien a 200+ productos.

---

## 🧪 Probar en local

`index.html` usa `fetch('productos.json')`, que **no funciona abriendo el archivo con doble clic**
(`file://` lo bloquea). Para probar en local, levantar un servidor:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```
(o la extensión "Live Server" de VS Code). En GitHub Pages funciona directo.

---

## ✅ Pendientes

- [ ] Mover fotos a `assets/img/` y actualizar rutas (esta refactor de arquitectura).
- [ ] Poner links reales de TikTok e Instagram en `productos.json` (`tienda`).
- [ ] Confirmar precio real de "Pantys panda" (placeholder S/12).
- [ ] Reemplazar fotos de baja calidad (pantys, lentes) por fotos propias.
- [ ] Optimizar todas las fotos a WebP livianas.
- [ ] (Futuro) Conectar dominio propio `kialobebe.com` en Settings → Pages → Custom domain.
