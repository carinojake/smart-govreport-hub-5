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
        # ฝัง Security Headers มาตรฐานความปลอดภัยภาครัฐ และรองรับ PWA
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:8086 http://127.0.0.1:8086 ws: wss: https:; worker-src 'self' blob:;"
        )
        if hasattr(self, 'path') and self.path.split("?")[0].endswith("sw.js"):
            self.send_header("Service-Worker-Allowed", "/")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def guess_type(self, path):
        if path.endswith("manifest.json") or path.endswith(".webmanifest"):
            return "application/manifest+json"
        if path.endswith(".svg"):
            return "image/svg+xml"
        return super().guess_type(path)

    def _proxy_to_backend(self, method):
        import urllib.request
        import urllib.error
        url = f"http://127.0.0.1:8086{self.path}"
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        skip_headers = {"host", "content-length", "connection", "transfer-encoding"}
        req_headers = {k: v for k, v in self.headers.items() if k.lower() not in skip_headers}

        req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                self.send_response(resp.status)
                for k, v in resp.getheaders():
                    if k.lower() not in {"transfer-encoding", "content-length", "connection"}:
                        self.send_header(k, v)
                resp_body = resp.read()
                self.send_header("Content-Length", str(len(resp_body)))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "*")
                self.end_headers()
                self.wfile.write(resp_body)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for k, v in e.headers.items():
                if k.lower() not in {"transfer-encoding", "content-length", "connection"}:
                    self.send_header(k, v)
            err_body = e.read()
            self.send_header("Content-Length", str(len(err_body)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(err_body)
        except Exception as err:
            self.send_error(502, f"Bad Gateway to Backend Port 8086: {err}")

    def do_GET(self):
        clean_path = self.path.split("?")[0].split("#")[0]
        if clean_path.startswith("/api"):
            self._proxy_to_backend("GET")
            return

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

    def do_POST(self):
        clean_path = self.path.split("?")[0].split("#")[0]
        if clean_path.startswith("/api"):
            self._proxy_to_backend("POST")
            return
        self.send_error(405, "Method Not Allowed")

    def do_PUT(self):
        clean_path = self.path.split("?")[0].split("#")[0]
        if clean_path.startswith("/api"):
            self._proxy_to_backend("PUT")
            return
        self.send_error(405, "Method Not Allowed")

    def do_DELETE(self):
        clean_path = self.path.split("?")[0].split("#")[0]
        if clean_path.startswith("/api"):
            self._proxy_to_backend("DELETE")
            return
        self.send_error(405, "Method Not Allowed")

    def do_OPTIONS(self):
        clean_path = self.path.split("?")[0].split("#")[0]
        if clean_path.startswith("/api"):
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "*")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_response(200)
        self.end_headers()

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
