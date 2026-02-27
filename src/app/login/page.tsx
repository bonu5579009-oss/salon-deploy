"use client";
import { API_URL } from "@/app/config";
import React, { useState } from "react";
import { Scissors, Lock, User, ArrowRight, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLang, LangSwitcher } from "@/context/LangContext";

export default function AuthPage() {
    const router = useRouter();
    const { t } = useLang();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        shop_name: ""
    });
    const [error, setError] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");



        try {
            if (isLogin) {
                // Login
                const details = new URLSearchParams();
                details.append('username', formData.username);
                details.append('password', formData.password);

                const resp = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: details
                });

                if (resp.ok) {
                    const data = await resp.json();
                    localStorage.setItem("token", data.access_token);
                    localStorage.setItem("is_superadmin", data.is_superadmin ? "true" : "false");

                    if (data.is_superadmin) {
                        router.push("/super-admin");
                    } else {
                        router.push("/admin");
                    }
                } else {
                    const err = await resp.json();
                    setError(err.detail || "Kirishda xatolik yuz berdi");
                }
            } else {
                // Register
                const resp = await fetch(`${API_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password,
                        shop_name: formData.shop_name
                    })
                });

                if (resp.ok) {
                    setIsLogin(true);
                    alert("Muvaffaqiyatli ro'yxatdan o'tdingiz! Endi kirishingiz mumkin.");
                } else {
                    const err = await resp.json();
                    setError(err.detail || "Ro'yxatdan o'tishda xatolik");
                }
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError(t("network_error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/20 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg z-10"
            >
                <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800/50 rounded-[3rem] p-12 shadow-2xl overflow-hidden relative">

                    {/* Header */}
                    <div className="flex flex-col items-center mb-10">
                        {/* Lang Switcher */}
                        <div className="absolute top-6 right-6">
                            <LangSwitcher />
                        </div>
                        <motion.div
                            whileHover={{ rotate: 180 }}
                            className="p-5 bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 rounded-[2rem] shadow-2xl shadow-rose-500/20 mb-8"
                        >
                            <Scissors size={48} className="text-white" />
                        </motion.div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic text-center leading-none">
                            Beauty <span className="text-amber-500">Ladies</span>
                        </h1>
                        <p className="text-slate-500 font-bold mt-4 uppercase tracking-[0.3em] text-[10px]">{t("login_subtitle")}</p>
                    </div>

                    {/* Switcher */}
                    <div className="flex bg-slate-950/50 p-2 rounded-2xl mb-10 border border-slate-800">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${isLogin ? "bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
                        >
                            {t("login_btn")}
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${!isLogin ? "bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
                        >
                            {t("register_btn")}
                        </button>
                    </div>

                    {/* 2 oy bepul banner — faqat Register da ko'rinadi */}
                    {!isLogin && (
                        <div className="mb-6 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center gap-4">
                            <div className="text-3xl">🎁</div>
                            <div>
                                <div className="text-emerald-400 font-black text-sm uppercase tracking-wider">2 oy bepul!</div>
                                <div className="text-emerald-300/70 text-xs font-bold mt-0.5">
                                    Ro'yxatdan o'tgan hamma do'kon 60 kun bepul foydalanadi
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-6">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">{t("shop_name_label")}</label>
                                <div className="relative">
                                    <Store className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        required
                                        type="text"
                                        value={formData.shop_name}
                                        onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-[1.5rem] pl-16 pr-6 py-6 text-white font-black italic focus:border-amber-500 outline-none transition-all"
                                        placeholder={t("shop_name_placeholder")}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">{t("username_label")}</label>
                            <div className="relative">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    required
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-[1.5rem] pl-16 pr-6 py-6 text-white font-black italic focus:border-amber-500 outline-none transition-all"
                                    placeholder={t("username_placeholder")}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">{t("password_label")}</label>
                            <div className="relative">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                <input
                                    required
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-[1.5rem] pl-16 pr-6 py-6 text-white font-black italic focus:border-amber-500 outline-none transition-all"
                                    placeholder={t("password_placeholder")}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 text-white font-black text-xl py-6 rounded-[1.5rem] shadow-2xl shadow-rose-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-10 uppercase tracking-tight italic"
                        >
                            {loading ? (
                                <div className="w-8 h-8 border-4 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? t("submit_login") : t("submit_register")} <ArrowRight size={24} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-slate-800/50 space-y-4">
                        <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{t("contact_title")}</p>
                        <a
                            href="tel:+998935579006"
                            className="flex items-center gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-amber-500/50 transition-all group"
                        >
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                                📞
                            </div>
                            <div>
                                <div className="text-white font-black text-sm">+998 93 557 90 06</div>
                                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t("phone_label")}</div>
                            </div>
                        </a>
                        <a
                            href="https://t.me/Osiyo9006"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all group"
                        >
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                ✈️
                            </div>
                            <div>
                                <div className="text-white font-black text-sm">@Osiyo9006</div>
                                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{t("telegram_label")}</div>
                            </div>
                        </a>
                    </div>
                </div>
            </motion.div>

            {/* Foreground Decor */}
            <div className="fixed bottom-10 left-10 text-slate-800 font-black text-[12vw] pointer-events-none uppercase opacity-5 select-none leading-none">
                PREMIUM
            </div>
        </div>
    );
}
