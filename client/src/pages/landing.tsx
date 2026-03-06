import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Map, Clock, HeartHandshake, Users, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import logoImg from "@assets/WhatsApp_Image_2026-03-07_at_12.53.20_AM_1772834050515.jpeg";

export function LandingPage() {
  const { lang, setLang, isRTL } = useLanguage();
  const ar = lang === "ar";

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans" dir={isRTL ? "rtl" : "ltr"}>
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg bg-[#f5e6c8] flex-shrink-0">
              <img src={logoImg} alt="CheckNusuk Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">CheckNusuk</span>
          </div>

          <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            {/* Language toggle */}
            <div className="flex items-center bg-secondary rounded-xl overflow-hidden border border-border">
              <button onClick={() => setLang("en")} className={`px-3 py-1.5 text-sm font-bold transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
              <button onClick={() => setLang("ar")} className={`px-3 py-1.5 text-sm font-bold transition-all ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>العربية</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-32">
        <section className="relative px-6 py-20 md:py-28 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute top-1/4 right-0 w-[350px] h-[350px] bg-accent/5 rounded-full blur-3xl -z-10" />

          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-primary font-semibold text-sm mb-8 border border-primary/10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            {ar ? "نظام الحج الذكي 1446 — متاح الآن" : "Hajj 1446 Smart System — Online"}
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.05 }}
            className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl bg-[#f5e6c8] mb-8"
          >
            <img src={logoImg} alt="CheckNusuk" className="w-full h-full object-contain" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.1]"
          >
            {ar
              ? <>حج آمن ومنظّم<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">بالذكاء الاصطناعي</span></>
              : <>Ensuring a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Safe & Seamless</span> Pilgrimage</>
            }
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-xl md:text-2xl text-muted-foreground max-w-2xl font-medium"
          >
            {ar
              ? "إدارة الحشود، والتتبع الفوري، والاستجابة للطوارئ لضيوف الرحمن"
              : "AI-powered crowd management, real-time tracking, and instant emergency response for the Guests of Allah."}
          </motion.p>

          {/* Two entry buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className={`mt-14 flex flex-col sm:flex-row gap-5 ${isRTL ? "sm:flex-row-reverse" : ""}`}
          >
            {/* Admin / Supervisor */}
            <Link
              href="/dashboard"
              data-testid="link-admin-entry"
              className="group flex flex-col items-center gap-3 px-10 py-6 bg-primary text-primary-foreground font-bold rounded-3xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 min-w-[220px]"
            >
              <Shield className="w-9 h-9 opacity-90 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="text-xl font-bold">{ar ? "دخول المشرف" : "Supervisor Access"}</div>
                <div className="text-sm opacity-80 mt-1">{ar ? "لوحة تحكم المشرفين" : "Admin control panel"}</div>
              </div>
              <ArrowRight className={`w-5 h-5 opacity-70 ${isRTL ? "rotate-180" : ""}`} />
            </Link>

            {/* Pilgrim Portal */}
            <Link
              href="/pilgrim"
              data-testid="link-pilgrim-entry"
              className="group flex flex-col items-center gap-3 px-10 py-6 bg-card text-foreground font-bold rounded-3xl border-2 border-border hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300 min-w-[220px]"
            >
              <Users className="w-9 h-9 text-primary group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <div className="text-xl font-bold">{ar ? "بوابة الحاج" : "Pilgrim Portal"}</div>
                <div className="text-sm text-muted-foreground mt-1">{ar ? "للحجاج والمعتمرين" : "For Hajj & Umrah pilgrims"}</div>
              </div>
              <ArrowRight className={`w-5 h-5 text-primary opacity-70 ${isRTL ? "rotate-180" : ""}`} />
            </Link>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-card border-t border-border/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className={`text-center mb-16 ${isRTL ? "text-right md:text-center" : ""}`}>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                {ar ? "نظام إدارة متكامل" : "Comprehensive Management"}
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {ar
                  ? "أنظمة متكاملة مصممة خصيصاً لتحديات الحج والعمرة"
                  : "Integrated systems designed specifically for the unique challenges of Hajj."}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Map,
                  titleAr: "مراقبة ذكية للحشود", titleEn: "Smart Crowd Control",
                  descAr: "الذكاء الاصطناعي يتنبأ بالازدحام قبل حدوثه.",
                  descEn: "Predictive AI to prevent congestion before it happens.",
                },
                {
                  icon: ShieldCheck,
                  titleAr: "كشف غير المصرح لهم", titleEn: "Unauthorized Detection",
                  descAr: "التحقق التلقائي من التصاريح عبر الكاميرات الذكية.",
                  descEn: "Automated permit verification via smart cameras.",
                },
                {
                  icon: HeartHandshake,
                  titleAr: "استجابة الطوارئ", titleEn: "Emergency Response",
                  descAr: "تنبيهات SOS فورية لأقرب فريق طبي.",
                  descEn: "Instant SOS alerts directly to the nearest medical team.",
                },
                {
                  icon: Clock,
                  titleAr: "تتبع فوري", titleEn: "Real-time Tracking",
                  descAr: "تحديثات الموقع المباشرة للمجموعات والأفراد.",
                  descEn: "Live location updates for groups and individuals.",
                },
              ].map((feature, i) => (
                <div key={i} className="bg-background rounded-3xl p-8 border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className={`text-xl font-bold font-display mb-3 ${isRTL ? "text-right" : ""}`}>
                    {ar ? feature.titleAr : feature.titleEn}
                  </h3>
                  <p className={`text-muted-foreground leading-relaxed ${isRTL ? "text-right" : ""}`}>
                    {ar ? feature.descAr : feature.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
