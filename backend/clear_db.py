from main import SessionLocal, DBBooking, DBBarber

def clear_data():
    db = SessionLocal()
    try:
        # 1. Barcha eski navbatlarni o'chirish
        num_deleted = db.query(DBBooking).delete()
        print(f"{num_deleted} ta eski navbat o'chirildi.")
        
        # 2. Ustalar ro'yxatini tozalash va faqat siz xohlaganlarni qoldirish
        # (Alisher, Bobur, Sardor demo ma'lumotlar edi, siz Sultonbek va Mashxurbekni xohlagan edingiz)
        db.query(DBBarber).delete()
        
        valid_barbers = ["Sultonbek", "Mashxur bek"]
        for name in valid_barbers:
            db.add(DBBarber(name=name, is_active=1))
            
        db.commit()
        print("Baza tozalangan holatga keltirildi!")
    except Exception as e:
        print(f"Xatolik: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_data()
