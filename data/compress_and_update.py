"""
Compress images/videos to web formats, convert PDFs, and update projects.json
==============================================================================
Walks every folder in data/IMG/:
  - Converts images (PNG/JPG/JPEG) to WebP
  - Compresses videos (MP4/MOV/AVI/MKV) to H.264 MP4 and extracts a 2-second thumbnail
  - Converts PDF pages to WebP images
  - Updates projects.json with the resulting images and videos arrays

Requirements:
    pip install Pillow moviepy PyMuPDF

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

IMAGE_EXTENSIONS = ('.png', '.jpg', '.jpeg')
VIDEO_EXTENSIONS = ('.mp4', '.mov', '.avi', '.mkv')
PDF_EXTENSIONS = ('.pdf',)


def compress_to_webp(input_path, output_path, quality=90, max_size=None):
    """Convert an image to WebP, optionally capping the largest dimension."""
    img = Image.open(input_path)
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        img = img.convert('RGBA')
    else:
        img = img.convert('RGB')
    # Resize if larger than max_size (preserving aspect ratio)
    if max_size and max(img.size) > max_size:
        w, h = img.size
        scale = max_size / max(w, h)
        new_w, new_h = round(w * scale), round(h * scale)
        img = img.resize((new_w, new_h), Image.LANCZOS)
    img.save(output_path, 'WEBP', quality=quality, method=6)


def compress_video(input_path, output_path, target_bitrate='2M'):
    """Re-encode a video to H.264 MP4 using moviepy."""
    from moviepy import VideoFileClip
    clip = VideoFileClip(input_path)
    clip.write_videofile(
        output_path,
        codec='libx264',
        audio_codec='aac',
        bitrate=target_bitrate,
        logger=None,
    )
    clip.close()


def extract_thumbnail(input_path, output_path, timestamp=2.0, quality=90):
    """Extract a frame from a video at the given timestamp and save as WebP."""
    from moviepy import VideoFileClip
    clip = VideoFileClip(input_path)
    # Use 2s or last frame if video is shorter
    t = min(timestamp, clip.duration - 0.1) if clip.duration > 0.1 else 0
    frame = clip.get_frame(t)
    clip.close()
    img = Image.fromarray(frame)
    img.save(output_path, 'WEBP', quality=quality, method=6)


def convert_pdf_to_webp(pdf_path, output_dir, quality=90):
    """Render each page of a PDF to a WebP image. Returns list of generated filenames."""
    import fitz  # PyMuPDF
    doc = fitz.open(pdf_path)
    pdf_stem = os.path.splitext(os.path.basename(pdf_path))[0]
    generated = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        # Render at 2x for quality
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        webp_name = f"{pdf_stem}_page{page_num + 1}.webp"
        webp_path = os.path.join(output_dir, webp_name)
        # Convert pixmap → PIL → WebP
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        img.save(webp_path, 'WEBP', quality=quality, method=6)
        generated.append(webp_name)
    doc.close()
    return generated


def process_folders(img_root, quality=90, max_size=None, dry_run=False):
    """Walk data/IMG/*/, process all media, return (folder_images, folder_videos) dicts."""
    folder_images = {}
    folder_videos = {}

    for folder_name in sorted(os.listdir(img_root)):
        folder_path = os.path.join(img_root, folder_name)
        if not os.path.isdir(folder_path):
            continue

        webp_files = []
        video_entries = []

        for filename in sorted(os.listdir(folder_path)):
            name, ext = os.path.splitext(filename)
            ext_lower = ext.lower()

            # --- Images ---
            if ext_lower in IMAGE_EXTENSIONS:
                webp_name = name + '.webp'
                webp_path = os.path.join(folder_path, webp_name)
                if not dry_run:
                    if not os.path.exists(webp_path):
                        print(f"  Converting: {folder_name}/{filename} -> {webp_name}")
                        compress_to_webp(os.path.join(folder_path, filename), webp_path, quality, max_size)
                    else:
                        # Re-compress if existing webp is oversized and --max-size is set
                        if max_size:
                            existing = Image.open(webp_path)
                            if max(existing.size) > max_size:
                                print(f"  Resizing:   {folder_name}/{webp_name} ({existing.size[0]}x{existing.size[1]} -> max {max_size})")
                                existing.close()
                                compress_to_webp(webp_path, webp_path, quality, max_size)
                            else:
                                existing.close()
                                print(f"  OK:         {folder_name}/{webp_name} ({existing.size[0]}x{existing.size[1]})")
                        else:
                            print(f"  Exists:     {folder_name}/{webp_name}")
                else:
                    print(f"  [DRY-RUN]   {folder_name}/{filename} -> {webp_name}")
                webp_files.append(webp_name)

            # --- Videos ---
            elif ext_lower in VIDEO_EXTENSIONS:
                # Skip already-compressed files
                if name.endswith('_compressed'):
                    continue
                compressed_name = name + '_compressed.mp4'
                thumb_name = name + '_thumb.webp'
                compressed_path = os.path.join(folder_path, compressed_name)
                thumb_path = os.path.join(folder_path, thumb_name)
                if not dry_run:
                    if not os.path.exists(compressed_path):
                        print(f"  Compressing video: {folder_name}/{filename} -> {compressed_name}")
                        compress_video(os.path.join(folder_path, filename), compressed_path)
                    else:
                        print(f"  Exists:     {folder_name}/{compressed_name}")
                    if not os.path.exists(thumb_path):
                        print(f"  Extracting thumbnail: {folder_name}/{filename} -> {thumb_name}")
                        extract_thumbnail(os.path.join(folder_path, filename), thumb_path, quality=quality)
                    else:
                        print(f"  Exists:     {folder_name}/{thumb_name}")
                else:
                    print(f"  [DRY-RUN]   {folder_name}/{filename} -> {compressed_name}")
                    print(f"  [DRY-RUN]   {folder_name}/{filename} -> {thumb_name}")
                video_entries.append({
                    'file': compressed_name,
                    'thumbnail': thumb_name,
                })

            # --- Existing WebP-only files (no PNG/JPG source) — resize if oversized ---
            elif ext_lower == '.webp':
                # Check if a source image exists (skip if the IMAGE_EXTENSIONS block already handles it)
                has_source = any(
                    os.path.exists(os.path.join(folder_path, name + src_ext))
                    for src_ext in IMAGE_EXTENSIONS
                )
                if not has_source:
                    if not dry_run and max_size:
                        existing = Image.open(os.path.join(folder_path, filename))
                        if max(existing.size) > max_size:
                            print(f"  Resizing:   {folder_name}/{filename} ({existing.size[0]}x{existing.size[1]} -> max {max_size})")
                            existing.close()
                            compress_to_webp(os.path.join(folder_path, filename), os.path.join(folder_path, filename), quality, max_size)
                        else:
                            existing.close()
                            print(f"  OK:         {folder_name}/{filename} ({existing.size[0]}x{existing.size[1]})")
                    elif dry_run and max_size:
                        print(f"  [DRY-RUN]   {folder_name}/{filename} (would check size)")
                    webp_files.append(filename)

            # --- PDFs ---
            elif ext_lower in PDF_EXTENSIONS:
                if not dry_run:
                    try:
                        print(f"  Converting PDF: {folder_name}/{filename}")
                        pages = convert_pdf_to_webp(
                            os.path.join(folder_path, filename), folder_path, quality
                        )
                        webp_files.extend(pages)
                        for p in pages:
                            print(f"    -> {p}")
                    except ImportError:
                        print(f"  Skipping PDF (PyMuPDF not installed): {folder_name}/{filename}")
                else:
                    # Estimate page count from PDF for dry-run reporting
                    try:
                        import fitz
                        doc = fitz.open(os.path.join(folder_path, filename))
                        num_pages = len(doc)
                        doc.close()
                        for pg in range(1, num_pages + 1):
                            page_name = f"{name}_page{pg}.webp"
                            webp_files.append(page_name)
                            print(f"  [DRY-RUN]   {folder_name}/{filename} -> {page_name}")
                    except ImportError:
                        print(f"  [DRY-RUN]   {folder_name}/{filename} -> (PDF pages to WebP, install PyMuPDF for details)")

        if webp_files:
            folder_images[folder_name] = webp_files
        if video_entries:
            folder_videos[folder_name] = video_entries

    return folder_images, folder_videos


def update_projects_json(json_path, folder_images, folder_videos, dry_run=False):
    """Update images and videos arrays in projects.json using folder_name to match folders."""
    with open(json_path, 'r', encoding='utf-8-sig') as f:
        projects = json.load(f)

    updated = 0
    for key, project in projects.items():
        folder = project.get('folder_name', key)
        has_folder = folder in folder_images or folder in folder_videos
        changed = False

        # Update images
        if folder in folder_images:
            old_images = project.get('images', [])
            new_images = folder_images[folder]
            if old_images != new_images:
                print(f"  Updating images for {key}: {len(old_images)} -> {len(new_images)} files")
                project['images'] = new_images
                changed = True
            else:
                print(f"  No image change for {key}")
        elif not has_folder:
            print(f"  WARNING: No folder found for {key} (expected folder: {folder})")

        # Update videos
        if folder in folder_videos:
            old_videos = project.get('videos', [])
            new_videos = folder_videos[folder]
            if old_videos != new_videos:
                print(f"  Updating videos for {key}: {len(old_videos)} -> {len(new_videos)} entries")
                project['videos'] = new_videos
                changed = True
            else:
                print(f"  No video change for {key}")
        elif 'videos' not in project:
            # Ensure videos key exists even if empty
            project['videos'] = []

        if changed:
            updated += 1

    if not dry_run and updated > 0:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(projects, f, indent=2, ensure_ascii=False)
        print(f"\n  Updated {updated} project(s) in projects.json")
    elif dry_run:
        print(f"\n  [DRY-RUN] Would update {updated} project(s)")
    else:
        print("\n  No changes needed in projects.json")


def main():
    parser = argparse.ArgumentParser(
        description='Compress images/videos to web formats, convert PDFs, and update projects.json'
    )
    parser.add_argument('--quality', type=int, default=90, help='WebP quality (default: 90)')
    parser.add_argument('--max-size', type=int, default=None,
                        help='Cap largest image dimension to this value in pixels (e.g. 1920)')
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

    print(f"Media compression — quality: {args.quality}, max-size: {args.max_size or 'unlimited'}")
    print(f"Source: {img_root}\n")

    print("=== Processing media files ===")
    folder_images, folder_videos = process_folders(img_root, quality=args.quality, max_size=args.max_size, dry_run=args.dry_run)

    print("\n=== Updating projects.json ===")
    update_projects_json(json_path, folder_images, folder_videos, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
