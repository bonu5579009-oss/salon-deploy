import sqlite3
import os

db_path = "C:/Users/User/.gemini/antigravity/scratch/barber_queue_system/backend/barber_queue.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM broadcast_logs ORDER BY created_at DESC LIMIT 5")
        rows = cursor.fetchall()
        print("--- LAST BROADCASTS ---")
        for r in rows:
            print(r)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
else:
    print("DB not found at", db_path)
