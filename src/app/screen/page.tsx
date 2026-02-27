"use client";
import { API_URL, WS_URL } from "@/app/config";


import React, { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Scissors, Clock, Sparkles, TrendingUp, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface QueueItem {
    id: number;
    queue_number: number;
    customer_name: string;
    barber_name: string;
    status: "PENDING" | "CALLED" | "IN_PROGRESS";
}

const AdSection = ({ shopId }: { shopId: string | null }) => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [adText, setAdText] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // 1. Try to get shop-specific video first
                if (shopId) {
                    const shopResp = await fetch(`${API_URL}/public/queue/${shopId}`);
                    if (shopResp.ok) {
                        const shopData = await shopResp.json();
                        if (shopData.ad_video_url) {
                            processVideoUrl(shopData.ad_video_url);
                            return; // Stop here if shop video found
                        }
                    }
                }

                // 2. Fallback to global settings
                const resp = await fetch(`${API_URL}/public/global-settings`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.ad_video_url) {
                        processVideoUrl(data.ad_video_url);
                    }
                    if (data.ad_text) {
                        setAdText(data.ad_text);
                    }
                }
            } catch (err) { console.error(err); }
        };

        const processVideoUrl = (url: string) => {
            let videoId = "";
            if (url.includes("v=")) {
                videoId = url.split("v=")[1].split("&")[0];
            } else if (url.includes("youtu.be/")) {
                videoId = url.split("/").pop()?.split("?")[0] || "";
            } else if (url.includes("embed/")) {
                videoId = url.split("embed/")[1].split("?")[0];
            }

            if (videoId) {
                const finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
                setVideoUrl(finalUrl);
            }
        };

        fetchSettings();
    }, []);

    if (videoUrl) {
        return (
            <div className="flex-1 overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl bg-black relative">
                <iframe
                    className="absolute inset-0 w-full h-full"
                    src={videoUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-600 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center border border-white/20 relative overflow-hidden"
        >
            <div className="relative z-10 text-center">
                <div className="text-2xl font-black text-white/80 uppercase tracking-[0.3em] mb-6">REKLAMA</div>
                <Sparkles className="text-white mx-auto mb-6" size={64} />
                <div className="text-4xl font-black text-white uppercase italic leading-tight">
                    {adText || "Premium Navbat Boshqaruv Tizimi"}
                </div>
            </div>
        </motion.div>
    );
};

const CustomCard = ({ item, isActive = false }: { item: QueueItem, isActive?: boolean }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`relative ${isActive
            ? "bg-gradient-to-r from-rose-500/20 to-indigo-500/20 border-l-[16px] border-rose-500 shadow-[0_0_50px_-12px_rgba(244,63,94,0.3)]"
            : "bg-white/5 border-l-[10px] border-white/10 opacity-60"
            } rounded-[3rem] p-10 flex justify-between items-center border border-white/10 backdrop-blur-xl`}
    >
        <div className="relative z-10">
            <div className={`text-9xl font-black italic tracking-tighter ${isActive ? "text-rose-400 drop-shadow-[0_0_20px_rgba(251,113,133,0.5)]" : "text-white/20"}`}>
                #{item.queue_number}
            </div>
            <div className="text-6xl font-black uppercase tracking-tight text-white mt-2 italic">{item.customer_name}</div>
        </div>

        <div className="text-right">
            <div className="text-2xl font-black text-rose-300/50 mb-4 uppercase tracking-widest flex items-center justify-end gap-3 italic">
                <Scissors size={28} className={isActive ? "text-rose-500" : "text-white/20"} /> MASTER
            </div>
            <div className={`text-6xl font-black text-white px-12 py-6 rounded-[2rem] border ${isActive ? "bg-rose-500/10 border-rose-500/30" : "bg-white/5 border-white/10"}`}>
                {item.barber_name}
            </div>
        </div>
    </motion.div>
);

function ScreenContent() {
    const searchParams = useSearchParams();
    const shopId = searchParams.get("shop_id");

    const [shopName, setShopName] = useState("Beauty Ladies Salon");
    const [called, setCalled] = useState<QueueItem[]>([]);
    const [waiting, setWaiting] = useState<QueueItem[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchQueue = async () => {
        if (!shopId) return;
        try {
            const resp = await fetch(`${API_URL}/public/queue/${shopId}`);
            if (resp.ok) {
                const data = await resp.json();
                setShopName(data.shop_name);
                const q = data.bookings;
                setCalled(q.filter((u: any) => u.status === "CALLED").map((u: any, idx: number) => ({
                    id: idx, queue_number: u.num, customer_name: u.name, barber_name: u.barber, status: "CALLED"
                })));
                setWaiting(q.filter((u: any) => u.status === "WAITING").map((u: any, idx: number) => ({
                    id: idx + 1000, queue_number: u.num, customer_name: u.name, barber_name: u.barber, status: "PENDING"
                })));
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchQueue();
        const socket = new WebSocket(`${WS_URL}/ws/queue`);
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (shopId && message.owner_id && message.owner_id.toString() !== shopId.toString()) return;
            if (message.event === "UPDATE_QUEUE") fetchQueue();
        };
        return () => socket.close();
    }, [shopId]);

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col p-10 font-sans overflow-hidden relative">
            {/* Background Glows/Gradients */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/20 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-rose-600/20 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10 border-b-2 border-white/5 pb-8">
                <div className="flex items-center gap-6">
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="p-5 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[2rem] shadow-2xl">
                        <Scissors size={48} className="text-slate-950" />
                    </motion.div>
                    <div>
                        <h1 className="text-6xl font-black uppercase italic tracking-tighter leading-none text-white drop-shadow-2xl">
                            {shopName}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="w-8 h-1 bg-amber-500 rounded-full" />
                            <p className="text-lg font-black text-amber-500 tracking-[0.4em] uppercase italic">Digital Queue Display</p>
                        </div>
                    </div>
                </div>
                <div className="text-right bg-white/5 backdrop-blur-3xl px-8 py-4 rounded-[2rem] border border-white/10">
                    <div className="text-lg font-black text-slate-500 uppercase tracking-widest">{formatDate(currentTime)}</div>
                    <div className="text-7xl font-black leading-none tracking-tighter tabular-nums">
                        {currentTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* MAIN: Left=Video, Right=Queue */}
            <div className="flex gap-8 flex-1 overflow-hidden relative z-10">

                {/* LEFT — Video / Reklama (40%) */}
                <div className="w-[40%] flex flex-col">
                    <AdSection shopId={shopId} />
                </div>

                {/* RIGHT — Queue (60%) */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">

                    {/* CALLED */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-3xl font-black flex items-center gap-4 text-rose-400 uppercase italic">
                                <Users size={36} /> CHAQIRILGANLAR
                            </h2>
                            <div className="text-lg font-black text-rose-400/50 uppercase tracking-widest">{called.length} navbat</div>
                        </div>
                        <div className="space-y-4 overflow-y-auto custom-scroll flex-1">
                            <AnimatePresence mode="popLayout">
                                {called.map(item => <CustomCard key={item.id} item={item} isActive />)}
                            </AnimatePresence>
                            {called.length === 0 && (
                                <div className="flex flex-col items-center justify-center border-4 border-dashed border-white/5 rounded-[3rem] p-12 h-40">
                                    <div className="text-2xl font-black text-slate-800 uppercase italic tracking-widest">Kutilmoqda...</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* WAITING */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <h2 className="text-3xl font-black mb-4 flex items-center gap-4 text-slate-500 uppercase italic">
                            <Clock size={36} /> KUTISH ZALI
                        </h2>
                        <div className="bg-white/[0.02] backdrop-blur-2xl rounded-[3rem] p-8 border border-white/5 flex-1 overflow-y-auto custom-scroll">
                            <div className="space-y-6">
                                <AnimatePresence mode="popLayout">
                                    {waiting.map(item => (
                                        <motion.div key={item.id} layout initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-6">
                                                <div className="text-5xl font-black text-white/20 italic group-hover:text-rose-500 transition-colors">#{item.queue_number}</div>
                                                <div className="text-3xl font-black text-white/90 uppercase tracking-tight italic">{item.customer_name}</div>
                                            </div>
                                            <div className="text-xl font-black text-rose-500/40 uppercase italic">{item.barber_name}</div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {waiting.length === 0 && (
                                    <div className="text-center text-2xl font-black text-slate-800 uppercase italic py-8">Bo&apos;sh</div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style jsx global>{`
                .custom-scroll::-webkit-scrollbar { width: 0px; }
            `}</style>
        </div>
    );
}

function formatDate(date: Date) {
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function QueueScreen() {
    return (
        <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center font-black text-white italic text-4xl">LOADING PREMIUM SYSTEM...</div>}>
            <ScreenContent />
        </Suspense>
    );
}
