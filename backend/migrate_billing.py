import sqlite3

conn = sqlite3.connect('barber_queue.db')
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 0")
    print("Added balance to users")
except:
    print("Balance column exists")

try:
    cursor.execute("ALTER TABLE users ADD COLUMN subscription_until DATETIME")
    print("Added subscription_until to users")
except:
    print("Subscription column exists")

try:
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        click_trans_id TEXT,
        amount INTEGER,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    print("Created transactions table")
except Exception as e:
    print(f"Transactions table error: {e}")

conn.commit()
conn.close()
