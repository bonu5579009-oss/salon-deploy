import sqlite3
conn = sqlite3.connect('barber_queue.db')
users = conn.execute("SELECT id, username, is_superadmin FROM users").fetchall()
print("Users in DB:")
for u in users:
    print(u)
conn.close()
