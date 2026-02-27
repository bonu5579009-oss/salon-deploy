"use client";
import { API_URL, WS_URL } from "@/app/config";


import React, { useState, useEffect } from "react";
import { TrendingUp, Users, Clock, Star, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const StatCard = ({ title, value, change, isPositive, icon: Icon }: any) => (
    <div className="bg-white p-8 rounded-[32px] shadow-sm border group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                <Icon size={28} />
            </div>
            <div className={`flex items-center gap-1 font-bold text-sm px-3 py-1 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isPositive ? <ArrowUpRight size={14} /> : <ArrowUpRight size={14} />}
                {change}
            </div>
        </div>
        <div className="text-4xl font-black text-slate-900 mb-2">{value}</div>
        <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">{title}</div>
    </div>
);

export default function Stats() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${API_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Fetch stats error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const colors = ["bg-amber-500", "bg-blue-500", "bg-emerald-500", "bg-indigo-500", "bg-rose-500"];

    return (
        <div className="space-y-10">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tight italic">Tizim Statistikasi</h3>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Real vaqtdagi ko'rsatkichlar va tahlillar</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-amber-500 transition-all shadow-sm"
                >
                    <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Jami Mijozlar"
                    value={`${stats?.total_bookings || 0} ta`}
                    change="Aktiv"
                    isPositive={true}
                    icon={Users}
                />
                <StatCard
                    title="Kutilayotganlar"
                    value={`${stats?.waiting_bookings || 0} ta`}
                    change="Navbatda"
                    isPositive={false}
                    icon={Clock}
                />
                <StatCard
                    title="Tugatilgan"
                    value={`${stats?.done_bookings || 0} ta`}
                    change="Bitgan"
                    isPositive={true}
                    icon={TrendingUp}
                />
                <StatCard
                    title="Taxminiy Daromad"
                    value={`${(stats?.total_income || 0).toLocaleString()} so'm`}
                    change="Kassa"
                    isPositive={true}
                    icon={Star}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Chart Placeholder */}
                <div className="bg-white p-10 rounded-[40px] shadow-sm border h-[450px] flex flex-col">
                    <h3 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tight italic">Haftalik tashriflar</h3>
                    <div className="flex-1 flex items-end gap-6 px-4">
                        {[10, 20, 15, 30, 25, 40, 50].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className="w-full bg-slate-100 rounded-2xl group-hover:bg-amber-500 transition-all duration-500 relative cursor-pointer"
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap">
                                        Demo: {h} ta
                                    </div>
                                </motion.div>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">
                                    {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Ya'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] shadow-sm border">
                    <h3 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tight italic">Usta bandligi (Real)</h3>
                    <div className="space-y-8">
                        {stats?.barber_stats && Object.entries(stats.barber_stats).length > 0 ? (
                            Object.entries(stats.barber_stats).map(([name, count]: any, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between font-black text-slate-700 text-lg uppercase italic">
                                        <span>{name} usta</span>
                                        <span className="text-amber-600">{count} ta mijoz</span>
                                    </div>
                                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((Number(count) / 20) * 100, 100)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full ${colors[i % colors.length]} rounded-full shadow-lg`}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">
                                Ma'lumotlar mavjud emas
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
