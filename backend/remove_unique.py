import sqlite3

def fix_unique_constraints():
    conn = sqlite3.connect('barber_queue.db')
    cursor = conn.cursor()

    print("Fixing services table...")
    # 1. Create temporary table
    cursor.execute("""
    CREATE TABLE services_new (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        name VARCHAR,
        price INTEGER,
        duration VARCHAR DEFAULT '30 min'
    )
    """)
    # 2. Copy data
    cursor.execute("INSERT INTO services_new (id, owner_id, name, price, duration) SELECT id, owner_id, name, price, duration FROM services")
    # 3. Drop old table
    cursor.execute("DROP TABLE services")
    # 4. Rename new table
    cursor.execute("ALTER TABLE services_new RENAME TO services")

    print("Fixing barbers table...")
    # 1. Create temporary table
    cursor.execute("""
    CREATE TABLE barbers_new (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        name VARCHAR,
        is_active INTEGER DEFAULT 1
    )
    """)
    # 2. Copy data
    cursor.execute("INSERT INTO barbers_new (id, owner_id, name, is_active) SELECT id, owner_id, name, is_active FROM barbers")
    # 3. Drop old table
    cursor.execute("DROP TABLE barbers")
    # 4. Rename new table
    cursor.execute("ALTER TABLE barbers_new RENAME TO barbers")

    conn.commit()
    conn.close()
    print("Redundant UNIQUE constraints removed successfully.")

if __name__ == "__main__":
    fix_unique_constraints()
