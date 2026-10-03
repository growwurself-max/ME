import math
import os
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import VideoClip

WIDTH, HEIGHT = 1920, 1080
FPS = 30
DURATION = 5.0
OUTPUT_PATH = "public/intro.mp4"

os.makedirs("public", exist_ok=True)

# Color palette & furniture particle setup
COLORS = [
    (218, 165, 32),   # Luxury Gold
    (100, 149, 237),  # Sapphire Blue
    (240, 128, 128),  # Coral
    (220, 220, 220),  # Silk Silver
    (245, 120, 35)    # Mokshaa Orange
]

PARTICLES = []
NUM_PARTICLES = 50
random.seed(42)

for _ in range(NUM_PARTICLES):
    angle = random.uniform(0, 2 * math.pi)
    speed = random.uniform(400, 950)
    item_type = random.choice(["sofa", "chair", "bed", "table", "lamp"])
    PARTICLES.append({
        "angle": angle,
        "speed": speed,
        "type": item_type,
        "size": random.randint(28, 55),
        "color": random.choice(COLORS)
    })

def draw_furniture(draw, ftype, cx, cy, size, color):
    hw, hh = size / 2, size / 3
    if ftype == "sofa":
        draw.rounded_rectangle([cx - hw, cy - hh, cx + hw, cy + hh], radius=6, fill=color)
        draw.rounded_rectangle([cx - hw * 0.8, cy - hh * 1.5, cx + hw * 0.8, cy - hh * 0.2], radius=4, fill=color)
    elif ftype == "chair":
        draw.rounded_rectangle([cx - hw * 0.7, cy - hh, cx + hw * 0.7, cy + hh], radius=4, fill=color)
        draw.rectangle([cx - hw * 0.6, cy - hh * 1.6, cx + hw * 0.6, cy - hh * 0.3], fill=color)
    elif ftype == "bed":
        draw.rounded_rectangle([cx - hw * 1.2, cy - hh * 0.8, cx + hw * 1.2, cy + hh * 0.8], radius=5, fill=color)
        draw.rectangle([cx - hw * 1.1, cy - hh * 0.6, cx - hw * 0.4, cy + hh * 0.6], fill=(255, 255, 255))
    else:
        draw.ellipse([cx - hw * 0.8, cy - hw * 0.8, cx + hw * 0.8, cy + hw * 0.8], fill=color)

def make_frame(t):
    img = Image.new("RGBA", (WIDTH, HEIGHT), (12, 13, 16, 255))
    draw = ImageDraw.Draw(img)
    cx, cy = WIDTH // 2, HEIGHT // 2 - 40

    # 1. Falling bomb capsule (0.0s -> 1.8s)
    if t < 1.8:
        progress = t / 1.8
        drop_y = int(-100 + (cy + 100) * (progress ** 2.2))
        radius = 35 + int(5 * math.sin(t * 10))

        for r in range(radius + 40, radius, -8):
            alpha = int(40 * (1 - (r - radius) / 40))
            draw.ellipse([cx - r, drop_y - r, cx + r, drop_y + r], fill=(245, 140, 40, alpha))
        draw.ellipse([cx - radius, drop_y - radius, cx + radius, drop_y + radius], fill=(255, 180, 80))

    # 2. Explosion & Furniture scattering (1.8s -> 4.5s)
    if t >= 1.8:
        et = t - 1.8
        if et < 0.6:
            ring_rad = int(et * 1200)
            alpha = int(255 * (1.0 - et / 0.6))
            draw.ellipse([cx - ring_rad, cy - ring_rad, cx + ring_rad, cy + ring_rad],
                         outline=(255, 215, 120, alpha), width=max(1, int(15 * (1 - et / 0.6))))

        for p in PARTICLES:
            dist = p["speed"] * (1 - math.exp(-et * 1.8))
            px = cx + dist * math.cos(p["angle"])
            py = cy + dist * math.sin(p["angle"]) + (et ** 2 * 60)
            p_alpha = max(0, min(255, int(255 * (1 - (et / 3.0)))))
            if p_alpha > 0 and 0 <= px <= WIDTH and 0 <= py <= HEIGHT:
                draw_furniture(draw, p["type"], px, py, p["size"], (*p["color"], p_alpha))

    # 3. Logo & Brand Typography Reveal (2.5s -> 5.0s)
    if t >= 2.5:
        lt = min(1.0, (t - 2.5) / 1.2)
        logo_alpha = int(lt * 255)
        logo_scale = 0.8 + 0.2 * (1 - math.exp(-lt * 4))

        hex_s = int(90 * logo_scale)
        # Left facet (Sapphire Blue)
        draw.polygon([(cx, cy - hex_s), (cx - hex_s, cy - hex_s // 2), 
                      (cx - hex_s, cy + hex_s // 2), (cx, cy + hex_s)],
                     fill=(65, 80, 180, logo_alpha))
        # Right facet (Satin Orange)
        draw.polygon([(cx, cy - hex_s), (cx + hex_s, cy - hex_s // 2), 
                      (cx + hex_s, cy + hex_s // 2), (cx, cy + hex_s)],
                     fill=(245, 120, 35, logo_alpha))

        draw.line([(cx, cy - hex_s), (cx, cy + hex_s)], fill=(25, 28, 36, logo_alpha), width=6)

        text = "M O K S H A A   E N T E R P R I S E S"
        try:
            font = ImageFont.truetype("arial.ttf", int(34 * logo_scale))
        except IOError:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        text_y = cy + hex_s + 45
        draw.text((cx - tw // 2, text_y), text, font=font, fill=(245, 240, 230, logo_alpha))

    return np.array(img.convert("RGB"))

clip = VideoClip(make_frame, duration=DURATION)
clip.write_videofile(OUTPUT_PATH, fps=FPS, codec="libx264", audio=False)
print(f"✅ Video successfully created at {OUTPUT_PATH}")