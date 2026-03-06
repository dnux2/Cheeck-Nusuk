import { createContext, useContext, useState, useEffect } from "react";
import { type Language, t as translate, type TranslationKey } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as Language) || "en";
    }
    return "en";
  });

  const isRTL = lang === "ar";

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("lang", newLang);
  };

  useEffect(() => {
    const html = document.documentElement;
    if (isRTL) {
      html.setAttribute("dir", "rtl");
      html.setAttribute("lang", "ar");
      html.style.setProperty("--font-sans", "'Cairo', 'Tajawal', sans-serif");
    } else {
      html.setAttribute("dir", "ltr");
      html.setAttribute("lang", "en");
      html.style.setProperty("--font-sans", "'Plus Jakarta Sans', sans-serif");
    }
  }, [isRTL]);

  const tFn = (key: TranslationKey) => translate(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tFn, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
