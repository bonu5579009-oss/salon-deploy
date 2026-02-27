import os
from sqlalchemy import create_engine, text

# Supabase URL from your project
DATABASE_URL = "postgresql://postgres.xdujzjkerrgdknyeyjic:Asaka1993%402812@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)

def list_users():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, username, shop_name, is_superadmin FROM users"))
        print("--- CURRENT USERS ON SUPABASE ---")
        for row in result:
            print(f"ID: {row[0]} | Username: {row[1]} | Shop: {row[2]} | SuperAdmin: {row[3]}")

if __name__ == "__main__":
    list_users()
