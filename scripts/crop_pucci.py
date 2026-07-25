"""One-shot crop of Pucci photo from the authorized source file.
Manual precise crop: removes top bar (y < 90), bottom search field UI (y > 1100).
Keeps full portrait: hair, face to chin, bust.
Output: assets/players/pucci.jpg"""

from PIL import Image
import os

SRC = r"C:\Users\david\.codex\codex-remote-attachments\019f8671-39dc-7270-8530-625a4f14b303\2D866231-DAE3-4058-9179-5EF95337E70B\1-Foto-1.jpg"
DST = "assets/players/pucci.jpg"

img = Image.open(SRC)
w, h = img.size  # 590 x 1280

# Verified boundaries from brightness analysis:
# - Top bar: y=0 to y=88 (dark UI), hair starts ~y=90
# - Person: y=90 to y≈950 (hair, face, bust)
# - Dark background: y=950 to y=1140
# - Search field UI: y=1143+ (bright white/gray)
top_crop = 90
bottom_crop = 1100

cropped = img.crop((0, top_crop, w, bottom_crop))
print(f"Cropped size: {cropped.size}")
print(f"Aspect ratio: {cropped.size[0]}/{cropped.size[1]} = {cropped.size[0]/cropped.size[1]:.3f}")

# Verify top and bottom edges
center = cropped.size[0] // 2
for y in range(0, min(20, cropped.size[1])):
    r, g, b = cropped.getpixel((center, y))
    print(f"  top y={y}: ({r},{g},{b}) brightness={(r+g+b)//3}")

print("  ...")
for y in range(cropped.size[1] - 10, cropped.size[1]):
    r, g, b = cropped.getpixel((center, y))
    print(f"  bottom y={y}: ({r},{g},{b}) brightness={(r+g+b)//3}")

cropped.save(DST, quality=95)
print(f"Saved to {DST}")
print(f"File size: {os.path.getsize(DST)} bytes")