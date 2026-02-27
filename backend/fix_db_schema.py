import sqlite3

conn = sqlite3.connect('barber_queue.db')
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE users ADD COLUMN ad_video_url TEXT")
    print("Added ad_video_url to users")
except Exception as e:
    print("users already has ad_video_url or error:", e)

try:
    cursor.execute("ALTER TABLE bookings ADD COLUMN notified INTEGER DEFAULT 0")
    print("Added notified to bookings")
except Exception as e:
    print("bookings already has notified or error:", e)

conn.commit()
conn.close()
