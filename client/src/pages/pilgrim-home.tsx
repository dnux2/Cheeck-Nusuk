import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Map, MessageSquare, Languages, BookOpen, Star, Droplets, Clock, CheckCircle2, ChevronRight, Stethoscope, UserSearch, Shield, X } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Pilgrim } from "@shared/schema";
import { PilgrimLayout } from "@/components/pilgrim-layout";

const PRAYER_TIMES = [
  { ar: "الفجر",  en: "Fajr",    time: "05:12" },
  { ar: "الظهر",  en: "Dhuhr",   time: "12:31" },
  { ar: "العصر",  en: "Asr",     time: "15:52" },
  { ar: "المغرب", en: "Maghrib", time: "18:45" },
  { ar: "العشاء", en: "Isha",    time: "20:15" },
];

const HAJJ_STEPS = [
  { key: "tarwiyah",   dayAr: "اليوم الثامن",  dayEn: "Day 8",    ritualAr: "الإحرام والتوجه إلى منى",            ritualEn: "Ihram & travel to Mina",                done: true  },
  { key: "arafat",     dayAr: "اليوم التاسع",  dayEn: "Day 9",    ritualAr: "الوقوف بعرفات — الركن الأعظم",       ritualEn: "Standing at Arafat — greatest rite",    done: true  },
  { key: "muzdalifah", dayAr: "الليل",          dayEn: "Night",    ritualAr: "المبيت في مزدلفة وجمع الحصى",       ritualEn: "Stay at Muzdalifah & collect pebbles",  done: false, current: true },
  { key: "eid",        dayAr: "اليوم العاشر",  dayEn: "Day 10",   ritualAr: "رمي الجمرات، الذبح، الحلق، الطواف", ritualEn: "Jamarat, sacrifice, shaving, Tawaf",    done: false },
  { key: "tashreeq",   dayAr: "أيام التشريق",  dayEn: "Tashreeq", ritualAr: "رمي الجمرات الثلاثة",               ritualEn: "Throwing all three Jamarat",            done: false },
];

const QUICK_ACTIONS = [
  { href: "/pilgrim/map",        iconEl: <Map className="w-6 h-6" />,           titleAr: "خريطتي",  titleEn: "My Map",     descAr: "أقرب المنشآت والمسار",          descEn: "Nearest facilities & route",     color: "text-primary" },
  { href: "/pilgrim/hajj-notes", iconEl: <BookOpen className="w-6 h-6" />,      titleAr: "يومياتي", titleEn: "My Journal", descAr: "نوتات على مراحل الحج",           descEn: "Notes on Hajj stages",           color: "text-accent"  },
  { href: "/pilgrim/chat",       iconEl: <MessageSquare className="w-6 h-6" />, titleAr: "رسائلي",  titleEn: "Messages",   descAr: "تواصل مع المشرف",               descEn: "Chat with supervisor",           color: "text-primary" },
  { href: "/pilgrim/translator", iconEl: <Languages className="w-6 h-6" />,     titleAr: "المترجم", titleEn: "Translator", descAr: "ترجمة فورية بالذكاء الاصطناعي", descEn: "AI instant translation",         color: "text-accent"  },
];

type EmergencyType = "Medical" | "Lost" | "Security";

const EMERGENCY_TYPES: { type: EmergencyType; ar: string; en: string; icon: React.ReactNode; color: string }[] = [
  { type: "Medical",  ar: "طوارئ طبية",   en: "Medical",       icon: <Stethoscope className="w-5 h-5" />, color: "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" },
  { type: "Lost",     ar: "ضائع / مفقود", en: "Lost / Missing", icon: <UserSearch className="w-5 h-5" />,  color: "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" },
  { type: "Security", ar: "تهديد أمني",   en: "Security Threat", icon: <Shield className="w-5 h-5" />,     color: "border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" },
];

export function PilgrimHomePage() {
  const { lang, isRTL } = useLanguage();
  const { toast } = useToast();
  const ar = lang === "ar";
  const [sosSent, setSosSent] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);

  const { data: pilgrim } = useQuery<Pilgrim>({ queryKey: ["/api/pilgrims/1"] });

  const createEmergency = useMutation({
    mutationFn: (type: EmergencyType) =>
      new Promise<void>((resolve, reject) => {
        const send = (lat: number, lng: number) => {
          apiRequest("POST", "/api/emergencies", {
            pilgrimId: 1, type, status: "Active",
            locationLat: lat, locationLng: lng,
          }).then(() => resolve()).catch(reject);
        };
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => send(pos.coords.latitude, pos.coords.longitude),
            () => send(21.4225, 39.8262),
            { timeout: 4000 }
          );
        } else {
          send(21.4225, 39.8262);
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergencies"] });
      setSosSent(true);
      setShowTypeModal(false);
      toast({
        title: ar ? "✓ تم إرسال نداء الطوارئ" : "✓ SOS Sent",
        description: ar ? "سيصلك المشرف قريباً — ابقَ في مكانك" : "A supervisor will reach you soon — stay where you are",
      });
    },
    onError: () => {
      toast({ title: ar ? "خطأ" : "Error", description: ar ? "فشل إرسال النداء، حاول مجدداً" : "Failed to send SOS, please try again", variant: "destructive" });
    },
  });

  const currentStep = HAJJ_STEPS.find(s => s.current);

  const permitLabel =
    pilgrim?.permitStatus === "Valid"   ? (ar ? "ساري"       : "Valid")
    : pilgrim?.permitStatus === "Expired" ? (ar ? "منتهي"     : "Expired")
    : (ar ? "قيد التحقق" : "Pending");

  const permitClass =
    pilgrim?.permitStatus === "Valid"   ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : pilgrim?.permitStatus === "Expired" ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-violet-600 bg-violet-50 border-violet-200";

  return (
    <PilgrimLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5" dir={isRTL ? "rtl" : "ltr"}>

        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden border border-[#a8d4cb]"
          style={{ background: "linear-gradient(160deg, #d4ede6 0%, #ffffff 100%)" }}
        >
          <div className="px-6 pt-5 pb-4">
            <div className="text-xs font-semibold text-[#2d7a5f]/70 mb-1">
              ٢٩ ذو الحجة ١٤٤٦
            </div>
            <h1 className="text-xl font-bold text-[#0E4D41] mb-0.5">
              {ar ? `مرحباً، ${pilgrim?.name?.split(" ")[0] || "أحمد"} 👋` : `Welcome, ${pilgrim?.name?.split(" ")[0] || "Ahmed"} 👋`}
            </h1>
            <p className="text-sm text-[#2d7a5f]/80">
              {ar ? "تقبّل الله حجكم ومناسككم" : "May Allah accept your pilgrimage"}
            </p>
          </div>
          <div className="flex border-t border-[#a8d4cb]">
            <div className="flex-1 px-4 py-3 border-e border-[#a8d4cb] text-center">
              <div className="text-[10px] text-[#2d7a5f]/60 mb-1">{ar ? "التصريح" : "Permit"}</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${permitClass}`}>{permitLabel}</span>
            </div>
            <div className="flex-1 px-4 py-3 border-e border-[#a8d4cb] text-center">
              <div className="text-[10px] text-[#2d7a5f]/60 mb-1">{ar ? "الصحة" : "Health"}</div>
              <div className="text-xs font-bold text-[#0E4D41]">
                {pilgrim?.healthStatus === "NeedsAttention" ? (ar ? "تحتاج متابعة" : "Needs Attention")
                  : pilgrim?.healthStatus === "Stable" ? (ar ? "مستقرة" : "Stable")
                  : (ar ? "جيدة ✓" : "Good ✓")}
              </div>
            </div>
            <div className="flex-1 px-4 py-3 text-center">
              <div className="text-[10px] text-[#2d7a5f]/60 mb-1">{ar ? "الطقس" : "Weather"}</div>
              <div className="text-xs font-bold text-[#0E4D41]">42°C ☀️</div>
            </div>
          </div>
        </motion.div>

        {/* SOS button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <button
            onClick={() => !sosSent && setShowTypeModal(true)}
            disabled={sosSent || createEmergency.isPending}
            className={`w-full py-4 rounded-3xl font-bold text-base flex flex-row items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98]
              ${sosSent ? "bg-muted text-muted-foreground" : "text-white"}`}
            style={!sosSent ? { background: "linear-gradient(135deg, #f07070 0%, #c0392b 100%)" } : {}}
            dir="ltr"
            data-testid="btn-sos-home"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {sosSent
              ? (ar ? "✓ تم إرسال نداء الطوارئ — ابقَ في مكانك" : "✓ SOS Sent — Help is on the way")
              : createEmergency.isPending
              ? (ar ? "جارٍ الإرسال…" : "Sending…")
              : (ar ? "زر الطوارئ SOS" : "SOS Emergency")}
          </button>
        </motion.div>

        {/* Emergency type modal */}
        <AnimatePresence>
          {showTypeModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
              onClick={(e) => { if (e.target === e.currentTarget) setShowTypeModal(false); }}
            >
              <motion.div
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-md bg-card rounded-t-3xl p-6 pb-10 shadow-2xl border-t border-border"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className={`flex items-center justify-between mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className={isRTL ? "text-right" : ""}>
                    <h2 className="text-lg font-bold text-foreground">{ar ? "نوع الطوارئ" : "Emergency Type"}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{ar ? "اختر نوع الطارئ ليصل المساعد المناسب" : "Select type so the right team responds"}</p>
                  </div>
                  <button onClick={() => setShowTypeModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80" data-testid="btn-close-sos-modal">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  {EMERGENCY_TYPES.map((et) => (
                    <button
                      key={et.type}
                      onClick={() => setSelectedType(et.type)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isRTL ? "flex-row-reverse" : ""}
                        ${selectedType === et.type ? et.color + " border-opacity-100" : "border-border bg-secondary/30 text-foreground hover:border-primary/30"}`}
                      data-testid={`btn-sos-type-${et.type.toLowerCase()}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedType === et.type ? "bg-white/40 dark:bg-black/20" : "bg-secondary"}`}>
                        {et.icon}
                      </div>
                      <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                        <div className="font-bold text-sm">{ar ? et.ar : et.en}</div>
                      </div>
                      {selectedType === et.type && (
                        <div className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center flex-shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-current" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => selectedType && createEmergency.mutate(selectedType)}
                  disabled={!selectedType || createEmergency.isPending}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-40 transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #f07070 0%, #c0392b 100%)" }}
                  data-testid="btn-sos-confirm"
                >
                  {createEmergency.isPending
                    ? (ar ? "جارٍ الإرسال…" : "Sending SOS…")
                    : (ar ? "إرسال نداء الطوارئ 🚨" : "Send SOS Alert 🚨")}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
            {ar ? "الإجراءات السريعة" : "Quick Actions"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href}>
                <div
                  className="bg-card border border-border rounded-3xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group cursor-pointer h-full"
                  data-testid={`action-${action.href.split("/").pop()}`}
                >
                  <div className={`w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 ${action.color}`}>
                    {action.iconEl}
                  </div>
                  <div className="font-bold text-sm text-foreground">{ar ? action.titleAr : action.titleEn}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{ar ? action.descAr : action.descEn}</div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Current ritual highlight */}
        {currentStep && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="bg-card border border-border rounded-3xl p-5 hover:border-primary/30 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-accent" fill="currentColor" />
                </div>
                <span className="text-xs font-bold text-accent uppercase tracking-wide">{ar ? "شعيرتك الحالية" : "Current Ritual"}</span>
              </div>
              <Link href="/pilgrim/hajj-notes" className="text-xs text-primary font-semibold flex items-center gap-1">
                {ar ? "يومياتي" : "My Notes"} <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
              </Link>
            </div>
            <div className="mt-3">
              <div className="font-bold text-foreground text-sm">{ar ? currentStep.dayAr : currentStep.dayEn}</div>
              <div className="text-muted-foreground text-xs mt-0.5">{ar ? currentStep.ritualAr : currentStep.ritualEn}</div>
            </div>
          </motion.div>
        )}

        {/* Prayer times */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-gradient-to-b from-[#f5e6c8] to-white dark:from-[#3a2a12] dark:to-card border border-[#e8d4a0] dark:border-border rounded-3xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[#e8d4a0] dark:border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="font-bold text-sm text-foreground">{ar ? "مواقيت الصلاة — مكة المكرمة" : "Prayer Times — Makkah"}</span>
          </div>
          <div className="flex divide-x divide-border rtl:divide-x-reverse">
            {PRAYER_TIMES.map((p) => {
              const isNext = p.ar === "العشاء";
              return (
                <div key={p.ar} className={`flex-1 py-3 text-center ${isNext ? "bg-secondary/50" : ""}`}>
                  <div className={`text-[10px] font-bold mb-1 ${isNext ? "text-primary" : "text-muted-foreground"}`}>{ar ? p.ar : p.en}</div>
                  <div className={`text-xs font-mono font-bold ${isNext ? "text-primary" : "text-foreground"}`}>{p.time}</div>
                  {isNext && <div className="text-[8px] text-primary mt-0.5 font-bold">{ar ? "التالية" : "Next"}</div>}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Hajj journey steps */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="bg-card border border-border rounded-3xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              <span className="font-bold text-sm text-foreground">{ar ? "مراحل الحج" : "Hajj Journey"}</span>
            </div>
            <Link href="/pilgrim/hajj-notes" className="text-xs text-primary font-semibold">
              {ar ? "← أضف ملاحظة" : "Add Note →"}
            </Link>
          </div>
          <div className="px-5 py-4 space-y-3">
            {HAJJ_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                  ${step.done ? "bg-primary" : step.current ? "bg-accent" : "bg-border"}`}>
                  {step.done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                    : <div className={`w-2 h-2 rounded-full ${step.current ? "bg-white" : "bg-muted-foreground/40"}`} />}
                </div>
                <div className="flex-1">
                  <div className={`text-xs font-bold ${step.done ? "text-primary" : step.current ? "text-accent" : "text-muted-foreground"}`}>
                    {ar ? step.dayAr : step.dayEn}
                  </div>
                  <div className={`text-xs mt-0.5 ${step.done ? "text-muted-foreground line-through" : step.current ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {ar ? step.ritualAr : step.ritualEn}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Health tip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}
          className="bg-card border border-border rounded-3xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-xs text-blue-600">{ar ? "نصيحة صحية" : "Health Tip"}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {ar
              ? "درجة الحرارة ٤٢°م — اشرب ماء زمزم كل ٣٠ دقيقة، تجنب التعرض المباشر للشمس بين ١١ص و٣م. ارتدِ ملابس بيضاء فضفاضة."
              : "Temperature 42°C — Drink Zamzam water every 30 min. Avoid direct sun between 11AM–3PM. Wear loose white clothing."}
          </p>
        </motion.div>

      </div>
    </PilgrimLayout>
  );
}
