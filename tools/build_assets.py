#!/usr/bin/env python3
"""Rebuild all game-ready assets from the raw uploaded art (v2 redesign).

Character: bigger, crisper frames (140x188) from the dynamic `2_*` run set,
with half the frames for a faster stride. Backgrounds are composed at their
native pixel scale with aligned baselines so the map layers stack correctly:

  sky (day + sunset crossfade)  ->  buildings (shops, + wedding street for
  the finale)  ->  sidewalk strip the player actually runs on.
"""
from PIL import Image
import os
import numpy as np

RAW = '/tmp/assets_preview'
BG  = f'{RAW}/5959bd8a-BG/BG'
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')

FW, FH = 140, 188   # character frame (560x752 / 4 — exact ratio)


def clean_alpha(img, threshold=15):
    img = img.convert('RGBA')
    r, g, b, a = img.split()
    a = a.point(lambda v: 0 if v <= threshold else v)
    return Image.merge('RGBA', (r, g, b, a))


def sheet(frames, path):
    w, h = frames[0].size
    s = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        s.paste(f, (i * w, 0), f)
    s.save(path)
    print(f'  {os.path.basename(path)}: {len(frames)} frames {s.size}')


# ── character ───────────────────────────────────────────────────────────────

def build_character():
    run_dir = f'{RAW}/8eb78b07-Run/Run'
    # dynamic side-view set, every 2nd frame -> snappier, faster-looking stride
    frames = []
    for i in range(0, 16, 2):
        img = clean_alpha(Image.open(f'{run_dir}/2_{i:05d}.png'))
        frames.append(img.resize((FW, FH), Image.LANCZOS))
    sheet(frames, f'{OUT}/marwan-run.png')

    # jump: 75 raw frames across three archives, take every 5th
    jump_files = []
    for d in ('df50d9eb-Jump/Jump', '11c4fe3e-Jump_2/Jump 2', '85fba972-Jump_3/Jump 3'):
        full = f'{RAW}/{d}'
        jump_files += sorted(os.path.join(full, f) for f in os.listdir(full))
    frames = []
    for p in jump_files[::5]:
        img = clean_alpha(Image.open(p))
        frames.append(img.resize((FW, FH), Image.LANCZOS))
    sheet(frames, f'{OUT}/marwan-jump.png')


# ── backgrounds ─────────────────────────────────────────────────────────────

def build_skies():
    for src, name in (('4.png', 'bg-sky-day.png'), ('2.png', 'bg-sky-sunset.png')):
        img = Image.open(f'{BG}/{src}').convert('RGB').resize((2172, 720), Image.LANCZOS)
        img.save(f'{OUT}/{name}')
        print(f'  {name}: {img.size}')


def build_buildings():
    a = Image.open(f'{BG}/6.png').convert('RGBA')
    b = Image.open(f'{BG}/3.png').convert('RGBA')
    s = Image.new('RGBA', (a.width + b.width, 724), (0, 0, 0, 0))
    s.paste(a, (0, 0), a)
    s.paste(b, (a.width, 0), b)
    s.save(f'{OUT}/bg-buildings.png')
    print(f'  bg-buildings.png: {s.size}')

    w = Image.open(f'{BG}/1.png').convert('RGBA')
    w.save(f'{OUT}/bg-wedding.png')
    print(f'  bg-wedding.png: {w.size}')


def build_sidewalk():
    f1 = Image.open(f'{BG}/Front 1.png').convert('RGBA')
    f2 = Image.open(f'{BG}/Front 2.png').convert('RGBA')

    # erase the baked-in pedestrian (cols ~1841-1908) using the clean
    # pavement right next to him
    src = f1.crop((1912, 0, 1994, 724))
    f1.paste(src, (1833, 0))

    # Front 2's pavement top sits 43px higher (row 526 vs 569) — shift it
    # down so the sidewalk surface is one continuous line
    f2s = Image.new('RGBA', (f2.width, 724), (0, 0, 0, 0))
    f2s.paste(f2, (0, 43), f2)

    s = Image.new('RGBA', (f1.width + f2.width, 724), (0, 0, 0, 0))
    s.paste(f1, (0, 0), f1)
    s.paste(f2s, (f1.width, 0), f2s)

    # keep rows 200..724: all props (lamppost tops) + pavement + under-ledge
    s = s.crop((0, 200, s.width, 724))
    s.save(f'{OUT}/bg-sidewalk.png')
    # pavement surface row inside this crop: 569 - 200 = 369
    print(f'  bg-sidewalk.png: {s.size} (pavement top at row 369)')


def cleanup_old():
    for n in ('bg-sky.png', 'bg-shops.png', 'bg-street.png', 'bg-front.png'):
        p = f'{OUT}/{n}'
        if os.path.exists(p):
            os.remove(p)
            print(f'  removed {n}')


if __name__ == '__main__':
    print('character…');  build_character()
    print('skies…');      build_skies()
    print('buildings…');  build_buildings()
    print('sidewalk…');   build_sidewalk()
    print('cleanup…');    cleanup_old()
    print('done.')
