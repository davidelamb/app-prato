from PIL import Image, ImageFilter
import os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Source files with custom crop parameters for each player
# Each: (source, raw_top, raw_bottom, portrait_top, portrait_bottom)
# raw = crop from source to remove UI bars
# portrait = crop from raw to get head+bust portrait

configs = {
    'pucci': {
        'src': 'assets/players/pucci-source.jpg',
        # Source: 590x1280 phone screenshot
        # Top status bar removed (y>=90), bottom nav removed (y<=1100)
        'raw_top': 90,
        'raw_bottom': 1100,
        # Portrait: head is at top of raw crop, face peaks at raw_y~370
        # Take from raw_y=0 to raw_y=500 for head + upper chest
        'portrait_top': 0,
        'portrait_bottom': 500,
        # Face center offset (for imageScale/position tuning)
        'face_center_y': 370,  # approximate face center in raw crop coords
    },
    'verde': {
        'src': 'assets/players/verde-source.jpg',
        # Source: 590x1280 phone screenshot
        # Top status bar + search UI removed (y>=90), bottom nav removed (y<=1100)
        'raw_top': 90,
        'raw_bottom': 1100,
        # Portrait: head starts at raw_y~130, face at raw_y~200-450
        # Take from raw_y=100 to raw_y=600 for head + upper chest
        'portrait_top': 100,
        'portrait_bottom': 600,
        'face_center_y': 325,
    },
}

for player_id, cfg in configs.items():
    img = Image.open(cfg['src'])
    w, h = img.size  # 590 x 1280
    
    # Step 1: Remove UI bars (top status bar, bottom nav)
    raw = img.crop((0, cfg['raw_top'], w, cfg['raw_bottom']))
    raw.save(f"assets/players/{player_id}-raw.jpg", quality=92)
    rh = cfg['raw_bottom'] - cfg['raw_top']
    print(f"{player_id}: raw crop {cfg['raw_top']}->{cfg['raw_bottom']} = {rh}px (from {h}px source)")
    
    # Step 2: Extract portrait (head + bust)
    portrait_top = cfg['portrait_top']
    portrait_bottom = cfg['portrait_bottom']
    portrait_h = portrait_bottom - portrait_top
    
    portrait = raw.crop((0, portrait_top, w, portrait_bottom))
    print(f"  portrait: raw[{portrait_top}:{portrait_bottom}] = {portrait_h}px")
    
    # Step 3: Resize for web efficiency while keeping quality
    # Target ~400px tall, maintain aspect ratio
    target_height = 400
    aspect = w / portrait_h
    target_width = int(target_height * aspect)
    
    resized = portrait.resize((target_width, target_height), Image.LANCZOS)
    
    # Apply subtle sharpening
    resized = resized.filter(ImageFilter.SHARPEN)
    
    out_path = f"assets/players/{player_id}.jpg"
    resized.save(out_path, quality=90, optimize=True)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"  final: {target_width}x{target_height}, {size_kb:.1f} KB -> {out_path}")
    print()

print("Done! Raw intermediate files kept for verification.")