import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, ArrowRightLeft, Volume2, Languages, Copy } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useTranslate } from "@/hooks/use-ai";
import { useToast } from "@/hooks/use-toast";
import { PilgrimLayout } from "@/components/pilgrim-layout";

const LANGUAGES = [
  { code: "Arabic", labelAr: "العربية",      labelEn: "Arabic" },
  { code: "English", labelAr: "الإنجليزية", labelEn: "English" },
  { code: "Urdu",    labelAr: "الأردية",    labelEn: "Urdu" },
  { code: "French",  labelAr: "الفرنسية",   labelEn: "French" },
  { code: "Malay",   labelAr: "الملايو",    labelEn: "Malay" },
  { code: "Indonesian", labelAr: "الإندونيسية", labelEn: "Indonesian" },
  { code: "Turkish", labelAr: "التركية",    labelEn: "Turkish" },
  { code: "Bengali", labelAr: "البنغالية",  labelEn: "Bengali" },
];

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function PilgrimTranslatorPage() {
  const { lang, isRTL } = useLanguage();
  const { toast } = useToast();
  const translate = useTranslate();
  const ar = lang === "ar";

  const [text, setText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Arabic");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleTranslate = async () => {
    if (!text.trim()) return;
    await translate.mutateAsync({ text, targetLanguage });
  };

  const startListening = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({ title: ar ? "المتصفح لا يدعم التعرف على الصوت" : "Browser doesn't support voice recognition", variant: "destructive" });
      return;
    }
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

  const speak = (content: string) => {
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = targetLanguage === "Arabic" ? "ar-SA" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const copyText = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: ar ? "تم النسخ" : "Copied!" });
  };

  return (
    <PilgrimLayout>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5" dir={isRTL ? "rtl" : "ltr"}>

        {/* Header */}
        <div className={isRTL ? "text-right" : ""}>
          <div className="flex items-center gap-2 mb-1">
            <Languages className="w-5 h-5 text-accent" />
            <h1 className="font-bold text-primary text-xl">{ar ? "المترجم الذكي" : "AI Translator"}</h1>
          </div>
          <p className="text-xs text-muted-foreground">{ar ? "ترجمة فورية بالذكاء الاصطناعي بـ٨ لغات" : "Instant AI translation in 8 languages"}</p>
        </div>

        {/* Source */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-card border border-border shadow-sm overflow-hidden"
        >
          <div className={`px-4 pt-4 pb-2 text-xs font-bold text-muted-foreground ${isRTL ? "text-right" : ""}`}>
            {ar ? "النص الأصلي" : "Original Text"}
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={ar ? "اكتب النص هنا أو استخدم الميكروفون..." : "Type text here or use the microphone..."}
            className={`w-full px-4 pb-3 text-sm bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground/50 min-h-[100px] ${isRTL ? "text-right" : ""}`}
            rows={4}
            data-testid="input-translate-text"
          />
          <div className={`px-4 pb-3 flex items-center gap-2 border-t border-border pt-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-secondary text-primary hover:bg-secondary/80"}`}
              data-testid="btn-voice-input"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening ? (ar ? "إيقاف" : "Stop") : (ar ? "صوت" : "Voice")}
            </button>
            {text && (
              <button onClick={() => copyText(text)} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Target language */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-3xl bg-card border border-border shadow-sm p-4"
        >
          <div className={`text-xs font-bold text-muted-foreground mb-3 ${isRTL ? "text-right" : ""}`}>{ar ? "اللغة المستهدفة" : "Target Language"}</div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setTargetLanguage(l.code)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${targetLanguage === l.code ? "bg-primary text-white border-transparent" : "bg-background text-muted-foreground border-border hover:border-primary"}`}
                data-testid={`lang-${l.code.toLowerCase()}`}
              >
                {ar ? l.labelAr : l.labelEn}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Translate button */}
        <button
          onClick={handleTranslate}
          disabled={!text.trim() || translate.isPending}
          className="w-full py-4 rounded-3xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          data-testid="btn-translate"
        >
          <ArrowRightLeft className="w-5 h-5" />
          {translate.isPending ? (ar ? "جاري الترجمة..." : "Translating...") : (ar ? "ترجم الآن" : "Translate Now")}
        </button>

        {/* Result */}
        {translate.data && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-[#0E4D41]/20 bg-gradient-to-br from-[#F0FDF9] to-white shadow-sm overflow-hidden"
          >
            <div className={`px-5 pt-4 pb-2 flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-xs font-bold text-primary">{ar ? "الترجمة" : "Translation"} — {targetLanguage}</span>
              <div className="flex gap-2">
                <button onClick={() => speak(translate.data.translatedText)} className="p-2 rounded-xl hover:bg-emerald-50 text-primary">
                  <Volume2 className="w-4 h-4" />
                </button>
                <button onClick={() => copyText(translate.data.translatedText)} className="p-2 rounded-xl hover:bg-emerald-50 text-primary">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className={`px-5 pb-5 text-base text-primary font-medium leading-relaxed ${isRTL && targetLanguage === "Arabic" ? "text-right" : ""}`}>
              {translate.data.translatedText}
            </p>
          </motion.div>
        )}

      </div>
    </PilgrimLayout>
  );
}
