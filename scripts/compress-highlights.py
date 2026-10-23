"""把 assets/highlights 的截圖轉成 720px 寬的 WebP（原檔保留，不刪除）。
用法：python3 scripts/compress-highlights.py   （需要 Pillow：pip install Pillow）
"""
from pathlib import Path
from PIL import Image, ImageOps

SRC = Path(__file__).resolve().parent.parent / 'assets' / 'highlights'
MAX_W, QUALITY = 720, 78
before = after = n = 0
for p in sorted(SRC.iterdir()):
    if p.suffix.lower() not in {'.png', '.jpg', '.jpeg'}:
        continue
    out = p.with_suffix('.webp')
    im = ImageOps.exif_transpose(Image.open(p)).convert('RGB')
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    im.save(out, 'WEBP', quality=QUALITY, method=6)
    before += p.stat().st_size; after += out.stat().st_size; n += 1
print(f'{n} 張：{before/1048576:.1f} MB → {after/1048576:.1f} MB')
