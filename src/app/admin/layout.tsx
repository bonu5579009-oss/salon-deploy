"use client";
import { API_URL } from "@/app/config";
import React, { useState, useEffect } from "react";
import {
    BarChart3, Users, Settings, LogOut,
    LayoutDashboard, Scissors, History,
    Monitor, Menu, X, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLang, LangSwitcher } from "@/context/LangContext";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfile {
    username: string;
    shop_name: string;
    id: number;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLang();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            if (!token) { router.push("/login"); return; }
            try {
                const resp = await fetch(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resp.ok) setUser(await resp.json());
                else { localStorage.removeItem("token"); router.push("/login"); }
            } catch { /* ignore */ }
            finally { setLoading(false); }
        };
        checkAuth();
    }, [router]);

    // Close sidebar on route change (mobile)
    useEffect(() => { setSidebarOpen(false); }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    const menuItems = [
        { title: "Dashboard", icon: LayoutDashboard, href: "/admin" },
        { title: t("barber"), icon: Users, href: "/admin/barbers" },
        { title: t("status"), icon: BarChart3, href: "/admin/stats" },
        { title: t("billing"), icon: History, href: "/admin/billing" },
        { title: "Monitor", icon: Monitor, href: `/screen?shop_id=${user?.id}`, external: true },
        { title: t("settings_title"), icon: Settings, href: "/admin/settings" },
    ];

    // Bottom nav items (most used, max 5 for mobile)
    const bottomNav = [
        { title: "Home", icon: LayoutDashboard, href: "/admin" },
        { title: t("barber"), icon: Users, href: "/admin/barbers" },
        { title: t("status"), icon: BarChart3, href: "/admin/stats" },
        { title: t("settings_title"), icon: Settings, href: "/admin/settings" },
        { title: "Menyu", icon: Menu, href: "#menu", isMenu: true },
    ];

    if (loading) return (
        <div className="h-screen bg-slate-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 flex items-center gap-4 border-b border-slate-100">
                <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl shadow-xl shadow-amber-500/20">
                    <Scissors size={24} className="text-white" />
                </div>
                <div>
                    <span className="text-lg font-black tracking-tight uppercase italic block leading-none text-slate-900">BarberPro</span>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">SaaS Edition</span>
                </div>
                {/* Close button on mobile */}
                <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-2 text-slate-400 hover:text-slate-700">
                    <X size={20} />
                </button>
            </div>

            {/* Shop info */}
            <div className="px-6 py-4 border-b border-slate-50">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("shop_name_setting")}</div>
                <div className="text-sm font-black text-slate-900 uppercase italic truncate">{user?.shop_name}</div>
                <div className="text-xs text-emerald-600 font-bold">@{user?.username}</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            target={item.external ? "_blank" : undefined}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${isActive
                                ? "bg-amber-500 text-white font-black shadow-lg shadow-amber-500/30"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <item.icon size={20} className={isActive ? "text-white" : "group-hover:text-amber-500 transition-colors"} />
                            <span className="text-sm font-bold uppercase tracking-wider flex-1">{item.title}</span>
                            {isActive && <ChevronRight size={16} />}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="p-4 border-t border-slate-50 space-y-3">
                <LangSwitcher />
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-black text-xs uppercase tracking-widest"
                >
                    <LogOut size={18} />
                    <span>{t("logout_btn")}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">

            {/* ===== DESKTOP SIDEBAR ===== */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col z-20 flex-shrink-0">
                <SidebarContent />
            </aside>

            {/* ===== MOBILE DRAWER OVERLAY ===== */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                        />
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed left-0 top-0 h-full w-72 bg-white z-40 shadow-2xl lg:hidden flex flex-col"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

                {/* Header */}
                <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 z-10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Hamburger (mobile only) */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="w-1 h-6 bg-amber-500 rounded-full" />
                        <h2 className="text-base font-black text-slate-900 uppercase italic tracking-tight">
                            {menuItems.find(m => m.href === pathname)?.title || "Dashboard"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <div className="text-xs font-black text-slate-700 uppercase italic">{user?.username}</div>
                            <div className="text-[9px] text-emerald-600 font-black tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">Online</div>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Users size={18} className="text-slate-400" />
                        </div>
                    </div>
                </header>

                {/* Page content — extra bottom padding on mobile for bottom nav */}
                <div className="flex-1 overflow-auto p-4 lg:p-10 pb-24 lg:pb-10 scroll-smooth">
                    {children}
                </div>

                {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-20 flex items-center justify-around px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                    {bottomNav.map((item) => {
                        const isActive = pathname === item.href;
                        if (item.isMenu) {
                            return (
                                <button
                                    key="menu"
                                    onClick={() => setSidebarOpen(true)}
                                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all text-slate-400 hover:text-slate-700"
                                >
                                    <Menu size={22} />
                                    <span className="text-[9px] font-black uppercase tracking-wider">Menyu</span>
                                </button>
                            );
                        }
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${isActive
                                    ? "text-amber-500"
                                    : "text-slate-400 hover:text-slate-700"
                                    }`}
                            >
                                <div className={`relative ${isActive ? "after:content-[''] after:absolute after:-top-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-amber-500" : ""}`}>
                                    <item.icon size={22} />
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? "text-amber-500" : ""}`}>
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </main>
        </div>
    );
}
