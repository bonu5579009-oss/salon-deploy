import sqlite3

def fix_missing_columns():
    conn = sqlite3.connect('barber_queue.db')
    cursor = conn.cursor()

    # Helper to add column if not exists
    def add_column_if_missing(table, column, type):
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [col[1] for col in cursor.fetchall()]
        if column not in columns:
            print(f"Adding {column} to {table}...")
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type}")
        else:
            print(f"{column} already in {table}.")

    add_column_if_missing("bookings", "owner_id", "INTEGER")
    add_column_if_missing("reminders", "owner_id", "INTEGER")
    
    # Also check other tables for owner_id just in case
    for table in ["barbers", "services", "settings"]:
        add_column_if_missing(table, "owner_id", "INTEGER")

    conn.commit()
    conn.close()
    print("Schema updated successfully.")

if __name__ == "__main__":
    fix_missing_columns()
