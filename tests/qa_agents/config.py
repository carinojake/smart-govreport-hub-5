"""
🏛️ QA Multi-Agent Unit - Central Configuration
Smart GovReport Hub 2.5 (PostgreSQL 5432 + Modular Frontend)
"""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
EVIDENCE_DIR = BASE_DIR / "docs" / "deliverables" / "03_System_Testing_and_QA_Report" / "evidence"
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR = BASE_DIR / "docs" / "deliverables" / "03_System_Testing_and_QA_Report"

# Target Services
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8085/")
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8086")

# Docker PostgreSQL 5432 Configuration
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", 5432))
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "postgres")
PG_DATABASE = os.getenv("PG_DATABASE", "smartgov_v25")
PG_TEST_DATABASE = os.getenv("PG_TEST_DATABASE", "smartgov_test")

# Test Thresholds & SLAs
MAX_API_LATENCY_MS = 500.0  # SLA < 500ms under heavy Multi-Agent concurrent burst load
CONCURRENT_USERS_TARGET = 50
WCAG_CONTRAST_RATIO_MIN = 4.5  # WCAG 2.1 AA requirement for normal text
A4_MARGIN_LEFT_CM = 3.0
A4_MARGIN_RIGHT_CM = 2.0
GARUDA_HEIGHT_CM = 3.0
