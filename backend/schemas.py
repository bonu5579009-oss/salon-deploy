from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models import BookingStatus, UserRole

class ServiceBase(BaseModel):
    name: str
    duration_minutes: int
    price: int

class ServiceSchema(ServiceBase):
    id: int
    class Config:
        from_attributes = True

class BarberBase(BaseModel):
    name: str
    is_active: bool

class BarberSchema(BarberBase):
    id: int
    class Config:
        from_attributes = True

class BookingBase(BaseModel):
    customer_name: str
    customer_phone: str
    service_id: int
    barber_id: int
    appointment_time: datetime

class BookingSchema(BookingBase):
    id: int
    queue_number: int
    status: BookingStatus
    created_at: datetime
    barber: BarberSchema
    service: ServiceSchema
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserSchema(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
