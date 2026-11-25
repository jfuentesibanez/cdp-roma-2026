import sys
from PIL import Image, ImageChops
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB").resize((1100, 1100), Image.LANCZOS)
# background colour: median of the four corner patches
px = []
for x, y in [(8, 8), (1060, 8), (8, 1060), (1060, 1060)]:
    px += list(im.crop((x, y, x + 30, y + 30)).getdata())
bg = [sorted(p[i] for p in px)[len(px) // 2] for i in range(3)]
# levels: background -> white (a touch below so paper grain goes too)
chans = [c.point(lambda v, b=b: min(255, int(v * 255 / (b - 4)))) for c, b in zip(im.split(), bg)]
r, g, b = chans
mn = ImageChops.darker(ImageChops.darker(r, g), b)
a = mn.point(lambda v: 255 - v)                      # white -> transparent
def unmul(c):
    out = Image.new("L", c.size)
    out.putdata([0 if al == 0 else max(0, min(255, int(255 - (255 - v) * 255 / al))) for v, al in zip(c.getdata(), a.getdata())])
    return out
Image.merge("RGBA", (unmul(r), unmul(g), unmul(b), a)).save(dst, optimize=True)
print(dst, "bg", bg)
