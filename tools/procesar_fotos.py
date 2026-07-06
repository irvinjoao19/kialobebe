#!/usr/bin/env python3
"""
Optimiza y publica las fotos del catálogo (Kialo bebé).

Toma las fotos que la dueña arrastró a cada carpeta de producto (con cualquier
nombre y tamaño), las convierte a WebP ligero (~800-1000px), las renombra solo
(<codigo>-1.webp, <codigo>-2.webp...) y las deja en assets/img/productos/.

No hay que escribir nombres de archivo en ningún lado: el conversor las engancha
por código automáticamente. Después corre:  python3 convertir.py

Uso:
    python3 procesar_fotos.py                 -> lee tools/fotos_nuevas/
    python3 procesar_fotos.py /ruta/a/Fotos   -> lee esa carpeta (ej. Google Drive)

Requisitos:  pip install pillow pillow-heif   (heif = soporte fotos de iPhone)
"""
import os, sys, re, glob

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta Pillow. Instálalo con:  pip3 install pillow pillow-heif")

try:  # soporte HEIC/HEIF (fotos de iPhone), opcional
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    pass

MAX_LADO = 1000     # px del lado más largo
CALIDAD = 80        # calidad WebP (0-100)
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".bmp", ".tif", ".tiff"}


def orden_natural(nombre):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", nombre)]


def carpeta_entrada(args):
    if args:
        return args[0]
    return "fotos_nuevas" if os.path.basename(os.getcwd()) == "tools" else os.path.join("tools", "fotos_nuevas")


def carpeta_salida():
    raiz = ".." if os.path.basename(os.getcwd()) == "tools" else "."
    return os.path.join(raiz, "assets", "img", "productos")


def main():
    base_in = carpeta_entrada(sys.argv[1:])
    out = carpeta_salida()
    os.makedirs(out, exist_ok=True)

    if not os.path.isdir(base_in):
        sys.exit(f"No existe la carpeta {base_in}. Corre primero: python3 preparar_carpetas.py")

    total_prod = total_fotos = 0
    for carpeta in sorted(os.listdir(base_in)):
        ruta = os.path.join(base_in, carpeta)
        if not os.path.isdir(ruta):
            continue
        cod = carpeta.split()[0].lower()  # primer token del nombre de carpeta = código
        imgs = sorted(
            [f for f in os.listdir(ruta) if os.path.splitext(f)[1].lower() in EXTS],
            key=orden_natural,
        )
        if not imgs:
            continue
        # limpia las webp anteriores de este producto (por si ahora hay menos fotos)
        for viejo in glob.glob(os.path.join(out, f"{cod}-*.webp")):
            os.remove(viejo)

        n = 0
        for img in imgs:
            try:
                im = Image.open(os.path.join(ruta, img))
                im = ImageOps.exif_transpose(im)      # corrige rotación del celular
                im = im.convert("RGB")
                im.thumbnail((MAX_LADO, MAX_LADO))    # achica manteniendo proporción
                n += 1
                im.save(os.path.join(out, f"{cod}-{n}.webp"), "WEBP", quality=CALIDAD, method=6)
            except Exception as e:
                print(f"  ⚠️  {carpeta}/{img}: {e}")
        if n:
            total_prod += 1
            total_fotos += n
            print(f"  {cod}: {n} foto(s) -> {cod}-1..{n}.webp")

    print(f"\n✅ {total_prod} producto(s), {total_fotos} foto(s) optimizadas en assets/img/productos/")
    print("   Ahora corre:  python3 convertir.py   (regenera productos.json enganchando las fotos)")


if __name__ == "__main__":
    main()
