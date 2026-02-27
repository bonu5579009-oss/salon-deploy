from sqlalchemy import create_engine
import sys

# Password: Asaka1993@2812
# URL encoded @ is %40
db_url = "postgresql://postgres.xdujzjkerrgdknyeyjic:Asaka1993%402812@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("Successfully connected to Supabase!")
except Exception as e:
    print(f"Connection failed: {e}")
    sys.exit(1)
