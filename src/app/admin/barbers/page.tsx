"use client";
import { API_URL, WS_URL } from "@/app/config";


import React, { useState, useEffect } from "react";
import {
    Users,
    UserCheck,
    Plus,
    Trash2,
    X,
    UserPlus,
    RefreshCw,
    ToggleLeft,
    ToggleRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Barber {
    id: number;
    name: string;
    is_active: number;
}

export default function Barbers() {
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBarberName, setNewBarberName] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchBarbers = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${API_URL}/admin/barbers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setBarbers(data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBarbers();
    }, []);

    const handleAddBarber = async () => {
        if (!newBarberName.trim()) return;
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${API_URL}/admin/barbers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: newBarberName })
            });
            if (resp.ok) {
                setNewBarberName("");
                setIsModalOpen(false);
                fetchBarbers();
            }
        } catch (err) {
            console.error("Add barber error:", err);
        }
    };

    const handleDeleteBarber = async (id: number) => {
        if (!confirm("Haqiqatan ham bu ustani o'chirmoqchimisiz?")) return;
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${API_URL}/admin/barbers/${id}`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                fetchBarbers();
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    const handleToggleBarber = async (id: number) => {
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${API_URL}/admin/barbers/${id}/toggle`, {
                method: "PATCH",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                fetchBarbers();
            }
        } catch (err) {
            console.error("Toggle error:", err);
        }
    };

    return (
        <div className="space-y-12 pb-20 font-sans">
            <header className="flex justify-between items-end">
                <div>
                    <h3 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter">Peshqadam Ustalar</h3>
                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Jamoangiz Tarkibi va Faollik Nazorati</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={fetchBarbers}
                        className="p-5 bg-white border border-slate-100 rounded-3xl text-slate-400 hover:text-amber-500 transition-all shadow-sm"
                    >
                        <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-4 bg-amber-500 text-slate-950 px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-amber-500/30 hover:bg-amber-400 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-tight italic"
                    >
                        <UserPlus size={24} />
                        YANGI USTA
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <AnimatePresence mode="popLayout">
                    {barbers.map((u) => (
                        <motion.div
                            key={u.id}
                            layout
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-[3.5rem] p-10 shadow-sm border-2 border-slate-50 hover:border-amber-500/20 transition-all group relative"
                        >
                            <div className="absolute top-10 right-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleToggleBarber(u.id)}
                                    className={`p-4 rounded-2xl transition-all ${u.is_active ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}
                                >
                                    {u.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                </button>
                                <button
                                    onClick={() => handleDeleteBarber(u.id)}
                                    className="p-4 text-rose-500 bg-rose-50 rounded-2xl transition-all"
                                >
                                    <Trash2 size={24} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center mb-8 shadow-2xl relative group-hover:scale-105 transition-transform">
                                    <Users size={56} className="text-amber-500" />
                                    {u.is_active ? (
                                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2.5 rounded-2xl border-4 border-white shadow-xl">
                                            <UserCheck size={20} className="text-white" />
                                        </div>
                                    ) : (
                                        <div className="absolute -bottom-2 -right-2 bg-slate-400 p-2.5 rounded-2xl border-4 border-white shadow-xl">
                                            <X size={20} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">{u.name}</h4>
                                <div className={`mt-4 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-inner ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {u.is_active ? 'FAOL ISHLAMOQDA' : 'DAM OLMOQDA'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-10">
                                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                                    <div className="text-lg font-black text-slate-900 italic uppercase">{u.is_active ? 'OPEN' : 'OFF'}</div>
                                </div>
                                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kod</div>
                                    <div className="text-lg font-black text-slate-900 italic">#0{u.id}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {barbers.length === 0 && !loading && (
                    <div className="col-span-full py-32 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[5rem] text-center">
                        <Users size={80} className="mx-auto text-slate-200 mb-8" />
                        <h5 className="text-4xl font-black text-slate-300 uppercase italic tracking-tighter">Usta topilmadi</h5>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-4 italic">Hozircha jamoa bo'sh</p>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-12 bg-slate-950/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[5rem] p-16 w-full max-w-2xl relative shadow-2xl border border-white/10"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-12 right-12 text-slate-300 hover:text-rose-500 transition-colors">
                                <X size={48} />
                            </button>

                            <div className="text-center mb-12">
                                <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-amber-500 shadow-inner">
                                    <UserPlus size={48} />
                                </div>
                                <h3 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter">Yangi Usta</h3>
                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-4">Jamoangizga yangi mutaxassis qo'shing</p>
                            </div>

                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">To'liq ismi</label>
                                    <input
                                        type="text"
                                        value={newBarberName}
                                        onChange={(e) => setNewBarberName(e.target.value)}
                                        placeholder="Masalan: Sardorbek Aliev"
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500/50 rounded-[2.5rem] px-10 py-8 text-2xl font-black italic text-slate-800 outline-none transition-all shadow-inner"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleAddBarber}
                                    className="w-full bg-amber-500 text-slate-950 py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all italic tracking-tight"
                                >
                                    SAQLASH VA QO'SHISH
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
