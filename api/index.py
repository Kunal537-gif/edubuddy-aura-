import sys
import os
import shutil
from pathlib import Path

# Add project root to path for Vercel Serverless
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Ensure writable database in /tmp for Vercel serverless environment
if os.getenv("VERCEL") or not os.access(str(BASE_DIR), os.W_OK):
    os.environ["DATABASE_PATH"] = "/tmp/edubuddy.db"
    tmp_db = Path("/tmp/edubuddy.db")
    seed_db = BASE_DIR / "edubuddy.db"
    if seed_db.exists() and not tmp_db.exists():
        try:
            shutil.copyfile(seed_db, tmp_db)
        except Exception:
            pass

from backend.app import app
