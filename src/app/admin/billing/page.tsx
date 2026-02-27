"use client";
import { API_URL } from "@/app/config";
import React, { useState, useEffect } from "react";
import {
    CreditCard, Wallet, ArrowRight, CheckCircle2,
    History, TrendingUp, Clock, AlertCircle, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Transaction {
    id: number;
    amount: number;
    status: string;
    created_at: string;
    click_trans_id?: string;
}

export default function BillingPage() {
    const [balance, setBalance] = useState(0);
    const [subscriptionUntil, setSubscriptionUntil] = useState<string | null>(null);
    const [amount, setAmount] = useState(50000);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [successMsg, setSuccessMsg] = useState("");

    const fetchStatus = async () => {
        const token = localStorage.getItem("token");
        try {
            // Balance va subscription /auth/me dan
            const resp = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setBalance(data.balance || 0);
                setSubscriptionUntil(data.subscription_until || null);
            }

            // Tranzaksiya tarixi
            const txResp = await fetch(`${API_URL}/admin/billing/transactions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (txResp.ok) {
                const txData = await txResp.json();
                setTransactions(txData);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleTopUp = async () => {
        if (amount < 10000) {
            alert("Minimum to'lov miqdori: 10,000 UZS");
            return;
        }
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${API_URL}/admin/billing/generate-url?amount=${amount}`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                window.open(data.url, "_blank");
            } else {
                alert("To'lov URL yaratishda xatolik");
            }
        } catch (err) {
            console.error(err);
            alert("Serverga ulanib bo'lmadi");
        } finally {
            setLoading(false);
        }
    };

    const handleTestPay = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const resp = await fetch(`${API_URL}/admin/billing/test-pay?amount=${amount}`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resp.ok) {
                const data = await resp.json();
                setBalance(data.new_balance);
                setSuccessMsg(`✅ Test to'lov muvaffaqiyatli! +${amount.toLocaleString()} UZS`);
                setTimeout(() => setSuccessMsg(""), 4000);
                fetchStatus();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchStatus();
        setRefreshing(false);
    };

    // Subscription status
    const subDaysLeft = subscriptionUntil
        ? Math.max(0, Math.floor((new Date(subscriptionUntil).getTime() - Date.now()) / 86400000))
        : 0;
    const isSubActive = subDaysLeft > 0;

    const statusColor: Record<string, string> = {
        SUCCESS: "bg-emerald-100 text-emerald-700",
        PENDING: "bg-amber-100 text-amber-700",
        FAILED: "bg-red-100 text-red-600",
    };

    return (
        <div className="space-y-10 pb-24 font-sans">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h3 className="text-4xl sm:text-5xl font-black text-slate-900 uppercase italic tracking-tighter">
                        Moliyaviy Markaz
                    </h3>
                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] mt-2">
                        Hisobingizni Boshqarish va To'lovlar
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-100 rounded-2xl text-slate-500 font-black text-sm hover:bg-slate-200 transition-all"
                >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    Yangilash
                </button>
            </header>

            {/* Success message */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-700 font-black text-sm flex items-center gap-3"
                    >
                        <CheckCircle2 size={20} /> {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Balance + Subscription + TopUp */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 bg-slate-950 rounded-[3rem] p-10 sm:p-14 relative overflow-hidden shadow-2xl"
                >
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-amber-500">
                                <Wallet size={28} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Joriy Balans
                            </span>
                        </div>
                        <h4 className="text-6xl sm:text-8xl font-black text-white italic leading-none tracking-tighter mb-3 tabular-nums">
                            {balance.toLocaleString()}
                            <span className="text-3xl text-amber-500 uppercase not-italic ml-3">uzs</span>
                        </h4>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-4">
                            Sizning SaaS hisobingizdagi mablag' miqdori
                        </p>

                        {/* Subscription badge */}
                        <div className={`mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl font-black text-sm ${isSubActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {isSubActive
                                ? <><CheckCircle2 size={16} /> Obuna faol — {subDaysLeft} kun qoldi</>
                                : <><AlertCircle size={16} /> Obuna tugagan yoki yo'q</>
                            }
                        </div>
                    </div>
                </motion.div>

                {/* Top Up Form */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[3rem] p-10 border-2 border-slate-50 shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
                                <CreditCard size={28} />
                            </div>
                            <h5 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
                                Balans To'ldirish
                            </h5>
                        </div>

                        <div className="space-y-5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                Miqdor (UZS)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                min={10000}
                                step={10000}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500/50 rounded-2xl px-6 py-5 text-2xl font-black italic text-slate-800 outline-none transition-all"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                {[50000, 100000, 200000, 500000].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(val)}
                                        className={`py-3 rounded-2xl font-black text-xs transition-all ${amount === val ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        {(val / 1000).toFixed(0)}K
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-8">
                        <button
                            onClick={handleTopUp}
                            disabled={loading}
                            className="w-full bg-amber-500 text-slate-950 py-5 rounded-2xl font-black text-base shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all italic tracking-tight flex items-center justify-center gap-3"
                        >
                            {loading
                                ? <div className="w-5 h-5 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                : <><CreditCard size={20} /> Click bilan to'lash <ArrowRight size={18} /></>
                            }
                        </button>

                        <button
                            onClick={handleTestPay}
                            disabled={loading}
                            className="w-full bg-slate-100 text-slate-400 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                        >
                            🧪 Demo to'lov (test)
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Tarif Plans */}
            <div>
                <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-6">
                    Tariflar
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {[
                        { name: "Starter", price: "50,000", period: "oy", desc: "1 oy obuna", days: 30, color: "bg-slate-50 border-slate-100" },
                        { name: "Pro", price: "130,000", period: "3 oy", desc: "3 oy obuna (13% tejaysiz)", days: 90, color: "bg-amber-50 border-amber-200", badge: "🔥 Mashhur" },
                        { name: "Business", price: "200,000", period: "6 oy", desc: "6 oy obuna (33% tejaysiz)", days: 180, color: "bg-slate-950 border-slate-900", dark: true },
                    ].map(plan => (
                        <div
                            key={plan.name}
                            className={`rounded-[2.5rem] p-8 border-2 ${plan.color} relative`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3 left-8 bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-1 rounded-full">
                                    {plan.badge}
                                </div>
                            )}
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${plan.dark ? 'text-slate-400' : 'text-slate-400'}`}>
                                {plan.name}
                            </div>
                            <div className={`text-4xl font-black italic tracking-tighter ${plan.dark ? 'text-white' : 'text-slate-900'}`}>
                                {plan.price} <span className="text-lg not-italic font-bold text-slate-400">uzs</span>
                            </div>
                            <div className={`text-xs font-bold mt-1 ${plan.dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {plan.period} / {plan.desc}
                            </div>
                            <button
                                onClick={() => setAmount(parseInt(plan.price.replace(/,/g, "")))}
                                className={`mt-6 w-full py-3 rounded-2xl font-black text-sm transition-all ${plan.dark ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-slate-900 text-white hover:bg-slate-700'}`}
                            >
                                Tanlash
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction History */}
            <div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-500">
                        <History size={24} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                        To'lov Tarixi
                    </h4>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <Clock size={48} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
                            Tranzaksiyalar yo'q
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.slice(0, 10).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between bg-white rounded-3xl px-8 py-5 border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-5">
                                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 text-base">
                                            +{(tx.amount || 0).toLocaleString()} UZS
                                        </div>
                                        <div className="text-xs text-slate-400 font-bold mt-0.5">
                                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString("uz-UZ") : "—"}
                                            {tx.click_trans_id ? ` · ID: ${tx.click_trans_id}` : ""}
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-full ${statusColor[tx.status] || statusColor.PENDING}`}>
                                    {tx.status === "SUCCESS" ? "✅ Muvaffaqiyatli"
                                        : tx.status === "PENDING" ? "⏳ Kutilmoqda"
                                            : "❌ Bekor qilindi"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
