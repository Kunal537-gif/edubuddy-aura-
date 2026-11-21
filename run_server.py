import sys
import os
import socket
import webbrowser
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

def find_available_port(start_port=8000, max_attempts=20):
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port

if __name__ == "__main__":
    import uvicorn
    from backend.database import init_db
    from backend.seed_data import seed_initial_data

    # Initialize SQLite database and seed initial topics
    print("=" * 65)
    print("  🚀 EDUBUDDY AURA — AI STUDENT LEARNING PLATFORM")
    print("=" * 65)
    print("[1/3] Initializing SQLite database schema...")
    init_db()
    print("[2/3] Seeding high-yield STEM & Humanities concepts...")
    seed_initial_data()

    port = int(os.getenv("PORT", str(find_available_port(8000))))
    host = os.getenv("HOST", "0.0.0.0")
    url = f"http://{host}:{port}" if host != "0.0.0.0" else f"http://127.0.0.1:{port}"

    print(f"[3/3] Starting web server on {host}:{port}")
    print("=" * 65)
    print(f"  👉 Dashboard is live at: {url}")
    print("  Press Ctrl+C to stop the server anytime.")
    print("=" * 65)

    uvicorn.run(
        "backend.app:app",
        host=host,
        port=port,
        log_level="info"
    )
