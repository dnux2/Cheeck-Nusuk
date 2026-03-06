import { useState, useRef, useEffect } from "react";
import { useTranslate } from "@/hooks/use-ai";
import { Languages, ArrowRightLeft, Mic, MicOff, Volume2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

const LANGUAGES = ["Arabic", "English", "Urdu", "French", "Malay", "Indonesian", "Turkish", "Bengali", "Pashto"];

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function TranslatorPage() {
  const [text, setText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Arabic");
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const translate = useTranslate();
  const { isRTL, lang } = useLanguage();

  const labels = {
    title: lang === "ar" ? "المترجم الذكي" : "AI Field Translator",
    subtitle: lang === "ar" ? "ترجمة فورية للمشرفين في الميدان" : "Instant communication bridging for supervisors",
    autoDetect: lang === "ar" ? "كشف تلقائي" : "Auto-Detect",
    placeholder: lang === "ar" ? "اكتب أو تحدث لترجمة النص..." : "Type or speak to translate...",
    targetLang: lang === "ar" ? "اللغة المستهدفة" : "Target Language",
    translateBtn: lang === "ar" ? "ترجمة" : "Translate",
    translating: lang === "ar" ? "جارٍ الترجمة..." : "Translating...",
    result: lang === "ar" ? "ستظهر الترجمة هنا" : "Translation will appear here",
    listening: lang === "ar" ? "جارٍ الاستماع..." : "Listening...",
    voiceStart: lang === "ar" ? "انقر للتحدث" : "Click to speak",
    voiceNotSupported: lang === "ar" ? "المتصفح لا يدعم التعرف على الصوت" : "Voice recognition not supported in this browser",
    copy: lang === "ar" ? "نسخ" : "Copy",
    copied: lang === "ar" ? "تم النسخ" : "Copied!",
    speak: lang === "ar" ? "استمع" : "Listen",
  };

  const startListening = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceError(labels.voiceNotSupported);
      return;
    }
    setVoiceError(null);
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang === "ar" ? "ar-SA" : "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
      setText(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setVoiceError(lang === "ar" ? "تعذّر الوصول إلى الميكروفون" : "Could not access microphone");
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const handleTranslate = () => {
    if (!text.trim()) return;
    translate.mutate({ text, targetLanguage });
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
    const utt = new SpeechSynthesisUtterance(translate.data.translatedText);
    const langMap: Record<string, string> = {
      Arabic: "ar-SA", English: "en-US", Urdu: "ur-PK", French: "fr-FR",
      Malay: "ms-MY", Indonesian: "id-ID", Turkish: "tr-TR", Bengali: "bn-BD", Pashto: "ps-AF",
    };
    utt.lang = langMap[targetLanguage] || "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto h-[calc(100vh-5rem)] flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`mb-8 ${isRTL ? "text-right" : ""}`}>
        <h1 className={`text-3xl font-display font-bold text-foreground flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Languages className="w-8 h-8 text-primary flex-shrink-0" />
          {labels.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">{labels.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 items-start flex-1 min-h-0">
        {/* Input panel */}
        <div className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-sm p-5 min-h-[300px]">
          <div className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="font-bold text-muted-foreground text-sm">{labels.autoDetect}</span>
            {/* Voice button */}
            <button
              onClick={isListening ? stopListening : startListening}
              data-testid="button-voice-input"
              title={labels.voiceStart}
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={labels.placeholder}
            data-testid="input-translate-text"
            dir="auto"
            className={`flex-1 w-full bg-transparent resize-none outline-none text-xl placeholder:text-muted p-2 ${isRTL ? "text-right" : ""}`}
          />

          <AnimatePresence>
            {voiceError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm text-destructive mt-2">
                {voiceError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Listening waveform animation */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1 mt-3"
              >
                {[0.2, 0.5, 0.8, 0.5, 0.2].map((d, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-destructive rounded-full"
                    animate={{ height: ["8px", "24px", "8px"] }}
                    transition={{ duration: 0.8, delay: d, repeat: Infinity }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Translate button */}
        <div className="flex flex-col items-center gap-3 pt-14">
          <button
            onClick={handleTranslate}
            disabled={!text.trim() || translate.isPending}
            data-testid="button-translate"
            className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/25 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 transition-all"
          >
            <ArrowRightLeft className={`w-6 h-6 ${translate.isPending ? "animate-spin" : ""}`} />
          </button>
          <span className="text-xs text-muted-foreground font-semibold">
            {translate.isPending ? labels.translating : labels.translateBtn}
          </span>
        </div>

        {/* Output panel */}
        <div className="flex flex-col h-full bg-secondary/30 rounded-2xl border border-border shadow-sm p-5 relative overflow-hidden min-h-[300px]">
          <div className={`flex items-center justify-between mb-4 z-10 ${isRTL ? "flex-row-reverse" : ""}`}>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              data-testid="select-target-language"
              className="bg-background border border-border rounded-lg px-3 py-1.5 font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            >
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>

            {translate.data && (
              <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={handleSpeak}
                  title={labels.speak}
                  data-testid="button-speak-translation"
                  className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-white transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopy}
                  title={labels.copy}
                  data-testid="button-copy-translation"
                  className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className={`flex-1 text-xl font-medium p-2 z-10 ${isRTL ? "text-right" : ""}`} dir="auto">
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
