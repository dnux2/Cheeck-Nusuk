import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, ArrowRightLeft, Volume2, VolumeX, Languages, Copy, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useTranslate } from "@/hooks/use-ai";
import { useToast } from "@/hooks/use-toast";
import { PilgrimLayout } from "@/components/pilgrim-layout";

const LANGUAGES = [
  { code: "Arabic",     labelAr: "العربية",         labelEn: "Arabic",      flag: "🇸🇦" },
  { code: "English",    labelAr: "الإنجليزية",      labelEn: "English",     flag: "🇬🇧" },
  { code: "Urdu",       labelAr: "الأردية",         labelEn: "Urdu",        flag: "🇵🇰" },
  { code: "French",     labelAr: "الفرنسية",        labelEn: "French",      flag: "🇫🇷" },
  { code: "Malay",      labelAr: "الملايو",         labelEn: "Malay",       flag: "🇲🇾" },
  { code: "Indonesian", labelAr: "الإندونيسية",     labelEn: "Indonesian",  flag: "🇮🇩" },
  { code: "Turkish",    labelAr: "التركية",         labelEn: "Turkish",     flag: "🇹🇷" },
  { code: "Bengali",    labelAr: "البنغالية",       labelEn: "Bengali",     flag: "🇧🇩" },
];

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const LANG_TO_LOCALE: Record<string, string> = {
  Arabic: "ar-SA", English: "en-US", Urdu: "ur-PK", French: "fr-FR",
  Malay: "ms-MY", Indonesian: "id-ID", Turkish: "tr-TR", Bengali: "bn-BD",
};

export function PilgrimTranslatorPage() {
  const { lang, isRTL } = useLanguage();
  const { toast } = useToast();
  const translate = useTranslate();
  const ar = lang === "ar";

  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState("Arabic");
  const [targetLang, setTargetLang] = useState("English");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    await translate.mutateAsync({ text: sourceText, targetLanguage: targetLang });
  };

  const handleSwap = () => {
    const prevSrc = sourceLang;
    const prevTgt = targetLang;
    const prevResult = translate.data?.translatedText || "";
    setSourceLang(prevTgt);
    setTargetLang(prevSrc);
    if (prevResult) setSourceText(prevResult);
  };

  const startListening = () => {
    const API = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!API) {
      toast({ title: ar ? "المتصفح لا يدعم التعرف على الصوت" : "Voice not supported", variant: "destructive" });
      return;
    }
    const r = new API();
    r.continuous = false;
    r.interimResults = true;
    r.lang = LANG_TO_LOCALE[sourceLang] || "ar-SA";
    r.onstart = () => setIsListening(true);
    r.onresult = (e: SpeechRecognitionEvent) => {
      setSourceText(Array.from(e.results).map(r => r[0].transcript).join(""));
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
  };

  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const handleSpeak = () => {
    if (!translate.data?.translatedText) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const utter = new SpeechSynthesisUtterance(translate.data.translatedText);
    utter.lang = LANG_TO_LOCALE[targetLang] || "en-US";
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const copyText = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: ar ? "تم النسخ" : "Copied!" });
  };

  const getLangLabel = (code: string) => {
    const l = LANGUAGES.find(x => x.code === code);
    if (!l) return code;
    return `${l.flag} ${ar ? l.labelAr : l.labelEn}`;
  };

  return (
    <PilgrimLayout>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4" dir={isRTL ? "rtl" : "ltr"}>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Languages className="w-5 h-5 text-accent" />
            <h1 className="font-bold text-primary text-xl">{ar ? "المترجم الذكي" : "AI Translator"}</h1>
          </div>
          <p className="text-xs text-muted-foreground">{ar ? "ترجمة فورية بالذكاء الاصطناعي بـ٨ لغات" : "Instant AI translation in 8 languages"}</p>
        </div>

        {/* Source panel */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          {/* Language selector + mic */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <select
              value={sourceLang}
              onChange={e => setSourceLang(e.target.value)}
              className="bg-secondary border border-border rounded-2xl px-3 py-1.5 text-xs font-bold text-primary outline-none"
              data-testid="select-source-language"
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {ar ? l.labelAr : l.labelEn}</option>)}
            </select>
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-secondary text-primary hover:bg-secondary/80"}`}
              data-testid="btn-voice-input"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {isListening ? (ar ? "إيقاف" : "Stop") : (ar ? "صوت" : "Voice")}
            </button>
          </div>

          {/* Source textarea */}
          <textarea
            value={sourceText}
            onChange={e => setSourceText(e.target.value)}
            placeholder={ar ? `اكتب النص بـ ${getLangLabel(sourceLang)}...` : `Type text in ${getLangLabel(sourceLang)}...`}
            className="w-full px-4 pb-4 text-sm bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground/50 min-h-[100px]"
            dir="auto"
            rows={4}
            data-testid="input-translate-text"
          />

          {sourceText && (
            <div className="px-4 pb-3 border-t border-border pt-2 flex items-center gap-2">
              <button onClick={() => copyText(sourceText)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Swap button */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleSwap}
            data-testid="btn-swap-languages"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-xs font-bold text-primary hover:bg-secondary transition-all shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            {ar ? `عكس: ${getLangLabel(sourceLang)} ↔ ${getLangLabel(targetLang)}` : `Swap: ${getLangLabel(sourceLang)} ↔ ${getLangLabel(targetLang)}`}
          </button>
        </div>

        {/* Target language */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-muted-foreground">{ar ? "ترجم إلى" : "Translate to"}</div>
            <select
              value={targetLang}
              onChange={e => setTargetLang(e.target.value)}
              className="bg-secondary border border-border rounded-2xl px-3 py-1.5 text-xs font-bold text-primary outline-none"
              data-testid="select-target-language"
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {ar ? l.labelAr : l.labelEn}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setTargetLang(l.code)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${targetLang === l.code ? "bg-primary text-primary-foreground border-transparent" : "bg-background text-muted-foreground border-border hover:border-primary"}`}
                data-testid={`lang-${l.code.toLowerCase()}`}
              >
                {l.flag} {ar ? l.labelAr : l.labelEn}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Translate button */}
        <button
          onClick={handleTranslate}
          disabled={!sourceText.trim() || translate.isPending}
          className="w-full py-4 rounded-3xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          data-testid="btn-translate"
        >
          {translate.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}
          {translate.isPending ? (ar ? "جاري الترجمة..." : "Translating...") : (ar ? "ترجم الآن" : "Translate Now")}
        </button>

        {/* Result */}
        {translate.data && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border-2 border-primary/20 bg-secondary/30 overflow-hidden shadow-sm">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-border">
              <span className="text-xs font-bold text-primary">{getLangLabel(targetLang)}</span>
              <div className="flex gap-2">
                <button
                  onClick={handleSpeak}
                  data-testid="btn-speak-translation"
                  className={`p-2 rounded-xl transition-colors ${isSpeaking ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-primary"}`}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button onClick={() => copyText(translate.data.translatedText)} className="p-2 rounded-xl hover:bg-secondary text-primary">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="px-5 py-4 text-base text-foreground font-medium leading-relaxed" dir="auto">
              {translate.data.translatedText}
            </p>
          </motion.div>
        )}

      </div>
    </PilgrimLayout>
  );
}
