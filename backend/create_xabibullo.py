from sqlalchemy import create_engine, text
from passlib.context import CryptContext

# Supabase URL
DATABASE_URL = "postgresql://postgres.xdujzjkerrgdknyeyjic:Asaka1993%402812@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

engine = create_engine(DATABASE_URL)

def create_super_user(username, password, shop_name):
    password_hash = pwd_context.hash(password)
    
    with engine.connect() as conn:
        # Check if user exists
        check = conn.execute(text("SELECT id FROM users WHERE username = :u"), {"u": username}).fetchone()
        
        if check:
            conn.execute(text("UPDATE users SET password_hash = :p, is_superadmin = 1 WHERE username = :u"),
                        {"p": password_hash, "u": username})
            print(f"User {username} updated successfully.")
        else:
            conn.execute(text("INSERT INTO users (username, password_hash, shop_name, is_superadmin, balance) VALUES (:u, :p, :s, 1, 1000000)"),
                        {"u": username, "p": password_hash, "s": shop_name})
            print(f"User {username} created successfully as Super Admin.")
        
        conn.commit()

if __name__ == "__main__":
    create_super_user("xabibullo", "xabibullo777", "Xabibullo Mirzaaxmedov Shop")
