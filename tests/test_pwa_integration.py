#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🧪 PWA Integration & Offline Verification Test - Smart GovReport Hub 2.5
ผู้พัฒนา: โค้ดเดอร์หลังบ้าน (5.5) & เซียน SA (5.2)
"""

import json
import os
import sys
from PIL import Image

def test_pwa():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print("==========================================================================")
    print("📱 Verifying Smart GovReport Hub 2.5 - Progressive Web App (PWA) Engine")
    print("==========================================================================")
    passed = 0
    total = 0

    def check(desc, cond):
        nonlocal passed, total
        total += 1
        if cond:
            passed += 1
            print(f"  ✅ [PASS] {desc}")
        else:
            print(f"  ❌ [FAIL] {desc}")

    # 1. Manifest verification
    manifest_path = os.path.join(base_dir, "manifest.json")
    check("manifest.json exists", os.path.isfile(manifest_path))
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        check("Manifest name is Smart GovReport Hub 2.5", "Smart GovReport Hub" in manifest.get("name", ""))
        check("Manifest short_name is GovReport", manifest.get("short_name") == "GovReport")
        check("Manifest display is standalone", manifest.get("display") == "standalone")
        check("Manifest start_url is ./index.html", manifest.get("start_url") == "./index.html")
        check("Manifest theme_color is #1B365D", manifest.get("theme_color") == "#1B365D")
        check("Manifest background_color is #F8FAFC", manifest.get("background_color") == "#F8FAFC")
        icons = manifest.get("icons", [])
        check("Manifest contains >= 4 icons", len(icons) >= 4)
        purposes = [i.get("purpose") for i in icons]
        check("Manifest contains maskable icon", "maskable" in purposes)
        shortcuts = manifest.get("shortcuts", [])
        check("Manifest has quick shortcuts", len(shortcuts) >= 2)
    except Exception as e:
        check(f"Manifest JSON parsing: {e}", False)

    # 2. Service Worker verification
    sw_path = os.path.join(base_dir, "sw.js")
    check("sw.js exists at project root", os.path.isfile(sw_path))
    try:
        with open(sw_path, "r", encoding="utf-8") as f:
            sw_code = f.read()
        check("sw.js defines cache version", "CACHE_NAME" in sw_code)
        check("sw.js handles install event with skipWaiting", "install" in sw_code and "skipWaiting" in sw_code)
        check("sw.js handles activate event with clients.claim", "activate" in sw_code and "clients.claim" in sw_code)
        check("sw.js handles fetch event with offline fallback", "fetch" in sw_code and "offline" in sw_code)
        check("sw.js precaches 15-pwa-manager.js", "15-pwa-manager.js" in sw_code)
        check("sw.js precaches core css files", "custom.css" in sw_code and "print-a4.css" in sw_code)
    except Exception as e:
        check(f"sw.js inspection: {e}", False)

    # 3. PWA Manager Module verification
    pwa_module_path = os.path.join(base_dir, "js", "modules", "15-pwa-manager.js")
    check("15-pwa-manager.js exists", os.path.isfile(pwa_module_path))
    try:
        with open(pwa_module_path, "r", encoding="utf-8") as f:
            pwa_code = f.read()
        check("PWA Manager registers serviceWorker", "serviceWorker.register" in pwa_code)
        check("PWA Manager handles beforeinstallprompt", "beforeinstallprompt" in pwa_code)
        check("PWA Manager handles standalone detection", "display-mode: standalone" in pwa_code)
        check("PWA Manager monitors online/offline network events", "window.addEventListener('online'" in pwa_code)
        check("PWA Manager provides clearCacheAndReload", "clearCacheAndReload" in pwa_code)
    except Exception as e:
        check(f"15-pwa-manager.js inspection: {e}", False)

    # 4. High-Res Icons verification with PIL
    icons_dir = os.path.join(base_dir, "static", "icons")
    icon_checks = [
        ("icon-192.png", 192, 192),
        ("icon-512.png", 512, 512),
        ("icon-maskable-192.png", 192, 192),
        ("icon-maskable-512.png", 512, 512),
        ("apple-touch-icon.png", 180, 180),
    ]
    for filename, w, h in icon_checks:
        filepath = os.path.join(icons_dir, filename)
        if os.path.isfile(filepath):
            with Image.open(filepath) as img:
                check(f"Icon {filename} size matches {w}x{h}", img.size == (w, h))
        else:
            check(f"Icon {filename} exists", False)

    check("favicon.ico exists", os.path.isfile(os.path.join(icons_dir, "favicon.ico")))
    check("icon.svg exists and non-empty", os.path.isfile(os.path.join(icons_dir, "icon.svg")) and os.path.getsize(os.path.join(icons_dir, "icon.svg")) > 0)

    # 5. index.html PWA tags verification
    index_path = os.path.join(base_dir, "index.html")
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            index_html = f.read()
        check("index.html has <link rel=\"manifest\" href=\"manifest.json\">", '<link rel="manifest" href="manifest.json">' in index_html)
        check("index.html has theme-color #1B365D", '<meta name="theme-color" content="#1B365D">' in index_html)
        check("index.html has mobile-web-app-capable", '<meta name="mobile-web-app-capable" content="yes">' in index_html)
        check("index.html has apple-touch-icon", '<link rel="apple-touch-icon" href="static/icons/apple-touch-icon.png">' in index_html)
        check("index.html contains #btn-pwa-install", 'id="btn-pwa-install"' in index_html)
        check("index.html contains #pwa-network-badge", 'id="pwa-network-badge"' in index_html)
        check("index.html loads 15-pwa-manager.js", 'src="js/modules/15-pwa-manager.js"' in index_html)
        check("index.html contains #pwa-install-guide-modal", 'id="pwa-install-guide-modal"' in index_html)
    except Exception as e:
        check(f"index.html inspection: {e}", False)

    # 6. secure_dev_server.py CSP & PWA headers verification
    server_path = os.path.join(base_dir, "secure_dev_server.py")
    try:
        with open(server_path, "r", encoding="utf-8") as f:
            srv_code = f.read()
        check("secure_dev_server.py CSP allows worker-src 'self' blob:;", "worker-src 'self' blob:;" in srv_code)
        check("secure_dev_server.py includes Service-Worker-Allowed header", "Service-Worker-Allowed" in srv_code)
        check("secure_dev_server.py handles manifest MIME type", "application/manifest+json" in srv_code)
    except Exception as e:
        check(f"secure_dev_server.py inspection: {e}", False)

    print("==========================================================================")
    print(f"🎯 PWA Verification Score: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    print("==========================================================================")
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(test_pwa())
