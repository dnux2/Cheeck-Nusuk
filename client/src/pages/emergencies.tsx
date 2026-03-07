import { useState, useRef, useEffect } from "react";
import { useEmergencies, useResolveEmergency } from "@/hooks/use-emergencies";
import { usePilgrims } from "@/hooks/use-pilgrims";
import { AlertTriangle, MapPin, CheckCircle, ShieldCheck, User, Phone, HeartPulse, Navigation } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { useLocation } from "wouter";
import { type Pilgrim } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // AudioContext not available
  }
}

const TYPE_LABEL: Record<string, { ar: string; en: string; color: string }> = {
  Medical:  { ar: "طوارئ طبية",   en: "Medical",        color: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
  Lost:     { ar: "ضائع / مفقود", en: "Lost / Missing", color: "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  Security: { ar: "تهديد أمني",   en: "Security",       color: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
};

export function EmergenciesPage() {
  const { data: emergencies } = useEmergencies();
  const { data: pilgrims } = usePilgrims();
  const resolveEmergency = useResolveEmergency();
  const { t, isRTL, lang } = useLanguage();
  const ar = lang === "ar";
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const prevCountRef = useRef<number>(0);

  const activeCount = emergencies?.filter(e => e.status === "Active").length ?? 0;

  useEffect(() => {
    if (activeCount > prevCountRef.current) {
      playBeep();
    }
    prevCountRef.current = activeCount;
  }, [activeCount]);

  const pilgrimMap = new Map<number, Pilgrim>(
    (pilgrims ?? []).map(p => [p.id, p])
  );

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-display font-bold text-foreground">{t("emergencyResponseTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("emergencyResponseDesc")}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm ${
          activeCount > 0
            ? "bg-destructive/10 border-destructive/30 text-destructive"
            : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
        }`}>
          {activeCount > 0 ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              {activeCount} {t("activeEmergenciesTitle")}
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              {ar ? "لا حالات نشطة" : t("noActiveEmergencies")}
            </>
          )}
        </div>
      </div>

      {/* Emergency Cards */}
      <h2 className={`text-2xl font-display font-bold mb-6 ${isRTL ? "text-right" : ""}`}>{t("activeEmergenciesTitle")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(!emergencies || emergencies.length === 0) && (
          <div className="col-span-full p-16 text-center bg-card rounded-2xl border border-border">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-1">{ar ? "لا توجد حالات طوارئ" : t("noActiveEmergencies")}</p>
            <p className="text-sm text-muted-foreground">{ar ? "النظام يعمل بشكل طبيعي" : "All systems normal"}</p>
          </div>
        )}

        {emergencies?.map((em, i) => {
          const pilgrim = em.pilgrimId ? pilgrimMap.get(em.pilgrimId) : undefined;
          const typeInfo = TYPE_LABEL[em.type] ?? { ar: em.type, en: em.type, color: "bg-secondary text-foreground border-border" };

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={em.id}
              data-testid={`card-emergency-${em.id}`}
              className={`rounded-2xl border bg-card overflow-hidden ${
                em.status === "Active" ? "border-destructive shadow-sm shadow-destructive/10" : "border-border opacity-70"
              }`}
            >
              {/* Card header */}
              <div className={`p-5 border-b border-border/50 flex justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className={`p-3 rounded-xl ${em.status === "Active" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <div className={`flex items-center gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                      <h3 className="font-bold text-base text-foreground">
                        {ar ? typeInfo.ar : typeInfo.en}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeInfo.color}`}>
                        {em.status === "Active" ? (ar ? "نشط" : "Active") : (ar ? "محلول" : "Resolved")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {em.timestamp ? format(new Date(em.timestamp), "HH:mm · dd MMM yyyy") : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pilgrim info */}
              {pilgrim ? (
                <div className={`px-5 py-4 space-y-2 bg-muted/20 border-b border-border/50`} dir={isRTL ? "rtl" : "ltr"}>
                  <div className={`flex items-center gap-2 text-sm font-bold text-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
                    <User className="w-4 h-4 text-primary flex-shrink-0" />
                    <span data-testid={`text-emergency-pilgrim-name-${em.id}`}>{pilgrim.name}</span>
                    <span className="text-muted-foreground font-normal text-xs">· {pilgrim.nationality}</span>
                  </div>
                  <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
                    {pilgrim.phone && (
                      <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{pilgrim.phone}</span>
                      </span>
                    )}
                    {pilgrim.bloodType && (
                      <span className={`flex items-center gap-1 font-semibold text-red-600 dark:text-red-400 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <HeartPulse className="w-3 h-3" />
                        {pilgrim.bloodType}
                      </span>
                    )}
                    {pilgrim.campaignGroup && (
                      <span className="text-muted-foreground/70">{pilgrim.campaignGroup}</span>
                    )}
                  </div>
                  {pilgrim.medicalConditions && (
                    <p className={`text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 ${isRTL ? "text-right" : ""}`}>
                      ⚕️ {pilgrim.medicalConditions}
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-5 py-3 bg-muted/20 border-b border-border/50">
                  <p className="text-xs text-muted-foreground">
                    {ar ? `رقم الحاج: ${em.pilgrimId ?? "—"}` : `Pilgrim ID: ${em.pilgrimId ?? "—"}`}
                  </p>
                </div>
              )}

              {/* GPS location */}
              <div className={`flex items-center gap-2 text-sm text-muted-foreground mx-5 my-3 bg-background p-3 rounded-lg border border-border ${isRTL ? "flex-row-reverse" : ""}`}>
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span dir="ltr" className="font-mono text-xs">
                  {em.locationLat?.toFixed(5)}, {em.locationLng?.toFixed(5)}
                </span>
              </div>

              {/* Action buttons */}
              <div className={`px-5 pb-5 flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                {em.status === "Active" ? (
                  <>
                    {pilgrim && (
                      <button
                        data-testid={`button-track-pilgrim-${em.id}`}
                        onClick={() => navigate(`/pilgrims?pilgrimId=${pilgrim.id}`)}
                        className={`flex-1 py-2.5 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-secondary/70 transition-colors text-sm flex items-center justify-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        <Navigation className="w-4 h-4" />
                        {ar ? "تتبع الحاج" : "Track Pilgrim"}
                      </button>
                    )}
                    <button
                      data-testid={`button-resolve-emergency-${em.id}`}
                      onClick={() => setConfirmId(em.id)}
                      disabled={resolveEmergency.isPending}
                      className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                    >
                      {t("markResolved")}
                    </button>
                  </>
                ) : (
                  <div className={`w-full py-2.5 bg-secondary text-secondary-foreground text-center font-bold rounded-xl flex items-center justify-center gap-2 text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {t("resolved")}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmId !== null} onOpenChange={(open) => { if (!open) setConfirmId(null); }}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isRTL ? "text-right" : ""}>
              {ar ? "تأكيد إنهاء الحالة" : "Confirm Resolve Emergency"}
            </AlertDialogTitle>
            <AlertDialogDescription className={isRTL ? "text-right" : ""}>
              {ar
                ? "هل أنت متأكد من إنهاء هذه الحالة؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to mark this emergency as resolved? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <AlertDialogCancel data-testid="button-cancel-resolve">
              {ar ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-resolve"
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                if (confirmId !== null) {
                  resolveEmergency.mutate(confirmId);
                  setConfirmId(null);
                }
              }}
            >
              {ar ? "نعم، إنهاء الحالة" : "Yes, Resolve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
