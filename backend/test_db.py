import sqlite3
import os

db_path = 'barber_queue.db'
if not os.path.exists(db_path):
    print(f"File {db_path} not found!")
else:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print("Tables:", tables)
        for table in tables:
            tname = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {tname}")
            count = cursor.fetchone()[0]
            print(f"Table {tname}: {count} rows")
        conn.close()
    except Exception as e:
        print("Error:", e)
