import sqlite3
conn = sqlite3.connect('barber_queue.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
for table in tables:
    print(f"\nTable: {table[0]}")
    cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table[0]}'")
    print(cursor.fetchone()[0])
conn.close()
