from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.xdujzjkerrgdknyeyjic:Asaka1993%402812@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
engine = create_engine(DATABASE_URL)

def add_test_token():
    # Soxta token (faqat bot menejeri buni sezishini tekshirish uchun)
    fake_token = "12345678:ABC-DEF123456ghIkl-zyx57W2v1u123ew11"
    
    with engine.connect() as conn:
        conn.execute(text("UPDATE users SET bot_token = :t WHERE username = 'xabibullo'"), {"t": fake_token})
        conn.commit()
    print("Test token added to user 'xabibullo'")

if __name__ == "__main__":
    add_test_token()
