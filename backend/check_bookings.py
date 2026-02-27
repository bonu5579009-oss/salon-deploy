import sqlite3
conn = sqlite3.connect('barber_queue.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM bookings")
print(cursor.fetchall())
conn.close()
