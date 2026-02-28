from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import json
import os
import hashlib
from sqlalchemy import create_engine, Column, Integer, String, desc, BigInteger, DateTime, ForeignKey, text
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv

# --- Config ---
load_dotenv()
PORT = os.getenv("PORT", "10000") # Render usually uses 10000 or a random port
API_URL = os.getenv("API_URL", f"http://127.0.0.1:{PORT}")

# --- DATABASE SETUP ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./barber_queue.db")

# For PostgreSQL on Supabase/Render, we don't need check_same_thread
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Fix for SQLAlchemy 1.4+ where postgres:// should be postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- APP SETUP ---
app = FastAPI(title="Beauty Ladies Salon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY SETUP ---
SECRET_KEY = "SUPER_SECRET_KEY_CHANGEME"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
# oauth2_scheme moved to dependencies section

# --- CLICK CONFIG ---
CLICK_SERVICE_ID = "398062629"
CLICK_MERCHANT_ID = "398062629"
CLICK_SECRET_KEY = "F91D8F69C042267444B74CC0B3C747757EB0E065"

# --- DB MODELS ---
class DBUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    shop_name = Column(String)
    is_superadmin = Column(Integer, default=0)
    is_active = Column(Integer, default=1)  # 0=blocked, 1=active
    bot_token = Column(String, nullable=True)
    balance = Column(Integer, default=0)
    subscription_until = Column(DateTime, nullable=True)
    ad_video_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)

class DBTransaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    click_trans_id = Column(String, nullable=True)
    amount = Column(Integer)
    status = Column(String, default="PENDING") # PENDING, SUCCESS, FAILED
    created_at = Column(DateTime, default=datetime.now)

class DBBroadcastLog(Base):
    __tablename__ = "broadcast_logs"
    id = Column(Integer, primary_key=True)
    message = Column(String)
    sent_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)

class DBBooking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    num = Column(Integer)
    name = Column(String)
    tel = Column(String)
    service = Column(String)
    barber = Column(String)
    time = Column(String)
    status = Column(String, default="WAITING") 
    user_id = Column(BigInteger, nullable=True)
    chat_id = Column(BigInteger, nullable=True)
    notified = Column(Integer, default=0) # 0: not notified, 1: notified
    created_at = Column(DateTime, default=datetime.now)

# --- DEPENDENCIES ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise HTTPException(status_code=401)
    except JWTError: raise HTTPException(status_code=401)
    user = db.query(DBUser).filter(DBUser.username == username).first()
    if user is None: raise HTTPException(status_code=401)
    return user

@app.get("/bot/pending-turns")
async def get_pending_turns(db: Session = Depends(get_db)):
    # Get bookings with status CALLED that haven't been notified via Telegram
    bs = db.query(DBBooking).filter(DBBooking.status == "CALLED", DBBooking.notified == 0, DBBooking.chat_id != None).all()
    res = []
    for b in bs:
        owner = db.query(DBUser).filter(DBUser.id == b.owner_id).first()
        if owner and owner.bot_token:
            res.append({
                "id": b.id,
                "chat_id": b.chat_id,
                "bot_token": owner.bot_token,
                "shop_name": owner.shop_name,
                "barber": b.barber,
                "num": b.num
            })
            b.notified = 1
    db.commit()
    return res

class DBBarber(Base):
    __tablename__ = "barbers"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    is_active = Column(Integer, default=1)

class DBService(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    price = Column(Integer)
    duration = Column(String, default="30 min")

class DBSetting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    key = Column(String)
    value = Column(String)

class DBReminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    user_id = Column(BigInteger)
    chat_id = Column(BigInteger)
    barber = Column(String)
    remind_at = Column(DateTime)
    is_sent = Column(Integer, default=0)

class DBGlobalSetting(Base):
    __tablename__ = "global_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)

Base.metadata.create_all(bind=engine)

# --- AUTO MIGRATION: add missing columns to existing tables ---
def run_migrations():
    """Add new columns to existing tables if they don't exist."""
    try:
        db = SessionLocal()
        try:
            insp = sa_inspect(engine)
            table_names = insp.get_table_names()
            
            if 'users' in table_names:
                user_columns = [col['name'] for col in insp.get_columns('users')]

                if 'is_active' not in user_columns:
                    db.execute(text("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1"))
                    db.commit()
                    print("Migration OK: Added is_active column")

                if 'phone' not in user_columns:
                    db.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR"))
                    db.commit()
                    print("✅ Migration: Added 'phone' column to users")

            # Ensure broadcast_logs table exists
            if 'broadcast_logs' not in table_names:
                # Use PostgreSQL compatible syntax for table creation
                if DATABASE_URL.startswith("postgresql"):
                    db.execute(text("""
                        CREATE TABLE broadcast_logs (
                            id SERIAL PRIMARY KEY,
                            message TEXT,
                            sent_count INTEGER DEFAULT 0,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                else: # For SQLite or other databases
                    db.execute(text("""
                        CREATE TABLE broadcast_logs (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            message TEXT,
                            sent_count INTEGER DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    """))
                db.commit()
                print("✅ Migration: Created 'broadcast_logs' table")

        except Exception as e:
            print(f"Migration warning: {e}")
            db.rollback()
        finally:
            db.close()
    except Exception as e:
        print(f"Migration skipped: {e}")

run_migrations()

# Ensure default global settings exist
try:
    _db = SessionLocal()
    if not _db.query(DBGlobalSetting).filter(DBGlobalSetting.key == "ad_video_url").first():
        _db.add(DBGlobalSetting(key="ad_video_url", value=""))
        _db.commit()
    if not _db.query(DBGlobalSetting).filter(DBGlobalSetting.key == "ad_text").first():
        _db.add(DBGlobalSetting(key="ad_text", value=""))
        _db.commit()
    _db.close()
except Exception as _e:
    print(f"Settings init warning: {_e}")

# --- WEB SOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                pass

manager = ConnectionManager()



# --- HELPERS ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- PING / KEEP-ALIVE ---
@app.get("/ping")
async def ping():
    return {"status": "ok", "time": datetime.now().isoformat()}

# --- INITIAL SETUP ENDPOINT ---
@app.get("/setup/init")
async def setup_init(db: Session = Depends(get_db)):
    """Superadmin yaratish yoki parolini reset qilish"""
    existing = db.query(DBUser).filter(DBUser.is_superadmin == 1).first()
    new_password = "Admin2024!"
    
    if existing:
        # Reset password if already exists
        existing.password_hash = pwd_context.hash(new_password)
        db.commit()
        return {
            "status": "reset", 
            "message": "✅ Super admin paroli yangilandi!",
            "login": existing.username,
            "password": new_password
        }
    
    u = DBUser(
        username="superadmin",
        password_hash=pwd_context.hash(new_password),
        shop_name="Beauty Ladies Salon",
        is_superadmin=1
    )
    db.add(u)
    db.commit()
    return {
        "status": "success", 
        "message": "✅ Super admin yaratildi!",
        "login": "superadmin",
        "password": new_password,
        "url": "/login"
    }

@app.post("/setup/superadmin")
async def setup_superadmin(form_data: dict, db: Session = Depends(get_db)):
    """Birinchi super admin yaratish (faqat bitta superadmin bo'lmaganda ishlaydi)"""
    existing = db.query(DBUser).filter(DBUser.is_superadmin == 1).first()
    if existing:
        raise HTTPException(status_code=400, detail="Super admin allaqachon mavjud!")
    
    username = form_data.get("username", "superadmin")
    password = form_data.get("password", "Admin2024!")
    
    u = DBUser(
        username=username,
        password_hash=pwd_context.hash(password),
        shop_name="System",
        is_superadmin=1
    )
    db.add(u)
    db.commit()
    return {"status": "success", "message": f"Super admin '{username}' yaratildi!", "login": username, "password": password}

# --- AUTH ENDPOINTS ---
@app.post("/auth/register")
async def register(form_data: dict, db: Session = Depends(get_db)):
    username, password = form_data.get("username"), form_data.get("password")
    shop_name = form_data.get("shop_name", "Beauty Ladies Salon")
    if db.query(DBUser).filter(DBUser.username == username).first():
        raise HTTPException(status_code=400, detail="Username band")
    try:
        # 🎁 2 oy bepul sinov obuna (60 kun)
        trial_until = datetime.now() + timedelta(days=60)
        u = DBUser(
            username=username,
            password_hash=pwd_context.hash(password),
            shop_name=shop_name,
            subscription_until=trial_until
        )
        db.add(u); db.commit(); db.refresh(u)
        db.add(DBBarber(owner_id=u.id, name="Usta 1"))
        db.add(DBService(owner_id=u.id, name="Soch olish", price=50000))
        db.add(DBSetting(owner_id=u.id, key="work_start", value="09:00"))
        db.add(DBSetting(owner_id=u.id, key="work_end", value="20:00"))
        db.add(DBSetting(owner_id=u.id, key="slot_interval", value="30"))
        db.commit()
        print(f"✅ New user registered: {username} | Trial until: {trial_until.date()}")
    except Exception as e:
        print(f"Register error: {e}")
        raise HTTPException(status_code=500, detail="Saqlashda xatolik")
    return {"status": "success", "trial_days": 60}

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    u = db.query(DBUser).filter(DBUser.username == form_data.username).first()
    if not u or not pwd_context.verify(form_data.password, u.password_hash):
        raise HTTPException(status_code=400, detail="Login yoki parol xato")
    # Bloklangan userlarni taqiqlash (super admin uchun emas)
    is_active = getattr(u, 'is_active', 1)
    if not u.is_superadmin and is_active == 0:
        raise HTTPException(status_code=403, detail="Hisobingiz bloklangan. Administrator bilan bog'laning.")
    token = create_access_token({"sub": u.username})
    return {"access_token": token, "token_type": "bearer", "is_superadmin": bool(u.is_superadmin)}

@app.get("/auth/me")
async def get_me(u: DBUser = Depends(get_current_user)):
    sub_until = None
    try:
        sub_until = u.subscription_until.isoformat() if u.subscription_until else None
    except Exception:
        pass
    return {
        "username": u.username,
        "shop_name": u.shop_name,
        "id": u.id,
        "balance": u.balance or 0,
        "subscription_until": sub_until
    }

@app.get("/admin/notifications")
async def get_notifications(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # Oxirgi 5 ta super admin xabarini olish
    notifs = db.query(DBBroadcastLog).order_by(desc(DBBroadcastLog.created_at)).limit(5).all()
    return [{
        "id": n.id,
        "message": n.message,
        "created_at": n.created_at.isoformat()
    } for n in notifs]

# --- ADMIN ENDPOINTS FOR BARBERS ---
@app.get("/admin/bookings")
async def get_bookings(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    bs = db.query(DBBooking).filter(DBBooking.owner_id == u.id).order_by(desc(DBBooking.id)).limit(100).all()
    return {"bookings": [{"id":b.id,"num":b.num,"name":b.name,"tel":b.tel,"service":b.service,"barber":b.barber,"status":b.status,"time":b.time} for b in bs]}

@app.post("/admin/bookings")
async def create_booking(d: dict, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    last = db.query(DBBooking).filter(DBBooking.owner_id == u.id).order_by(desc(DBBooking.num)).first()
    num = (last.num + 1) if last else 101
    b = DBBooking(owner_id=u.id, num=num, name=d.get("customer_name"), tel=d.get("customer_phone"), service=d.get("service"), barber=d.get("barber"), status="WAITING", time=d.get("appointment_time") or "Hozir")
    db.add(b); db.commit(); db.refresh(b)
    data = {"id":b.id,"num":b.num,"name":b.name,"barber":b.barber,"status":b.status,"time":b.time}
    await manager.broadcast({"event":"UPDATE_QUEUE","owner_id":u.id,"action":"NEW_BOOKING","data":data})
    return {"status":"success","booking":data}

@app.post("/admin/bookings/{bid}/call")
async def call_customer(bid: int, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.query(DBBooking).filter(DBBooking.id == bid, DBBooking.owner_id == u.id).first()
    if b: b.status = "CALLED"; db.commit(); await manager.broadcast({"event":"UPDATE_QUEUE","owner_id":u.id,"booking_id":bid,"status":"CALLED"})
    return {"status":"success"}

@app.post("/admin/bookings/{bid}/start")
async def start_service(bid: int, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.query(DBBooking).filter(DBBooking.id == bid, DBBooking.owner_id == u.id).first()
    if b: b.status = "IN_PROGRESS"; db.commit(); await manager.broadcast({"event":"UPDATE_QUEUE","owner_id":u.id,"booking_id":bid,"status":"IN_PROGRESS"})
    return {"status":"success"}

@app.post("/admin/bookings/{bid}/done")
async def done_service(bid: int, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.query(DBBooking).filter(DBBooking.id == bid, DBBooking.owner_id == u.id).first()
    if b: b.status = "DONE"; db.commit(); await manager.broadcast({"event":"UPDATE_QUEUE","owner_id":u.id,"booking_id":bid,"status":"DONE"})
    return {"status":"success"}

@app.get("/admin/barbers")
async def admin_get_barbers(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    bs = db.query(DBBarber).filter(DBBarber.owner_id == u.id).all()
    return [{"id":b.id,"name":b.name,"is_active":b.is_active} for b in bs]

@app.post("/admin/barbers")
async def admin_add_barber(d: dict, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    b = DBBarber(owner_id=u.id, name=d['name']); db.add(b); db.commit(); return b

@app.patch("/admin/barbers/{bid}/toggle")
async def toggle_barber(bid: int, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.query(DBBarber).filter(DBBarber.id == bid, DBBarber.owner_id == u.id).first()
    if b: b.is_active = 0 if b.is_active else 1; db.commit()
    return {"status":"success"}

@app.delete("/admin/barbers/{bid}")
async def delete_barber(bid: int, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.query(DBBarber).filter(DBBarber.id == bid, DBBarber.owner_id == u.id).first()
    if b: db.delete(b); db.commit()
    return {"status":"success"}

@app.get("/admin/services")
async def admin_get_services(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    ss = db.query(DBService).filter(DBService.owner_id == u.id).all()
    return [{"id":s.id,"name":s.name,"price":s.price,"duration":s.duration} for s in ss]

@app.post("/admin/services")
async def admin_add_service(d: dict, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    s = DBService(owner_id=u.id, name=d['name'], price=d['price'], duration=d.get('duration','30 min'))
    db.add(s); db.commit(); return s

@app.patch("/admin/settings")
async def update_settings(d: dict, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if 'shop_name' in d: u.shop_name = d['shop_name']
    if 'bot_token' in d: u.bot_token = d['bot_token']
    if 'ad_video_url' in d: u.ad_video_url = d['ad_video_url']
    for k, v in d.items():
        if k in ['work_start','work_end','slot_interval']:
            s = db.query(DBSetting).filter(DBSetting.owner_id == u.id, DBSetting.key == k).first()
            if s: s.value = str(v)
            else: db.add(DBSetting(owner_id=u.id, key=k, value=str(v)))
    db.commit(); return {"status":"success"}

@app.get("/admin/settings")
async def get_admin_settings(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    ss = db.query(DBSetting).filter(DBSetting.owner_id == u.id).all()
    res = {s.key: s.value for s in ss}
    res.update({"shop_name": u.shop_name, "bot_token": u.bot_token, "balance": u.balance, "ad_video_url": u.ad_video_url})
    return res

# --- PUBLIC ENDPOINTS ---
@app.get("/public/queue/{oid}")
async def get_public_queue(oid: int, db: Session = Depends(get_db)):
    bs = db.query(DBBooking).filter(DBBooking.owner_id == oid, DBBooking.status.in_(["WAITING","CALLED","IN_PROGRESS"])).order_by(DBBooking.num).all()
    u = db.query(DBUser).filter(DBUser.id == oid).first()
    return {
        "shop_name": u.shop_name if u else "Barber", 
        "ad_video_url": u.ad_video_url if u else None,
        "bookings": [{"num":b.num,"name":b.name,"barber":b.barber,"status":b.status,"time":b.time} for b in bs]
    }

@app.get("/public/services/{oid}")
async def get_pub_services(oid: int, db: Session = Depends(get_db)):
    ss = db.query(DBService).filter(DBService.owner_id == oid).all()
    return [{"name":s.name,"price":s.price} for s in ss]

@app.get("/public/barbers/{oid}")
async def get_pub_barbers(oid: int, db: Session = Depends(get_db)):
    bs = db.query(DBBarber).filter(DBBarber.owner_id == oid, DBBarber.is_active == 1).all()
    return [{"name":b.name} for b in bs]

@app.get("/public/settings/{oid}")
async def get_pub_settings(oid: int, db: Session = Depends(get_db)):
    ss = db.query(DBSetting).filter(DBSetting.owner_id == oid).all()
    return {s.key: s.value for s in ss}

@app.post("/public/bookings")
async def create_pub_booking(d: dict, db: Session = Depends(get_db)):
    oid = d.get("owner_id")
    if not oid: raise HTTPException(status_code=400)
    last = db.query(DBBooking).filter(DBBooking.owner_id == oid).order_by(desc(DBBooking.num)).first()
    num = (last.num + 1) if last else 101
    b = DBBooking(
        owner_id=oid, 
        num=num, 
        name=d.get("customer_name"), 
        tel=d.get("customer_phone"), 
        service=d.get("service"), 
        barber=d.get("barber"), 
        status="WAITING", 
        time=d.get("appointment_time") or "Hozir",
        chat_id=d.get("chat_id")
    )
    db.add(b); db.commit(); db.refresh(b)
    data = {"id":b.id,"num":b.num,"name":b.name,"barber":b.barber,"status":b.status,"time":b.time}
    await manager.broadcast({"event":"UPDATE_QUEUE","owner_id":oid,"action":"NEW_BOOKING","data":data})
    u = db.query(DBUser).filter(DBUser.id == oid).first()
    return {"status":"success","booking":data,"shop_name":u.shop_name if u else "Barber"}

@app.get("/public/customer/{chat_id}/phone")
async def get_customer_phone(chat_id: int, db: Session = Depends(get_db)):
    b = db.query(DBBooking).filter(DBBooking.chat_id == chat_id).order_by(desc(DBBooking.created_at)).first()
    if b: return {"phone": b.tel}
    return {"phone": None}

@app.get("/public/customer/{chat_id}/active-bookings")
async def get_active_bookings(chat_id: int, db: Session = Depends(get_db)):
    bs = db.query(DBBooking).filter(
        DBBooking.chat_id == chat_id, 
        DBBooking.status.in_(["WAITING", "CALLED"])
    ).order_by(DBBooking.id).all()
    return [{"id": b.id, "num": b.num, "service": b.service, "barber": b.barber, "time": b.time} for b in bs]

@app.post("/public/bookings/{bid}/cancel")
async def cancel_booking_pub(bid: int, d: dict, db: Session = Depends(get_db)):
    chat_id = d.get("chat_id")
    b = db.query(DBBooking).filter(DBBooking.id == bid, DBBooking.chat_id == chat_id).first()
    if b:
        b.status = "CANCELLED"
        db.commit()
        await manager.broadcast({"event": "UPDATE_QUEUE", "owner_id": b.owner_id, "booking_id": bid, "status": "CANCELLED"})
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Booking not found")

@app.get("/bot/active-tokens")
async def get_bot_tokens(db: Session = Depends(get_db)):
    us = db.query(DBUser).filter(DBUser.bot_token != None).all()
    return [{"owner_id":u.id,"token":u.bot_token} for u in us]

@app.get("/admin/barbers/{barber_name}/busy-times")
async def get_busy_times(barber_name: str, owner_id: int, db: Session = Depends(get_db)):
    bs = db.query(DBBooking).filter(DBBooking.owner_id == owner_id, DBBooking.barber == barber_name, DBBooking.status.in_(["WAITING","CALLED","IN_PROGRESS"])).all()
    return [b.time for b in bs if b.time and ":" in b.time]

# --- REMINDERS ---
@app.post("/admin/reminders")
async def create_reminder(rem: dict, db: Session = Depends(get_db)):
    remind_date = datetime.now() + timedelta(days=int(rem.get("days", 15)))
    new_rem = DBReminder(owner_id=rem.get("owner_id"), user_id=rem.get("user_id"), chat_id=rem.get("chat_id"), barber=rem.get("barber"), remind_at=remind_date)
    db.add(new_rem); db.commit(); return {"status": "success"}

@app.get("/admin/reminders/due")
async def get_due_reminders(db: Session = Depends(get_db)):
    now = datetime.now()
    due = db.query(DBReminder).filter(DBReminder.remind_at <= now, DBReminder.is_sent == 0).all()
    res = []
    for r in due:
        owner = db.query(DBUser).filter(DBUser.id == r.owner_id).first()
        res.append({"id": r.id, "chat_id": r.chat_id, "barber": r.barber, "bot_token": owner.bot_token if owner else None})
        r.is_sent = 1
    db.commit(); return res

# --- STATS ---
@app.get("/admin/stats")
async def get_stats(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(DBBooking).filter(DBBooking.owner_id == u.id).count()
    waiting = db.query(DBBooking).filter(DBBooking.owner_id == u.id, DBBooking.status == "WAITING").count()
    done = db.query(DBBooking).filter(DBBooking.owner_id == u.id, DBBooking.status == "DONE").count()
    income = 0
    services = db.query(DBService).filter(DBService.owner_id == u.id).all()
    s_map = {s.name: s.price for s in services}
    done_bookings = db.query(DBBooking).filter(DBBooking.owner_id == u.id, DBBooking.status == "DONE").all()
    for b in done_bookings: income += s_map.get(b.service, 0)
    b_stats = {}
    barbers = db.query(DBBarber).filter(DBBarber.owner_id == u.id).all()
    for b in barbers:
        b_count = db.query(DBBooking).filter(DBBooking.owner_id == u.id, DBBooking.barber == b.name, DBBooking.status == "DONE").count()
        b_stats[b.name] = b_count
    return {"total_bookings": total, "waiting_bookings": waiting, "done_bookings": done, "total_income": income, "barber_stats": b_stats}

@app.get("/admin/billing/transactions")
async def get_my_transactions(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    txs = db.query(DBTransaction).filter(DBTransaction.user_id == u.id).order_by(desc(DBTransaction.created_at)).limit(20).all()
    return [{
        "id": t.id,
        "amount": t.amount,
        "status": t.status,
        "click_trans_id": t.click_trans_id,
        "created_at": t.created_at.isoformat() if t.created_at else None
    } for t in txs]

# --- CLICK BILLING ENDPOINTS ---
@app.post("/admin/billing/generate-url")
async def generate_click_url(amount: int, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # Create a pending transaction
    trans = DBTransaction(user_id=u.id, amount=amount, status="PENDING")
    db.add(trans); db.commit(); db.refresh(trans)
    
    url = f"https://my.click.uz/services/pay?service_id={CLICK_SERVICE_ID}&merchant_id={CLICK_MERCHANT_ID}&amount={amount}&transaction_param={trans.id}"
    return {"url": url}

@app.post("/admin/billing/test-pay")
async def test_pay(amount: int, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simulate a successful payment for testing
    trans = DBTransaction(user_id=u.id, amount=amount, status="SUCCESS", click_trans_id="TEST_MODE_TRX")
    u.balance += amount
    db.add(trans); db.commit()
    return {"status": "success", "new_balance": u.balance}

@app.post("/click/prepare")
async def click_prepare(
    click_trans_id: str = Form(...),
    service_id: str = Form(...),
    merchant_trans_id: str = Form(...),
    amount: float = Form(...),
    action: int = Form(...),
    error: int = Form(...),
    error_note: str = Form(...),
    sign_time: str = Form(...),
    sign_string: str = Form(...),
    db: Session = Depends(get_db)
):
    # Verify Sign
    check_str = f"{click_trans_id}{service_id}{CLICK_SECRET_KEY}{merchant_trans_id}{amount}{action}{sign_time}"
    my_sign = hashlib.md5(check_str.encode()).hexdigest()
    
    if my_sign != sign_string:
        return {"error": -1, "error_note": "Sign mismatch"}

    trans = db.query(DBTransaction).filter(DBTransaction.id == int(merchant_trans_id)).first()
    if not trans:
        return {"error": -5, "error_note": "Transaction not found"}
        
    if amount != trans.amount:
        return {"error": -2, "error_note": "Incorrect amount"}

    return {
        "click_trans_id": click_trans_id,
        "merchant_trans_id": merchant_trans_id,
        "merchant_prepare_id": merchant_trans_id,
        "error": 0,
        "error_note": "Success"
    }

@app.post("/click/complete")
async def click_complete(
    click_trans_id: str = Form(...),
    service_id: str = Form(...),
    merchant_trans_id: str = Form(...),
    merchant_prepare_id: str = Form(...),
    amount: float = Form(...),
    action: int = Form(...),
    error: int = Form(...),
    error_note: str = Form(...),
    sign_time: str = Form(...),
    sign_string: str = Form(...),
    db: Session = Depends(get_db)
):
    # Verify Sign
    check_str = f"{click_trans_id}{service_id}{CLICK_SECRET_KEY}{merchant_trans_id}{merchant_prepare_id}{amount}{action}{sign_time}"
    my_sign = hashlib.md5(check_str.encode()).hexdigest()
    
    if my_sign != sign_string:
        return {"error": -1, "error_note": "Sign mismatch"}

    trans = db.query(DBTransaction).filter(DBTransaction.id == int(merchant_trans_id)).first()
    if not trans:
        return {"error": -5, "error_note": "Transaction not found"}

    if error != 0:
        trans.status = "FAILED"
        db.commit()
        return {"error": 0, "error_note": "Failed status recorded"}

    if trans.status == "SUCCESS":
        return {"error": -4, "error_note": "Already paid"}

    # Update balance
    user = db.query(DBUser).filter(DBUser.id == trans.user_id).first()
    if user:
        user.balance += int(amount)
        trans.status = "SUCCESS"
        trans.click_trans_id = click_trans_id
        db.commit()

    return {
        "click_trans_id": click_trans_id,
        "merchant_trans_id": merchant_trans_id,
        "error": 0,
        "error_note": "Success"
    }

# --- SUPERADMIN ENDPOINTS ---

@app.get("/superadmin/stats")
async def get_super_stats(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    total_users = db.query(DBUser).count()
    total_bookings = db.query(DBBooking).count()
    total_income = db.query(DBTransaction).filter(DBTransaction.status == "SUCCESS").with_entities(desc(DBTransaction.amount)).all()
    # Simple sum
    sum_income = sum([t[0] for t in total_income])
    return {
        "total_users": total_users,
        "total_bookings": total_bookings,
        "total_income": sum_income
    }

@app.get("/superadmin/users")
async def get_super_users(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    users = db.query(DBUser).all()
    res = []
    for user in users:
        res.append({
            "id": user.id,
            "username": user.username,
            "shop_name": user.shop_name,
            "balance": user.balance,
            "bot_token": user.bot_token,
            "is_superadmin": user.is_superadmin
        })
    return res

@app.patch("/superadmin/users/{uid}/balance")
async def super_update_balance(uid: int, d: dict, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    target = db.query(DBUser).filter(DBUser.id == uid).first()
    if not target: raise HTTPException(status_code=404)
    target.balance += d.get("amount", 0)
    db.commit()
    return {"status": "success", "new_balance": target.balance}

@app.get("/superadmin/transactions")
async def get_super_transactions(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    txs = db.query(DBTransaction).order_by(desc(DBTransaction.created_at)).limit(50).all()
    res = []
    for t in txs:
        owner = db.query(DBUser).filter(DBUser.id == t.user_id).first()
        res.append({
            "id": t.id,
            "username": owner.username if owner else "Unknown",
            "amount": t.amount,
            "status": t.status,
            "created_at": t.created_at
        })
    return res

@app.get("/public/global-settings")
async def get_global_settings(db: Session = Depends(get_db)):
    gs = db.query(DBGlobalSetting).all()
    return {s.key: s.value for s in gs}

@app.patch("/superadmin/global-settings")
async def update_global_settings(d: dict, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    for k, v in d.items():
        s = db.query(DBGlobalSetting).filter(DBGlobalSetting.key == k).first()
        if s: s.value = str(v)
        else: db.add(DBGlobalSetting(key=k, value=str(v)))
    db.commit()
    return {"status": "success"}

# --- SUPERADMIN: DO'KON BLOKLASH/YOQISH ---
@app.patch("/superadmin/users/{uid}/toggle-block")
async def toggle_block_user(uid: int, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    target = db.query(DBUser).filter(DBUser.id == uid).first()
    if not target: raise HTTPException(status_code=404)
    if target.is_superadmin: raise HTTPException(status_code=400, detail="Super admin'ni bloklash mumkin emas!")
    target.is_active = 0 if target.is_active else 1
    db.commit()
    return {"status": "success", "is_active": target.is_active}

# --- SUPERADMIN: BALANS QO'SHISH ---
@app.patch("/superadmin/users/{uid}/balance")
async def add_balance(uid: int, d: dict, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    target = db.query(DBUser).filter(DBUser.id == uid).first()
    if not target: raise HTTPException(status_code=404)
    amount = d.get("amount", 0)
    target.balance = (target.balance or 0) + int(amount)
    db.commit()
    return {"status": "success", "balance": target.balance}

# --- SUPERADMIN: PAROL TIKLASH ---
@app.patch("/superadmin/users/{uid}/reset-password")
async def reset_user_password(uid: int, d: dict, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    target = db.query(DBUser).filter(DBUser.id == uid).first()
    if not target: raise HTTPException(status_code=404)
    new_pass = d.get("new_password", "Shop2024!")
    target.password_hash = pwd_context.hash(new_pass)
    db.commit()
    return {"status": "success", "new_password": new_pass}

# --- SUPERADMIN: OBUNA MUDDATI ---
@app.patch("/superadmin/users/{uid}/subscription")
async def set_subscription(uid: int, d: dict, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    target = db.query(DBUser).filter(DBUser.id == uid).first()
    if not target: raise HTTPException(status_code=404)
    days = d.get("days", 30)
    target.subscription_until = datetime.now() + timedelta(days=int(days))
    db.commit()
    return {"status": "success", "subscription_until": target.subscription_until.isoformat()}

# --- SUPERADMIN: DO'KON O'CHIRISH ---
@app.delete("/superadmin/users/{uid}")
async def delete_user(uid: int, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    target = db.query(DBUser).filter(DBUser.id == uid).first()
    if not target: raise HTTPException(status_code=404)
    if target.is_superadmin: raise HTTPException(status_code=400, detail="Super admin'ni o'chirish mumkin emas!")
    # Delete related data
    db.query(DBBooking).filter(DBBooking.owner_id == uid).delete()
    db.query(DBBarber).filter(DBBarber.owner_id == uid).delete()
    db.query(DBService).filter(DBService.owner_id == uid).delete()
    db.query(DBSetting).filter(DBSetting.owner_id == uid).delete()
    db.query(DBTransaction).filter(DBTransaction.user_id == uid).delete()
    db.delete(target)
    db.commit()
    return {"status": "success"}

# --- SUPERADMIN: BOT STATUS MONITORING ---
@app.get("/superadmin/bot-status")
async def get_bot_status(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    users = db.query(DBUser).filter(DBUser.is_superadmin == 0).all()
    result = []
    for user in users:
        if user.bot_token:
            # Check booking activity (last booking time indicates bot usage)
            last_booking = db.query(DBBooking).filter(DBBooking.owner_id == user.id).order_by(desc(DBBooking.created_at)).first()
            result.append({
                "id": user.id,
                "shop_name": user.shop_name,
                "username": user.username,
                "has_bot": True,
                "is_active": bool(user.is_active),
                "last_booking": last_booking.created_at.isoformat() if last_booking else None,
                "total_bookings": db.query(DBBooking).filter(DBBooking.owner_id == user.id).count()
            })
        else:
            result.append({
                "id": user.id,
                "shop_name": user.shop_name,
                "username": user.username,
                "has_bot": False,
                "is_active": bool(user.is_active),
                "last_booking": None,
                "total_bookings": db.query(DBBooking).filter(DBBooking.owner_id == user.id).count()
            })
    return result

# --- SUPERADMIN: HAFTALIK/OYLIK STATISTIKA ---
@app.get("/superadmin/stats/detailed")
async def get_detailed_stats(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    now = datetime.now()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total_users = db.query(DBUser).filter(DBUser.is_superadmin == 0).count()

    # Safe is_active filter (column may not exist yet)
    try:
        active_users = db.query(DBUser).filter(DBUser.is_superadmin == 0, DBUser.is_active == 1).count()
    except Exception:
        active_users = total_users
    blocked_users = total_users - active_users

    total_bookings = db.query(DBBooking).count()
    weekly_bookings = db.query(DBBooking).filter(DBBooking.created_at >= week_ago).count()
    monthly_bookings = db.query(DBBooking).filter(DBBooking.created_at >= month_ago).count()

    # Income stats
    try:
        total_income_rows = db.query(DBTransaction).filter(DBTransaction.status == "SUCCESS").all()
        total_income_sum = sum([t.amount for t in total_income_rows])
        weekly_income_rows = db.query(DBTransaction).filter(DBTransaction.status == "SUCCESS", DBTransaction.created_at >= week_ago).all()
        weekly_income_sum = sum([t.amount for t in weekly_income_rows])
    except Exception:
        total_income_sum = 0
        weekly_income_sum = 0

    # Users with active subscription
    try:
        active_subscriptions = db.query(DBUser).filter(DBUser.subscription_until > now).count()
    except Exception:
        active_subscriptions = 0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "blocked_users": blocked_users,
        "active_subscriptions": active_subscriptions,
        "total_bookings": total_bookings,
        "weekly_bookings": weekly_bookings,
        "monthly_bookings": monthly_bookings,
        "total_income": total_income_sum,
        "weekly_income": weekly_income_sum
    }

# --- SUPERADMIN: TELEGRAM BROADCAST ---
@app.post("/superadmin/broadcast")
async def broadcast_message(d: dict, u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    message = d.get("message", "")
    target_ids = d.get("user_ids", [])  # empty = all users
    
    if not message:
        raise HTTPException(status_code=400, detail="Xabar bo'sh bo'lishi mumkin emas")
    
    # Get users with bot tokens to find chat_ids
    if target_ids:
        users = db.query(DBUser).filter(DBUser.id.in_(target_ids)).all()
    else:
        users = db.query(DBUser).filter(DBUser.is_superadmin == 0).all()
    
    # Collect unique chat_ids from bookings (admin's telegram ID if any)
    sent_count = len(users)
    
    # Log the broadcast
    log = DBBroadcastLog(message=message, sent_count=sent_count)
    db.add(log)
    db.commit()
    
    # WebSocket orqali barcha adminlarga signal yuborish
    try:
        await manager.broadcast({
            "event": "NEW_BROADCAST",
            "message": message,
            "created_at": log.created_at.isoformat() if log.created_at else datetime.now().isoformat()
        })
    except Exception as e:
        print(f"WebSocket broadcast error: {e}")
    
    return {"status": "success", "sent_to": sent_count, "message": message}

# --- SUPERADMIN: BARCHA FOYDALANUVCHILAR (kengaytirilgan) ---
@app.get("/superadmin/users/detailed")
async def get_detailed_users(u: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not u.is_superadmin: raise HTTPException(status_code=403)
    users = db.query(DBUser).filter(DBUser.is_superadmin == 0).all()
    now = datetime.now()
    res = []
    for user in users:
        try:
            booking_count = db.query(DBBooking).filter(DBBooking.owner_id == user.id).count()
            last_booking = db.query(DBBooking).filter(DBBooking.owner_id == user.id).order_by(desc(DBBooking.created_at)).first()
            sub_days_left = (user.subscription_until - now).days if user.subscription_until and user.subscription_until > now else 0
            is_active = getattr(user, 'is_active', 1)  # safe: default 1 if column missing
            phone = getattr(user, 'phone', None)
            res.append({
                "id": user.id,
                "username": user.username,
                "shop_name": user.shop_name or "Nomsiz",
                "balance": user.balance or 0,
                "bot_token": bool(user.bot_token),
                "is_active": bool(is_active if is_active is not None else 1),
                "subscription_until": user.subscription_until.isoformat() if user.subscription_until else None,
                "subscription_days_left": sub_days_left,
                "total_bookings": booking_count,
                "last_activity": last_booking.created_at.isoformat() if last_booking else None,
                "phone": phone
            })
        except Exception as e:
            print(f"Error processing user {user.id}: {e}")
            res.append({
                "id": user.id,
                "username": user.username,
                "shop_name": user.shop_name or "Nomsiz",
                "balance": 0,
                "bot_token": bool(user.bot_token),
                "is_active": True,
                "subscription_until": None,
                "subscription_days_left": 0,
                "total_bookings": 0,
                "last_activity": None,
                "phone": None
            })
    return res

# --- WEBSOCKET ---
@app.websocket("/ws/queue")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect: manager.disconnect(websocket)

# --- SERVE FRONTEND ---
if os.path.exists("out"):
    print("DEBUG: 'out' directory found. Setting up static serving...")
    # Only mount existing sub-directories to avoid Starlette errors
    for subdir in ["_next", "static"]:
        full_subdir_path = os.path.join("out", subdir)
        if os.path.exists(full_subdir_path):
            print(f"DEBUG: Mounting static directory: /{subdir}")
            try:
                app.mount(f"/{subdir}", StaticFiles(directory=full_subdir_path), name=f"static_{subdir}")
            except Exception as e:
                print(f"DEBUG: Failed to mount {subdir}: {e}")

@app.get("/{path:path}")
async def serve_spa(path: str):
    # If path is empty or root
    if not path or path == "/":
        return FileResponse("out/index.html")
    
    # Check if file exists exactly as requested
    full_path = os.path.join("out", path)
    if os.path.isfile(full_path):
        return FileResponse(full_path)
    
    # Check if it's a clean URL (e.g., /login -> login.html)
    html_path = full_path + ".html"
    if os.path.isfile(html_path):
        return FileResponse(html_path)
    
    # Support for directory index (e.g., /login/ -> /login/index.html)
    dir_index = os.path.join(full_path, "index.html")
    if os.path.isfile(dir_index):
        return FileResponse(dir_index)
        
    # Fallback to index.html for SPA routing (only for page requests, not files)
    if "." not in path:
        return FileResponse("out/index.html")
        
    raise HTTPException(status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
