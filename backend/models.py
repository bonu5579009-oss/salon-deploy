from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime
import enum

Base = declarative_base()

class BookingStatus(enum.Enum):
    PENDING = "PENDING"
    CALLED = "CALLED"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    SKIPPED = "SKIPPED"
    CANCELLED = "CANCELLED"

class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    OPERATOR = "OPERATOR"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(SQLEnum(UserRole), default=UserRole.OPERATOR)

class Barber(Base):
    __tablename__ = "barbers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    is_active = Column(Boolean, default=True)
    bookings = relationship("Booking", back_populates="barber")

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    duration_minutes = Column(Integer)
    price = Column(Integer)

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    queue_number = Column(Integer)
    customer_name = Column(String)
    customer_phone = Column(String)
    service_id = Column(Integer, ForeignKey("services.id"))
    barber_id = Column(Integer, ForeignKey("barbers.id"))
    appointment_time = Column(DateTime)
    status = Column(SQLEnum(BookingStatus), default=BookingStatus.PENDING)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    barber = relationship("Barber", back_populates="bookings")
    service = relationship("Service")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String) # e.g., 'CALL', 'SKIP'
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
