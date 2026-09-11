#!/usr/bin/env python3
"""
==============================================================================
Antigravity 2.0 - GitHub & Gemini Intelligent Bridge
ศูนย์บัญชาการเชื่อมโยง GitHub (Repo) + Gemini (AI Core) + Antigravity (Agent Hub)
สำหรับ: พี่แจ็ค (Jake) - โครงการ Smart GovReport Hub 2.5
==============================================================================
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: ไม่พบ GEMINI_API_KEY ใน Environment Variables", file=sys.stderr)
        print("กรุณาตั้งค่า: export GEMINI_API_KEY='your_api_key'", file=sys.stderr)
        sys.exit(1)
    
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except ImportError:
        print("❌ Error: ไม่พบไลบรารี google-genai กรุณาติดตั้งผ่าน pip install google-genai", file=sys.stderr)
        sys.exit(1)

def get_git_diff(target="HEAD~1"):
    try:
        cmd = ["git", "diff", target, "--stat", "-p"]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout[:15000] # limit context window
    except subprocess.CalledProcessError:
        return ""

def review_code_with_gemini(client, diff_text):
    prompt = f"""
คุณคือ เซียน SA (5.2) และ โค้ดเดอร์หลังบ้าน (5.5) ในระบบ Google Antigravity 2.0
โปรดวิเคราะห์ Git Diff ต่อไปนี้ และจัดทำรายงานสรุป Code Review & Security Audit:
1. การเปลี่ยนแปลงสำคัญ (Key Changes)
2. ผลกระทบต่อความปลอดภัย (PDPA, RBAC, Data Sanitization)
3. ข้อเสนอแนะในการปรับปรุง (Performance, Cost-effectiveness บน Mac M1)

Git Diff:
{diff_text}
"""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text

def main():
    parser = argparse.ArgumentParser(description="Antigravity-GitHub-Gemini Bridge")
    parser.add_argument("--review", action="store_true", help="รัน AI Code Review ด้วย Gemini จาก Git Diff ล่าสุด")
    parser.add_argument("--status", action="store_true", help="ตรวจสอบสถานะการเชื่อมต่อทั้ง 3 ระบบ")
    args = parser.parse_args()

    print("=" * 70)
    print("🏛️ Antigravity 2.0 ⟷ GitHub ⟷ Gemini Integration Bridge")
    print("=" * 70)

    if args.status or len(sys.argv) == 1:
        # Check GitHub CLI
        gh_status = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True)
        print("1. 🐙 GitHub Connection:")
        if gh_status.returncode == 0:
            print("   ✅ GitHub CLI Logged in (Account: carinojake)")
        else:
            print("   ⚠️ GitHub CLI: Not logged in or error")

        # Check Gemini
        print("\n2. 🧠 Gemini AI Connection:")
        client = get_gemini_client()
        try:
            res = client.models.generate_content(model="gemini-2.5-flash", contents="Ping: respond with 'Gemini Online'")
            print(f"   ✅ Gemini API Active (Response: {res.text.strip()})")
        except Exception as e:
            print(f"   ❌ Gemini API Error: {e}")

        # Check Antigravity Workspace
        print("\n3. 🎯 Antigravity Workspace:")
        print(f"   ✅ Workspace Root: {Path.cwd()}")
        print(f"   ✅ Target Repository: https://github.com/carinojake/smart-govreport-hub-2.5")
        print("=" * 70)

    if args.review:
        print("\n🔍 กำลังดึง Git Diff ล่าสุดเพื่อส่งให้ Gemini วิเคราะห์...")
        diff = get_git_diff()
        if not diff:
            print("ℹ️ ไม่พบ Git Diff ล่าสุด หรือไม่มีการแก้ไขที่ตรวจพบ")
            return
        client = get_gemini_client()
        print("🤖 กำลังวิเคราะห์ผ่าน Gemini 2.5 Flash...")
        review = review_code_with_gemini(client, diff)
        print("\n" + "-" * 70)
        print("📝 ผลการวิเคราะห์จาก Gemini:")
        print("-" * 70)
        print(review)
        print("-" * 70)

if __name__ == "__main__":
    main()
