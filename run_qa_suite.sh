#!/bin/bash
# ==============================================================================
# 🏛️ Smart GovReport Hub 2.5 - QA Multi-Agent Suite (1-Click Shell Launcher)
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Preferred venv
VENV_PY="/Users/Shared/my_ai_project/venv/bin/python"

if [ -f "$VENV_PY" ]; then
    PYTHON_CMD="$VENV_PY"
else
    PYTHON_CMD="python3"
fi

echo "=========================================================================="
echo "🚀 สตาร์ตการทดสอบระบบ Smart GovReport Hub 2.5 (QA Multi-Agent Unit)"
echo "   Python: $PYTHON_CMD"
echo "   Target Frontend: http://localhost:8085/"
echo "   Target Backend:  http://127.0.0.1:8086"
echo "   Database:        Docker PostgreSQL 5432"
echo "=========================================================================="

"$PYTHON_CMD" run_qa_suite.py "$@"
