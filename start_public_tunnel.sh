#!/bin/bash
# Smart GovReport Hub 2.5 - Quick Public Tunnel Launcher
# Developed for พี่แจ็ค (Mac M1)

PORT=${1:-8085}
echo "=========================================================="
echo "🚀 กำลังเปิด Tunnel เพื่อนำ Smart GovReport Hub ออกสู่อินเทอร์เน็ต (พอร์ต $PORT)..."
echo "=========================================================="

/opt/homebrew/bin/cloudflared tunnel --url http://localhost:$PORT
