from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.xdujzjkerrgdknyeyjic:Asaka1993%402812@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
engine = create_engine(DATABASE_URL)

def list_tokens():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT username, bot_token FROM users WHERE bot_token IS NOT NULL"))
        for row in res:
            print(f"User: {row[0]}, Token: {row[1][:10]}...")

if __name__ == "__main__":
    list_tokens()
