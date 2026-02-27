from sqlalchemy import create_engine, text

# Supabase URL
DATABASE_URL = "postgresql://postgres.xdujzjkerrgdknyeyjic:Asaka1993%402812@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
engine = create_engine(DATABASE_URL)

def migrate_ad_video():
    with engine.connect() as conn:
        print("Checking for ad_video_url column...")
        # Check if column exists
        check_query = text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='ad_video_url'")
        res = conn.execute(check_query).fetchone()
        
        if not res:
            print("Adding ad_video_url column to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN ad_video_url TEXT"))
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column ad_video_url already exists.")

if __name__ == "__main__":
    migrate_ad_video()
