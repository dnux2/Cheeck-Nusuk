import { useState, useRef, useEffect } from "react";
import { useTranslate } from "@/hooks/use-ai";
import { Languages, ArrowRightLeft, Mic, MicOff, Volume2, VolumeX, Copy, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = [
  { code: "Arabic",     label: "العربية",      flag: "🇸🇦" },
  { code: "English",    label: "English",       flag: "🇬🇧" },
  { code: "Urdu",       label: "اردو",          flag: "🇵🇰" },
  { code: "French",     label: "Français",      flag: "🇫🇷" },
  { code: "Malay",      label: "Melayu",        flag: "🇲🇾" },
  { code: "Indonesian", label: "Bahasa",        flag: "🇮🇩" },
  { code: "Turkish",    label: "Türkçe",        flag: "🇹🇷" },
  { code: "Bengali",    label: "বাংলা",         flag: "🇧🇩" },
  { code: "Pashto",     label: "پښتو",          flag: "🇦🇫" },
];

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const LANG_TO_LOCALE: Record<string, string> = {
  Arabic: "ar-SA", English: "en-US", Urdu: "ur-PK", French: "fr-FR",
  Malay: "ms-MY", Indonesian: "id-ID", Turkish: "tr-TR", Bengali: "bn-BD", Pashto: "ps-AF",
};

export function TranslatorPage() {
  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState("Arabic");
  const [targetLang, setTargetLang] = useState("English");
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const translate = useTranslate();
  const { isRTL, lang } = useLanguage();
  const { toast } = useToast();
  const ar = lang === "ar";

  const labels = {
    title: ar ? "المترجم الذكي" : "AI Field Translator",
    subtitle: ar ? "ترجمة فورية للمشرفين في الميدان" : "Instant communication for supervisors in the field",
    placeholder: ar ? "اكتب أو تحدث لترجمة النص..." : "Type or speak to translate...",
    translateBtn: ar ? "ترجمة" : "Translate",
    translating: ar ? "جارٍ الترجمة..." : "Translating...",
    result: ar ? "ستظهر الترجمة هنا" : "Translation will appear here",
    listening: ar ? "جارٍ الاستماع..." : "Listening...",
    voiceStart: ar ? "انقر للتحدث" : "Click to speak",
    speaking: ar ? "جارٍ النطق..." : "Speaking...",
    speak: ar ? "استمع" : "Listen",
    swapLangs: ar ? "عكس اللغتين" : "Swap languages",
  };

  const startListening = () => {
    const API = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!API) {
      setVoiceError(ar ? "المتصفح لا يدعم التعرف على الصوت" : "Voice recognition not supported");
      return;
    }
    setVoiceError(null);
    const r = new API();
    r.continuous = false;
    r.interimResults = true;
    r.lang = LANG_TO_LOCALE[sourceLang] || "ar-SA";
    r.onstart = () => setIsListening(true);
    r.onresult = (e: SpeechRecognitionEvent) => {
      setSourceText(Array.from(e.results).map(r => r[0].transcript).join(""));
    };
    r.onerror = () => { setIsListening(false); setVoiceError(ar ? "تعذّر الوصول إلى الميكروفون" : "Microphone error"); };
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
  };

  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };

  useEffect(() => { return () => recognitionRef.current?.abort(); }, []);

  const handleTranslate = () => {
    if (!sourceText.trim()) return;
    translate.mutate({ text: sourceText, targetLanguage: targetLang });
  };

  const handleSwap = () => {
    const prevSource = sourceLang;
    const prevTarget = targetLang;
    const prevResult = translate.data?.translatedText || "";
    setSourceLang(prevTarget);
    setTargetLang(prevSource);
    if (prevResult) setSourceText(prevResult);
  };

  const handleCopy = () => {
    if (translate.data?.translatedText) {
      navigator.clipboard.writeText(translate.data.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = () => {
    if (!translate.data?.translatedText) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(translate.data.translatedText);
    utter.lang = LANG_TO_LOCALE[targetLang] || "en-US";
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto h-[calc(100vh-5rem)] flex flex-col" dir={isRTL ? "rtl" : "ltr"}>

      {/* Header */}
      <div className={`mb-8 ${isRTL ? "text-right" : ""}`}>
        <h1 className={`text-3xl font-display font-bold text-foreground flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Languages className="w-8 h-8 text-primary flex-shrink-0" />
          {labels.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">{labels.subtitle}</p>
      </div>

      {/* Main translator grid */}
      <div className={`grid md:grid-cols-[1fr,auto,1fr] gap-4 items-start flex-1 min-h-0`}>

        {/* Source panel */}
        <div className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[300px]">
          {/* Source language selector */}
          <div className={`flex items-center justify-between px-4 py-3 border-b border-border ${isRTL ? "flex-row-reverse" : ""}`}>
            <select
              value={sourceLang}
              onChange={e => setSourceLang(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 font-bold text-primary outline-none text-sm focus:ring-2 focus:ring-primary/20"
              data-testid="select-source-language"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
            <button
              onClick={isListening ? stopListening : startListening}
              data-testid="button-voice-input"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border ${
                isListening
                  ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse"
                  : "bg-secondary text-foreground border-border hover:border-primary/50"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isListening ? labels.listening : labels.voiceStart}
            </button>
          </div>

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder={labels.placeholder}
            data-testid="input-translate-text"
            dir="auto"
            className={`flex-1 w-full bg-transparent resize-none outline-none text-xl placeholder:text-muted-foreground/40 p-4 ${isRTL ? "text-right" : ""}`}
          />

          <AnimatePresence>
            {voiceError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm text-destructive px-4 pb-3">
                {voiceError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Listening waveform */}
          <AnimatePresence>
            {isListening && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1 pb-4">
                {[0.2, 0.5, 0.8, 0.5, 0.2].map((d, i) => (
                  <motion.div key={i} className="w-1 bg-destructive rounded-full"
                    animate={{ height: ["8px", "24px", "8px"] }}
                    transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Middle: Translate + Swap */}
        <div className="flex flex-col items-center gap-3 pt-10">
          {/* Translate button */}
          <button
            onClick={handleTranslate}
            disabled={!sourceText.trim() || translate.isPending}
            data-testid="button-translate"
            title={labels.translateBtn}
            className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/25 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 transition-all"
          >
            {translate.isPending
              ? <Loader2 className="w-6 h-6 animate-spin" />
              : <ArrowRightLeft className="w-6 h-6" />}
          </button>
          <span className="text-xs text-muted-foreground font-semibold text-center">
            {translate.isPending ? labels.translating : labels.translateBtn}
          </span>

          {/* Swap languages button */}
          <button
            onClick={handleSwap}
            data-testid="button-swap-languages"
            title={labels.swapLangs}
            className="w-10 h-10 rounded-full bg-secondary border border-border text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center mt-1"
          >
            <ArrowRightLeft className="w-4 h-4 rotate-90" />
          </button>
          <span className="text-[10px] text-muted-foreground text-center">{labels.swapLangs}</span>
        </div>

        {/* Output panel */}
        <div className="flex flex-col h-full bg-secondary/30 rounded-2xl border border-border shadow-sm overflow-hidden relative min-h-[300px]">
          {/* Target language selector + actions */}
          <div className={`flex items-center justify-between px-4 py-3 border-b border-border ${isRTL ? "flex-row-reverse" : ""}`}>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              data-testid="select-target-language"
              className="bg-background border border-border rounded-lg px-3 py-1.5 font-bold text-primary outline-none text-sm focus:ring-2 focus:ring-primary/20"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>

            {translate.data && (
              <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={handleSpeak}
                  title={labels.speak}
                  data-testid="button-speak-translation"
                  className={`p-2 rounded-lg transition-colors ${isSpeaking ? "bg-primary text-white" : "bg-secondary hover:bg-primary hover:text-white"}`}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCopy}
                  title={ar ? "نسخ" : "Copy"}
                  data-testid="button-copy-translation"
                  className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className={`flex-1 text-xl font-medium p-4 ${isRTL ? "text-right" : ""}`} dir="auto">
            {translate.isPending ? (
              <span className="text-muted-foreground animate-pulse">{labels.translating}</span>
            ) : translate.data ? (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {translate.data.translatedText}
              </motion.span>
            ) : (
              <span className="text-muted-foreground/50">{labels.result}</span>
            )}
          </div>

          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
