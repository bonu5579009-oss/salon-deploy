"use client";
import { API_URL } from "@/app/config";
import React, { useState, useEffect } from "react";
import {
    Users, Activity, TrendingUp, ShieldAlert, DollarSign,
    Ban, CheckCircle2, KeyRound, Clock, Trash2, Send,
    Bot, Bell, BarChart3, Globe, RefreshCw, Calendar,
    Search, ChevronRight, Wifi, WifiOff, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type Tab = "stats" | "users" | "bots" | "broadcast" | "ads";

export default function SuperAdminDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("stats");
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [botStatus, setBotStatus] = useState<any[]>([]);
    const [adVideoUrl, setAdVideoUrl] = useState("");
    const [adText, setAdText] = useState("");
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [broadcastResult, setBroadcastResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [resetModal, setResetModal] = useState<any>(null);
    const [subModal, setSubModal] = useState<any>(null);
    const [newPassword, setNewPassword] = useState("Shop2024!");
    const [subDays, setSubDays] = useState(30);
    const router = useRouter();

    const getHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
    });

    const fetchAll = async () => {
        const token = localStorage.getItem("token");
        const isSuper = localStorage.getItem("is_superadmin") === "true";
        if (!token || !isSuper) { router.push("/login"); return; }

        try {
            const [statsR, usersR, botR, settR] = await Promise.all([
                fetch(`${API_URL}/superadmin/stats/detailed`, { headers: getHeaders() }),
                fetch(`${API_URL}/superadmin/users/detailed`, { headers: getHeaders() }),
                fetch(`${API_URL}/superadmin/bot-status`, { headers: getHeaders() }),
                fetch(`${API_URL}/public/global-settings`),
            ]);
            if (statsR.ok) setStats(await statsR.json());
            if (usersR.ok) setUsers(await usersR.json());
            if (botR.ok) setBotStatus(await botR.json());
            if (settR.ok) {
                const d = await settR.json();
                setAdVideoUrl(d.ad_video_url || "");
                setAdText(d.ad_text || "");
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleToggleBlock = async (uid: number) => {
        setActionLoading(uid);
        try {
            const r = await fetch(`${API_URL}/superadmin/users/${uid}/toggle-block`, {
                method: "PATCH", headers: getHeaders()
            });
            if (r.ok) { const d = await r.json(); setUsers(prev => prev.map(u => u.id === uid ? { ...u, is_active: d.is_active } : u)); }
        } finally { setActionLoading(null); }
    };

    const handleResetPassword = async () => {
        if (!resetModal) return;
        setActionLoading(resetModal.id);
        try {
            const r = await fetch(`${API_URL}/superadmin/users/${resetModal.id}/reset-password`, {
                method: "PATCH", headers: getHeaders(),
                body: JSON.stringify({ new_password: newPassword })
            });
            if (r.ok) { alert(`✅ Parol tiklandi: ${newPassword}`); setResetModal(null); }
        } finally { setActionLoading(null); }
    };

    const handleSetSubscription = async () => {
        if (!subModal) return;
        setActionLoading(subModal.id);
        try {
            const r = await fetch(`${API_URL}/superadmin/users/${subModal.id}/subscription`, {
                method: "PATCH", headers: getHeaders(),
                body: JSON.stringify({ days: subDays })
            });
            if (r.ok) { alert(`✅ Obuna ${subDays} kunga belgilandi!`); setSubModal(null); fetchAll(); }
        } finally { setActionLoading(null); }
    };

    const handleAddBalance = async (uid: number) => {
        const amt = prompt("Qancha balans qo'shish?", "50000");
        if (!amt) return;
        setActionLoading(uid);
        try {
            const r = await fetch(`${API_URL}/superadmin/users/${uid}/balance`, {
                method: "PATCH", headers: getHeaders(),
                body: JSON.stringify({ amount: parseInt(amt) })
            });
            if (r.ok) fetchAll();
        } finally { setActionLoading(null); }
    };

    const handleDeleteUser = async (uid: number, name: string) => {
        if (!confirm(`"${name}" do'konini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi!`)) return;
        setActionLoading(uid);
        try {
            const r = await fetch(`${API_URL}/superadmin/users/${uid}`, {
                method: "DELETE", headers: getHeaders()
            });
            if (r.ok) { setUsers(prev => prev.filter(u => u.id !== uid)); alert("✅ O'chirildi!"); }
        } finally { setActionLoading(null); }
    };

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        try {
            const r = await fetch(`${API_URL}/superadmin/broadcast`, {
                method: "POST", headers: getHeaders(),
                body: JSON.stringify({ message: broadcastMsg })
            });
            if (r.ok) {
                const d = await r.json();
                setBroadcastResult(`✅ ${d.sent_to} ta do'konga yuborildi!`);
                setBroadcastMsg("");
            }
        } catch (e) { setBroadcastResult("❌ Xatolik yuz berdi"); }
    };

    const handleUpdateAds = async () => {
        try {
            const r = await fetch(`${API_URL}/superadmin/global-settings`, {
                method: "PATCH", headers: getHeaders(),
                body: JSON.stringify({ ad_video_url: adVideoUrl, ad_text: adText })
            });
            if (r.ok) alert("✅ Reklama yangilandi!");
        } catch (e) { alert("❌ Xatolik"); }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("is_superadmin");
        router.push("/login");
    };

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.shop_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: "stats", label: "Statistika", icon: BarChart3 },
        { id: "users", label: "Do'konlar", icon: Users },
        { id: "bots", label: "Bot Monitoring", icon: Bot },
        { id: "broadcast", label: "Xabar", icon: Bell },
        { id: "ads", label: "Global Reklama", icon: Globe },
    ];

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans">
            {/* Sidebar */}
            <div className="flex h-screen">
                <aside className="w-64 bg-slate-900/60 border-r border-white/5 flex flex-col p-6">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-2 bg-red-500/20 text-red-500 rounded-xl"><ShieldAlert size={22} /></div>
                        <div>
                            <div className="text-sm font-black uppercase italic tracking-tight text-white">Super Admin</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Platform Owner</div>
                        </div>
                    </div>

                    <nav className="space-y-2 flex-1">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeTab === tab.id
                                    ? "bg-red-500 text-white font-black shadow-lg shadow-red-500/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}>
                                <tab.icon size={18} />
                                <span className="text-sm font-bold">{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="space-y-3">
                        <button onClick={fetchAll}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all text-left">
                            <RefreshCw size={18} />
                            <span className="text-sm font-bold">Yangilash</span>
                        </button>
                        <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all text-left">
                            <LogOut size={18} />
                            <span className="text-sm font-bold">Chiqish</span>
                        </button>
                    </div>
                </aside>

                {/* Main */}
                <main className="flex-1 overflow-auto p-8">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                            {/* ===== STATISTIKA ===== */}
                            {activeTab === "stats" && (
                                <div className="space-y-8">
                                    <h1 className="text-3xl font-black uppercase italic tracking-tight">📊 Umumiy Statistika</h1>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                                        {[
                                            { label: "Jami Do'konlar", value: stats?.total_users || 0, color: "from-blue-600 to-indigo-700", icon: Users },
                                            { label: "Faol Do'konlar", value: stats?.active_users || 0, color: "from-emerald-500 to-teal-600", icon: CheckCircle2 },
                                            { label: "Bloklangan", value: stats?.blocked_users || 0, color: "from-rose-500 to-red-700", icon: Ban },
                                            { label: "Faol Obunalar", value: stats?.active_subscriptions || 0, color: "from-amber-500 to-orange-600", icon: Calendar },
                                        ].map(item => (
                                            <div key={item.label} className="bg-slate-900 rounded-[2rem] p-6 border border-white/5 relative overflow-hidden">
                                                <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-30 bg-gradient-to-br ${item.color} -mr-5 -mt-5`} />
                                                <item.icon size={24} className="mb-4 text-slate-400" />
                                                <div className="text-4xl font-black italic">{item.value}</div>
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{item.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                        {[
                                            { label: "Haftalik Navbatlar", value: stats?.weekly_bookings || 0, sub: "Oxirgi 7 kun" },
                                            { label: "Oylik Navbatlar", value: stats?.monthly_bookings || 0, sub: "Oxirgi 30 kun" },
                                            { label: "Jami Navbatlar", value: stats?.total_bookings || 0, sub: "Barcha vaqt" },
                                        ].map(item => (
                                            <div key={item.label} className="bg-slate-900 rounded-[2rem] p-6 border border-white/5">
                                                <Activity size={24} className="mb-4 text-blue-400" />
                                                <div className="text-5xl font-black italic">{item.value}</div>
                                                <div className="text-sm font-black text-white mt-2">{item.label}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{item.sub}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        <div className="bg-slate-900 rounded-[2rem] p-6 border border-white/5">
                                            <TrendingUp size={24} className="mb-4 text-emerald-400" />
                                            <div className="text-5xl font-black italic">{(stats?.total_income || 0).toLocaleString()} <span className="text-lg not-italic text-slate-500">UZS</span></div>
                                            <div className="text-sm font-black text-white mt-2">Jami Daromad</div>
                                        </div>
                                        <div className="bg-slate-900 rounded-[2rem] p-6 border border-white/5">
                                            <DollarSign size={24} className="mb-4 text-amber-400" />
                                            <div className="text-5xl font-black italic">{(stats?.weekly_income || 0).toLocaleString()} <span className="text-lg not-italic text-slate-500">UZS</span></div>
                                            <div className="text-sm font-black text-white mt-2">Haftalik Daromad</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ===== DO'KONLAR ===== */}
                            {activeTab === "users" && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h1 className="text-3xl font-black uppercase italic tracking-tight">🏪 Do&apos;konlar</h1>
                                        <div className="flex items-center gap-3 bg-slate-900 rounded-2xl p-2 border border-white/5">
                                            <Search size={16} className="text-slate-400 ml-2" />
                                            <input type="text" placeholder="Qidirish..." value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="bg-transparent outline-none text-sm font-bold text-white w-48 pr-2" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {filteredUsers.map(u => (
                                            <motion.div key={u.id} layout
                                                className={`bg-slate-900 rounded-[2rem] p-6 border transition-all ${u.is_active ? "border-white/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                            <span className="font-black text-lg italic">{u.shop_name}</span>
                                                            <span className="text-slate-500 text-sm">@{u.username}</span>
                                                            {!u.is_active && <span className="text-[9px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-black uppercase">BLOKLANGAN</span>}
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                            <div>
                                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Balans</div>
                                                                <div className="font-black text-amber-400">{u.balance?.toLocaleString()} UZS</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Navbat</div>
                                                                <div className="font-black">{u.total_bookings}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Bot</div>
                                                                <div className={`font-black ${u.bot_token ? "text-emerald-400" : "text-slate-600"}`}>{u.bot_token ? "✅ Ulangan" : "❌ Ulangan"}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Obuna</div>
                                                                <div className={`font-black text-sm ${u.subscription_days_left > 0 ? "text-emerald-400" : "text-slate-600"}`}>
                                                                    {u.subscription_days_left > 0 ? `${u.subscription_days_left} kun` : "Muddatsiz"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        {/* Block/Unblock */}
                                                        <button onClick={() => handleToggleBlock(u.id)} disabled={actionLoading === u.id}
                                                            title={u.is_active ? "Bloklash" : "Yoqish"}
                                                            className={`p-3 rounded-2xl transition-all ${u.is_active ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"}`}>
                                                            {u.is_active ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                                                        </button>
                                                        {/* Balance */}
                                                        <button onClick={() => handleAddBalance(u.id)} disabled={actionLoading === u.id}
                                                            title="Balans qo'shish"
                                                            className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl hover:bg-amber-500 hover:text-white transition-all">
                                                            <DollarSign size={18} />
                                                        </button>
                                                        {/* Reset password */}
                                                        <button onClick={() => { setResetModal(u); setNewPassword("Shop2024!"); }}
                                                            title="Parol tiklash"
                                                            className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl hover:bg-blue-500 hover:text-white transition-all">
                                                            <KeyRound size={18} />
                                                        </button>
                                                        {/* Subscription */}
                                                        <button onClick={() => { setSubModal(u); setSubDays(30); }}
                                                            title="Obuna belgilash"
                                                            className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl hover:bg-purple-500 hover:text-white transition-all">
                                                            <Clock size={18} />
                                                        </button>
                                                        {/* Delete */}
                                                        <button onClick={() => handleDeleteUser(u.id, u.shop_name)} disabled={actionLoading === u.id}
                                                            title="O'chirish"
                                                            className="p-3 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <div className="text-center py-20 text-slate-600 font-black uppercase italic">Do&apos;konlar topilmadi</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ===== BOT MONITORING ===== */}
                            {activeTab === "bots" && (
                                <div className="space-y-6">
                                    <h1 className="text-3xl font-black uppercase italic tracking-tight">🤖 Bot Monitoring</h1>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {botStatus.map(b => (
                                            <div key={b.id} className={`rounded-[2rem] p-5 border ${b.has_bot ? "bg-slate-900 border-white/5" : "bg-slate-900/50 border-white/5 opacity-60"}`}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <div className="font-black italic">{b.shop_name}</div>
                                                        <div className="text-xs text-slate-500 font-bold">@{b.username}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {b.is_active ? (
                                                            <Wifi size={16} className="text-emerald-400" />
                                                        ) : (
                                                            <WifiOff size={16} className="text-rose-400" />
                                                        )}
                                                        {b.has_bot ? (
                                                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-black uppercase">Bot Faol</span>
                                                        ) : (
                                                            <span className="text-[9px] bg-slate-800 text-slate-500 px-2 py-1 rounded-full font-black uppercase">Bot Yo&apos;q</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Jami navbat</div>
                                                        <div className="font-black text-white">{b.total_bookings}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest">So&apos;nggi faollik</div>
                                                        <div className="font-black text-slate-400 text-xs">
                                                            {b.last_booking ? new Date(b.last_booking).toLocaleDateString("uz-UZ") : "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ===== BROADCAST ===== */}
                            {activeTab === "broadcast" && (
                                <div className="space-y-6 max-w-2xl">
                                    <h1 className="text-3xl font-black uppercase italic tracking-tight">📢 Xabar Yuborish</h1>
                                    <div className="bg-slate-900 rounded-[2rem] p-8 border border-white/5 space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Xabar matni (barcha faol do&apos;konlarga yuboriladi)</label>
                                            <textarea
                                                rows={5}
                                                value={broadcastMsg}
                                                onChange={e => setBroadcastMsg(e.target.value)}
                                                placeholder="Xabaringizni yozing..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-500/50 resize-none transition-colors"
                                            />
                                            <div className="text-right text-[10px] text-slate-600 mt-1">{broadcastMsg.length} belgi</div>
                                        </div>
                                        <button onClick={handleBroadcast} disabled={!broadcastMsg.trim()}
                                            className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase italic py-4 rounded-2xl transition-all shadow-lg active:scale-95">
                                            <Send size={20} /> Yuborish ({users.filter(u => u.is_active).length} ta do&apos;kon)
                                        </button>
                                        {broadcastResult && (
                                            <div className="text-center text-emerald-400 font-black">{broadcastResult}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ===== GLOBAL REKLAMA ===== */}
                            {activeTab === "ads" && (
                                <div className="space-y-6 max-w-2xl">
                                    <h1 className="text-3xl font-black uppercase italic tracking-tight">🎬 Global Reklama</h1>
                                    <div className="bg-slate-900 rounded-[2rem] p-8 border border-white/5 space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">YouTube Video Linki</label>
                                            <input type="text" value={adVideoUrl} onChange={e => setAdVideoUrl(e.target.value)}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-500/50 transition-colors" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Reklama Matni (Video bo&apos;lmasa ko&apos;rinadi)</label>
                                            <textarea rows={3} value={adText} onChange={e => setAdText(e.target.value)}
                                                placeholder="Reklama matni..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-500/50 resize-none transition-colors" />
                                        </div>
                                        <button onClick={handleUpdateAds}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase italic py-4 rounded-2xl transition-all shadow-lg active:scale-95">
                                            Saqlash va Yangilash
                                        </button>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* PAROL RESET MODAL */}
            <AnimatePresence>
                {resetModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-slate-900 rounded-[2rem] p-8 border border-white/10 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-black uppercase italic mb-6">🔑 Parol Tiklash</h2>
                            <div className="text-slate-400 mb-4 font-bold">{resetModal.shop_name} (@{resetModal.username})</div>
                            <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-blue-500/50 mb-6 transition-colors" />
                            <div className="flex gap-3">
                                <button onClick={() => setResetModal(null)}
                                    className="flex-1 py-3 rounded-2xl border border-white/10 text-slate-400 font-black hover:bg-white/5 transition-all">
                                    Bekor
                                </button>
                                <button onClick={handleResetPassword}
                                    className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all">
                                    Tiklash
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OBUNA MODAL */}
            <AnimatePresence>
                {subModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-slate-900 rounded-[2rem] p-8 border border-white/10 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-black uppercase italic mb-6">📅 Obuna Belgilash</h2>
                            <div className="text-slate-400 mb-4 font-bold">{subModal.shop_name} (@{subModal.username})</div>
                            <div className="flex gap-3 mb-6">
                                {[7, 30, 90, 365].map(d => (
                                    <button key={d} onClick={() => setSubDays(d)}
                                        className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${subDays === d ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                                        {d} kun
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setSubModal(null)}
                                    className="flex-1 py-3 rounded-2xl border border-white/10 text-slate-400 font-black hover:bg-white/5 transition-all">
                                    Bekor
                                </button>
                                <button onClick={handleSetSubscription}
                                    className="flex-1 py-3 rounded-2xl bg-purple-600 text-white font-black hover:bg-purple-700 transition-all">
                                    Belgilash
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
