"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Lang, t as translate, TranslationKey } from "@/app/i18n";

interface LangContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextType>({
    lang: "uz",
    setLang: () => { },
    t: (key) => key,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>("uz");

    useEffect(() => {
        const saved = localStorage.getItem("lang") as Lang;
        if (saved === "uz" || saved === "ru") {
            setLangState(saved);
        }
    }, []);

    const setLang = (newLang: Lang) => {
        setLangState(newLang);
        localStorage.setItem("lang", newLang);
    };

    const t = (key: TranslationKey) => translate(lang, key);

    return (
        <LangContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LangContext.Provider>
    );
}

export function useLang() {
    return useContext(LangContext);
}

// Language Switcher Component
export function LangSwitcher() {
    const { lang, setLang } = useLang();
    return (
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
            <button
                onClick={() => setLang("uz")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${lang === "uz"
                        ? "bg-amber-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
            >
                🇺🇿 UZ
            </button>
            <button
                onClick={() => setLang("ru")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${lang === "ru"
                        ? "bg-amber-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
            >
                🇷🇺 RU
            </button>
        </div>
    );
}
