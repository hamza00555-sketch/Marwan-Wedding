#!/usr/bin/env python3
"""Process raw animation frames and backgrounds into game-ready assets."""

from PIL import Image, ImageDraw
import os, shutil, numpy as np

EXTRACT = "/tmp/assets_preview"
OUT     = "/home/user/Marwan-Wedding/assets/images"
os.makedirs(OUT, exist_ok=True)

FW, FH = 112, 150   # target frame size for character

# ── helpers ──────────────────────────────────────────────────────────────────

def clean_alpha(img, threshold=15):
    """Set near-transparent background pixels to fully transparent."""
    img = img.convert("RGBA")
    r, g, b, a = img.split()
    a = a.point(lambda v: 0 if v <= threshold else v)
    return Image.merge("RGBA", (r, g, b, a))

def fit_frame(img, w, h):
    """Scale image to fit within w×h, centred on transparent canvas."""
    scale = min(w / img.width, h / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    scaled = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(scaled, ((w - nw) // 2, (h - nh) // 2), scaled)
    return canvas

def spritesheet(frames, path):
    w, h = frames[0].size
    sheet = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f, (i * w, 0), f)
    sheet.save(path, "PNG")
    print(f"  ✓ {os.path.basename(path)}  ({len(frames)} frames, {sheet.size[0]}×{sheet.size[1]})")

# ── run animation (14 frames) ────────────────────────────────────────────────
print("Processing run animation…")
run_dir = f"{EXTRACT}/8eb78b07-Run"
run_files = sorted(f for f in os.listdir(run_dir) if f.startswith("Running looking forward"))
run_frames = []
for fname in run_files:
    img = Image.open(os.path.join(run_dir, fname)).convert("RGBA")
    img = clean_alpha(img)
    img = fit_frame(img, FW, FH)
    run_frames.append(img)
spritesheet(run_frames, f"{OUT}/marwan-run.png")

# ── jump animation (every 3rd of 75 = 25 frames) ─────────────────────────────
print("Processing jump animation…")
all_jump = {}
for dirname, rng in [("df50d9eb-Jump", range(28)),
                     ("11c4fe3e-Jump_2", range(28, 56)),
                     ("85fba972-Jump_3", range(56, 75))]:
    d = f"{EXTRACT}/{dirname}"
    for fname in os.listdir(d):
        if fname.startswith("jump_"):
            n = int(fname.replace("jump_", "").replace(".png", ""))
            all_jump[n] = os.path.join(d, fname)

jump_frames = []
for n in range(0, 75, 3):   # every 3rd → 25 frames
    img = Image.open(all_jump[n]).convert("RGBA")
    img = clean_alpha(img)
    img = fit_frame(img, FW, FH)
    jump_frames.append(img)
spritesheet(jump_frames, f"{OUT}/marwan-jump.png")

# ── backgrounds (copy as-is, they're already the right proportions) ──────────
print("Copying backgrounds…")
bg_src = f"{EXTRACT}/5959bd8a-BG"
bg_map = {
    "bg-sky.png":    "5.png",        # opaque sky – base layer
    "bg-shops.png":  "3.png",        # RGBA wedding shops
    "bg-street.png": "6.png",        # RGBA street buildings
    "bg-front.png":  "Front 1.png",  # RGBA ground decorations
    "menu-bg.png":   "5.png",
    "win-bg.png":    "3.png",
    "gameover-bg.png": "4.png",
}
for dest, src in bg_map.items():
    shutil.copy2(os.path.join(bg_src, src), os.path.join(OUT, dest))
    print(f"  ✓ {dest}")

# ── obstacle placeholders ────────────────────────────────────────────────────
print("Creating obstacle placeholders…")
obstacles = [
    ("obstacle-relative.png", (210, 60,  60), "قريب",   80, 100),
    ("obstacle-bills.png",    (230,160,  10), "فاتورة", 65,  55),
    ("obstacle-gossip.png",   (130, 50, 180), "نميمة",  90, 105),
    ("obstacle-traffic.png",  ( 40,110, 200), "سيارة",  110,115),
    ("obstacle-crowd.png",    (200,110,  30), "زحمة",   130, 95),
]
for fname, (r, g, b), label, w, h in obstacles:
    img = Image.new("RGBA", (w, h), (r, g, b, 230))
    draw = ImageDraw.Draw(img)
    draw.rectangle([1, 1, w-2, h-2], outline=(0, 0, 0, 255), width=2)
    img.save(os.path.join(OUT, fname))
    print(f"  ✓ {fname}")

# ── heart icons ──────────────────────────────────────────────────────────────
print("Creating UI icons…")
def draw_heart(filled):
    s = 40
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = (220, 50, 50, 255) if filled else (130, 130, 130, 180)
    d.ellipse([2, 8, 20, 26], fill=c)
    d.ellipse([20, 8, 38, 26], fill=c)
    d.polygon([(2, 20), (38, 20), (20, 38)], fill=c)
    return img

draw_heart(True).save(f"{OUT}/heart-full.png")
draw_heart(False).save(f"{OUT}/heart-empty.png")
print("  ✓ heart-full.png  ✓ heart-empty.png")

# ── coin spritesheet (6-frame spin) ──────────────────────────────────────────
CW = 36
coin_frames = []
for i in range(6):
    frame = Image.new("RGBA", (CW, CW), (0, 0, 0, 0))
    d = ImageDraw.Draw(frame)
    cx, cy, r = CW//2, CW//2, 16
    widths = [16, 11, 5, 2, 5, 11]
    xr = widths[i]
    if xr > 1:
        d.ellipse([cx-xr, cy-r, cx+xr, cy+r], fill=(255, 215, 0, 255),
                  outline=(180, 140, 0, 255), width=1)
        if xr > 5:
            d.text((cx, cy), "م", fill=(180, 130, 0, 255), anchor="mm")
    coin_frames.append(frame)
spritesheet(coin_frames, f"{OUT}/coin.png")

# ── wedding rings icon ────────────────────────────────────────────────────────
wi = Image.new("RGBA", (44, 36), (0, 0, 0, 0))
wd = ImageDraw.Draw(wi)
wd.ellipse([2, 8, 26, 32], outline=(255, 215, 0, 255), width=4)
wd.ellipse([18, 8, 42, 32], outline=(255, 215, 0, 255), width=4)
wi.save(f"{OUT}/wedding-icon.png")
print("  ✓ coin.png  ✓ wedding-icon.png")

print("\n✅  All assets ready in", OUT)
