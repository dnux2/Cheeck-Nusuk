import { useAlerts, useCreateAlert } from "@/hooks/use-alerts";
import { Shield, AlertCircle, ScanLine, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language-context";
import campPhoto from "@assets/image_1772833520488.png";

export function SecurityPage() {
  const { data: alerts } = useAlerts();
  const createAlert = useCreateAlert();
  const { isRTL, lang } = useLanguage();

  const triggerMockDetection = () => {
    createAlert.mutate({
      type: "Unauthorized",
      message: lang === "ar"
        ? "كاميرا الذكاء الاصطناعي 04 رصدت فرداً بدون تصريح سارٍ في القطاع 2."
        : "AI Camera 04 identified individual without valid permit in Sector 2.",
      locationLat: 21.42,
      locationLng: 39.82,
      status: "Active"
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`flex justify-between items-center mb-8 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {lang === "ar" ? "بث كاميرات الأمن الذكية" : "AI Security Feed"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === "ar" ? "الكشف الفوري عن الحجاج غير المرخصين." : "Real-time unauthorized pilgrim detection."}
          </p>
        </div>
        <button
          onClick={triggerMockDetection}
          className="px-4 py-2 bg-destructive/10 text-destructive font-bold rounded-xl border border-destructive/20 hover:bg-destructive hover:text-white transition-colors flex items-center gap-2"
        >
          <Shield className="w-5 h-5" />
          {lang === "ar" ? "اختبار الكشف" : "Test Detection"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Main camera feed with real camp photo */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl group">

            {/* Real Mina/Arafat camp photo as background */}
            <img
              src={campPhoto}
              alt="Mina Camp — Live Feed"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Dark overlay to give camera-feed feel */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Green scanlines overlay */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,100,0.3) 3px, rgba(0,255,100,0.3) 4px)" }}
            />

            {/* Moving scan line */}
            <motion.div
              className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent pointer-events-none"
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* HUD overlay */}
            <div className="absolute inset-0 p-5 flex flex-col justify-between font-mono text-sm z-10" dir="ltr">
              {/* Top bar */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 font-bold text-xs tracking-wider">REC</span>
                  <span className="text-white/80 text-xs">// CAM-02 MINA CAMP</span>
                </div>
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-bold tracking-wider">
                  AI_MODEL: ACTIVE
                </div>
              </div>

              {/* Location tag */}
              <div className="flex justify-center">
                <div className="bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-lg text-white/70 text-xs tracking-widest border border-white/10">
                  {lang === "ar" ? "خيام منى — مكة المكرمة" : "MINA TENT CITY — MAKKAH AL-MUKARRAMAH"}
                </div>
              </div>

              {/* AI bounding boxes on hover */}
              <div className="absolute top-[30%] left-[25%] w-16 h-28 border-2 border-emerald-400 rounded opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div className="absolute -top-5 left-0 bg-emerald-500 text-black px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap rounded-sm">
                  PERMIT: VALID 97%
                </div>
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
              </div>
              <div className="absolute top-[20%] left-[58%] w-14 h-24 border-2 border-red-500 rounded opacity-0 group-hover:opacity-100 transition-all duration-700">
                <div className="absolute -top-5 left-0 bg-red-500 text-white px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap rounded-sm">
                  UNAUTHORIZED 91%
                </div>
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500" />
              </div>

              {/* Bottom bar */}
              <div className="flex justify-between items-end">
                <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg text-white/80 text-xs space-y-0.5">
                  <div>SCANNED: <span className="text-emerald-400 font-bold">1,402/hr</span></div>
                  <div>FLAGS: <span className="text-red-400 font-bold">2</span></div>
                </div>
                <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg text-white/50 text-xs flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-emerald-400" />
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Additional camera thumbnails */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "CAM-01", label: lang === "ar" ? "خيام منى — مدخل A" : "Mina Tents — Gate A", active: false },
              { id: "CAM-03", label: lang === "ar" ? "جسر الجمرات" : "Jamarat Bridge", active: true },
              { id: "CAM-07", label: lang === "ar" ? "عرفات — جبل الرحمة" : "Arafat — Mount of Mercy", active: false },
            ].map((cam) => (
              <div key={cam.id} className="relative aspect-video rounded-xl overflow-hidden border border-border/50 shadow-md cursor-pointer hover:border-primary/50 transition-colors group/thumb">
                <img
                  src={campPhoto}
                  alt={cam.label}
                  className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover/thumb:opacity-90 transition-opacity"
                  style={{ filter: `hue-rotate(${cam.id === "CAM-03" ? "30deg" : cam.id === "CAM-07" ? "180deg" : "0deg"}) brightness(0.6)` }}
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 p-2 font-mono flex flex-col justify-between" dir="ltr">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${cam.active ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                    <span className="text-white/70 text-[9px] font-bold">{cam.id}</span>
                  </div>
                  <div className="text-white/60 text-[9px] truncate">{cam.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts panel */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col">
          <h2 className={`text-xl font-display font-bold flex items-center gap-2 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
            <AlertCircle className="w-5 h-5 text-accent" />
            {lang === "ar" ? "تنبيهات الأمن" : "Security Alerts"}
          </h2>

          <div className="space-y-4 overflow-y-auto flex-1">
            {(!alerts || alerts.length === 0) && (
              <div className={`text-center py-8 text-muted-foreground ${isRTL ? "text-right" : ""}`}>
                {lang === "ar" ? "لا توجد تنبيهات نشطة." : "No active alerts."}
              </div>
            )}
            {alerts?.map((alert) => (
              <motion.div
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={alert.id}
                className={`p-4 rounded-xl border-l-4 bg-background shadow-sm ${
                  alert.status === "Active" ? "border-l-destructive" : "border-l-muted"
                }`}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className={`flex justify-between items-start mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    alert.status === "Active" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                  }`}>
                    {alert.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {alert.timestamp ? format(new Date(alert.timestamp), "HH:mm") : lang === "ar" ? "الآن" : "Now"}
                  </span>
                </div>
                <p className={`text-sm text-foreground mb-3 ${isRTL ? "text-right" : ""}`}>{alert.message}</p>
                {alert.status === "Active" && (
                  <button className="w-full py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-colors">
                    {lang === "ar" ? "إرسال فريق" : "Dispatch Team"}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
