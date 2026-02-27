import sqlite3

def add_superadmin_field():
    conn = sqlite3.connect('barber_queue.db')
    cursor = conn.cursor()

    # 1. Add is_superadmin to users
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'is_superadmin' not in columns:
        print("Adding is_superadmin column to users...")
        cursor.execute("ALTER TABLE users ADD COLUMN is_superadmin INTEGER DEFAULT 0")
    
    # 2. Set 'admin' user as superadmin
    cursor.execute("UPDATE users SET is_superadmin = 1 WHERE username = 'admin'")
    
    # If admin doesn't exist, create it (dummy password 'admin123' - you should change it)
    # Actually, better to just check if there is ANY superadmin, if not, make the first user superadmin or wait for user to login
    
    conn.commit()
    conn.close()
    print("Superadmin field added successfully.")

if __name__ == "__main__":
    add_superadmin_field()
