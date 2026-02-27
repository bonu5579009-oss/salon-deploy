// Web site translations - UZ and RU

export const translations = {
    uz: {
        // Login page
        login_title: "Beauty Ladies Salon",
        login_subtitle: "Premium Navbat Boshqaruv Tizimi",
        login_btn: "KIRISH",
        register_btn: "RO'YXATDAN O'TISH",
        username_label: "Login (Username)",
        username_placeholder: "barber_admin",
        password_label: "Parol",
        password_placeholder: "••••••••",
        shop_name_label: "Sartaroshxona Nomi",
        shop_name_placeholder: "Beauty Ladies Salon",
        submit_login: "KIRISH",
        submit_register: "RO'YXATDAN O'TISH",
        contact_title: "Murojat uchun",
        phone_label: "Telefon",
        telegram_label: "Telegram",
        network_error: "Serverga ulanib bo'lmadi (Network Error)",
        register_success: "Muvaffaqiyatli ro'yxatdan o'tdingiz! Endi kirishingiz mumkin.",

        // Admin page
        admin_title: "Admin Panel",
        bookings_title: "Bugungi Navbatlar",
        total_today: "Bugun jami",
        waiting: "Kutmoqda",
        in_progress: "Jarayonda",
        done_today: "Bajarildi",
        call_btn: "Chaqirish",
        start_btn: "Boshlash",
        done_btn: "Tayyor",
        no_bookings: "Hozircha navbat yo'q",

        // Settings
        settings_title: "Sozlamalar",
        shop_name_setting: "Sartaroshxona Nomi",
        work_start: "Ish boshlanish vaqti",
        work_end: "Ish tugash vaqti",
        slot_interval: "Navbat intervali (daqiqa)",
        address: "Manzil",
        bot_token: "Bot Token",
        ad_video: "Reklama Video URL",
        save_btn: "Saqlash",
        saved_msg: "Saqlandi!",

        // Super Admin
        super_admin_title: "Super Admin",
        shops_list: "Sartaroshxonalar",
        create_shop: "Yangi Sartaroshxona",
        shop_username: "Login",
        shop_password: "Parol",
        create_btn: "Yaratish",
        delete_btn: "O'chirish",
        global_settings: "Global Sozlamalar",
        ad_text_label: "Reklama Matni",
        ad_video_label: "Reklama Video (YouTube)",
        update_btn: "Yangilash",
        billing: "Mablag'",
        logout_btn: "Chiqish",

        // Queue/Screen
        queue_title: "Navbat ro'yxati",
        now_serving: "Xizmat ko'rsatilmoqda",
        waiting_queue: "Kutish navbati",
        empty_queue: "Navbat bo'sh",
        advertisement: "REKLAMA",

        // Common
        loading: "Yuklanmoqda...",
        error: "Xatolik",
        back: "Orqaga",
        cancel: "Bekor qilish",
        confirm: "Tasdiqlash",
        edit: "Tahrirlash",
        add: "Qo'shish",
        name: "Ism",
        price: "Narx",
        status: "Holat",
        time: "Vaqt",
        barber: "Usta",
        service: "Xizmat",
        phone: "Telefon",
        customer: "Mijoz",
    },
    ru: {
        // Login page
        login_title: "Beauty Ladies Salon",
        login_subtitle: "Система Управления Очередями Premium",
        login_btn: "ВОЙТИ",
        register_btn: "РЕГИСТРАЦИЯ",
        username_label: "Логин (Username)",
        username_placeholder: "barber_admin",
        password_label: "Пароль",
        password_placeholder: "••••••••",
        shop_name_label: "Название Салона",
        shop_name_placeholder: "Beauty Ladies Salon",
        submit_login: "ВОЙТИ",
        submit_register: "ЗАРЕГИСТРИРОВАТЬСЯ",
        contact_title: "Для связи",
        phone_label: "Телефон",
        telegram_label: "Telegram",
        network_error: "Не удаётся подключиться к серверу",
        register_success: "Вы успешно зарегистрировались! Теперь можете войти.",

        // Admin page
        admin_title: "Панель Администратора",
        bookings_title: "Сегодняшние Записи",
        total_today: "Сегодня всего",
        waiting: "Ожидает",
        in_progress: "В процессе",
        done_today: "Завершено",
        call_btn: "Вызвать",
        start_btn: "Начать",
        done_btn: "Готово",
        no_bookings: "Пока нет записей",

        // Settings
        settings_title: "Настройки",
        shop_name_setting: "Название Салона",
        work_start: "Начало работы",
        work_end: "Конец работы",
        slot_interval: "Интервал записи (минуты)",
        address: "Адрес",
        bot_token: "Bot Token",
        ad_video: "URL рекламного видео",
        save_btn: "Сохранить",
        saved_msg: "Сохранено!",

        // Super Admin
        super_admin_title: "Супер Администратор",
        shops_list: "Салоны",
        create_shop: "Новый Салон",
        shop_username: "Логин",
        shop_password: "Пароль",
        create_btn: "Создать",
        delete_btn: "Удалить",
        global_settings: "Глобальные Настройки",
        ad_text_label: "Рекламный Текст",
        ad_video_label: "Рекламное Видео (YouTube)",
        update_btn: "Обновить",
        billing: "Финансы",
        logout_btn: "Выйти",

        // Queue/Screen
        queue_title: "Список очереди",
        now_serving: "Обслуживается",
        waiting_queue: "Очередь ожидания",
        empty_queue: "Очередь пуста",
        advertisement: "РЕКЛАМА",

        // Common
        loading: "Загрузка...",
        error: "Ошибка",
        back: "Назад",
        cancel: "Отмена",
        confirm: "Подтвердить",
        edit: "Редактировать",
        add: "Добавить",
        name: "Имя",
        price: "Цена",
        status: "Статус",
        time: "Время",
        barber: "Мастер",
        service: "Услуга",
        phone: "Телефон",
        customer: "Клиент",
    }
};

export type Lang = "uz" | "ru";
export type TranslationKey = keyof typeof translations.uz;

export function t(lang: Lang, key: TranslationKey): string {
    return translations[lang]?.[key] || translations.uz[key] || key;
}
