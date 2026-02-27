from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.xdujzjkerrgdknyeyjic:Asaka1993%402812@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
engine = create_engine(DATABASE_URL)

def cleanup_test_tokens():
    with engine.connect() as conn:
        print("Cleaning up test tokens...")
        # Delete or clear tokens that look like test tokens
        res = conn.execute(text("UPDATE users SET bot_token = NULL WHERE bot_token LIKE '12345678%'"))
        conn.commit()
        print(f"Cleanup done.")

if __name__ == "__main__":
    cleanup_test_tokens()
