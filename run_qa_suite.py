#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🏛️ 1-Click QA Multi-Agent Suite Runner
คำสั่งรันชุดทดสอบระดับ Full Option ของ Smart GovReport Hub 2.5
รองรับทั้งการสั่งรันราย Agent (1..4) หรือสั่งรันพร้อมกันแบบคู่ขนาน (Parallel All)
"""

import sys
import os
import asyncio
import argparse
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from tests.qa_agents.qa_orchestrator import QAOrchestrator

def main():
    parser = argparse.ArgumentParser(
        description="Smart GovReport Hub 2.5 - QA Multi-Agent Suite Runner"
    )
    parser.add_argument(
        "--agent", 
        type=int, 
        choices=[1, 2, 3, 4, 5, 6], 
        help="ระบุหมายเลข Agent ที่ต้องการรันเดี่ยว (1: E2E UI, 2: Concurrency DB, 3: PDPA Security, 4: WCAG A4, 5: OJT 90h Logbook, 6: Senior QA 13 Cases)"
    )
    parser.add_argument(
        "--all", 
        action="store_true", 
        default=True,
        help="รันทุก Agent พร้อมกันแบบคู่ขนาน (Default: True)"
    )

    args = parser.parse_args()
    orchestrator = QAOrchestrator()

    if args.agent:
        asyncio.run(orchestrator.run_agent(args.agent))
    else:
        asyncio.run(orchestrator.run_all())

if __name__ == "__main__":
    main()
