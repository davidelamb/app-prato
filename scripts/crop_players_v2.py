from PIL import Image, ImageFilter
import os

# Source files
sources = {
    'pucci': 'assets/players/pucci-source.jpg',
    'verde': 'assets/players/verde-source.jpg',
}

# Based on visual analysis of vertical phone screenshots (590x1280):
# - Top ~100px: phone status bar (time/battery)
# - Below: search bar and UI chrome
# - The face/portrait is in the middle-upper portion
# - Bottom bar with navigation
# 
# For a portrait crop suitable for cards:
# We want a headshot with some bust, roughly 4:5 or 3:4 portrait ratio
# Target: ~400-450px tall retaining full width (590px), crop centered on face
#
# Strategy: crop from y~100 (skip status bar) to y~1120 (above bottom nav bar)
# Then further refine by finding the face region

for player_id, src_path in sources.items():
    img = Image.open(src_path)
    w, h = img.size  # 590 x 1280
    
    # Crop: remove top status bar (~100px) and bottom UI ~180px
    top_crop = 90      # start below status bar
    bottom_crop = h - 180  # end above bottom nav
    
    # First pass: wide crop
    cropped = img.crop((0, top_crop, w, bottom_crop))
    print(f"{player_id}: cropped {top_crop}->{bottom_crop} = {bottom_crop - top_crop}px tall")
    
    # Save intermediate
    cropped.save(f"assets/players/{player_id}-raw.jpg", quality=92)
    
    # Now determine final crop - aim for ~450px tall portrait centered on face
    # The face should be in the upper portion of the cropped image
    ch = bottom_crop - top_crop  # ~1010px
    
    # For a card portrait, we want roughly 400-500px with the face well-framed
    # Let's take a generous crop that includes head and upper body
    # Face is typically in the top 30-40% of the screenshot content area
    # So we crop from the top of our already-cropped image, keeping ~500px
    
    final_h = 500  # final height for card portrait
    final_top = 0
    final_bottom = final_h
    
    final = cropped.crop((0, final_top, w, final_bottom))
    
    # Resize to reasonable dimensions: 590x500 -> resize to ~354x300 for web efficiency
    # But keep good quality for display
    target_w = 472  # keep reasonable width
    target_h = 400  # 590x500 -> ~472x400 preserves ratio roughly
    
    ratio_w = target_w / w
    ratio_h = target_h / final_h
    ratio = min(ratio_w, ratio_h)
    
    new_w = int(w * ratio)
    new_h = int(final_h * ratio)
    
    resized = final.resize((new_w, new_h), Image.LANCZOS)
    
    # Apply slight sharpening
    resized = resized.filter(ImageFilter.SHARPEN)
    
    out_path = f"assets/players/{player_id}.jpg"
    resized.save(out_path, quality=90, optimize=True)
    print(f"  final: {new_w}x{new_h} saved to {out_path}")
    print(f"  size: {os.path.getsize(out_path)} bytes")