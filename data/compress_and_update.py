"""
Compress images to WebP and update projects.json
=================================================
Walks every folder in data/IMG/, converts images to WebP,
and updates the "images" array in projects.json so each entry
lists only the WebP files found in its folder_name directory.

Usage:
    python data/compress_and_update.py
    python data/compress_and_update.py --quality 85
    python data/compress_and_update.py --dry-run
"""
import argparse
import json
import os
import sys

from PIL import Image

SUPPORTED_EXTENSIONS = ('.png', '.jpg', '.jpeg')


def compress_to_webp(input_path, output_path, quality=90):
    """Convert an image to WebP."""
    img = Image.open(input_path)
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        img = img.convert('RGBA')
    else:
        img = img.convert('RGB')
    img.save(output_path, 'WEBP', quality=quality, method=6)


def process_folders(img_root, quality=90, dry_run=False):
    """Walk data/IMG/*/, compress images to WebP, return mapping of folder → webp filenames."""
    folder_images = {}

    for folder_name in sorted(os.listdir(img_root)):
        folder_path = os.path.join(img_root, folder_name)
        if not os.path.isdir(folder_path):
            continue

        webp_files = []
        for filename in sorted(os.listdir(folder_path)):
            name, ext = os.path.splitext(filename)
            if ext.lower() not in SUPPORTED_EXTENSIONS:
                continue

            webp_name = name + '.webp'
            webp_path = os.path.join(folder_path, webp_name)

            if not dry_run:
                if not os.path.exists(webp_path):
                    print(f"  Converting: {folder_name}/{filename} -> {webp_name}")
                    compress_to_webp(os.path.join(folder_path, filename), webp_path, quality)
                else:
                    print(f"  Exists:     {folder_name}/{webp_name}")
            else:
                print(f"  [DRY-RUN]   {folder_name}/{filename} -> {webp_name}")

            webp_files.append(webp_name)

        if webp_files:
            folder_images[folder_name] = webp_files

    return folder_images


def update_projects_json(json_path, folder_images, dry_run=False):
    """Update the images array in projects.json using folder_name to match folders."""
    with open(json_path, 'r', encoding='utf-8-sig') as f:
        projects = json.load(f)

    updated = 0
    for key, project in projects.items():
        folder = project.get('folder_name', key)
        if folder in folder_images:
            old_images = project.get('images', [])
            new_images = folder_images[folder]
            if old_images != new_images:
                print(f"  Updating {key}: {old_images} -> {new_images}")
                project['images'] = new_images
                updated += 1
            else:
                print(f"  No change for {key}")
        else:
            print(f"  WARNING: No folder found for {key} (expected folder: {folder})")

    if not dry_run and updated > 0:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(projects, f, indent=2, ensure_ascii=False)
        print(f"\n  Updated {updated} project(s) in projects.json")
    elif dry_run:
        print(f"\n  [DRY-RUN] Would update {updated} project(s)")
    else:
        print("\n  No changes needed in projects.json")


def main():
    parser = argparse.ArgumentParser(description='Compress images to WebP and update projects.json')
    parser.add_argument('--quality', type=int, default=90, help='WebP quality (default: 90)')
    parser.add_argument('--dry-run', action='store_true', help='Preview without writing any files')
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    img_root = os.path.join(script_dir, 'IMG')
    json_path = os.path.join(script_dir, 'projects.json')

    if not os.path.isdir(img_root):
        print(f"ERROR: Image folder not found: {img_root}")
        sys.exit(1)
    if not os.path.isfile(json_path):
        print(f"ERROR: projects.json not found: {json_path}")
        sys.exit(1)

    print(f"WebP compression — quality: {args.quality}")
    print(f"Source: {img_root}\n")

    print("=== Compressing images ===")
    folder_images = process_folders(img_root, quality=args.quality, dry_run=args.dry_run)

    print("\n=== Updating projects.json ===")
    update_projects_json(json_path, folder_images, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
