import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, Eye, EyeOff, LogIn, Lock, User, CreditCard, Hash } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/WhatsApp_Image_2026-03-07_at_12.53.20_AM_1772834050515.jpeg";

type Tab = "supervisor" | "pilgrim";

export function LoginPage() {
  const { lang, setLang, isRTL } = useLanguage();
  const ar = lang === "ar";
  const { login } = useAuth();
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "supervisor");

  // Supervisor form
  const [supUsername, setSupUsername] = useState("");
  const [supPassword, setSupPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Pilgrim form
  const [passport, setPassport] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSupervisorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supUsername || !supPassword) return;
    setLoading(true);
    const result = await login({ username: supUsername, password: supPassword });
    if (result.ok) {
      window.location.href = "/dashboard";
    } else {
      setLoading(false);
      toast({ title: ar ? "خطأ في تسجيل الدخول" : "Login Failed", description: ar ? "اسم المستخدم أو كلمة المرور غير صحيحة" : "Invalid username or password", variant: "destructive" });
    }
  };

  const handlePilgrimLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passport || pin.length !== 4) return;
    setLoading(true);
    const result = await login({ username: passport.toUpperCase(), password: pin });
    if (result.ok) {
      window.location.href = "/pilgrim";
    } else {
      setLoading(false);
      toast({ title: ar ? "خطأ في تسجيل الدخول" : "Login Failed", description: ar ? "رقم الجواز أو الرمز السري غير صحيح" : "Invalid passport number or PIN", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E4D41] via-[#0a3d32] to-[#052a22] flex flex-col items-center justify-center px-4 py-8" dir={isRTL ? "rtl" : "ltr"}>

      {/* Lang toggle */}
      <div className="absolute top-4 right-4 flex items-center bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20">
        <button onClick={() => setLang("en")} className={`px-2.5 py-1 text-xs font-bold transition-all ${lang === "en" ? "bg-white text-primary" : "text-white"}`}>EN</button>
        <button onClick={() => setLang("ar")} className={`px-2.5 py-1 text-xs font-bold transition-all ${lang === "ar" ? "bg-white text-primary" : "text-white"}`}>ع</button>
      </div>

      {/* Logo + title */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl bg-[#f5e6c8] mb-4">
          <img src={logoImg} alt="CheckNusuk" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">CheckNusuk</h1>
        <p className="text-white/60 text-sm mt-1">{ar ? "نظام إدارة الحج الذكي" : "Smart Hajj Management System"}</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-white dark:bg-card rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            data-testid="tab-supervisor"
            onClick={() => setTab("supervisor")}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === "supervisor" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            {ar ? "دخول المشرف" : "Supervisor Login"}
          </button>
          <button
            data-testid="tab-pilgrim"
            onClick={() => setTab("pilgrim")}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === "pilgrim" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            {ar ? "بوابة الحاج" : "Pilgrim Portal"}
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {tab === "supervisor" ? (
              <motion.form
                key="supervisor"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleSupervisorLogin}
                className="space-y-5"
              >
                <div>
                  <p className={`text-xs font-semibold text-muted-foreground mb-4 ${isRTL ? "text-right" : ""}`}>
                    {ar ? "الدخول للوحة تحكم المشرفين" : "Access the supervisor control panel"}
                  </p>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold text-foreground block ${isRTL ? "text-right" : ""}`}>
                    {ar ? "اسم المستخدم" : "Username"}
                  </label>
                  <div className="relative">
                    <User className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                    <input
                      data-testid="input-username"
                      type="text"
                      value={supUsername}
                      onChange={e => setSupUsername(e.target.value)}
                      placeholder={ar ? "أدخل اسم المستخدم" : "Enter username"}
                      autoComplete="username"
                      className={`w-full h-11 rounded-2xl border border-border bg-secondary/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all ${isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4"}`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold text-foreground block ${isRTL ? "text-right" : ""}`}>
                    {ar ? "كلمة المرور" : "Password"}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                    <input
                      data-testid="input-password"
                      type={showPassword ? "text" : "password"}
                      value={supPassword}
                      onChange={e => setSupPassword(e.target.value)}
                      placeholder={ar ? "أدخل كلمة المرور" : "Enter password"}
                      autoComplete="current-password"
                      className={`w-full h-11 rounded-2xl border border-border bg-secondary/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all ${isRTL ? "pr-10 pl-10 text-right" : "pl-10 pr-10"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${isRTL ? "left-3" : "right-3"}`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Demo hint */}
                <div className={`bg-primary/8 rounded-2xl p-3 border border-primary/20 text-xs text-primary/80 space-y-1 ${isRTL ? "text-right" : ""}`}>
                  <p className="font-bold text-primary">{ar ? "بيانات تجريبية:" : "Demo credentials:"}</p>
                  <p>admin / nusuk2026</p>
                  <p>supervisor1 / hajj1446</p>
                </div>

                <button
                  data-testid="btn-supervisor-login"
                  type="submit"
                  disabled={loading || !supUsername || !supPassword}
                  className="w-full h-12 bg-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 flex-shrink-0" />
                      {ar ? "تسجيل الدخول" : "Sign In"}
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="pilgrim"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handlePilgrimLogin}
                className="space-y-5"
              >
                <div>
                  <p className={`text-xs font-semibold text-muted-foreground mb-4 ${isRTL ? "text-right" : ""}`}>
                    {ar ? "ادخل برقم جواز سفرك والرمز السري" : "Sign in with your passport number and PIN"}
                  </p>
                </div>

                {/* Passport */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold text-foreground block ${isRTL ? "text-right" : ""}`}>
                    {ar ? "رقم جواز السفر" : "Passport Number"}
                  </label>
                  <div className="relative">
                    <CreditCard className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                    <input
                      data-testid="input-passport"
                      type="text"
                      value={passport}
                      onChange={e => setPassport(e.target.value.toUpperCase())}
                      placeholder="A12345678"
                      autoComplete="off"
                      className={`w-full h-11 rounded-2xl border border-border bg-secondary/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all uppercase tracking-widest ${isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4"}`}
                    />
                  </div>
                </div>

                {/* PIN */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold text-foreground block ${isRTL ? "text-right" : ""}`}>
                    {ar ? "الرمز السري (4 أرقام)" : "4-Digit PIN"}
                  </label>
                  <div className="relative">
                    <Hash className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
                    <input
                      data-testid="input-pin"
                      type={showPin ? "text" : "password"}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="••••"
                      maxLength={4}
                      inputMode="numeric"
                      autoComplete="off"
                      className={`w-full h-11 rounded-2xl border border-border bg-secondary/40 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all tracking-[0.5em] ${isRTL ? "pr-10 pl-10 text-right" : "pl-10 pr-10"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(v => !v)}
                      className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${isRTL ? "left-3" : "right-3"}`}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Demo hint */}
                <div className={`bg-primary/8 rounded-2xl p-3 border border-primary/20 text-xs text-primary/80 space-y-1 ${isRTL ? "text-right" : ""}`}>
                  <p className="font-bold text-primary">{ar ? "بيانات تجريبية:" : "Demo credentials:"}</p>
                  <p>A12345678 / PIN: 1234 ({ar ? "أحمد علي" : "Ahmed Ali"})</p>
                  <p>B98765432 / PIN: 5678 ({ar ? "محمد رحمان" : "Muhammad Rahman"})</p>
                  <p>C45678912 / PIN: 9012 ({ar ? "فاطمة نور" : "Fatima Noor"})</p>
                </div>

                <button
                  data-testid="btn-pilgrim-login"
                  type="submit"
                  disabled={loading || !passport || pin.length !== 4}
                  className="w-full h-12 bg-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 flex-shrink-0" />
                      {ar ? "دخول" : "Enter"}
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="mt-6 text-white/30 text-xs">{ar ? "CheckNusuk © 1446 هـ — نظام إدارة الحج" : "CheckNusuk © 2026 — Hajj Management System"}</p>
    </div>
  );
}
