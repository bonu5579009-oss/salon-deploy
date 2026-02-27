"use client";
import { API_URL, WS_URL } from "@/app/config";


import React, { useState, useEffect } from "react";
import { Clock, Scissors, Trash2, Edit3, Save, Plus, RefreshCw, Bot, Store, ExternalLink, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Service {
    id: number;
    name: string;
    price: number;
    duration: string;
}

export default function Settings() {
    const [services, setServices] = useState<Service[]>([]);
    const [shopSettings, setShopSettings] = useState({
        work_start: "09:00",
        work_end: "20:00",
        slot_interval: "30",
        bot_token: "",
        shop_name: "",
        shop_id: "",
        ad_video_url: ""
    });
    const [loading, setLoading] = useState(true);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceFormData, setServiceFormData] = useState({ name: "", price: "", duration: "30 min" });

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { 'Authorization': `Bearer ${token}` };

        try {


            const sResp = await fetch(`${API_URL}/admin/services`, { headers });
            if (sResp.ok) setServices(await sResp.json());

            const stResp = await fetch(`${API_URL}/admin/settings`, { headers });
            if (stResp.ok) setShopSettings(await stResp.json());

        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveShopSettings = async () => {
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${API_URL}/admin/settings`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(shopSettings)
            });
            if (resp.ok) {
                alert("Sozlamalar saqlandi!");
                fetchData();
            }
        } catch (err) {
            console.error("Save settings error:", err);
        }
    };

    const handleSaveService = async () => {
        if (!serviceFormData.name || !serviceFormData.price) return;
        const token = localStorage.getItem("token");

        const payload = {
            name: serviceFormData.name,
            price: parseInt(serviceFormData.price.toString()),
            duration: serviceFormData.duration
        };

        try {
            const url = editingService
                ? `${API_URL}/admin/services/${editingService.id}`
                : `${API_URL}/admin/services`;

            const resp = await fetch(url, {
                method: editingService ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (resp.ok) {
                setIsServiceModalOpen(false);
                fetchData();
            }
        } catch (err) {
            console.error("Save service error:", err);
        }
    };

    const handleDeleteService = async (id: number) => {
        if (!confirm("Haqiqatan ham bu xizmatni o'chirmoqchimisiz?")) return;
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${API_URL}/admin/services/${id}`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) fetchData();
        } catch (err) {
            console.error("Delete service error:", err);
        }
    };

    return (
        <div className="max-w-5xl space-y-12 pb-20 font-sans">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter">Boshqaruv Markazi</h3>
                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Profil va Xizmatlarni sozlash</p>
                </div>
                <button onClick={fetchData} className="p-4 bg-white border border-slate-100 rounded-3xl text-slate-400 hover:text-amber-500 transition-all shadow-sm">
                    <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                </button>
            </header>

            {/* Shop Profile & Bot Section */}
            <section className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-50">
                <div className="flex items-center gap-6 mb-12 pb-10 border-b border-slate-50 text-slate-900">
                    <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[2rem] shadow-inner">
                        <Store size={32} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black uppercase italic tracking-tight">Do'kon va Bot</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">SaaS Profil Sozlamalari</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Sartaroshxona Nomi</label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500/50 rounded-[2rem] px-8 py-6 text-xl font-black italic text-slate-800 outline-none transition-all shadow-inner"
                            value={shopSettings.shop_name}
                            onChange={(e) => setShopSettings({ ...shopSettings, shop_name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 font-black">Telegram Bot Token</label>
                        <div className="relative">
                            <Bot className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                            <input
                                type="password"
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500/50 rounded-[2rem] pl-16 pr-8 py-6 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner"
                                placeholder="1234567890:ABC..."
                                value={shopSettings.bot_token || ""}
                                onChange={(e) => setShopSettings({ ...shopSettings, bot_token: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Ad Video URL Input */}
                    <div className="space-y-4 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 font-black">Monitor Reklama Videosi (YouTube Link)</label>
                        <div className="relative">
                            <Play className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                            <input
                                type="text"
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500/50 rounded-[2rem] pl-16 pr-8 py-6 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={shopSettings.ad_video_url || ""}
                                onChange={(e) => setShopSettings({ ...shopSettings, ad_video_url: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-10 p-8 bg-amber-50/50 border-2 border-amber-500/10 rounded-[2.5rem] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-amber-500">
                            <ExternalLink size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Sizning Monitor Havolangiz</div>
                            <div className="text-sm font-bold text-amber-900">http://localhost:3000/screen?shop_id={shopSettings.shop_id}</div>
                        </div>
                    </div>
                    <button onClick={handleSaveShopSettings} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/20">
                        O'ZGARISHLARNI SAQLASH
                    </button>
                </div>
            </section>

            {/* Work Schedule */}
            <section className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-50">
                <div className="flex items-center gap-6 mb-12 pb-10 border-b border-slate-50">
                    <div className="p-5 bg-blue-50 text-blue-600 rounded-[2rem] shadow-inner">
                        <Clock size={32} />
                    </div>
                    <div className="text-slate-900">
                        <h3 className="text-3xl font-black uppercase italic tracking-tight">Ish Tartibi</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Vaqt va Slotlar oralig'i</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Start Time</label>
                        <input type="time" value={shopSettings.work_start} onChange={(e) => setShopSettings({ ...shopSettings, work_start: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-10 py-6 text-2xl font-black text-slate-800 outline-none shadow-inner" />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">End Time</label>
                        <input type="time" value={shopSettings.work_end} onChange={(e) => setShopSettings({ ...shopSettings, work_end: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-10 py-6 text-2xl font-black text-slate-800 outline-none shadow-inner" />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Interval (min)</label>
                        <select value={shopSettings.slot_interval} onChange={(e) => setShopSettings({ ...shopSettings, slot_interval: e.target.value })} className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-10 py-6 text-xl font-black text-slate-800 outline-none shadow-inner appearance-none">
                            <option value="15">15 min</option>
                            <option value="30">30 min</option>
                            <option value="60">1 hour</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Services Management */}
            <section className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-50">
                <div className="flex items-center justify-between mb-12 pb-10 border-b border-slate-50">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-amber-50 text-amber-600 rounded-[2rem] shadow-inner">
                            <Scissors size={32} />
                        </div>
                        <div className="text-slate-900">
                            <h3 className="text-3xl font-black uppercase italic tracking-tight">Xizmatlar</h3>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Narxlar va Turlar</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setEditingService(null); setServiceFormData({ name: "", price: "", duration: "30 min" }); setIsServiceModalOpen(true); }}
                        className="bg-amber-500 text-slate-900 h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-amber-500/30 hover:rotate-90 transition-all font-black"
                    >
                        <Plus size={32} />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence mode="popLayout">
                        {services.map((s) => (
                            <motion.div key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between p-10 bg-slate-50 rounded-[3rem] border-2 border-transparent hover:border-amber-500/20 transition-all group">
                                <div>
                                    <div className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{s.name}</div>
                                    <div className="flex gap-6 mt-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.duration}</span>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{s.price.toLocaleString()} UZS</span>
                                    </div>
                                </div>
                                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingService(s); setServiceFormData({ name: s.name, price: s.price.toString(), duration: s.duration }); setIsServiceModalOpen(true); }} className="p-5 bg-white text-blue-500 rounded-2xl shadow-sm"><Edit3 size={24} /></button>
                                    <button onClick={() => handleDeleteService(s.id)} className="p-5 bg-white text-rose-500 rounded-2xl shadow-sm"><Trash2 size={24} /></button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </section>

            {/* Service Modal */}
            <AnimatePresence>
                {isServiceModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-12 bg-slate-950/90 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[5rem] p-16 w-full max-w-3xl border border-slate-100 shadow-2xl">
                            <h3 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter mb-12 text-center">Xizmat Ma'lumoti</h3>
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Xizmat Nomi</label>
                                    <input type="text" className="w-full bg-slate-50 border-2 border-transparent rounded-[2.5rem] px-10 py-6 text-xl font-bold text-slate-800 outline-none" value={serviceFormData.name} onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Narxi (UZS)</label>
                                        <input type="number" className="w-full bg-slate-50 border-2 border-transparent rounded-[2.5rem] px-10 py-6 text-xl font-bold text-slate-800 outline-none" value={serviceFormData.price} onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })} />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Davomiyligi</label>
                                        <select className="w-full bg-slate-50 border-2 border-transparent rounded-[2.5rem] px-10 py-6 text-xl font-bold text-slate-800 outline-none appearance-none" value={serviceFormData.duration} onChange={(e) => setServiceFormData({ ...serviceFormData, duration: e.target.value })}>
                                            <option>15 min</option><option>30 min</option><option>45 min</option><option>1 hour</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-6 pt-10">
                                    <button onClick={() => setIsServiceModalOpen(false)} className="flex-1 py-8 rounded-[2.5rem] font-black text-slate-400 bg-slate-50">BEKOR QILISH</button>
                                    <button onClick={handleSaveService} className="flex-[1.5] py-8 rounded-[2.5rem] font-black text-xl bg-amber-500 text-slate-950 shadow-2xl shadow-amber-500/30">SAQLASH</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
