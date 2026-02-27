import sqlite3

conn = sqlite3.connect('barber_queue.db')
cursor = conn.cursor()

print("Services table schema:")
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='services'")
print(cursor.fetchone()[0])

print("\nBarbers table schema:")
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='barbers'")
print(cursor.fetchone()[0])

conn.close()
