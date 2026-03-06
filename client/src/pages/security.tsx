import { useState } from "react";
import { useAlerts, useCreateAlert } from "@/hooks/use-alerts";
import { Shield, AlertCircle, ScanLine, Camera, Video } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language-context";
import { CameraDetector } from "@/components/camera-detector";
import campPhoto from "@assets/image_1772833520488.png";

type Tab = "live" | "camp";

export function SecurityPage() {
  const { data: alerts } = useAlerts();
  const createAlert = useCreateAlert();
  const { isRTL, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("live");

  const ar = lang === "ar";

  const triggerMockDetection = () => {
    createAlert.mutate({
      type: "Unauthorized",
      message: ar
        ? "كاميرا الذكاء الاصطناعي رصدت فرداً بدون تصريح سارٍ في القطاع 2."
        : "AI Camera detected individual without valid permit in Sector 2.",
      locationLat: 21.42,
      locationLng: 39.82,
      status: "Active",
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className={`flex justify-between items-center mb-8 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {ar ? "بث كاميرات الأمن الذكية" : "AI Security Feed"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {ar
              ? "الكشف الفوري عن الأشخاص والحجاج غير المرخصين باستخدام الذكاء الاصطناعي."
              : "Real-time person detection and unauthorized pilgrim identification using AI."}
          </p>
        </div>
        <button
          onClick={triggerMockDetection}
          className={`px-4 py-2 bg-destructive/10 text-destructive font-bold rounded-xl border border-destructive/20 hover:bg-destructive hover:text-white transition-colors flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <Shield className="w-5 h-5" />
          {ar ? "اختبار التنبيه" : "Test Alert"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">

          {/* Tab switcher */}
          <div className="flex gap-2 bg-secondary/50 rounded-2xl p-1.5 border border-border">
            <button
              onClick={() => setActiveTab("live")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === "live"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="tab-live-camera"
            >
              <Camera className="w-4 h-4" />
              {ar ? "كاميرا الجهاز المباشرة" : "Live Device Camera"}
              <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                {ar ? "ذكاء اصطناعي" : "AI"}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("camp")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === "camp"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="tab-camp-feed"
            >
              <Video className="w-4 h-4" />
              {ar ? "كاميرا خيام منى" : "Mina Camp Feed"}
            </button>
          </div>

          {/* Live Camera Tab — TensorFlow real-time detection */}
          {activeTab === "live" && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Info banner */}
              <div className={`flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                <Camera className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">
                    {ar ? "الكشف الفوري عن الأشخاص" : "Real-Time Person Detection"}
                  </p>
                  <p className="text-emerald-600/80 dark:text-emerald-500/80 mt-0.5">
                    {ar
                      ? "يستخدم النموذج COCO-SSD لرصد الأشخاص مباشرةً من كاميرا الجهاز. سيتم رسم إطار أخضر حول كل شخص مع نسبة الثقة."
                      : "Uses COCO-SSD model to detect persons directly from your device camera. A green box with confidence score is drawn around each detected person."}
                  </p>
                </div>
              </div>

              <CameraDetector />
            </motion.div>
          )}

          {/* Camp Feed Tab — static camp photo with AI overlay */}
          {activeTab === "camp" && (
            <motion.div
              key="camp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl group">
                <img
                  src={campPhoto}
                  alt="Mina Camp — Live Feed"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,100,0.3) 3px, rgba(0,255,100,0.3) 4px)" }}
                />
                <motion.div
                  className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent pointer-events-none"
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 p-5 flex flex-col justify-between font-mono text-sm z-10" dir="ltr">
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
                  <div className="flex justify-center">
                    <div className="bg-black/50 px-4 py-1.5 rounded-lg text-white/70 text-xs tracking-widest border border-white/10">
                      {ar ? "خيام منى — مكة المكرمة" : "MINA TENT CITY — MAKKAH AL-MUKARRAMAH"}
                    </div>
                  </div>
                  {/* AI bounding boxes on hover */}
                  <div className="absolute top-[30%] left-[25%] w-16 h-28 border-2 border-emerald-400 rounded opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="absolute -top-5 left-0 bg-emerald-500 text-black px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap rounded-sm">PERMIT: VALID 97%</div>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                  <div className="absolute top-[20%] left-[58%] w-14 h-24 border-2 border-red-500 rounded opacity-0 group-hover:opacity-100 transition-all duration-700">
                    <div className="absolute -top-5 left-0 bg-red-500 text-white px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap rounded-sm">UNAUTHORIZED 91%</div>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="bg-black/60 px-3 py-2 rounded-lg text-white/80 text-xs space-y-0.5">
                      <div>SCANNED: <span className="text-emerald-400 font-bold">1,402/hr</span></div>
                      <div>FLAGS: <span className="text-red-400 font-bold">2</span></div>
                    </div>
                    <div className="bg-black/60 px-3 py-2 rounded-lg text-white/50 text-xs flex items-center gap-2">
                      <ScanLine className="w-4 h-4 text-emerald-400" />
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "CAM-01", label: ar ? "خيام منى — مدخل A" : "Mina Tents — Gate A", hue: "0deg" },
                  { id: "CAM-03", label: ar ? "جسر الجمرات" : "Jamarat Bridge", hue: "30deg" },
                  { id: "CAM-07", label: ar ? "عرفات — جبل الرحمة" : "Arafat — Mount of Mercy", hue: "180deg" },
                ].map((cam) => (
                  <div key={cam.id} className="relative aspect-video rounded-xl overflow-hidden border border-border/50 cursor-pointer hover:border-primary/50 transition-colors group/t">
                    <img src={campPhoto} alt={cam.label} className="absolute inset-0 w-full h-full object-cover group-hover/t:opacity-90 transition-opacity"
                      style={{ filter: `hue-rotate(${cam.hue}) brightness(0.6)` }} />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 p-2 font-mono flex flex-col justify-between" dir="ltr">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-white/70 text-[9px] font-bold">{cam.id}</span>
                      </div>
                      <div className="text-white/60 text-[9px] truncate">{cam.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Alerts panel */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col">
          <h2 className={`text-xl font-display font-bold flex items-center gap-2 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
            <AlertCircle className="w-5 h-5 text-accent" />
            {ar ? "تنبيهات الأمن" : "Security Alerts"}
          </h2>
          <div className="space-y-4 overflow-y-auto flex-1">
            {(!alerts || alerts.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                {ar ? "لا توجد تنبيهات نشطة." : "No active alerts."}
              </div>
            )}
            {alerts?.map((alert) => (
              <motion.div
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={alert.id}
                className={`p-4 rounded-xl border-l-4 bg-background shadow-sm ${alert.status === "Active" ? "border-l-destructive" : "border-l-muted"}`}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className={`flex justify-between items-start mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${alert.status === "Active" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {alert.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {alert.timestamp ? format(new Date(alert.timestamp), "HH:mm") : ar ? "الآن" : "Now"}
                  </span>
                </div>
                <p className={`text-sm text-foreground mb-3 ${isRTL ? "text-right" : ""}`}>{alert.message}</p>
                {alert.status === "Active" && (
                  <button className="w-full py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-colors">
                    {ar ? "إرسال فريق" : "Dispatch Team"}
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
