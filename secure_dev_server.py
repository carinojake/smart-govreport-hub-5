#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔒 Secure Dev Server - Smart GovReport Hub 2.5
พัฒนาโดย: โค้ดเดอร์หลังบ้าน (5.5) & การ์ด Sec (5.3)
คุณสมบัติ:
1. บังคับ Bind เฉพาะ 127.0.0.1 (Localhost Only ป้องกันการแอบเข้าถึงจากคนในวง LAN)
2. ปิดกั้นการเข้าถึงโฟลเดอร์เสี่ยง: /.git, /backend, /.env, /1_CLICK_START (ส่ง 403 Forbidden)
3. ฝัง Security Headers (X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy)
"""

import os
import sys
import http.server
import socketserver

PORT = int(os.getenv("FRONTEND_PORT", 8085))
BIND_HOST = "127.0.0.1"
PROJECT_DIR = os.path.abspath(os.path.dirname(__file__))

FORBIDDEN_PATTERNS = [
    "/.git",
    "/backend",
    "/.env",
    "/1_CLICK_START",
    "/test_v2_5_standalone_suite.py"
]

class SecureGovHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)

    def end_headers(self):
        # ฝัง Security Headers มาตรฐานความปลอดภัยภาครัฐ
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval';"
        )
        super().end_headers()

    def do_GET(self):
        clean_path = self.path.split("?")[0].split("#")[0]
        for pattern in FORBIDDEN_PATTERNS:
            if clean_path.startswith(pattern) or f"{pattern}/" in clean_path:
                self.send_error(403, "Forbidden: Access to system directory is blocked by Security Guard")
                return

        # ตรวจจับและบล็อก Hidden Files (ขึ้นต้นด้วยจุด เช่น .DS_Store, .gitignore)
        path_parts = clean_path.strip("/").split("/")
        if any(part.startswith(".") for part in path_parts if part):
            self.send_error(403, "Forbidden: Hidden file access is prohibited")
            return

        super().do_GET()

    def do_HEAD(self):
        clean_path = self.path.split("?")[0].split("#")[0]
        for pattern in FORBIDDEN_PATTERNS:
            if clean_path.startswith(pattern) or f"{pattern}/" in clean_path:
                self.send_error(403, "Forbidden")
                return
        super().do_HEAD()

    def log_message(self, format, *args):
        sys.stderr.write(f"🔒 [SecureServer:8085] {self.address_string()} - {format % args}\n")

def main():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((BIND_HOST, PORT), SecureGovHTTPHandler) as httpd:
        print(f"🔒 [Secure Dev Server] กำลังทำงานที่ http://{BIND_HOST}:{PORT}/")
        print(f"   โฟลเดอร์ที่ให้บริการ: {PROJECT_DIR}")
        print(f"   การป้องกัน: บล็อก /.git, /backend, /.env และใส่ Security Headers อัตโนมัติ")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 หยุดการทำงานของ Secure Dev Server เรียบร้อยแล้ว")

if __name__ == "__main__":
    main()
