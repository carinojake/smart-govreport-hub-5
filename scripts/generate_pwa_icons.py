#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎨 PWA High-Res Icon Generator - Smart GovReport Hub 2.5
สร้างชุดไอคอน PWA ทั้งหมด:
- static/icons/icon-192.png
- static/icons/icon-512.png
- static/icons/icon-maskable-192.png
- static/icons/icon-maskable-512.png
- static/icons/apple-touch-icon.png (180x180)
- static/icons/favicon.ico
- static/icons/icon.svg
"""

import os
from PIL import Image, ImageDraw

ICONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

# SVG Icon
SVG_CONTENT = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGovGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1B365D" />
      <stop offset="100%" stop-color="#0F2038" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F2D07C" />
      <stop offset="100%" stop-color="#C5A059" />
    </linearGradient>
  </defs>
  <!-- Background Shield/Rounded Rect -->
  <rect width="512" height="512" rx="115" fill="url(#bgGovGrad)" />
  <circle cx="256" cy="256" r="210" fill="none" stroke="url(#goldGrad)" stroke-width="8" opacity="0.4" />
  
  <!-- Scales of Justice Emblem -->
  <!-- Central Pillar -->
  <path d="M256 100 L256 390" stroke="url(#goldGrad)" stroke-width="18" stroke-linecap="round" />
  <circle cx="256" cy="90" r="22" fill="url(#goldGrad)" />
  <path d="M190 390 L322 390" stroke="url(#goldGrad)" stroke-width="20" stroke-linecap="round" />
  
  <!-- Balance Beam -->
  <path d="M130 160 Q256 145 382 160" fill="none" stroke="url(#goldGrad)" stroke-width="16" stroke-linecap="round" />
  <circle cx="130" cy="160" r="12" fill="url(#goldGrad)" />
  <circle cx="382" cy="160" r="12" fill="url(#goldGrad)" />
  
  <!-- Left Scale Pan -->
  <path d="M130 160 L80 260 L180 260 Z" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round" opacity="0.9" />
  <path d="M70 260 Q130 295 190 260 Z" fill="url(#goldGrad)" />
  
  <!-- Right Scale Pan -->
  <path d="M382 160 L332 260 L432 260 Z" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round" opacity="0.9" />
  <path d="M322 260 Q382 295 442 260 Z" fill="url(#goldGrad)" />
  
  <!-- Modern Spark / Tech Dot -->
  <circle cx="256" cy="205" r="10" fill="#FFFFFF" />
  <text x="256" y="445" font-family="'Prompt', 'Sarabun', sans-serif" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">GOVREPORT</text>
</svg>
"""

with open(os.path.join(ICONS_DIR, "icon.svg"), "w", encoding="utf-8") as f:
    f.write(SVG_CONTENT)

def draw_gov_icon(size, is_maskable=False):
    # Supersampling 2x for ultra smooth curves
    scale = 2
    actual_size = size * scale
    img = Image.new("RGBA", (actual_size, actual_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    navy_bg = (27, 54, 93, 255)
    gold = (197, 160, 89, 255)
    gold_light = (242, 208, 124, 255)
    white = (255, 255, 255, 255)
    white_trans = (255, 255, 255, 200)

    if is_maskable:
        # Full bleed background for maskable icons (Android adapts shape)
        draw.rectangle([0, 0, actual_size, actual_size], fill=navy_bg)
        # Scale content down slightly to fit inside the safe zone (80% diameter)
        margin = int(actual_size * 0.12)
    else:
        # Beautiful rounded rect
        corner_radius = int(actual_size * 0.22)
        draw.rounded_rectangle([0, 0, actual_size, actual_size], radius=corner_radius, fill=navy_bg)
        margin = int(actual_size * 0.05)

    # Content dimensions
    cx = actual_size // 2
    cy = actual_size // 2 - int(actual_size * 0.03)
    content_w = actual_size - (margin * 2)

    # Decorative circle
    circle_r = int(content_w * 0.42)
    draw.ellipse([cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r], outline=gold, width=max(2, int(6 * scale * size / 512)))

    # Central Pillar
    pillar_top = cy - int(content_w * 0.32)
    pillar_bottom = cy + int(content_w * 0.30)
    p_w = max(3, int(16 * scale * size / 512))
    draw.line([cx, pillar_top, cx, pillar_bottom], fill=gold, width=p_w)
    
    # Pillar finial
    finial_r = max(4, int(18 * scale * size / 512))
    draw.ellipse([cx - finial_r, pillar_top - finial_r, cx + finial_r, pillar_top + finial_r], fill=gold_light)

    # Base
    base_w = int(content_w * 0.28)
    base_y = pillar_bottom
    b_thickness = max(4, int(16 * scale * size / 512))
    draw.line([cx - base_w // 2, base_y, cx + base_w // 2, base_y], fill=gold, width=b_thickness)

    # Balance beam
    beam_y = cy - int(content_w * 0.18)
    beam_span = int(content_w * 0.62)
    left_x = cx - beam_span // 2
    right_x = cx + beam_span // 2
    beam_w = max(3, int(14 * scale * size / 512))
    draw.line([left_x, beam_y, right_x, beam_y], fill=gold, width=beam_w)

    pivot_r = max(3, int(11 * scale * size / 512))
    draw.ellipse([left_x - pivot_r, beam_y - pivot_r, left_x + pivot_r, beam_y + pivot_r], fill=gold_light)
    draw.ellipse([right_x - pivot_r, beam_y - pivot_r, right_x + pivot_r, beam_y + pivot_r], fill=gold_light)

    # Pans
    pan_drop = int(content_w * 0.22)
    pan_w = int(content_w * 0.22)
    cord_w = max(1, int(4 * scale * size / 512))

    # Left pan cords & basin
    draw.line([left_x, beam_y, left_x - pan_w // 2, beam_y + pan_drop], fill=white_trans, width=cord_w)
    draw.line([left_x, beam_y, left_x + pan_w // 2, beam_y + pan_drop], fill=white_trans, width=cord_w)
    draw.chord([left_x - pan_w // 2, beam_y + pan_drop - int(pan_w * 0.2), left_x + pan_w // 2, beam_y + pan_drop + int(pan_w * 0.35)], start=0, end=180, fill=gold, outline=gold_light)

    # Right pan cords & basin
    draw.line([right_x, beam_y, right_x - pan_w // 2, beam_y + pan_drop], fill=white_trans, width=cord_w)
    draw.line([right_x, beam_y, right_x + pan_w // 2, beam_y + pan_drop], fill=white_trans, width=cord_w)
    draw.chord([right_x - pan_w // 2, beam_y + pan_drop - int(pan_w * 0.2), right_x + pan_w // 2, beam_y + pan_drop + int(pan_w * 0.35)], start=0, end=180, fill=gold, outline=gold_light)

    # Center jewel / spark
    jewel_r = max(2, int(8 * scale * size / 512))
    draw.ellipse([cx - jewel_r, cy - jewel_r, cx + jewel_r, cy + jewel_r], fill=white)

    # Downsample with high-quality Lanczos filter
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

# Generate icons
icon_192 = draw_gov_icon(192, is_maskable=False)
icon_192.save(os.path.join(ICONS_DIR, "icon-192.png"), "PNG")

icon_512 = draw_gov_icon(512, is_maskable=False)
icon_512.save(os.path.join(ICONS_DIR, "icon-512.png"), "PNG")

icon_maskable_192 = draw_gov_icon(192, is_maskable=True)
icon_maskable_192.save(os.path.join(ICONS_DIR, "icon-maskable-192.png"), "PNG")

icon_maskable_512 = draw_gov_icon(512, is_maskable=True)
icon_maskable_512.save(os.path.join(ICONS_DIR, "icon-maskable-512.png"), "PNG")

apple_icon = draw_gov_icon(180, is_maskable=False)
apple_icon.save(os.path.join(ICONS_DIR, "apple-touch-icon.png"), "PNG")

# Favicon (includes 16, 32, 48)
favicon_img = draw_gov_icon(48, is_maskable=False)
favicon_img.save(
    os.path.join(ICONS_DIR, "favicon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)]
)

print("✅ [PWA Icon Generator] All high-res icons generated successfully in static/icons/")
