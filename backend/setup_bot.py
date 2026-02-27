import sqlite3
import os

db_path = 'barber_queue.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Make sure tables exist (backend might have created them, but let's be safe)
cursor.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT, shop_name TEXT, bot_token TEXT, balance INTEGER DEFAULT 0, subscription_until DATETIME)")

token = "8495320182:AAHRqXRIAxCDbEZMYB77BWdj-zqAXFF20po"
username = "admin"

cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
user = cursor.fetchone()

if user:
    cursor.execute("UPDATE users SET bot_token = ? WHERE username = ?", (token, username))
    print(f"Updated user {username} with token")
else:
    cursor.execute("INSERT INTO users (username, password_hash, shop_name, bot_token) VALUES (?, ?, ?, ?)", 
                   (username, "pbkdf2:sha256:...", "Sulton barber", token))
    print(f"Created user {username} with token")

conn.commit()
conn.close()
