import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"
# Vercel Serverless environment: /tmp is the only writable filesystem
if os.getenv("VERCEL"):
    DATABASE_PATH = Path("/tmp/edubuddy.db")
    seed_db = BASE_DIR / "edubuddy.db"
    if seed_db.exists() and not DATABASE_PATH.exists():
        import shutil
        try:
            shutil.copyfile(seed_db, DATABASE_PATH)
        except Exception:
            pass
else:
    DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "edubuddy.db")))

# Load local development secrets from .env when python-dotenv is installed.
# In Cloud Run, configure environment variables / Secret Manager instead.
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / ".env", override=False)
except ImportError:
    pass

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

DEFAULT_GEMINI_KEY = "AQ.Ab8RN6KulPJ0FlBQmGP90qb8UAjSJTbtyQKE0Dl5b3HSmBVEhA"
DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip() or DEFAULT_GEMINI_KEY
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "").strip() or DEFAULT_GEMINI_MODEL
GEMINI_TIMEOUT = int(os.getenv("GEMINI_TIMEOUT", "45"))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

def set_gemini_credentials(api_key: str, model: str = None):
    global GEMINI_API_KEY, GEMINI_MODEL
    GEMINI_API_KEY = (api_key or "").strip()
    if model:
        GEMINI_MODEL = model.strip()
    elif not GEMINI_MODEL:
        GEMINI_MODEL = DEFAULT_GEMINI_MODEL
    os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
    os.environ["GEMINI_MODEL"] = GEMINI_MODEL

APP_TITLE = "EduBuddy Aura - AI Student Learning Platform"
APP_VERSION = "1.0.0"
APP_DESCRIPTION = (
    "Interactive learning platform that helps students simplify difficult concepts, "
    "improve understanding, and accelerate mastery through AI-powered assistance."
)
