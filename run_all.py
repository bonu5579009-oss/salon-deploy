import os
import subprocess
import sys
import time
import threading

def run_backend():
    print("Starting Backend (uvicorn)...")
    port = os.getenv("PORT", "10000")
    # Use single worker to save RAM on free tier
    proc = subprocess.Popen([
        sys.executable, "-m", "uvicorn",
        "backend.main:app",
        "--host", "0.0.0.0",
        "--port", port,
        "--workers", "1",        # Only 1 worker to save RAM
        "--limit-concurrency", "20",
        "--timeout-keep-alive", "30"
    ])
    return proc

def run_bot():
    print("Starting Bot...")
    subprocess.run([sys.executable, "bot/main.py"])

def monitor(proc):
    """Restart backend if it crashes."""
    while True:
        proc.wait()
        print("Backend crashed! Restarting in 5 seconds...")
        time.sleep(5)
        proc = run_backend()

if __name__ == "__main__":
    backend_proc = run_backend()
    
    # Background thread to monitor and restart backend if needed
    t = threading.Thread(target=monitor, args=(backend_proc,), daemon=True)
    t.start()
    
    try:
        run_bot()
    except (KeyboardInterrupt, SystemExit):
        backend_proc.terminate()
    finally:
        backend_proc.terminate()
