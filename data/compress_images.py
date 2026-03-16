"""
Portfolio Image Compression Pipeline
=====================================
Compresses all images in data/IMG/*/ folders:
  - PNG: lossless pngquant compression (90-100 quality), Pillow fallback
  - WebP: generates a .webp copy alongside each original (quality 90)

Usage:
    python data/compress_images.py              # compress all
    python data/compress_images.py --quality 85  # custom WebP quality
    python data/compress_images.py --dry-run     # preview without writing

Originals are NEVER deleted. WebP files are placed next to the source images.
"""

import os
import sys
import argparse
import shutil
import tempfile
import subprocess
from PIL import Image

SUPPORTED_EXTENSIONS = ('.png', '.jpg', '.jpeg')


def compress_png_pngquant(input_path, output_path):
    """Compress PNG via pngquant (lossy, quality 90-100). Falls back to Pillow."""
    original_size = os.path.getsize(input_path)
    fd, tmp_path = tempfile.mkstemp(suffix='.png')
    os.close(fd)
    try:
        result = subprocess.run(
            ['pngquant', '--quality=90-100', '--force', '--output', tmp_path, input_path],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            shutil.move(tmp_path, output_path)
            compressed_size = os.path.getsize(output_path)
            return original_size, compressed_size
        # pngquant returned an error; fall through to Pillow
    except FileNotFoundError:
        pass

    # Pillow fallback (lossless optimization) — write to temp file then replace
    img = Image.open(input_path)
    img.save(tmp_path, 'PNG', optimize=True, compress_level=9)
    compressed_size = os.path.getsize(tmp_path)
    shutil.move(tmp_path, output_path)
    return original_size, compressed_size


def generate_webp(input_path, output_path, quality=90):
    """Convert any image to WebP alongside the original."""
    img = Image.open(input_path)
    # Preserve RGBA if present
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        img = img.convert('RGBA')
    else:
        img = img.convert('RGB')
    img.save(output_path, 'WEBP', quality=quality, method=6)
    original_size = os.path.getsize(input_path)
    webp_size = os.path.getsize(output_path)
    return original_size, webp_size


def process_folder(img_root, webp_quality=90, dry_run=False):
    """Walk data/IMG/*/ and compress every image found."""
    total_files = 0
    total_original = 0
    total_compressed_png = 0
    total_webp = 0

    for dirpath, _dirnames, filenames in os.walk(img_root):
        for fname in sorted(filenames):
            ext = os.path.splitext(fname)[1].lower()
            if ext not in SUPPORTED_EXTENSIONS:
                continue

            src = os.path.join(dirpath, fname)
            rel = os.path.relpath(src, img_root)
            original_size = os.path.getsize(src)
            total_files += 1

            webp_out = os.path.splitext(src)[0] + '.webp'

            if dry_run:
                print(f"[DRY-RUN] {rel}  ({original_size:,} bytes)  -> .webp")
                continue

            # 1) Compress PNG in-place (only for PNGs)
            if ext == '.png':
                orig, comp = compress_png_pngquant(src, src)
                reduction = ((orig - comp) / orig * 100) if orig else 0
                print(f"[PNG] {rel}: {orig:,} -> {comp:,} bytes ({reduction:.1f}% saved)")
                total_original += orig
                total_compressed_png += comp
            else:
                total_original += original_size
                total_compressed_png += original_size

            # 2) Generate WebP copy
            _orig, wsize = generate_webp(src, webp_out, quality=webp_quality)
            reduction_w = ((original_size - wsize) / original_size * 100) if original_size else 0
            print(f"[WebP] {rel} -> {os.path.basename(webp_out)}: {wsize:,} bytes ({reduction_w:.1f}% vs original)")
            total_webp += wsize

    # Summary
    if dry_run:
        print(f"\n{'='*60}")
        print(f"DRY RUN — {total_files} image(s) would be processed.")
        return

    if total_files == 0:
        print("No images found.")
        return

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"Files processed : {total_files}")
    print(f"Original total  : {total_original:,} bytes ({total_original / (1024*1024):.2f} MB)")
    if total_compressed_png < total_original:
        png_saved = total_original - total_compressed_png
        print(f"After PNG opt   : {total_compressed_png:,} bytes (saved {png_saved:,} bytes)")
    print(f"WebP total      : {total_webp:,} bytes ({total_webp / (1024*1024):.2f} MB)")
    webp_saved = total_original - total_webp
    print(f"WebP savings    : {webp_saved:,} bytes ({webp_saved / (1024*1024):.2f} MB, "
          f"{(webp_saved / total_original * 100):.1f}%)")
    print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(description='Compress portfolio images (WebP + PNG)')
    parser.add_argument('--quality', type=int, default=90,
                        help='WebP quality (default: 90)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Preview without writing any files')
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    img_root = os.path.join(script_dir, 'IMG')

    if not os.path.isdir(img_root):
        print(f"Error: image folder not found at {img_root}")
        sys.exit(1)

    print(f"Portfolio image compression — WebP quality: {args.quality}")
    print(f"Source: {img_root}\n")
    process_folder(img_root, webp_quality=args.quality, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
