import sqlite3

db_path = 'barber_queue.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get the owner_id for 'admin'
cursor.execute("SELECT id FROM users WHERE username = 'admin'")
user = cursor.fetchone()

if user:
    owner_id = user[0]
    print(f"Assigning defaults to owner_id: {owner_id}")
    
    # Force update/recreate settings
    cursor.execute("DROP TABLE IF EXISTS settings")
    cursor.execute("CREATE TABLE settings (id INTEGER PRIMARY KEY, owner_id INTEGER, key TEXT, value TEXT)")
    
    settings = [
        ("work_start", "09:00"),
        ("work_end", "20:00"),
        ("slot_interval", "30")
    ]
    for key, value in settings:
        cursor.execute("INSERT INTO settings (owner_id, key, value) VALUES (?, ?, ?)", 
                       (owner_id, key, value))
    print("Added default settings")

    # Fix services and barbers
    cursor.execute("UPDATE services SET owner_id = ? WHERE owner_id IS NULL", (owner_id,))
    cursor.execute("UPDATE barbers SET owner_id = ? WHERE owner_id IS NULL", (owner_id,))
    
    # If still empty, add some
    cursor.execute("SELECT count(*) FROM services WHERE owner_id = ?", (owner_id,))
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO services (owner_id, name, price, duration) VALUES (?, ?, ?, ?)", 
                       (owner_id, "Soch olish", 50000, "30 min"))
        print("Added a service")

    cursor.execute("SELECT count(*) FROM barbers WHERE owner_id = ?", (owner_id,))
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO barbers (owner_id, name, is_active) VALUES (?, ?, ?)", 
                       (owner_id, "Sulton", 1))
        print("Added a barber")

conn.commit()
conn.close()
