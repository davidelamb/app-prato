"""Process the Club tab icon: extract diamond-shaped giglio from source, remove background, create transparent PNG."""
import sys
from PIL import Image
import numpy as np

SRC = "assets/club-tab-logo-source.jpg"
OUT = "assets/club-tab-icon.png"
SIZES = [44, 88, 132]

try:
    img = Image.open(SRC).convert("RGBA")
    data = np.array(img)
    r, g, b = data[:,:,0].astype(np.int16), data[:,:,1].astype(np.int16), data[:,:,2].astype(np.int16)
    brightness = (r + g + b) / 3.0
    
    # Remove white/very light background: threshold at brightness > 200
    white_mask = brightness > 200
    data[white_mask, 3] = 0  # make transparent
    
    # Fade transition zone (brightness 150-200)
    fade_mask = (brightness > 150) & (brightness <= 200)
    alpha_adj = np.clip(255 - (brightness[fade_mask] - 150) * 5.1, 0, 255).astype(np.uint8)
    data[fade_mask, 3] = np.minimum(data[fade_mask, 3], alpha_adj)
    
    # Also remove pixels with very low saturation (gray/white areas within logo)
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    sat = np.where(max_c > 0, (max_c - min_c) / max_c, 0)
    low_sat_mask = (sat < 0.08) & (brightness > 130)
    data[low_sat_mask, 3] = np.minimum(data[low_sat_mask, 3], np.clip(255 * (1 - (brightness[low_sat_mask] - 130) / 125), 0, 255).astype(np.uint8))
    
    result = Image.fromarray(data, "RGBA")
    
    # Crop to non-transparent content
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)
    
    # Make square
    w, h = result.size
    size = max(w, h)
    square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    square.paste(result, ((size - w) // 2, (size - h) // 2))
    
    # Save at multiple sizes
    for s in SIZES:
        rsz = square.resize((s, s), Image.LANCZOS)
        rsz.save(f"assets/club-tab-icon-{s}.png")
        print(f"Saved: club-tab-icon-{s}.png ({s}x{s})")
    
    square.resize((88, 88), Image.LANCZOS).save(OUT)
    print(f"Main icon saved: {OUT} ({square.size[0]}x{square.size[1]})")
    
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)