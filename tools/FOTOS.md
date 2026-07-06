# Carga de fotos — Kialo bebé

Objetivo: que la dueña **no** tenga que renombrar fotos ni escribir nombres de
archivo. Solo **arrastra las fotos de cada producto a su carpeta**. El resto
(optimizar a WebP, renombrar, enganchar en el catálogo) lo hacen los scripts.

## Instalación (una sola vez, en la Mac de Irvin)

```bash
cd tools
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

> Luego siempre corre los scripts con `.venv/bin/python3 <script>.py`.

## Flujo de cada lote de productos

1. **La dueña** llena el Excel `Kialo_Catalogo.xlsx` (nombre, categoría, precio,
   colores, etc.). **No** llena la columna de fotos.

2. **Irvin** crea las carpetas por producto:
   ```bash
   .venv/bin/python3 preparar_carpetas.py
   # o apuntando a una carpeta compartida (Google Drive, etc.):
   .venv/bin/python3 preparar_carpetas.py "/ruta/a/Fotos"
   ```
   Esto crea, dentro de la carpeta de fotos, una subcarpeta por producto ya
   nombrada (ej. `BOINA - Boina con lazo/`) y un `_indice.txt` de referencia.

3. **La dueña** arrastra las fotos de cada producto a su carpeta — con cualquier
   nombre y tamaño. La **primera** (por orden alfabético) será la portada; si
   quiere un orden específico, antepone `1`, `2`, … al nombre.

4. **Irvin** procesa y publica:
   ```bash
   .venv/bin/python3 procesar_fotos.py        # optimiza a WebP -> assets/img/productos/
   .venv/bin/python3 convertir.py             # regenera productos.json
   git add . && git commit -m "Nuevos productos" && git push
   ```

## Notas

- Formatos aceptados: JPG, PNG, WEBP, HEIC (iPhone), BMP, TIFF.
- Cada foto se reduce a ~1000px de lado y se guarda como `.webp` (~50-150 KB).
- Los archivos quedan como `assets/img/productos/<codigo>-1.webp`, `-2.webp`, …
  y `convertir.py` los engancha solo por código (no hay que escribir nombres).
- La carpeta `tools/fotos_nuevas/` (fotos crudas) está en `.gitignore`: no se sube.
