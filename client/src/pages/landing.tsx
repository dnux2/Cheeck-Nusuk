import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Map, Clock, HeartHandshake, Users, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import logoImg from "@assets/WhatsApp_Image_2026-03-07_at_12.53.20_AM_1772834050515.jpeg";
import kaabahImg from "@assets/image_1772857790742.png";

export function LandingPage() {
  const { lang, setLang, isRTL } = useLanguage();
  const ar = lang === "ar";

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans" dir={isRTL ? "rtl" : "ltr"}>
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg bg-[#f5e6c8] flex-shrink-0">
              <img src={logoImg} alt="CheckNusuk Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">CheckNusuk</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language toggle */}
            <div className="flex items-center bg-secondary rounded-lg overflow-hidden border border-border">
              <button onClick={() => setLang("en")} className={`px-2 py-1 text-xs font-bold transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>EN</button>
              <button onClick={() => setLang("ar")} className={`px-2 py-1 text-xs font-bold transition-all ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>ع</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 pt-24">
        <section className="relative px-6 py-14 md:py-20 max-w-7xl mx-auto overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />

          <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${isRTL ? "lg:flex-row-reverse" : ""}`}>

            {/* Text column */}
            <div className={`flex-1 flex flex-col ${isRTL ? "items-end text-right" : "items-start text-left"} max-w-xl`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-primary font-semibold text-sm mb-6 border border-primary/10"
              >
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                {ar ? "نظام الحج الذكي 1446 — متاح الآن" : "Hajj 1446 Smart System — Online"}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-foreground leading-[1.15]"
              >
                {ar
                  ? <><span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-emerald-500">حج آمن ومنظّم</span><br />بالذكاء الاصطناعي</>
                  : <>Ensuring a<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Safe & Seamless</span><br />Pilgrimage</>
                }
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 text-lg md:text-xl text-muted-foreground font-medium leading-relaxed"
              >
                {ar
                  ? "إدارة الحشود، والتتبع الفوري، والاستجابة للطوارئ لضيوف الرحمن"
                  : "AI-powered crowd management, real-time tracking, and instant emergency response for the Guests of Allah."}
              </motion.p>

              {/* Two entry buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              >
                <Link
                  href="/dashboard"
                  data-testid="link-admin-entry"
                  className="group flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Shield className="w-5 h-5 opacity-90 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <div className={isRTL ? "text-right" : "text-left"}>
                    <div className="text-base font-bold">{ar ? "دخول المشرف" : "Supervisor Access"}</div>
                    <div className="text-xs opacity-75">{ar ? "لوحة تحكم المشرفين" : "Admin control panel"}</div>
                  </div>
                  <ArrowRight className={`w-4 h-4 opacity-60 flex-shrink-0 ${isRTL ? "rotate-180" : ""}`} />
                </Link>

                <Link
                  href="/pilgrim"
                  data-testid="link-pilgrim-entry"
                  className="group flex items-center justify-center gap-3 px-8 py-4 bg-card text-foreground font-bold rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300"
                >
                  <Users className="w-5 h-5 text-primary group-hover:scale-110 transition-transform flex-shrink-0" />
                  <div className={isRTL ? "text-right" : "text-left"}>
                    <div className="text-base font-bold">{ar ? "بوابة الحاج" : "Pilgrim Portal"}</div>
                    <div className="text-xs text-muted-foreground">{ar ? "للحجاج والمعتمرين" : "For Hajj & Umrah pilgrims"}</div>
                  </div>
                  <ArrowRight className={`w-4 h-4 text-primary opacity-60 flex-shrink-0 ${isRTL ? "rotate-180" : ""}`} />
                </Link>
              </motion.div>
            </div>

            {/* Kaabah image column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="flex-1 w-full max-w-lg lg:max-w-none"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40">
                <img
                  src={kaabahImg}
                  alt={ar ? "الحجاج حول الكعبة المشرفة" : "Pilgrims around the Holy Kaabah"}
                  className="w-full h-64 sm:h-80 lg:h-[420px] object-cover"
                />
                {/* Overlay caption */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-6 py-5">
                  <p className="text-white font-bold text-lg">{ar ? "🕌 حج آمن بإذن الله" : "🕌 A Safe Pilgrimage, God willing"}</p>
                  <p className="text-white/70 text-sm mt-0.5">{ar ? "مكة المكرمة — الكعبة المشرفة" : "Makkah Al-Mukarramah — Holy Kaabah"}</p>
                </div>
              </div>
            </motion.div>

          </div>
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
