from PIL import Image
import os
import subprocess

def compress_png(input_path, output_path=None, optimize=True):
    """
    Compress PNG files without losing quality or changing dimensions.
    
    Args:
        input_path: Path to input PNG file
        output_path: Path to save compressed PNG (if None, overwrites original)
        optimize: Enable PNG optimization (default: True)
    """
    if output_path is None:
        output_path = input_path
    
    img = Image.open(input_path)
    
    # Save with maximum compression (compress_level=9) and optimization
    img.save(output_path, 'PNG', optimize=optimize, compress_level=9)
    
    # Get file sizes
    original_size = os.path.getsize(input_path)
    compressed_size = os.path.getsize(output_path)
    reduction = ((original_size - compressed_size) / original_size) * 100
    
    print(f"Original: {original_size:,} bytes")
    print(f"Compressed: {compressed_size:,} bytes")
    print(f"Reduction: {reduction:.2f}%")

def compress_folder(folder_path, output_folder=None):
    """
    Compress all PNG files in a folder.
    """
    if output_folder and not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    for filename in os.listdir(folder_path):
        if filename.lower().endswith('.png'):
            input_path = os.path.join(folder_path, filename)
            output_path = os.path.join(output_folder, filename) if output_folder else input_path
            
            print(f"\nCompressing: {filename}")
            compress_png(input_path, output_path)

def compress_with_tinypng(input_path, output_path=None):
    """
    Compress PNG using pngquant (install: pip install pngquant-cli)
    Lossy compression but visually identical, typically 50-80% reduction.
    """
    if output_path is None:
        output_path = input_path
    
    # Get ORIGINAL size BEFORE compression
    original_size = os.path.getsize(input_path)
    
    try:
        # Quality range 90-100 means nearly lossless
        result = subprocess.run(
            ['pngquant', '--quality=90-100', '--force', '--output', output_path, input_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            compressed_size = os.path.getsize(output_path)
            reduction = ((original_size - compressed_size) / original_size) * 100
            
            print(f"Original: {original_size:,} bytes")
            print(f"Compressed: {compressed_size:,} bytes")
            print(f"Reduction: {reduction:.2f}%")
        else:
            print(f"pngquant failed: {result.stderr}")
            print("Falling back to PIL compression...")
            compress_png(input_path, output_path)
    except FileNotFoundError:
        print("pngquant not found. Install with: pip install pngquant-cli")
        print("Falling back to PIL compression...")
        compress_png(input_path, output_path)

def convert_to_webp(input_path, output_path=None, quality=95):
    """
    Convert PNG to WebP format for much better compression.
    WebP typically achieves 25-35% smaller files than PNG with same quality.
    """
    if output_path is None:
        output_path = input_path.rsplit('.', 1)[0] + '.webp'
    
    img = Image.open(input_path)
    img.save(output_path, 'WEBP', quality=quality, method=6)
    
    original_size = os.path.getsize(input_path)
    compressed_size = os.path.getsize(output_path)
    reduction = ((original_size - compressed_size) / original_size) * 100
    
    print(f"Original PNG: {original_size:,} bytes")
    print(f"WebP: {compressed_size:,} bytes")
    print(f"Reduction: {reduction:.2f}%")

def compress_folder_with_pngquant(folder_path, output_folder=None):
    """
    Compress all PNG files in a folder using pngquant.
    
    Args:
        folder_path: Path to folder containing PNG files
        output_folder: Path to save compressed files (if None, overwrites originals)
    """
    if output_folder and not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    png_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.png')]
    total_files = len(png_files)
    total_original = 0
    total_compressed = 0
    
    print(f"Found {total_files} PNG files in {folder_path}\n")
    
    for i, filename in enumerate(png_files, 1):
        input_path = os.path.join(folder_path, filename)
        output_path = os.path.join(output_folder, filename) if output_folder else input_path
        
        print(f"[{i}/{total_files}] Compressing: {filename}")
        
        original_size = os.path.getsize(input_path)
        total_original += original_size
        
        compress_with_tinypng(input_path, output_path)
        
        total_compressed += os.path.getsize(output_path)
        print()
    
    # Summary
    total_reduction = ((total_original - total_compressed) / total_original) * 100
    print("="*60)
    print(f"SUMMARY:")
    print(f"Files processed: {total_files}")
    print(f"Total original size: {total_original:,} bytes ({total_original / (1024*1024):.2f} MB)")
    print(f"Total compressed size: {total_compressed:,} bytes ({total_compressed / (1024*1024):.2f} MB)")
    print(f"Total reduction: {total_reduction:.2f}%")
    print(f"Space saved: {(total_original - total_compressed):,} bytes ({(total_original - total_compressed) / (1024*1024):.2f} MB)")
    print("="*60)

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Usage examples:

# Single file compression
#input_file = os.path.join(script_dir, 'TXT/PHOTOBOOTH/PHOTOBOOTH_standardSurface51SG_OcclusionRoughnessMetallic.1001.png')
#print(f"Checking file: {input_file}")
#if os.path.exists(input_file):
#    current_size = os.path.getsize(input_file)
#    print(f"Current file size: {current_size:,} bytes ({current_size / (1024*1024):.2f} MB)")
#    print(f"File exists at: {os.path.abspath(input_file)}\n")
#    compress_with_tinypng(input_file, input_file)
#else:
#    print(f"File not found!\n")

# Compress entire folder with pngquant (overwrites originals)
folder_to_compress = os.path.join(script_dir, 'TXT/SWEEP')
compress_folder_with_pngquant(folder_to_compress)

# Compress entire folder and save to new location (preserves originals)
#folder_to_compress = os.path.join(script_dir, 'TXT/PHOTOBOOTH')
#output_folder = os.path.join(script_dir, 'TXT/PHOTOBOOTH_compressed')
#compress_folder_with_pngquant(folder_to_compress, output_folder)