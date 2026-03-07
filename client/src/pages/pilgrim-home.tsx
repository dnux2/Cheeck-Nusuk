import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Map, MessageSquare, Languages, BookOpen, Star, Droplets, Clock, CheckCircle2, ChevronRight, Stethoscope, UserSearch, Shield, X, MapPin, BatteryLow, Activity, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Pilgrim } from "@shared/schema";
import { PilgrimLayout } from "@/components/pilgrim-layout";
import { useUpdatePilgrimLocation } from "@/hooks/use-pilgrims";

type SharingMode = "saver" | "normal" | "active";

const MODE_INTERVALS: Record<SharingMode, number> = {
  saver:  15 * 60 * 1000,
  normal:  5 * 60 * 1000,
  active:  2 * 60 * 1000,
};
const EMERGENCY_INTERVAL = 30 * 1000;
const MIN_MOVE_METERS = 50;

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadQueue(key: string): { lat: number; lng: number }[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}
function saveQueue(key: string, q: { lat: number; lng: number }[]) {
  localStorage.setItem(key, JSON.stringify(q.slice(-20)));
}

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

  const pilgrimId = 1;
  const LOC_QUEUE_KEY = "loc_queue_pilgrim_1";

  const { data: pilgrim } = useQuery<Pilgrim>({
    queryKey: ["/api/pilgrims", pilgrimId],
    queryFn: () => fetch(`/api/pilgrims/${pilgrimId}`).then(r => r.json()),
  });

  const [isSharing, setIsSharing] = useState(false);
  const [sharingMode, setSharingMode] = useState<SharingMode>("normal");
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [queueSize, setQueueSize] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number } | null>(null);
  const nextTickRef = useRef<number>(0);
  const updateLocation = useUpdatePilgrimLocation();

  const isEmergency = !!pilgrim?.emergencyStatus;

  const getInterval = useCallback((mode: SharingMode) => {
    return isEmergency ? EMERGENCY_INTERVAL : MODE_INTERVALS[mode];
  }, [isEmergency]);

  const sendLocation = useCallback((lat: number, lng: number, forced = false) => {
    const prev = lastSentRef.current;
    if (!forced && prev && haversineM(prev.lat, prev.lng, lat, lng) < MIN_MOVE_METERS) return;
    updateLocation.mutate(
      { id: pilgrimId, locationLat: lat, locationLng: lng },
      {
        onSuccess: () => {
          lastSentRef.current = { lat, lng };
          const q = loadQueue(LOC_QUEUE_KEY);
          if (q.length > 0) {
            const next = q.shift()!;
            saveQueue(LOC_QUEUE_KEY, q);
            updateLocation.mutate({ id: pilgrimId, locationLat: next.lat, locationLng: next.lng });
            setQueueSize(q.length);
          }
        },
        onError: () => {
          const q = loadQueue(LOC_QUEUE_KEY);
          q.push({ lat, lng });
          saveQueue(LOC_QUEUE_KEY, q);
          setQueueSize(q.length);
        },
      }
    );
  }, [updateLocation, pilgrimId, LOC_QUEUE_KEY]);

  const tick = useCallback((mode: SharingMode) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLastAccuracy(Math.round(pos.coords.accuracy));
        sendLocation(pos.coords.latitude, pos.coords.longitude, isEmergency);
      },
      () => {},
      { enableHighAccuracy: mode === "active" || isEmergency, timeout: 8000, maximumAge: mode === "saver" ? 120000 : 30000 }
    );
  }, [sendLocation, isEmergency]);

  const startPolling = useCallback((mode: SharingMode) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    const ms = getInterval(mode);
    tick(mode);
    nextTickRef.current = Date.now() + ms;
    setCountdown(Math.round(ms / 1000));
    intervalRef.current = setInterval(() => {
      tick(mode);
      nextTickRef.current = Date.now() + ms;
    }, ms);
    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((nextTickRef.current - Date.now()) / 1000));
      setCountdown(remaining);
    }, 1000);
  }, [tick, getInterval]);

  const startSharing = () => {
    if (!navigator.geolocation) {
      toast({ title: ar ? "خطأ" : "Error", description: ar ? "الجهاز لا يدعم GPS" : "Device doesn't support GPS", variant: "destructive" });
      return;
    }
    setIsSharing(true);
    setQueueSize(loadQueue().length);
    startPolling(sharingMode);
  };

  const stopSharing = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setIsSharing(false);
    setLastAccuracy(null);
    setCountdown(0);
  };

  const changeMode = (mode: SharingMode) => {
    setSharingMode(mode);
    if (isSharing) startPolling(mode);
  };

  useEffect(() => {
    if (isSharing) startPolling(sharingMode);
  }, [isEmergency]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const createEmergency = useMutation({
    mutationFn: (type: EmergencyType) =>
      new Promise<void>((resolve, reject) => {
        const send = (lat: number, lng: number) => {
          apiRequest("POST", "/api/emergencies", {
            pilgrimId, type, status: "Active",
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

        {/* Smart adaptive location sharing */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          {!isSharing ? (
            <div className="rounded-3xl border-2 border-[#10B981] overflow-hidden bg-emerald-50 dark:bg-emerald-950/20">
              {/* Mode selector */}
              <div className="px-4 pt-4 pb-2" dir={isRTL ? "rtl" : "ltr"}>
                <p className={`text-[11px] font-semibold text-[#0E4D41]/60 mb-2.5 ${isRTL ? "text-right" : ""}`}>
                  {ar ? "اختر وتيرة مشاركة الموقع:" : "Choose location update frequency:"}
                </p>
                <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  {([
                    { key: "saver"  as SharingMode, labelAr: "توفير طاقة", labelEn: "Battery Saver", subAr: "كل ١٥ دقيقة", subEn: "Every 15 min", icon: <BatteryLow className="w-3.5 h-3.5" /> },
                    { key: "normal" as SharingMode, labelAr: "عادي",        labelEn: "Normal",        subAr: "كل ٥ دقائق", subEn: "Every 5 min",  icon: <MapPin className="w-3.5 h-3.5" /> },
                    { key: "active" as SharingMode, labelAr: "تتبع نشط",    labelEn: "Active Track",  subAr: "كل دقيقتين", subEn: "Every 2 min",  icon: <Zap className="w-3.5 h-3.5" /> },
                  ]).map(m => (
                    <button
                      key={m.key}
                      data-testid={`btn-mode-${m.key}`}
                      onClick={() => setSharingMode(m.key)}
                      className={`flex-1 py-2 px-1.5 rounded-2xl text-center transition-all border-2 ${
                        sharingMode === m.key
                          ? "border-[#10B981] bg-[#10B981] text-white"
                          : "border-[#10B981]/30 bg-white/60 dark:bg-black/20 text-[#0E4D41] dark:text-[#10B981]"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        {m.icon}
                        <span className="text-[10px] font-bold leading-tight">{ar ? m.labelAr : m.labelEn}</span>
                        <span className="text-[9px] opacity-70">{ar ? m.subAr : m.subEn}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-4 pb-4">
                <button
                  data-testid="btn-share-live-location"
                  onClick={startSharing}
                  className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-[#10B981] text-white hover:bg-[#0d9e70] transition-all active:scale-[0.98]"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {ar ? "مشاركة موقعي مع المشرف" : "Share My Location with Supervisor"}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-[#10B981] bg-emerald-50 dark:bg-emerald-950/20 overflow-hidden">
              {/* Status bar */}
              <div className="flex items-center justify-between px-5 py-3" dir={isRTL ? "rtl" : "ltr"}>
                <div className={`flex items-center gap-2.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className="relative flex h-3 w-3 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]"></span>
                  </span>
                  <div className={isRTL ? "text-right" : ""}>
                    <p className="text-xs font-bold text-[#10B981]">
                      {isEmergency
                        ? (ar ? "⚠ وضع الطوارئ — تحديث كل ٣٠ ثانية" : "⚠ Emergency — updating every 30s")
                        : ar ? "موقعك يُرسَل دورياً" : "Location sharing active"}
                    </p>
                    <p className="text-[10px] text-[#10B981]/70">
                      {ar
                        ? `التالي خلال: ${countdown >= 60 ? `${Math.floor(countdown / 60)} دقيقة` : `${countdown} ثانية`}${lastAccuracy !== null ? ` · دقة: ${lastAccuracy}م` : ""}`
                        : `Next in: ${countdown >= 60 ? `${Math.floor(countdown / 60)} min` : `${countdown}s`}${lastAccuracy !== null ? ` · ±${lastAccuracy}m` : ""}`}
                    </p>
                  </div>
                </div>
                <button
                  data-testid="btn-stop-live-location"
                  onClick={stopSharing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#10B981]/15 text-[#10B981] text-xs font-bold hover:bg-[#10B981]/25 transition-colors"
                >
                  <X className="w-3 h-3" />
                  {ar ? "إيقاف" : "Stop"}
                </button>
              </div>
              {/* Mode switcher while active */}
              {!isEmergency && (
                <div className={`px-5 pb-3 flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  {([
                    { key: "saver"  as SharingMode, labelAr: "توفير طاقة", labelEn: "Saver",   icon: <BatteryLow className="w-3 h-3" /> },
                    { key: "normal" as SharingMode, labelAr: "عادي",        labelEn: "Normal",  icon: <MapPin className="w-3 h-3" /> },
                    { key: "active" as SharingMode, labelAr: "نشط",         labelEn: "Active",  icon: <Zap className="w-3 h-3" /> },
                  ]).map(m => (
                    <button
                      key={m.key}
                      data-testid={`btn-active-mode-${m.key}`}
                      onClick={() => changeMode(m.key)}
                      className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all border ${
                        sharingMode === m.key
                          ? "border-[#10B981] bg-[#10B981] text-white"
                          : "border-[#10B981]/30 bg-white/50 dark:bg-black/20 text-[#10B981]"
                      }`}
                    >
                      {m.icon}
                      {ar ? m.labelAr : m.labelEn}
                    </button>
                  ))}
                </div>
              )}
              {queueSize > 0 && (
                <div className={`px-5 pb-3 text-[10px] text-amber-600 font-semibold ${isRTL ? "text-right" : ""}`}>
                  {ar ? `⚠ ${queueSize} تحديث في الانتظار (بدون إنترنت)` : `⚠ ${queueSize} update(s) queued (offline)`}
                </div>
              )}
            </div>
          )}
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
