import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertTriangle, Languages, MapPin, Phone, Shield, ArrowRight, Globe, Mic, MicOff, ArrowRightLeft, Volume2 } from "lucide-react";
import { useCreateEmergency } from "@/hooks/use-emergencies";
import { useTranslate } from "@/hooks/use-ai";
import { useLanguage } from "@/contexts/language-context";
import logoImg from "@assets/WhatsApp_Image_2026-03-07_at_12.53.20_AM_1772834050515.jpeg";
import { useRef, useEffect } from "react";

const LANGUAGES = ["Arabic", "English", "Urdu", "French", "Malay", "Indonesian", "Turkish", "Bengali"];

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function PilgrimPortalPage() {
  const { lang, setLang, isRTL } = useLanguage();
  const createEmergency = useCreateEmergency();
  const translate = useTranslate();
  const [sosSent, setSosSent] = useState(false);
  const [text, setText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Arabic");
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "translator">("home");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const ar = lang === "ar";

  const handleSOS = () => {
    createEmergency.mutate({
      pilgrimId: 1,
      type: "Medical",
      status: "Active",
      locationLat: 21.4225,
      locationLng: 39.8262,
    });
    setSosSent(true);
  };

  const startListening = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang === "ar" ? "ar-SA" : "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      setText(Array.from(e.results).map(r => r[0].transcript).join(""));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="bg-card border-b border-border px-6 h-16 flex items-center justify-between">
        <Link href="/" className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#f5e6c8]">
            <img src={logoImg} alt="CheckNusuk" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg">CheckNusuk</span>
        </Link>
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="flex items-center bg-secondary rounded-xl overflow-hidden border border-border">
            <button onClick={() => setLang("en")} className={`px-3 py-1.5 text-sm font-bold transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
            <button onClick={() => setLang("ar")} className={`px-3 py-1.5 text-sm font-bold transition-all ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>العربية</button>
          </div>
          <Link href="/dashboard" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
            <Shield className="w-4 h-4" />
            {ar ? "لوحة المشرف" : "Supervisor"}
          </Link>
        </div>
      </header>

      {/* Tab bar */}
      <div className={`flex border-b border-border bg-card`}>
        <button
          onClick={() => setActiveTab("home")}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === "home" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
        >
          {ar ? "الرئيسية" : "Home"}
        </button>
        <button
          onClick={() => setActiveTab("translator")}
          className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === "translator" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
        >
          <Languages className="w-4 h-4" />
          {ar ? "المترجم" : "Translator"}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "home" && (
          <div className="max-w-xl mx-auto p-6 space-y-6">
            {/* Welcome */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={`text-center pt-4 ${isRTL ? "text-right" : ""}`}
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#f5e6c8] mx-auto mb-4">
                <img src={logoImg} alt="CheckNusuk" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">
                {ar ? "مرحباً بك في بوابة الحاج" : "Welcome to Pilgrim Portal"}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {ar ? "خدمات الحج الذكية في متناول يدك" : "Smart Hajj services at your fingertips"}
              </p>
            </motion.div>

            {/* SOS Emergency */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {sosSent ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-2xl p-6 text-center">
                  <Shield className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <p className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">
                    {ar ? "تم إرسال نداء الطوارئ" : "Emergency Alert Sent"}
                  </p>
                  <p className="text-sm text-emerald-600/80 mt-1">
                    {ar ? "الفريق في الطريق إليك" : "A team is on the way to your location"}
                  </p>
                  <button onClick={() => setSosSent(false)} className="mt-4 text-xs text-muted-foreground underline">
                    {ar ? "إعادة تعيين" : "Reset"}
                  </button>
                </div>
              ) : (
                <div className={`text-center ${isRTL ? "text-right" : ""}`}>
                  <p className="text-sm font-semibold text-muted-foreground mb-4">
                    {ar ? "في حالة الطوارئ" : "In case of emergency"}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSOS}
                    disabled={createEmergency.isPending}
                    className="w-40 h-40 rounded-full bg-gradient-to-b from-rose-500 to-red-700 shadow-[0_0_40px_rgba(225,29,72,0.45)] border-4 border-rose-400/50 flex flex-col items-center justify-center text-white mx-auto disabled:opacity-60 transition-all"
                    data-testid="button-pilgrim-sos"
                  >
                    <AlertTriangle className="w-12 h-12 mb-1" />
                    <span className="font-bold text-xl tracking-widest">SOS</span>
                  </motion.button>
                  <p className="text-xs text-muted-foreground mt-4">
                    {ar ? "اضغط للإبلاغ عن حالة طارئة وإرسال موقعك" : "Press to report an emergency and share your location"}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Quick info cards */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: MapPin,
                  titleAr: "موقعك الحالي",
                  titleEn: "Your Location",
                  valueAr: "مِنىٰ — خيمة A12",
                  valueEn: "Mina — Tent A12",
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                },
                {
                  icon: Phone,
                  titleAr: "مشرف الحملة",
                  titleEn: "Campaign Leader",
                  valueAr: "أحمد — 0501234567",
                  valueEn: "Ahmed — 0501234567",
                  color: "text-blue-600",
                  bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className={`rounded-2xl border p-4 ${card.bg}`}>
                    <Icon className={`w-5 h-5 mb-2 ${card.color}`} />
                    <p className="text-xs text-muted-foreground font-semibold">{ar ? card.titleAr : card.titleEn}</p>
                    <p className="font-bold text-sm mt-0.5">{ar ? card.valueAr : card.valueEn}</p>
                  </div>
                );
              })}
            </motion.div>

            {/* Info section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className={`font-bold ${isRTL ? "text-right" : ""}`}>
                {ar ? "تسلسل شعائر الحج" : "Hajj Ritual Schedule"}
              </h3>
              {[
                { dayAr: "اليوم 1 — 8 ذو الحجة", dayEn: "Day 1 — 8th Dhul Hijjah", actAr: "التوجه إلى منى", actEn: "Travel to Mina", done: true },
                { dayAr: "اليوم 2 — 9 ذو الحجة", dayEn: "Day 2 — 9th Dhul Hijjah", actAr: "الوقوف بعرفات", actEn: "Standing at Arafat", done: false },
                { dayAr: "اليوم 3 — 10 ذو الحجة", dayEn: "Day 3 — 10th Dhul Hijjah", actAr: "رمي الجمرات والعيد", actEn: "Jamarat & Eid", done: false },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${step.done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {step.done ? "✓" : i + 1}
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="text-xs text-muted-foreground">{ar ? step.dayAr : step.dayEn}</p>
                    <p className="font-semibold text-sm">{ar ? step.actAr : step.actEn}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Go to translator */}
            <motion.button
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              onClick={() => setActiveTab("translator")}
              className={`w-full flex items-center justify-between bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-bold px-5 py-4 rounded-2xl transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Languages className="w-5 h-5" />
                {ar ? "فتح المترجم الفوري" : "Open Live Translator"}
              </div>
              <ArrowRight className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
            </motion.button>
          </div>
        )}

        {activeTab === "translator" && (
          <div className="max-w-xl mx-auto p-6 space-y-4">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
              <Languages className="w-6 h-6 text-primary" />
              {ar ? "المترجم الذكي" : "AI Translator"}
            </h2>

            <div className="bg-card border border-border rounded-2xl p-4">
              <div className={`flex justify-between items-center mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-sm font-semibold text-muted-foreground">{ar ? "النص المُدخل" : "Input"}</span>
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                    isListening ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse" : "bg-secondary border-border hover:border-primary/50"
                  }`}
                  data-testid="button-pilgrim-voice"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isListening ? (ar ? "جارٍ الاستماع..." : "Listening...") : (ar ? "تحدث" : "Speak")}
                </button>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={ar ? "اكتب أو تحدث..." : "Type or speak..."}
                dir="auto"
                className="w-full bg-transparent resize-none outline-none text-base min-h-[100px] placeholder:text-muted"
              />
            </div>

            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <select
                value={targetLanguage}
                onChange={e => setTargetLanguage(e.target.value)}
                className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 font-semibold text-primary outline-none focus:ring-2 focus:ring-primary/20"
              >
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
              <button
                onClick={() => translate.mutate({ text, targetLanguage })}
                disabled={!text.trim() || translate.isPending}
                data-testid="button-pilgrim-translate"
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <ArrowRightLeft className={`w-4 h-4 ${translate.isPending ? "animate-spin" : ""}`} />
                {ar ? "ترجمة" : "Translate"}
              </button>
            </div>

            <div className="bg-secondary/40 border border-border rounded-2xl p-4 min-h-[120px]">
              {translate.isPending ? (
                <p className="text-muted-foreground animate-pulse">{ar ? "جارٍ الترجمة..." : "Translating..."}</p>
              ) : translate.data ? (
                <div>
                  <p className="text-lg font-medium" dir="auto">{translate.data.translatedText}</p>
                  <button
                    onClick={() => {
                      const u = new SpeechSynthesisUtterance(translate.data!.translatedText);
                      window.speechSynthesis.speak(u);
                    }}
                    className={`mt-3 flex items-center gap-2 text-sm text-primary font-semibold ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <Volume2 className="w-4 h-4" />
                    {ar ? "استمع" : "Listen"}
                  </button>
                </div>
              ) : (
                <p className="text-muted-foreground/50">{ar ? "ستظهر الترجمة هنا" : "Translation will appear here"}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
