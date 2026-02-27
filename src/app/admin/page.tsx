"use client";
import { API_URL, WS_URL } from "@/app/config";
import React, { useState, useEffect } from "react";
import {
    Phone, Clock, CheckCircle2, Play,
    Search, Bell, Users, TrendingUp, Scissors,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/context/LangContext";

const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white border border-slate-100 p-5 lg:p-8 rounded-[2rem] shadow-sm flex items-center justify-between group hover:border-amber-500/20 transition-all">
        <div>
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</div>
            <div className="text-4xl lg:text-5xl font-black text-slate-900 italic tracking-tighter">{value}</div>
        </div>
        <div className={`p-4 lg:p-5 rounded-2xl lg:rounded-3xl bg-gradient-to-br ${color} shadow-xl`}>
            <Icon size={24} className="text-white" />
        </div>
    </div>
);

// Mobile card for each booking
const BookingCard = ({ b, onAction }: { b: any; onAction: (id: number, action: string) => void }) => {
    const statusColor: Record<string, string> = {
        WAITING: "bg-amber-100 text-amber-700",
        CALLED: "bg-emerald-100 text-emerald-700",
        IN_PROGRESS: "bg-blue-100 text-blue-700",
        DONE: "bg-slate-100 text-slate-500",
        CANCELLED: "bg-rose-100 text-rose-500",
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm"
        >
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="text-3xl font-black text-amber-500 italic">#{b.num}</div>
                    <div>
                        <div className="font-black text-slate-900 uppercase italic">{b.name}</div>
                        <div className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-amber-400" /> {b.tel}
                        </div>
                    </div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${statusColor[b.status] || statusColor.DONE}`}>
                    {b.status}
                </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 font-bold mb-4">
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg">{b.service}</span>
                <span className="flex items-center gap-1 text-amber-600"><Clock size={11} /> {b.time}</span>
                <span className="text-slate-400">• {b.barber}</span>
            </div>

            <div className="flex gap-2">
                <button onClick={() => onAction(b.id, "call")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-black text-xs uppercase">
                    <Bell size={16} /> Chaqir
                </button>
                <button onClick={() => onAction(b.id, "start")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-black text-xs uppercase">
                    <Play size={16} /> Boshlash
                </button>
                <button onClick={() => onAction(b.id, "done")}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl hover:scale-105 transition-all font-black text-xs uppercase">
                    <CheckCircle2 size={16} /> Tayyor
                </button>
            </div>
        </motion.div>
    );
};

export default function Dashboard() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [userId, setUserId] = useState<number | null>(null);
    const { t } = useLang();

    const fetchData = async () => {
        const token = localStorage.getItem("token");
        try {
            // Bookings
            const resp = await fetch(`${API_URL}/admin/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.bookings) setBookings(data.bookings);
            }

            // Notifications
            const nResp = await fetch(`${API_URL}/admin/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (nResp.ok) {
                setNotifications(await nResp.json());
            }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json()).then(data => setUserId(data.id));

        fetchData();

        const socket = new WebSocket(`${WS_URL}/ws/queue`);
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (userId && message.owner_id !== userId) return;
            if (message.event === "UPDATE_QUEUE") {
                if (message.action === "NEW_BOOKING") {
                    setBookings(prev => [message.data, ...prev]);
                } else if (message.status) {
                    setBookings(prev => prev.map(b =>
                        b.id === message.booking_id ? { ...b, status: message.status } : b
                    ));
                }
            } else if (message.event === "NEW_BROADCAST") {
                setNotifications(prev => [{
                    id: Date.now(), // vaqtincha ID
                    message: message.message,
                    created_at: message.created_at
                }, ...prev]);
            }
        };
        return () => socket.close();
    }, [userId]);

    const handleAction = async (id: number, action: string) => {
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${API_URL}/admin/bookings/${id}/${action}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.ok) {
                setBookings(prev => prev.map(b =>
                    b.id === id ? { ...b, status: action === "call" ? "CALLED" : action === "start" ? "IN_PROGRESS" : "DONE" } : b
                ));
            }
        } catch { /* ignore */ }
    };

    const stats = {
        total: bookings.length,
        waiting: bookings.filter(b => b.status === "WAITING").length,
        active: bookings.filter(b => b.status === "IN_PROGRESS").length,
        done: bookings.filter(b => b.status === "DONE").length
    };

    const filtered = bookings.filter(b =>
        b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.num?.toString().includes(searchTerm)
    );

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Super Admin Notifications */}
            <AnimatePresence>
                {notifications.map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 p-1 rounded-[2rem] shadow-xl shadow-amber-500/20"
                    >
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-[1.85rem] flex items-center justify-between gap-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl">
                                    <Bell size={24} className="animate-bounce" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Tizim Xabari</div>
                                    <p className="font-black text-sm lg:text-base leading-tight italic">{n.message}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                                className="p-2 hover:bg-white/10 rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Stats Grid — 2 col on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <StatCard label={t("total_today")} value={stats.total} icon={TrendingUp} color="from-blue-600 to-indigo-700" />
                <StatCard label={t("waiting")} value={stats.waiting} icon={Clock} color="from-amber-500 to-orange-600" />
                <StatCard label={t("in_progress")} value={stats.active} icon={Users} color="from-emerald-500 to-teal-600" />
                <StatCard label={t("done_today")} value={stats.done} icon={CheckCircle2} color="from-slate-800 to-slate-950" />
            </div>

            {/* Bookings Section */}
            <div className="bg-white rounded-[2rem] lg:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="p-5 lg:p-8 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <Scissors size={20} className="text-amber-500" />
                        </div>
                        <h3 className="text-lg lg:text-2xl font-black text-slate-900 uppercase italic tracking-tight">{t("bookings_title")}</h3>
                        <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{bookings.length} ta</span>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder={`${t("customer")}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-amber-500/50 w-full sm:w-64 font-bold text-sm transition-all"
                        />
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("customer")}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("service")} / {t("time")}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("barber")}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("status")}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">⚙️</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {filtered.map((b) => (
                                    <motion.tr
                                        key={b.id} layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="text-3xl font-black text-slate-900 italic group-hover:text-amber-500 transition-colors">#{b.num}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-black text-slate-900 text-base uppercase italic">{b.name}</div>
                                            <div className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1">
                                                <Phone size={12} className="text-amber-400" /> {b.tel}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="bg-slate-100 text-[10px] font-black px-2.5 py-1 rounded-lg inline-block text-slate-600 mb-1.5">{b.service}</div>
                                            <div className="flex items-center gap-1.5 text-amber-600 font-black italic text-sm">
                                                <Clock size={13} /> {b.time}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-black text-slate-700 uppercase italic">{b.barber}</td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest
                                                ${b.status === "CALLED" ? "bg-emerald-100 text-emerald-600" :
                                                    b.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-600" :
                                                        b.status === "WAITING" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleAction(b.id, "call")} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"><Bell size={18} /></button>
                                                <button onClick={() => handleAction(b.id, "start")} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Play size={18} /></button>
                                                <button onClick={() => handleAction(b.id, "done")} className="p-3 bg-slate-900 text-white rounded-2xl hover:scale-105 transition-all"><CheckCircle2 size={18} /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    {bookings.length === 0 && (
                        <div className="py-20 text-center">
                            <Users size={52} className="mx-auto text-slate-100 mb-4" />
                            <div className="text-lg font-black text-slate-300 uppercase tracking-widest italic">{t("no_bookings")}</div>
                        </div>
                    )}
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(b => (
                            <BookingCard key={b.id} b={b} onAction={handleAction} />
                        ))}
                    </AnimatePresence>
                    {bookings.length === 0 && (
                        <div className="py-16 text-center">
                            <Users size={48} className="mx-auto text-slate-200 mb-4" />
                            <div className="text-base font-black text-slate-300 uppercase italic">{t("no_bookings")}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
