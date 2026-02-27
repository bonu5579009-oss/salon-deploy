import sqlite3
conn = sqlite3.connect('barber_queue.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
for table_name in [t[0] for t in tables]:
    print(f"--- TABLE: {table_name} ---")
    cursor.execute(f"PRAGMA table_info({table_name})")
    for col in cursor.fetchall():
        print(f"Column: {col}")
    cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}'")
    print(f"SQL: {cursor.fetchone()[0]}")
conn.close()
