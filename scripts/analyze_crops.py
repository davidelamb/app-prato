from PIL import Image
import numpy as np
import os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

for name in ['pucci-raw', 'verde-raw']:
    img = Image.open(f'assets/players/{name}.jpg')
    arr = np.array(img)
    h, w = arr.shape[:2]
    print(f"=== {name} ({w}x{h}) ===")
    
    # Print a summary every 50 rows
    for y_start in range(0, h, 50):
        y_end = min(y_start + 50, h)
        region = arr[y_start:y_end, :, :].astype(np.float32)
        avg_r = np.mean(region[:, :, 0])
        avg_g = np.mean(region[:, :, 1])
        avg_b = np.mean(region[:, :, 2])
        var = np.var(region)
        # Count warm pixel percentage
        r, g, b = region[:, :, 0], region[:, :, 1], region[:, :, 2]
        warm_mask = (r > g) & (r > b) & (r > 80) & (r < 230) & (b > 20)
        warm_pct = np.mean(warm_mask) * 100
        print(f"  y=[{y_start:4d}-{y_end:4d}]: avg_rgb=({avg_r:5.0f},{avg_g:5.0f},{avg_b:5.0f}) var={var:7.0f} warm={warm_pct:4.1f}%")
    print()