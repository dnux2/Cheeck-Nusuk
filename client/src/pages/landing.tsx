import { Link } from "wouter";
import { ShieldCheck, Map, Clock, HeartHandshake, Users, Shield, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import logoImg from "@assets/WhatsApp_Image_2026-03-07_at_12.53.20_AM_1772834050515.jpeg";
import kaabahImg from "@assets/image_1772857790742.png";

export function LandingPage() {
  const { lang, setLang, isRTL } = useLanguage();
  const ar = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans" dir={isRTL ? "rtl" : "ltr"}>
      {/* ── Navbar (floating over hero) ── */}
      <nav className="fixed w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg bg-[#f5e6c8] flex-shrink-0">
              <img src={logoImg} alt="CheckNusuk Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white drop-shadow">CheckNusuk</span>
          </div>

          {/* Lang toggle */}
          <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-lg overflow-hidden border border-white/30">
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 text-xs font-bold transition-all ${lang === "en" ? "bg-white text-primary" : "text-white"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ar")}
              className={`px-2.5 py-1 text-xs font-bold transition-all ${lang === "ar" ? "bg-white text-primary" : "text-white"}`}
            >
              ع
            </button>
          </div>
        </div>
      </nav>
      {/* ── Full-width Hero Banner ── */}
      <div className="relative w-full h-[88vh] min-h-[500px] overflow-hidden">
        {/* Background image */}
        <img
          src={kaabahImg}
          alt={ar ? "الحجاج حول الكعبة المشرفة" : "Pilgrims around the Holy Kaabah"}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Dark gradient overlay — stronger at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

        {/* Hero content — centered */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 pt-16">

          {/* Badge — above heading */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/25 text-[12px] font-bold"
          >
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            {ar ? "نظام الحج الذكي 1446 — متاح الآن" : "Hajj Smart System 1446 — Live Now"}
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-white leading-[1.15] tracking-tight drop-shadow-lg"
          >
            {ar
              ? <><span className="text-emerald-400">حج آمن</span> ومنظّم<br />بالذكاء الاصطناعي</>
              : <>Ensuring a <span className="text-emerald-400">Safe &amp; Seamless</span><br />Pilgrimage</>
            }
          </motion.h1>

          {/* Sub-text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg md:text-xl text-white/80 max-w-2xl font-medium leading-relaxed"
          >
            {ar
              ? "إدارة الحشود · التتبع الفوري · الاستجابة للطوارئ · الترجمة الذكية"
              : "Crowd management · Real-time tracking · Emergency response · AI translation"}
          </motion.p>

          {/* Entry buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/dashboard"
              data-testid="link-admin-entry"
              className="group flex items-center gap-3 px-7 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/40 hover:shadow-primary/60 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Shield className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className={isRTL ? "text-right" : "text-left"}>
                <div className="text-sm font-bold">{ar ? "دخول المشرف" : "Supervisor Access"}</div>
                <div className="text-xs opacity-75">{ar ? "لوحة تحكم المشرفين" : "Admin control panel"}</div>
              </div>
              <Arrow className="w-4 h-4 opacity-60 flex-shrink-0" />
            </Link>

            <Link
              href="/pilgrim"
              data-testid="link-pilgrim-entry"
              className="group flex items-center gap-3 px-7 py-3.5 bg-white/15 backdrop-blur-sm text-white font-bold rounded-2xl border border-white/30 hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Users className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className={isRTL ? "text-right" : "text-left"}>
                <div className="text-sm font-bold">{ar ? "بوابة الحاج" : "Pilgrim Portal"}</div>
                <div className="text-xs opacity-75">{ar ? "للحجاج والمعتمرين" : "For Hajj & Umrah pilgrims"}</div>
              </div>
              <Arrow className="w-4 h-4 opacity-60 flex-shrink-0" />
            </Link>
          </motion.div>
        </div>

      </div>
      {/* ── Features Grid ── */}
      <main className="flex-1">
        <section className="py-20 bg-card border-t border-border/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                {ar ? "نظام إدارة متكامل" : "Comprehensive Management System"}
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {ar
                  ? "أنظمة متكاملة مصممة خصيصاً لتحديات الحج والعمرة"
                  : "Integrated systems designed specifically for the unique challenges of Hajj."}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-background rounded-3xl p-7 border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary mb-5 mx-auto group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-display mb-2 text-center">
                    {ar ? feature.titleAr : feature.titleEn}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed text-center">
                    {ar ? feature.descAr : feature.descEn}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
