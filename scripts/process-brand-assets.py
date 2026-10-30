#!/usr/bin/env python3
"""Remove only the connected white matte around AtbinYar artwork.

The parchment inside the rounded-square mark is intentionally preserved.
The 512px master is the single source for all generated platform icons.
"""
from collections import deque
from pathlib import Path
from PIL import Image

WHITE_MIN = 244
WHITE_CHROMA = 18
FRINGE_MIN = 185
FRINGE_CHROMA = 58


def luminance(pixel):
    r, g, b = pixel[:3]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def process(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    width, height = image.size
    if width != height:
        raise RuntimeError(f"{path}: expected square image, got {width}x{height}")

    pixels = list(image.getdata())
    count = width * height
    white = bytearray(count)

    for i, (r, g, b, a) in enumerate(pixels):
        # Transparent pixels are also flood-fill seeds: some source icons
        # already have transparent corners but still contain a white halo ring.
        if a == 0 or (min(r, g, b) >= WHITE_MIN and max(r, g, b) - min(r, g, b) <= WHITE_CHROMA):
            white[i] = 1

    # Flood-fill only from the outside edges. White details inside the artwork
    # are therefore untouched unless they are actually connected to the matte.
    queue = deque()
    for x in range(width):
        for y in (0, height - 1):
            i = y * width + x
            if white[i]:
                white[i] = 2
                queue.append(i)
    for y in range(height):
        for x in (0, width - 1):
            i = y * width + x
            if white[i]:
                white[i] = 2
                queue.append(i)

    while queue:
        i = queue.popleft()
        x, y = i % width, i // width
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if not (dx or dy):
                    continue
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    ni = ny * width + nx
                    if white[ni] == 1:
                        white[ni] = 2
                        queue.append(ni)

    removed = sum(1 for i, value in enumerate(white) if value == 2 and pixels[i][3] > 0)
    if removed == 0:
        # A fully transparent source with no connected white pixels is already clean.
        corners = [pixels[0][3], pixels[width - 1][3], pixels[-width][3], pixels[-1][3]]
        if all(alpha == 0 for alpha in corners):
            print(f"{path}: already clean; no connected white matte found")
            return
        raise RuntimeError(f"{path}: no connected white outer matte found; refusing destructive edits")

    output = list(pixels)
    for i, value in enumerate(white):
        if value == 2:
            r, g, b, _ = output[i]
            output[i] = (r, g, b, 0)

    # Decontaminate one-pixel near-white anti-aliasing fringe around the
    # transparent edge so it does not glow white on dark launchers.
    fringe_updates = 0
    for y in range(height):
        for x in range(width):
            i = y * width + x
            if white[i] == 2:
                continue
            r, g, b, a = pixels[i]
            if a == 0 or min(r, g, b) < FRINGE_MIN or max(r, g, b) - min(r, g, b) > FRINGE_CHROMA:
                continue

            neighbours = []
            touches_background = False
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if not (dx or dy):
                        continue
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < width and 0 <= ny < height):
                        touches_background = True
                        continue
                    ni = ny * width + nx
                    if white[ni] == 2:
                        touches_background = True
                    elif pixels[ni][3] > 0 and luminance(pixels[ni]) < 242:
                        neighbours.append(pixels[ni])

            if not touches_background or not neighbours:
                continue

            foreground = min(neighbours, key=luminance)
            ratios = []
            for observed, color in zip((r, g, b), foreground[:3]):
                denominator = 255 - color
                if denominator >= 12:
                    ratios.append(max(0.0, min(1.0, (255 - observed) / denominator)))
            if not ratios:
                continue
            ratios.sort()
            coverage = ratios[len(ratios) // 2]
            alpha = round(255 * coverage * foreground[3] / 255)
            if alpha < 8:
                output[i] = (r, g, b, 0)
            else:
                output[i] = (*foreground[:3], alpha)
            fringe_updates += 1

    result = Image.new("RGBA", (width, height))
    result.putdata(output)
    result.save(path, format="PNG", optimize=True)

    check = Image.open(path).convert("RGBA")
    corner_alpha = [check.getpixel(p)[3] for p in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1))]
    if any(alpha != 0 for alpha in corner_alpha):
        raise RuntimeError(f"{path}: validation failed; corner pixels are not transparent")
    print(f"{path}: removed {removed} matte pixels, cleaned {fringe_updates} fringe pixels; RGBA {width}x{height}")


root = Path(".")
master = root / "icon_512x512.png"
logo = root / "logo.png"

if master.exists():
    process(master)
    Image.open(master).convert("RGBA").save(logo, format="PNG", optimize=True)
    Image.open(master).convert("RGBA").resize((192, 192), Image.Resampling.LANCZOS).save(
        root / "icon_192x192.png", format="PNG", optimize=True
    )
elif logo.exists():
    process(logo)
else:
    raise RuntimeError("No AtbinYar icon master (icon_512x512.png or logo.png) was found.")
