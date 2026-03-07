import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, User, Lock, Eye, EyeOff, AlertCircle, CreditCard, Hash, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import logoImg from "@assets/WhatsApp_Image_2026-03-07_at_12.53.20_AM_1772834050515.jpeg";

const SUPERVISOR_CREDENTIALS = [
  { username: "admin", password: "nusuk2026" },
  { username: "supervisor1", password: "hajj1447" },
];

export function LoginPage() {
  const [, navigate] = useLocation();
  const { lang, setLang, isRTL } = useLanguage();
  const ar = lang === "ar";

  const [tab, setTab] = useState<"supervisor" | "pilgrim">("supervisor");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Supervisor fields
  const [supUsername, setSupUsername] = useState("");
  const [supPassword, setSupPassword] = useState("");

  // Pilgrim fields
  const [passport, setPassport] = useState("");
  const [pin, setPin] = useState("");

  // Read tab from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "pilgrim") setTab("pilgrim");
    else setTab("supervisor");
  }, []);


  function handleSupervisorLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const match = SUPERVISOR_CREDENTIALS.find(
        c => c.username === supUsername.trim().toLowerCase() && c.password === supPassword
      );

      if (match) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", "supervisor");
        localStorage.setItem("username", supUsername.trim().toLowerCase());
        navigate("/dashboard");
      } else {
        setError(ar ? "اسم المستخدم أو كلمة المرور غير صحيحة" : "Invalid username or password");
        setLoading(false);
      }
    }, 400);
  }

  async function handlePilgrimLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!passport.trim()) {
      setError(ar ? "الرجاء إدخال رقم الجواز" : "Please enter your passport number");
      return;
    }
    if (!pin.trim()) {
      setError(ar ? "الرجاء إدخال الرقم السري" : "Please enter your PIN");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/pilgrims/by-passport/${passport.trim().toUpperCase()}`);
      if (!res.ok) {
        setError(ar ? "رقم الجواز غير موجود في النظام" : "Passport number not found in system");
        setLoading(false);
        return;
      }
      const pilgrim = await res.json();
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("role", "pilgrim");
      localStorage.setItem("passport", passport.trim().toUpperCase());
      localStorage.setItem("pilgrimId", String(pilgrim.id));
      navigate("/pilgrim");
    } catch {
      setError(ar ? "خطأ في الاتصال بالخادم" : "Connection error");
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen bg-gradient-to-br from-[#0a2e26] via-[#0c3d32] to-[#052a22] flex flex-col items-center justify-center px-4 py-10"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Lang toggle */}
      <div className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} flex items-center bg-white/10 rounded-lg overflow-hidden border border-white/20`}>
        <button
          onClick={() => setLang("ar")}
          className={`px-3 py-1.5 text-xs font-bold transition-all ${lang === "ar" ? "bg-white text-[#0a2e26]" : "text-white/70 hover:text-white"}`}
        >ع</button>
        <button
          onClick={() => setLang("en")}
          className={`px-3 py-1.5 text-xs font-bold transition-all ${lang === "en" ? "bg-white text-[#0a2e26]" : "text-white/70 hover:text-white"}`}
        >EN</button>
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/")}
        data-testid="btn-back-to-home"
        className={`absolute top-6 ${isRTL ? "right-6" : "left-6"} flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold transition-all`}
      >
        {isRTL ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
        {ar ? "رجوع" : "Back"}
      </motion.button>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 mb-8"
      >
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#f5e6c8] shadow-xl shadow-black/40">
          <img src={logoImg} alt="CheckNusuk" className="w-full h-full object-contain" />
        </div>
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">CheckNusuk</h1>
          <p className="text-white/60 text-sm mt-0.5">{ar ? "منصة إدارة الحج والعمرة" : "Hajj & Umrah Management Platform"}</p>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Tab switcher */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => { setTab("supervisor"); setError(""); }}
            data-testid="tab-supervisor"
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all
              ${tab === "supervisor"
                ? "text-white border-b-2 border-[#4CAF88] bg-white/5"
                : "text-white/40 hover:text-white/70"}`}
          >
            <ShieldCheck className="w-4 h-4" />
            {ar ? "المشرف" : "Supervisor"}
          </button>
          <button
            onClick={() => { setTab("pilgrim"); setError(""); }}
            data-testid="tab-pilgrim"
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all
              ${tab === "pilgrim"
                ? "text-white border-b-2 border-[#d4a853] bg-white/5"
                : "text-white/40 hover:text-white/70"}`}
          >
            <User className="w-4 h-4" />
            {ar ? "الحاج" : "Pilgrim"}
          </button>
        </div>

        <div className="p-7">
          <AnimatePresence mode="wait">
            {tab === "supervisor" ? (
              <motion.form
                key="supervisor"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSupervisorLogin}
                className="space-y-4"
              >
                <div>
                  <p className="text-white/50 text-xs mb-4 text-center">
                    {ar ? "تسجيل دخول المشرفين والمديرين" : "For supervisors and administrators"}
                  </p>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-white/70 text-xs font-semibold">{ar ? "اسم المستخدم" : "Username"}</label>
                  <div className="relative">
                    <User className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} w-4 h-4 text-white/30`} />
                    <input
                      type="text"
                      value={supUsername}
                      onChange={e => { setSupUsername(e.target.value); setError(""); }}
                      placeholder={ar ? "أدخل اسم المستخدم" : "Enter username"}
                      data-testid="input-username"
                      autoComplete="username"
                      className={`w-full bg-white/10 border border-white/15 rounded-xl py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#4CAF88]/60 focus:bg-white/15 transition-all
                        ${isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4"}`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-white/70 text-xs font-semibold">{ar ? "كلمة المرور" : "Password"}</label>
                  <div className="relative">
                    <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} w-4 h-4 text-white/30`} />
                    <input
                      type={showPass ? "text" : "password"}
                      value={supPassword}
                      onChange={e => { setSupPassword(e.target.value); setError(""); }}
                      placeholder={ar ? "أدخل كلمة المرور" : "Enter password"}
                      data-testid="input-password"
                      autoComplete="current-password"
                      className={`w-full bg-white/10 border border-white/15 rounded-xl py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#4CAF88]/60 focus:bg-white/15 transition-all
                        ${isRTL ? "pr-10 pl-10 text-right" : "pl-10 pr-10"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"} text-white/30 hover:text-white/60 transition-colors`}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                    >
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="btn-supervisor-login"
                  className="w-full py-3 rounded-xl bg-[#4CAF88] hover:bg-[#3d9e79] active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-[#4CAF88]/30 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (ar ? "جاري الدخول..." : "Signing in...") : (ar ? "تسجيل الدخول" : "Sign In")}
                </button>

                {/* Demo hint */}
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider text-center">{ar ? "بيانات تجريبية" : "Demo Credentials"}</p>
                  <div className="flex flex-col gap-1 text-center">
                    <code className="text-[#4CAF88] text-xs">admin / nusuk2026</code>
                    <code className="text-[#4CAF88] text-xs">supervisor1 / hajj1447</code>
                  </div>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="pilgrim"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePilgrimLogin}
                className="space-y-4"
              >
                <div>
                  <p className="text-white/50 text-xs mb-4 text-center">
                    {ar ? "أدخل رقم جوازك وكلمة المرور للدخول" : "Enter your passport number and PIN to continue"}
                  </p>
                </div>

                {/* Passport */}
                <div className="space-y-1.5">
                  <label className="text-white/70 text-xs font-semibold">{ar ? "رقم الجواز" : "Passport Number"}</label>
                  <div className="relative">
                    <CreditCard className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} w-4 h-4 text-white/30`} />
                    <input
                      type="text"
                      value={passport}
                      onChange={e => { setPassport(e.target.value.toUpperCase()); setError(""); }}
                      placeholder={ar ? "مثال: A12345678" : "e.g. A12345678"}
                      data-testid="input-passport"
                      autoComplete="off"
                      className={`w-full bg-white/10 border border-white/15 rounded-xl py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#d4a853]/60 focus:bg-white/15 transition-all tracking-wider
                        ${isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4"}`}
                    />
                  </div>
                </div>

                {/* PIN */}
                <div className="space-y-1.5">
                  <label className="text-white/70 text-xs font-semibold">
                    {ar ? "الرقم السري (آخر 4 أرقام من الهاتف)" : "PIN (last 4 digits of phone)"}
                  </label>
                  <div className="relative">
                    <Hash className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} w-4 h-4 text-white/30`} />
                    <input
                      type="password"
                      value={pin}
                      onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
                      placeholder="••••"
                      data-testid="input-pin"
                      autoComplete="off"
                      maxLength={4}
                      inputMode="numeric"
                      className={`w-full bg-white/10 border border-white/15 rounded-xl py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#d4a853]/60 focus:bg-white/15 transition-all tracking-[0.4em]
                        ${isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4"}`}
                    />
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                    >
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="btn-pilgrim-login"
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{ background: "linear-gradient(135deg, #d4a853 0%, #b8892e 100%)", color: "#fff", boxShadow: "0 4px 20px rgba(212,168,83,0.3)" }}
                >
                  {loading ? (ar ? "جاري الدخول..." : "Entering...") : (ar ? "دخول بوابة الحاج" : "Enter Pilgrim Portal")}
                </button>

                <p className="text-white/30 text-[10px] text-center mt-2">
                  {ar ? "يُقبل أي رقم جواز ورقم سري للدخول" : "Any passport number and PIN will be accepted"}
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="text-white/20 text-xs mt-6">
        © 2026 CheckNusuk · {ar ? "منصة حج آمنة وذكية" : "Smart & Secure Hajj Platform"}
      </p>
    </div>
  );
}
