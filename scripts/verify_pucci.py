"""Verify pucci.jpg crop quality"""
from PIL import Image

img = Image.open("assets/players/pucci.jpg")
w, h = img.size
print(f"Size: {w}x{h}")

# Check edges for dark bars
center = w // 2
for y in range(0, min(50, h), 2):
    r, g, b = img.getpixel((center, y))
    print(f"  y={y:4d}: ({r:3d},{g:3d},{b:3d}) brightness={(r+g+b)//3}")

print("...")

for y in range(h-50, h, 2):
    r, g, b = img.getpixel((center, y))
    print(f"  y={y:4d}: ({r:3d},{g:3d},{b:3d}) brightness={(r+g+b)//3}")

# Show middle row sample
mid = h // 2
r, g, b = img.getpixel((center, mid))
print(f"Mid: y={mid}: ({r},{g},{b}) brightness={(r+g+b)//3}")

# Show center vertical strip for face finding
print("\nVertical center strip (every 50px):")
for y in range(0, h, 50):
    r, g, b = img.getpixel((center, y))
    print(f"  y={y:4d}: ({r:3d},{g:3d},{b:3d}) brightness={(r+g+b)//3}")