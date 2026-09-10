import unittest
import os
from fastapi.testclient import TestClient

import app as app_module
from app import app

client = TestClient(app)

class TestV3ModularArchitecture(unittest.TestCase):

    def test_versioned_routes(self):
        # 1. Test /v1
        res_v1 = client.get("/v1")
        self.assertEqual(res_v1.status_code, 200)
        self.assertTrue("html" in res_v1.headers["content-type"])
        print("✓ /v1 route returns HTTP 200 (Legacy V1 preserved)")

        # 2. Test /v2
        res_v2 = client.get("/v2")
        self.assertEqual(res_v2.status_code, 200)
        self.assertTrue("html" in res_v2.headers["content-type"])
        print("✓ /v2 route returns HTTP 200 (Production V2 preserved)")

        # 3. Test /v3
        res_v3 = client.get("/v3")
        self.assertEqual(res_v3.status_code, 200)
        self.assertIn("Smart GovReport Hub V3", res_v3.text)
        self.assertIn("version-switcher-bar", res_v3.text)
        print("✓ /v3 route returns HTTP 200 (New V3 Modular active)")

        # 4. Test / (Root serves V3)
        res_root = client.get("/")
        self.assertEqual(res_root.status_code, 200)
        self.assertIn("Smart GovReport Hub V3", res_root.text)
        print("✓ / route successfully serves V3 as primary dashboard")

    def test_static_files_mounting(self):
        static_files = [
            "/static/css/modules_v3.css",
            "/static/js/db-adapter.js",
            "/static/js/image-compressor.js",
            "/static/js/voice-input.js",
            "/static/js/conflict-detector.js"
        ]
        for path in static_files:
            res = client.get(path)
            self.assertEqual(res.status_code, 200, f"Static asset {path} failed with {res.status_code}")
            self.assertGreater(len(res.text), 100)
            print(f"✓ Static mount verified: {path} (size: {len(res.text)} bytes)")

    def test_v3_ui_components(self):
        res = client.get("/v3")
        html = res.text

        # Check version switcher links
        self.assertIn('href="/v1"', html)
        self.assertIn('href="/v2"', html)
        self.assertIn('href="/v3"', html)

        # Check Voice Speech-to-text integration
        self.assertIn('window.SmartGovVoice.toggle', html)
        self.assertIn('fa-microphone', html)

        # Check Canvas Image Compression & Google Drive
        self.assertIn('SmartGovMedia.compressImage', html)
        self.assertIn('photo-compression-info', html)
        self.assertIn('gdrive-attachment-url', html)
        self.assertIn('applyDriveAttachment', html)

        # Check IndexedDB storage sync
        self.assertIn('window.SmartGovDB', html)
        self.assertIn('v3-quota-badge', html)

        print("✓ All V3 UI Components (Voice, Canvas Compressor, Drive, IndexedDB, Switcher) verified")

if __name__ == '__main__':
    unittest.main()
