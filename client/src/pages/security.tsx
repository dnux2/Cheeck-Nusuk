import { useAlerts, useCreateAlert } from "@/hooks/use-alerts";
import { Shield, AlertCircle, Camera, Radio, Zap, Users } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language-context";
import { CameraDetector } from "@/components/camera-detector";

export function SecurityPage() {
  const { data: alerts } = useAlerts();
  const createAlert = useCreateAlert();
  const { isRTL, lang } = useLanguage();
  const ar = lang === "ar";

  const activeAlerts = alerts?.filter(a => a.status === "Active") ?? [];

  const triggerMockDetection = () => {
    createAlert.mutate({
      type: "Unauthorized",
      message: ar
        ? "كاميرا الذكاء الاصطناعي رصدت حاجاً بدون تصريح سارٍ في مخيمات منى — القطاع C2."
        : "AI Camera detected pilgrim without valid permit in Mina Camp — Sector C2.",
      locationLat: 21.42,
      locationLng: 39.82,
      status: "Active",
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6" dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Page Header ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
        <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <div className={isRTL ? "text-right" : ""}>
            <h1 className="text-2xl font-display font-bold text-foreground leading-tight">
              {ar ? "الأمن والذكاء الاصطناعي" : "AI Security & Detection"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {ar
                ? "مراقبة مخيمات منى بالكاميرا الذكية — كشف الحجاج المصرحين وغير المصرحين"
                : "Smart camera surveillance for Mina Camps — real-time permit verification"}
            </p>
          </div>
        </div>

        {/* Status badges + test button */}
        <div className={`flex items-center gap-3 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
            <Radio className="w-3 h-3 animate-pulse" />
            {ar ? "بث مباشر" : "Live"}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-secondary-foreground text-xs font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
            <Camera className="w-3.5 h-3.5" />
            {ar ? "كاميرا منى C2" : "Mina Cam C2"}
          </div>
          <button
            onClick={triggerMockDetection}
            data-testid="button-test-alert"
            disabled={createAlert.isPending}
            className={`flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive font-semibold rounded-xl border border-destructive/30 hover:bg-destructive hover:text-white transition-all duration-200 text-sm ${isRTL ? "flex-row-reverse" : ""} disabled:opacity-50`}
          >
            <Zap className="w-4 h-4" />
            {ar ? "اختبار تنبيه" : "Test Alert"}
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Camera, label: ar ? "كاميرات نشطة" : "Active Cameras", value: "4", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
          { icon: Users, label: ar ? "حجاج مرصودون" : "Pilgrims Detected", value: "1,284", color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
          { icon: Shield, label: ar ? "تنبيهات نشطة" : "Active Alerts", value: String(activeAlerts.length), color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20" },
          { icon: Zap, label: ar ? "دقة الكشف" : "Detection Accuracy", value: "97.3%", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`bg-card rounded-xl border ${stat.border} p-4 flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <p className="text-xs text-muted-foreground leading-none mb-1">{stat.label}</p>
                <p className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Camera — 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Detection legend */}
          <div className={`flex items-center gap-6 bg-card rounded-xl border border-border px-5 py-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex-shrink-0">
              {ar ? "دليل الكشف" : "Detection Guide"}
            </span>
            <div className={`flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="w-4 h-4 border-2 border-emerald-500 rounded-sm flex-shrink-0" />
              {ar ? "إطار أخضر = مصرح" : "Green = Authorized"}
            </div>
            <div className={`flex items-center gap-2 text-destructive text-sm font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="w-4 h-4 border-2 border-destructive rounded-sm flex-shrink-0" />
              {ar ? "إطار أحمر = غير مصرح" : "Red = Unauthorized"}
            </div>
          </div>

          <CameraDetector />
        </div>

        {/* Alerts panel */}
        <div className="bg-card rounded-2xl border border-border flex flex-col min-h-[500px] overflow-hidden">
          {/* Panel header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b border-border ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h2 className="text-base font-display font-bold">
                {ar ? "تنبيهات الأمن" : "Security Alerts"}
              </h2>
            </div>
            {activeAlerts.length > 0 && (
              <span className="px-2.5 py-0.5 bg-destructive text-white text-xs font-bold rounded-full">
                {activeAlerts.length}
              </span>
            )}
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 p-4">
            {(!alerts || alerts.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                <Shield className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">{ar ? "لا توجد تنبيهات نشطة" : "No active alerts"}</p>
              </div>
            )}
            {alerts?.map((alert) => (
              <motion.div
                initial={{ opacity: 0, x: isRTL ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                key={alert.id}
                className={`p-4 rounded-xl border-s-4 bg-background shadow-sm ${
                  alert.status === "Active" ? "border-s-destructive" : "border-s-muted"
                }`}
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className={`flex justify-between items-start mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    alert.status === "Active"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {alert.type}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                    {alert.timestamp ? format(new Date(alert.timestamp), "HH:mm") : ar ? "الآن" : "Now"}
                  </span>
                </div>
                <p className={`text-sm text-foreground mb-3 leading-relaxed ${isRTL ? "text-right" : ""}`}>
                  {alert.message}
                </p>
                {alert.status === "Active" && (
                  <button className="w-full py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-destructive hover:text-white transition-colors">
                    {ar ? "إرسال فريق أمني" : "Dispatch Security Team"}
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
