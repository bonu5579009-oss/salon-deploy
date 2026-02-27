import asyncio
import logging
import os
import qrcode
import io
import aiohttp
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext
from aiogram.types import BufferedInputFile
from datetime import datetime, timedelta
from dotenv import load_dotenv
from translations import t

# --- Config ---
load_dotenv()
PORT = os.getenv("PORT", "10000")
API_URL = os.getenv("API_URL", f"http://127.0.0.1:{PORT}")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
print(f"DEBUG: Bot connecting to API at {API_URL}")

class BookingStates(StatesGroup):
    choosing_language = State()
    choosing_service = State()
    choosing_barber = State()
    choosing_time = State()
    requesting_phone = State()
    confirming = State()

# --- Utility ---
bot_owner_map = {}  # {bot_id: owner_id}

def lang_keyboard():
    builder = InlineKeyboardBuilder()
    builder.row(
        types.InlineKeyboardButton(text="🇺🇿 O'zbek", callback_data="lang_uz"),
        types.InlineKeyboardButton(text="🇷🇺 Русский", callback_data="lang_ru")
    )
    return builder.as_markup()

def main_menu(lang: str = "uz"):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text=t(lang, "book"), callback_data="book"))
    builder.row(types.InlineKeyboardButton(text=t(lang, "my_bookings"), callback_data="my_bookings"))
    builder.row(types.InlineKeyboardButton(text=t(lang, "services"), callback_data="services"))
    builder.row(types.InlineKeyboardButton(text=t(lang, "location"), callback_data="location"))
    builder.row(types.InlineKeyboardButton(text=t(lang, "barbers"), callback_data="barbers"))
    builder.row(types.InlineKeyboardButton(text=t(lang, "contact"), callback_data="contact"))
    builder.row(types.InlineKeyboardButton(text="🌐 UZ / RU", callback_data="change_lang"))
    return builder.as_markup()

async def services_menu(owner_id: int, lang: str = "uz"):
    builder = InlineKeyboardBuilder()
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/public/services/{owner_id}") as resp:
            if resp.status == 200:
                services = await resp.json()
                for s in services:
                    builder.row(types.InlineKeyboardButton(
                        text=f"💇‍♂️ {s['name']} - {s['price']:,} UZS".replace(",", " "),
                        callback_data=f"service_{s['name']}"
                    ))
    builder.row(types.InlineKeyboardButton(text=t(lang, "back"), callback_data="back_to_main"))
    return builder.as_markup()

async def barber_menu(owner_id: int, lang: str = "uz"):
    builder = InlineKeyboardBuilder()
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/public/barbers/{owner_id}") as resp:
            if resp.status == 200:
                barbers = await resp.json()
                for b in barbers:
                    builder.row(types.InlineKeyboardButton(text=f"🧔 {b['name']}", callback_data=f"barber_{b['name']}"))
    builder.row(types.InlineKeyboardButton(text=t(lang, "back"), callback_data="book"))
    return builder.as_markup()

async def time_menu(owner_id: int, barber_name: str, lang: str = "uz"):
    builder = InlineKeyboardBuilder()
    work_start, work_end, interval = "09:00", "20:00", 30

    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/public/settings/{owner_id}") as resp:
            if resp.status == 200:
                st = await resp.json()
                work_start = st.get("work_start", "09:00")
                work_end = st.get("work_end", "20:00")
                interval = int(st.get("slot_interval", "30"))

        async with session.get(f"{API_URL}/admin/barbers/{barber_name}/busy-times?owner_id={owner_id}") as resp:
            busy_times = await resp.json() if resp.status == 200 else []

    start_dt = datetime.strptime(work_start, "%H:%M")
    end_dt = datetime.strptime(work_end, "%H:%M")
    curr = start_dt
    while curr < end_dt:
        slot = curr.strftime("%H:%M")
        if slot in busy_times:
            builder.add(types.InlineKeyboardButton(text=f"❌ {slot}", callback_data="busy"))
        else:
            builder.add(types.InlineKeyboardButton(text=slot, callback_data=f"time_{slot}"))
        curr += timedelta(minutes=interval)

    builder.adjust(3)
    builder.row(types.InlineKeyboardButton(text=t(lang, "back"), callback_data="book"))
    return builder.as_markup()

# --- Dispatcher ---
dp = Dispatcher()

# --- START ---
@dp.message(Command("start"))
async def start_cmd(message: types.Message, state: FSMContext, bot: Bot):
    await state.clear()
    await state.set_state(BookingStates.choosing_language)
    await message.answer_photo(
        photo="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800",
        caption="🌐 <b>Tilni tanlang / Выберите язык:</b>",
        reply_markup=lang_keyboard(),
        parse_mode="HTML"
    )

# --- Language Selection ---
@dp.callback_query(F.data.in_({"lang_uz", "lang_ru"}))
async def select_language(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = "uz" if callback.data == "lang_uz" else "ru"
    await state.update_data(lang=lang)
    await state.set_state(None)  # Clear language selection state

    owner_id = bot_owner_map.get(bot.id)
    shop_name = "Barber Shop"
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/public/queue/{owner_id}") as resp:
            if resp.status == 200:
                shop_name = (await resp.json()).get("shop_name", "Barber Shop")

    await callback.message.edit_caption(
        caption=t(lang, "welcome", shop_name=shop_name),
        reply_markup=main_menu(lang),
        parse_mode="Markdown"
    )
    await callback.answer()

# --- Change Language ---
@dp.callback_query(F.data == "change_lang")
async def change_lang_handler(callback: types.CallbackQuery, state: FSMContext):
    await state.set_state(BookingStates.choosing_language)
    await callback.message.edit_caption(
        caption="🌐 <b>Tilni tanlang / Выберите язык:</b>",
        reply_markup=lang_keyboard(),
        parse_mode="HTML"
    )
    await callback.answer()

# --- Helper to get lang from state ---
async def get_lang(state: FSMContext) -> str:
    data = await state.get_data()
    return data.get("lang", "uz")

# --- SERVICES ---
@dp.callback_query(F.data == "services")
async def show_services(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    owner_id = bot_owner_map.get(bot.id)
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/public/services/{owner_id}") as resp:
            if resp.status == 200:
                services = await resp.json()
                if not services:
                    await callback.answer(t(lang, "no_services"), show_alert=True)
                    return

                txt = t(lang, "services_title")
                for s in services:
                    price = f"{s['price']:,}".replace(",", " ")
                    txt += f"🔹 **{s['name']}** — {price} UZS\n"

                builder = InlineKeyboardBuilder()
                builder.row(types.InlineKeyboardButton(text=t(lang, "back"), callback_data="back_to_main"))
                await callback.message.edit_caption(caption=txt, reply_markup=builder.as_markup(), parse_mode="Markdown")
            else:
                await callback.answer(t(lang, "error_fetch"), show_alert=True)

# --- BARBERS ---
@dp.callback_query(F.data == "barbers")
async def show_barbers(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    owner_id = bot_owner_map.get(bot.id)
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/public/barbers/{owner_id}") as resp:
            if resp.status == 200:
                barbers = await resp.json()
                if not barbers:
                    await callback.answer(t(lang, "no_barbers"), show_alert=True)
                    return

                txt = t(lang, "barbers_title")
                for b in barbers:
                    txt += f"✅ **{b['name']}**\n"
                txt += t(lang, "barbers_note")

                builder = InlineKeyboardBuilder()
                builder.row(types.InlineKeyboardButton(text=t(lang, "book_now"), callback_data="book"))
                builder.row(types.InlineKeyboardButton(text=t(lang, "back"), callback_data="back_to_main"))
                await callback.message.edit_caption(caption=txt, reply_markup=builder.as_markup(), parse_mode="Markdown")
            else:
                await callback.answer(t(lang, "error_fetch"), show_alert=True)

# --- LOCATION ---
@dp.callback_query(F.data == "location")
async def show_location(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    owner_id = bot_owner_map.get(bot.id)
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/public/settings/{owner_id}") as resp:
            address = "Toshkent sh." if lang == "uz" else "г. Ташкент"
            if resp.status == 200:
                settings = await resp.json()
                address = settings.get("address", address)

    txt = f"📍 **{'Bizning manzilimiz' if lang == 'uz' else 'Наш адрес'}:**\n\n{address}\n\n📞 Tel: +998 93 557 90 06"
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text=t(lang, "map_view"), url="https://maps.google.com"))
    builder.row(types.InlineKeyboardButton(text=t(lang, "back"), callback_data="back_to_main"))
    await callback.message.edit_caption(caption=txt, reply_markup=builder.as_markup(), parse_mode="Markdown")

# --- CONTACT ---
@dp.callback_query(F.data == "contact")
async def show_contact(callback: types.CallbackQuery, state: FSMContext):
    lang = await get_lang(state)
    txt = t(lang, "contact_text",
        address="Toshkent sh." if lang == "uz" else "г. Ташкент",
        phone="+998 93 557 90 06",
        telegram="@Osiyo9006",
        work_start="09:00",
        work_end="20:00"
    )
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text=t(lang, "back"), callback_data="back_to_main"))
    await callback.message.edit_caption(caption=txt, reply_markup=builder.as_markup(), parse_mode="Markdown")

# --- BACK TO MAIN ---
@dp.callback_query(F.data == "back_to_main")
async def back_to_main_handler(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    # Preserve lang when clearing state
    await state.set_state(None)

    owner_id = bot_owner_map.get(bot.id)
    shop_name = "Barber Shop"
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/public/queue/{owner_id}") as resp:
            if resp.status == 200:
                shop_name = (await resp.json()).get("shop_name", "Barber Shop")

    try:
        await callback.message.answer(t(lang, "main_returned"), reply_markup=types.ReplyKeyboardRemove())
    except:
        pass

    try:
        await callback.message.edit_caption(
            caption=t(lang, "welcome", shop_name=shop_name),
            reply_markup=main_menu(lang),
            parse_mode="Markdown"
        )
    except:
        await callback.message.answer(
            t(lang, "welcome", shop_name=shop_name),
            reply_markup=main_menu(lang),
            parse_mode="Markdown"
        )
    await callback.answer()

# --- BOOK ---
@dp.callback_query(F.data == "book")
async def book_start(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    owner_id = bot_owner_map.get(bot.id)
    await state.set_state(BookingStates.choosing_service)
    await callback.message.edit_caption(
        caption=t(lang, "choose_service"),
        reply_markup=await services_menu(owner_id, lang)
    )

@dp.callback_query(BookingStates.choosing_service, F.data.startswith("service_"))
async def select_barber(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    owner_id = bot_owner_map.get(bot.id)
    service = callback.data.replace("service_", "")
    await state.update_data(service=service)
    await state.set_state(BookingStates.choosing_barber)
    await callback.message.edit_caption(
        caption=t(lang, "choose_barber", service=service),
        reply_markup=await barber_menu(owner_id, lang),
        parse_mode="Markdown"
    )

@dp.callback_query(BookingStates.choosing_barber, F.data.startswith("barber_"))
async def select_time(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    owner_id = bot_owner_map.get(bot.id)
    barber = callback.data.replace("barber_", "")
    await state.update_data(barber=barber)
    await state.set_state(BookingStates.choosing_time)
    await callback.message.edit_caption(
        caption=t(lang, "choose_time", barber=barber),
        reply_markup=await time_menu(owner_id, barber, lang),
        parse_mode="Markdown"
    )

@dp.callback_query(BookingStates.choosing_time, F.data.startswith("time_"))
async def get_phone(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    time_val = callback.data[5:]
    await state.update_data(time=time_val)

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{API_URL}/public/customer/{callback.from_user.id}/phone") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get("phone"):
                        await state.update_data(phone=data["phone"])
                        await state.set_state(BookingStates.confirming)
                        d = await state.get_data()
                        builder = InlineKeyboardBuilder()
                        builder.row(
                            types.InlineKeyboardButton(text=t(lang, "confirm_btn"), callback_data="confirm_ok"),
                            types.InlineKeyboardButton(text=t(lang, "cancel_btn"), callback_data="back_to_main")
                        )
                        await callback.message.edit_caption(
                            caption=t(lang, "confirm_title",
                                service=d.get('service', '-'),
                                barber=d.get('barber', '-'),
                                time=d.get('time', '-'),
                                phone=d.get('phone', '-')
                            ),
                            reply_markup=builder.as_markup(),
                            parse_mode="Markdown"
                        )
                        return
    except Exception as e:
        logger.error(f"Error checking phone: {e}")

    await state.set_state(BookingStates.requesting_phone)
    try:
        await callback.message.delete()
    except:
        pass

    builder = ReplyKeyboardBuilder()
    builder.row(types.KeyboardButton(text=t(lang, "send_phone_btn"), request_contact=True))
    await bot.send_message(
        chat_id=callback.message.chat.id,
        text=t(lang, "request_phone", time=time_val),
        reply_markup=builder.as_markup(resize_keyboard=True, one_time_keyboard=True),
        parse_mode="Markdown"
    )
    await callback.answer()

@dp.message(BookingStates.requesting_phone, F.contact | F.text)
async def confirm_step(message: types.Message, state: FSMContext):
    lang = await get_lang(state)
    phone = message.contact.phone_number if message.contact else message.text

    if not message.contact:
        clean_phone = "".join(filter(str.isdigit, phone))
        if len(clean_phone) < 7:
            await message.answer(t(lang, "phone_error"))
            return
        phone = "+" + clean_phone if not phone.startswith("+") else phone

    await state.update_data(phone=phone)
    d = await state.get_data()

    await message.answer(t(lang, "thanks_phone"), reply_markup=types.ReplyKeyboardRemove())

    builder = InlineKeyboardBuilder()
    builder.row(
        types.InlineKeyboardButton(text=t(lang, "confirm_btn"), callback_data="confirm_ok"),
        types.InlineKeyboardButton(text=t(lang, "cancel_btn"), callback_data="back_to_main")
    )

    await message.answer(
        t(lang, "confirm_title",
          service=d.get('service', '-'),
          barber=d.get('barber', '-'),
          time=d.get('time', '-'),
          phone=d.get('phone', '-')
        ),
        reply_markup=builder.as_markup(),
        parse_mode="Markdown"
    )

@dp.callback_query(F.data == "confirm_ok")
async def save_booking(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    owner_id = bot_owner_map.get(bot.id)
    d = await state.get_data()

    if not owner_id:
        await callback.answer("Xatolik: Bot sozlamalari noto'g'ri." if lang == "uz" else "Ошибка: Неверные настройки бота.", show_alert=True)
        return

    payload = {
        "owner_id": owner_id,
        "customer_name": callback.from_user.full_name,
        "customer_phone": d.get('phone'),
        "chat_id": callback.from_user.id,
        "service": d.get('service'),
        "barber": d.get('barber'),
        "appointment_time": d.get('time')
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{API_URL}/public/bookings", json=payload) as resp:
            if resp.status == 200:
                res = await resp.json()
                num = res.get('booking', {}).get('num', '??')
                shop = res.get('shop_name', 'Barber')

                await callback.message.answer(t(lang, "ticket_preparing"), reply_markup=types.ReplyKeyboardRemove())

                qr_txt = f"#{num} | {shop} | {d.get('barber','-')} | {d.get('time','-')}"
                qr = qrcode.make(qr_txt)
                bio = io.BytesIO()
                qr.save(bio, "PNG")
                bio.seek(0)

                builder = InlineKeyboardBuilder()
                builder.row(types.InlineKeyboardButton(text=t(lang, "back_to_main"), callback_data="back_to_main"))

                await callback.message.answer_photo(
                    photo=BufferedInputFile(bio.read(), filename="ticket.png"),
                    caption=t(lang, "book_success", num=num, shop=shop),
                    reply_markup=builder.as_markup(),
                    parse_mode="Markdown"
                )
            else:
                await callback.answer(t(lang, "book_error"), show_alert=True)
    await state.set_state(None)

# --- MY BOOKINGS ---
@dp.callback_query(F.data == "my_bookings")
async def show_my_bookings(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/public/customer/{callback.from_user.id}/active-bookings") as resp:
            if resp.status == 200:
                bookings = await resp.json()
                if not bookings:
                    await callback.answer(t(lang, "no_bookings"), show_alert=True)
                    return

                txt = t(lang, "my_bookings_title")
                builder = InlineKeyboardBuilder()
                for b in bookings:
                    txt += f"🔢 #{b['num']}\n✂️ {b['service']}\n🧔 {b['barber']}\n⏰ {b['time']}\n---\n"
                    builder.row(types.InlineKeyboardButton(
                        text=t(lang, "cancel_booking", num=b['num']),
                        callback_data=f"cancel_{b['id']}"
                    ))

                builder.row(types.InlineKeyboardButton(text=t(lang, "back"), callback_data="back_to_main"))

                if callback.message.photo:
                    await callback.message.answer(txt, reply_markup=builder.as_markup(), parse_mode="Markdown")
                    await callback.message.delete()
                else:
                    await callback.message.edit_text(txt, reply_markup=builder.as_markup(), parse_mode="Markdown")
            else:
                await callback.answer(t(lang, "error_fetch"), show_alert=True)

@dp.callback_query(F.data.startswith("cancel_"))
async def cancel_booking_handler(callback: types.CallbackQuery, state: FSMContext, bot: Bot):
    lang = await get_lang(state)
    bid = callback.data.replace("cancel_", "")
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{API_URL}/public/bookings/{bid}/cancel", json={"chat_id": callback.from_user.id}) as resp:
            if resp.status == 200:
                await callback.answer(t(lang, "booking_cancelled"), show_alert=True)
                await show_my_bookings(callback, state, bot)
            else:
                await callback.answer(t(lang, "cancel_error"), show_alert=True)

# --- Multi-Bot Manager ---
running_bots_instances = {}
polling_task = None

async def wait_for_backend():
    print(f"DEBUG: Waiting for backend at {API_URL}...")
    async with aiohttp.ClientSession() as session:
        for i in range(100):
            try:
                async with session.get(f"{API_URL}/bot/active-tokens", timeout=5) as resp:
                    if resp.status == 200:
                        print("DEBUG: Backend is ready!")
                        return True
            except Exception as e:
                if i % 5 == 0:
                    print(f"DEBUG: Backend not ready yet... ({e})")
            await asyncio.sleep(3)
    return False

async def notification_loop():
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{API_URL}/bot/pending-turns") as resp:
                    if resp.status == 200:
                        turns = await resp.json()
                        for turn in turns:
                            try:
                                async with Bot(token=turn['bot_token']) as temp_bot:
                                    # Send in both languages (or detect from saved preference)
                                    msg_uz = t("uz", "notification_turn", num=turn['num'], barber=turn['barber'])
                                    msg_ru = t("ru", "notification_turn", num=turn['num'], barber=turn['barber'])
                                    await temp_bot.send_message(
                                        chat_id=turn['chat_id'],
                                        text=f"{msg_uz}\n\n{msg_ru}",
                                        parse_mode="Markdown"
                                    )
                            except Exception as e:
                                logger.error(f"Failed to send turn notification: {e}")

                async with session.get(f"{API_URL}/admin/reminders/due") as resp:
                    if resp.status == 200:
                        rems = await resp.json()
                        for r in rems:
                            if r['bot_token']:
                                try:
                                    async with Bot(token=r['bot_token']) as temp_bot:
                                        msg_uz = t("uz", "reminder", barber=r['barber'])
                                        msg_ru = t("ru", "reminder", barber=r['barber'])
                                        await temp_bot.send_message(
                                            chat_id=r['chat_id'],
                                            text=f"{msg_uz}\n\n{msg_ru}"
                                        )
                                except Exception as e:
                                    logger.error(f"Failed to send reminder: {e}")
        except Exception as e:
            logger.error(f"Notification loop error: {e}")
        await asyncio.sleep(20)

async def keep_alive_loop():
    """Har 10 daqiqada backend ga ping yuboradi — uxlab qolmaslik uchun."""
    await asyncio.sleep(30)  # Birinchi startda biroz kuting
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{API_URL}/ping", timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status == 200:
                        logger.info(f"✅ Keep-alive ping OK")
                    else:
                        logger.warning(f"⚠️ Keep-alive ping: {resp.status}")
        except Exception as e:
            logger.warning(f"⚠️ Keep-alive ping failed: {e}")
        await asyncio.sleep(600)  # 10 daqiqa

async def manager_loop():
    global polling_task

    if not await wait_for_backend():
        logger.error("Backend not reachable. Bot manager exiting.")
        return

    asyncio.create_task(notification_loop())
    asyncio.create_task(keep_alive_loop())  # 🔄 Keep-alive
    last_tokens = set()

    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{API_URL}/bot/active-tokens") as resp:
                    if resp.status == 200:
                        active_bots_data = await resp.json()
                        active_tokens_map = {b['token']: b['owner_id'] for b in active_bots_data}
                        current_tokens = set(active_tokens_map.keys())

                        if current_tokens != last_tokens:
                            logger.info("Bots list changed. Updating polling...")

                            if polling_task:
                                polling_task.cancel()
                                try:
                                    await polling_task
                                except asyncio.CancelledError:
                                    pass

                            for token, b in running_bots_instances.items():
                                await b.session.close()
                            running_bots_instances.clear()
                            bot_owner_map.clear()

                            if current_tokens:
                                bots_to_start = []
                                for token, oid in active_tokens_map.items():
                                    try:
                                        new_bot = Bot(token=token)
                                        bot_info = await new_bot.get_me()
                                        bot_owner_map[bot_info.id] = oid
                                        running_bots_instances[token] = new_bot
                                        bots_to_start.append(new_bot)
                                        new_bot._id = bot_info.id
                                        logger.info(f"✅ Bot @{bot_info.username} ready (ID: {bot_info.id}, Owner: {oid})")
                                    except Exception as e:
                                        logger.error(f"❌ Failed to start bot: {repr(e)}")

                                if bots_to_start:
                                    polling_task = asyncio.create_task(dp.start_polling(*bots_to_start, skip_updates=True))
                                    logger.info(f"🚀 Started polling for {len(bots_to_start)} bots")

                            last_tokens = current_tokens
        except Exception as e:
            logger.error(f"Manager error: {e}")
        await asyncio.sleep(15)

if __name__ == "__main__":
    try:
        asyncio.run(manager_loop())
    except (KeyboardInterrupt, SystemExit):
        pass
