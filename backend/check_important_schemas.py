import sqlite3
conn = sqlite3.connect('barber_queue.db')
cursor = conn.cursor()
for table in ['bookings', 'users', 'transactions', 'reminders']:
    print(f"\n--- {table} ---")
    cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table}'")
    res = cursor.fetchone()
    if res: print(res[0])
    else: print("NOT FOUND")
conn.close()
