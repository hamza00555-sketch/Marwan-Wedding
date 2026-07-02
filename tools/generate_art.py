#!/usr/bin/env python3
"""Draw the cartoon obstacle sprites and power-up icons for Marwan's Wedding Run.

Everything is drawn at 2x with PIL and downscaled with LANCZOS so the
outlines stay smooth. Cel-shaded look: flat base colour + darker shade +
soft highlight + thick dark outline.
"""
from PIL import Image, ImageDraw
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')

OUTLINE = (43, 34, 38, 255)
SKIN    = (243, 198, 160, 255)
SKIN_SH = (219, 168, 128, 255)


def canvas(w, h):
    img = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def save(img, name, w, h):
    img = img.resize((w, h), Image.LANCZOS)
    img.save(os.path.join(OUT, name))
    print(f'  {name}  {w}x{h}')


def oval(d, box, fill, outline=OUTLINE, ow=7):
    d.ellipse(box, fill=fill, outline=outline, width=ow)


def rrect(d, box, r, fill, outline=OUTLINE, ow=7):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=ow)


# ────────────────────────────────────────────────────────────────────────────
# Obstacle: strict relative — man in white thobe + red shemagh, arms crossed
# ────────────────────────────────────────────────────────────────────────────
def obstacle_relative():
    W, H = 78, 98
    img, d = canvas(W, H)
    w, h = W * 2, H * 2

    # body: thobe
    rrect(d, (28, 78, w - 28, h - 6), 26, (250, 247, 240, 255))
    # shade on right side of thobe
    d.polygon([(w - 34, 92), (w - 34, h - 14), (w - 62, h - 14), (w - 52, 92)],
              fill=(224, 217, 202, 255))
    # crossed arms band
    rrect(d, (34, 112, w - 34, 146), 16, (238, 233, 222, 255))
    d.line([(w // 2 - 26, 118), (w // 2 + 22, 140)], fill=OUTLINE, width=6)
    d.line([(w // 2 + 26, 118), (w // 2 - 22, 140)], fill=OUTLINE, width=6)

    # head
    oval(d, (44, 26, w - 44, 96), SKIN)
    d.ellipse((50, 62, 72, 92), fill=SKIN_SH)  # cheek shade

    # shemagh (red headdress)
    d.pieslice((38, 12, w - 38, 74), 180, 360, fill=(196, 60, 52, 255),
               outline=OUTLINE, width=7)
    d.rectangle((38, 40, w - 38, 52), fill=(196, 60, 52, 255), outline=OUTLINE, width=5)
    # white agal-band dashes
    for x in range(48, w - 48, 18):
        d.line([(x, 44), (x + 8, 48)], fill=(250, 247, 240, 255), width=4)

    # face: angry brows, dot eyes, frown, moustache
    d.line([(58, 60), (74, 66)], fill=OUTLINE, width=6)
    d.line([(w - 58, 60), (w - 74, 66)], fill=OUTLINE, width=6)
    d.ellipse((62, 66, 72, 76), fill=OUTLINE)
    d.ellipse((w - 72, 66, w - 62, 76), fill=OUTLINE)
    d.arc((60, 84, w - 60, 104), 200, 340, fill=OUTLINE, width=6)
    d.line([(66, 84), (w - 66, 84)], fill=(90, 60, 45, 255), width=7)  # moustache

    save(img, 'obstacle-relative.png', W, H)


# ────────────────────────────────────────────────────────────────────────────
# Obstacle: flying bills — fanned papers with coin marks and motion lines
# ────────────────────────────────────────────────────────────────────────────
def obstacle_bills():
    W, H = 64, 54
    img, d = canvas(W, H)
    w, h = W * 2, H * 2

    def paper(cx, cy, pw, ph, ang, col):
        p = Image.new('RGBA', (pw + 20, ph + 20), (0, 0, 0, 0))
        pd = ImageDraw.Draw(p)
        pd.rounded_rectangle((6, 6, pw + 6, ph + 6), radius=6, fill=col,
                             outline=OUTLINE, width=5)
        # money mark: circle + two bars
        cx2, cy2 = (pw + 12) // 2, (ph + 12) // 2
        pd.ellipse((cx2 - 9, cy2 - 9, cx2 + 9, cy2 + 9),
                   outline=(108, 150, 90, 255), width=4)
        pd.line([(cx2 - 12, cy2 + 13), (cx2 + 12, cy2 + 13)],
                fill=(150, 160, 140, 255), width=3)
        p = p.rotate(ang, expand=True, resample=Image.BICUBIC)
        img.alpha_composite(p, (cx - p.width // 2, cy - p.height // 2))

    # motion lines behind
    for i, y in enumerate((h // 2 - 22, h // 2, h // 2 + 22)):
        d.line([(4, y), (34 - i * 6, y)], fill=(255, 255, 255, 150), width=5)

    paper(w // 2 - 18, h // 2 + 10, 52, 64, -18, (233, 240, 224, 255))
    paper(w // 2 + 14, h // 2 - 6, 52, 64, 14, (252, 250, 238, 255))
    paper(w // 2 + 34, h // 2 + 16, 48, 58, 32, (243, 236, 214, 255))

    save(img, 'obstacle-bills.png', W, H)


# ────────────────────────────────────────────────────────────────────────────
# Obstacle: gossip — phone with angry speech bubbles stacked above
# ────────────────────────────────────────────────────────────────────────────
def obstacle_gossip():
    W, H = 88, 108
    img, d = canvas(W, H)
    w, h = W * 2, H * 2

    # phone at bottom
    rrect(d, (w // 2 - 30, h - 84, w // 2 + 30, h - 8), 12, (52, 56, 66, 255))
    d.rounded_rectangle((w // 2 - 22, h - 76, w // 2 + 22, h - 24),
                        radius=6, fill=(120, 200, 230, 255))
    d.ellipse((w // 2 - 6, h - 22, w // 2 + 6, h - 12), outline=(200, 200, 200, 255), width=3)

    def bubble(box, tail, col):
        d.rounded_rectangle(box, radius=18, fill=col, outline=OUTLINE, width=6)
        d.polygon(tail, fill=col, outline=OUTLINE)

    # big angry bubble
    bubble((14, 10, w - 44, 74), [(56, 70), (40, 96), (86, 70)], (252, 250, 240, 255))
    # angry scribble inside
    pts = [(34 + i * 12, 42 + (10 if i % 2 else -10)) for i in range(8)]
    d.line(pts, fill=(200, 60, 50, 255), width=6, joint='curve')

    # small reply bubble
    bubble((w - 78, 66, w - 8, 118), [(w - 44, 114), (w - 60, 140), (w - 28, 114)],
           (255, 236, 200, 255))
    for i in range(3):
        d.ellipse((w - 66 + i * 18, 86, w - 54 + i * 18, 98), fill=(150, 120, 80, 255))

    save(img, 'obstacle-gossip.png', W, H)


# ────────────────────────────────────────────────────────────────────────────
# Obstacle: traffic — little taxi, side view
# ────────────────────────────────────────────────────────────────────────────
def obstacle_traffic():
    W, H = 108, 118
    img, d = canvas(W, H)
    w, h = W * 2, H * 2
    Y = (240, 196, 60, 255)      # taxi yellow
    YSH = (212, 164, 40, 255)

    # exhaust puffs
    for i, (px, py, r) in enumerate(((16, h - 58, 12), (30, h - 72, 9))):
        d.ellipse((px - r, py - r, px + r, py + r), fill=(220, 220, 220, 170))

    # cabin
    rrect(d, (52, 34, w - 60, 118), 26, Y)
    # body
    rrect(d, (16, 96, w - 12, h - 42), 22, Y)
    d.rectangle((20, h - 76, w - 16, h - 46), fill=YSH)
    # windows
    rrect(d, (66, 48, w // 2 - 4, 100), 10, (150, 216, 238, 255), ow=6)
    rrect(d, (w // 2 + 8, 48, w - 74, 100), 10, (150, 216, 238, 255), ow=6)
    # taxi sign
    rrect(d, (w // 2 - 22, 16, w // 2 + 22, 40), 8, (250, 247, 240, 255), ow=5)
    d.rectangle((w // 2 - 12, 24, w // 2 + 12, 32), fill=(60, 60, 60, 255))
    # checker band
    for i, x in enumerate(range(24, w - 20, 20)):
        if x + 16 < w - 16:
            col = (40, 40, 40, 255) if i % 2 == 0 else (250, 250, 250, 255)
            d.rectangle((x, h - 72, x + 16, h - 58), fill=col)
    # lights
    d.ellipse((w - 26, 104, w - 8, 122), fill=(255, 240, 170, 255), outline=OUTLINE, width=5)
    # wheels
    for cx in (56, w - 52):
        d.ellipse((cx - 26, h - 56, cx + 26, h - 4), fill=(45, 45, 50, 255),
                  outline=OUTLINE, width=6)
        d.ellipse((cx - 11, h - 41, cx + 11, h - 19), fill=(190, 190, 195, 255))

    save(img, 'obstacle-traffic.png', W, H)


# ────────────────────────────────────────────────────────────────────────────
# Obstacle: crowd — three cartoon guests blocking the way
# ────────────────────────────────────────────────────────────────────────────
def obstacle_crowd():
    W, H = 132, 98
    img, d = canvas(W, H)
    w, h = W * 2, H * 2

    def person(cx, top, bw, thobe, ghutra, back=False):
        # body
        rrect(d, (cx - bw, top + 44, cx + bw, h - 6), 18, thobe)
        # head
        oval(d, (cx - 26, top, cx + 26, top + 52), SKIN)
        # headdress
        d.pieslice((cx - 30, top - 10, cx + 30, top + 36), 180, 360,
                   fill=ghutra, outline=OUTLINE, width=6)
        if not back:
            # simple face
            d.ellipse((cx - 14, top + 22, cx - 6, top + 30), fill=OUTLINE)
            d.ellipse((cx + 6, top + 22, cx + 14, top + 30), fill=OUTLINE)
            d.arc((cx - 12, top + 30, cx + 12, top + 46), 200, 340, fill=OUTLINE, width=5)

    person(58, 34, 40, (235, 230, 218, 255), (196, 60, 52, 255), back=True)
    person(w - 58, 40, 38, (215, 208, 195, 255), (250, 247, 240, 255), back=True)
    person(w // 2, 14, 44, (250, 247, 240, 255), (196, 60, 52, 255))

    save(img, 'obstacle-crowd.png', W, H)


# ────────────────────────────────────────────────────────────────────────────
# Power-up icons
# ────────────────────────────────────────────────────────────────────────────
def powerup_magnet():
    W = H = 52
    img, d = canvas(W, H)
    w, h = W * 2, H * 2
    # U-magnet
    d.arc((16, 14, w - 16, h + 30), 180, 360, fill=OUTLINE, width=42)
    d.arc((16, 14, w - 16, h + 30), 180, 360, fill=(210, 60, 60, 255), width=30)
    for x0 in (16, w - 46):
        d.rectangle((x0, 56, x0 + 30, h - 12), fill=(210, 60, 60, 255),
                    outline=OUTLINE, width=6)
        d.rectangle((x0, h - 34, x0 + 30, h - 12), fill=(226, 228, 235, 255),
                    outline=OUTLINE, width=6)
    # sparks
    for sx, sy in ((26, 20), (w - 26, 20), (w // 2, 8)):
        d.line([(sx - 8, sy), (sx + 8, sy)], fill=(255, 220, 90, 255), width=5)
        d.line([(sx, sy - 8), (sx, sy + 8)], fill=(255, 220, 90, 255), width=5)
    save(img, 'powerup-magnet.png', W, H)


def powerup_shield():
    W = H = 52
    img, d = canvas(W, H)
    w, h = W * 2, H * 2
    pts = [(w // 2, 8), (w - 12, 30), (w - 16, 66), (w // 2, h - 8), (16, 66), (12, 30)]
    d.polygon(pts, fill=(70, 130, 215, 255), outline=OUTLINE)
    inner = [(w // 2, 22), (w - 26, 38), (w - 28, 64), (w // 2, h - 24), (28, 64), (26, 38)]
    d.polygon(inner, fill=(110, 170, 240, 255))
    # star
    cx, cy, r1, r2 = w // 2, 54, 20, 8
    star = []
    for i in range(10):
        r = r1 if i % 2 == 0 else r2
        a = -math.pi / 2 + i * math.pi / 5
        star.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    d.polygon(star, fill=(255, 220, 90, 255), outline=(180, 140, 30, 255))
    save(img, 'powerup-shield.png', W, H)


def powerup_coinbag():
    W = H = 52
    img, d = canvas(W, H)
    w, h = W * 2, H * 2
    # bag
    d.polygon([(w // 2 - 34, 40), (w // 2 + 34, 40), (w - 14, h - 26), (14, h - 26)],
              fill=(160, 116, 70, 255), outline=OUTLINE)
    d.ellipse((14, h - 44, w - 14, h - 6), fill=(160, 116, 70, 255), outline=OUTLINE, width=6)
    d.rectangle((w // 2 - 16, 26, w // 2 + 16, 44), fill=(120, 84, 48, 255),
                outline=OUTLINE, width=5)
    # coins popping out
    for cx, cy in ((w // 2 - 26, 18), (w // 2 + 24, 12), (w // 2, 6)):
        d.ellipse((cx - 11, cy - 11, cx + 11, cy + 11), fill=(255, 208, 60, 255),
                  outline=(180, 140, 30, 255), width=4)
    # highlight
    d.ellipse((30, 62, 52, 92), fill=(186, 142, 94, 255))
    save(img, 'powerup-coinbag.png', W, H)


def coin_big():
    W = H = 56
    img, d = canvas(W, H)
    w, h = W * 2, H * 2
    d.ellipse((6, 6, w - 6, h - 6), fill=(255, 208, 60, 255),
              outline=(150, 110, 20, 255), width=8)
    d.ellipse((20, 20, w - 20, h - 20), outline=(240, 170, 40, 255), width=6)
    # "5" bars: five gems around
    for i in range(5):
        a = -math.pi / 2 + i * 2 * math.pi / 5
        cx = w // 2 + 30 * math.cos(a)
        cy = h // 2 + 30 * math.sin(a)
        d.ellipse((cx - 7, cy - 7, cx + 7, cy + 7), fill=(255, 240, 170, 255))
    d.ellipse((w // 2 - 12, h // 2 - 12, w // 2 + 12, h // 2 + 12),
              fill=(240, 170, 40, 255))
    save(img, 'coin-big.png', W, H)


if __name__ == '__main__':
    print('drawing obstacles…')
    obstacle_relative()
    obstacle_bills()
    obstacle_gossip()
    obstacle_traffic()
    obstacle_crowd()
    print('drawing power-ups…')
    powerup_magnet()
    powerup_shield()
    powerup_coinbag()
    coin_big()
    print('done.')
