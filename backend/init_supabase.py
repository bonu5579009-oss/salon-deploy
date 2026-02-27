import os
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime
import hashlib

# DATABASE_URL: Supabase URL
DATABASE_URL = "postgresql://postgres.xdujzjkerrgdknyeyjic:Asaka1993%402812@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    shop_name = Column(String)
    is_superadmin = Column(Integer, default=0)
    balance = Column(Integer, default=0)
    subscription_until = Column(DateTime, nullable=True)
    bot_token = Column(String, nullable=True)

# Note: The main app uses passlib. For this init script, we'll try to use a simple hash
# but it MUST match what the main app expects. 
# Since passlib failed, let's just create the tables and let the user register manually 
# OR I will try to fix the passlib issue.

def init_db():
    print("Initializing tables on Supabase...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init_db()
