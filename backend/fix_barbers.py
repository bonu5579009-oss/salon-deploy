from main import SessionLocal, DBBarber, DBBooking

def fix():
    db = SessionLocal()
    try:
        # 1. Eski ustalarni o'chirish (agar ular biz xohlaganlar bo'lmasa)
        valid_barbers = ["Sultonbek", "Mashxur bek"]
        
        # Hamma mavjud ustalarni ko'ramiz
        current_barbers = db.query(DBBarber).all()
        for b in current_barbers:
            if b.name not in valid_barbers:
                print(f"O'chirilmoqda: {b.name}")
                # Bu ustaga tegishli navbatlarni eng yaqin ustaga o'tkazish (ixtiyoriy)
                # db.query(DBBooking).filter(DBBooking.barber == b.name).update({"barber": "Sultonbek"})
                db.delete(b)
        
        # 2. Kerakli ustalarni qo'shish (agar yo'q bo'lsa)
        for name in valid_barbers:
            exists = db.query(DBBarber).filter(DBBarber.name == name).first()
            if not exists:
                print(f"Qo'shilmoqda: {name}")
                db.add(DBBarber(name=name, is_active=1))
        
        db.commit()
        print("Baza tozalandi! Faqat Sultonbek va Mashxur bek qoldi.")
    except Exception as e:
        print(f"Xato: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix()
