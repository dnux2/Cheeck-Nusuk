import { useState, useRef, useEffect } from "react";
import { useEmergencies, useResolveEmergency } from "@/hooks/use-emergencies";
import { AlertTriangle, MapPin, CheckCircle, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
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

export function EmergenciesPage() {
  const { data: emergencies } = useEmergencies();
  const resolveEmergency = useResolveEmergency();
  const { t, isRTL } = useLanguage();
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const prevCountRef = useRef<number>(0);

  const activeCount = emergencies?.filter(e => e.status === "Active").length ?? 0;

  useEffect(() => {
    if (activeCount > prevCountRef.current) {
      playBeep();
    }
    prevCountRef.current = activeCount;
  }, [activeCount]);

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
              {t("noActiveEmergencies")}
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
            <p className="text-lg font-semibold text-foreground mb-1">{t("noActiveEmergencies")}</p>
          </div>
        )}

        {emergencies?.map((em, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={em.id}
            data-testid={`card-emergency-${em.id}`}
            className={`p-6 rounded-2xl border bg-card ${
              em.status === "Active" ? "border-destructive shadow-sm shadow-destructive/10" : "border-border opacity-60"
            }`}
          >
            <div className={`flex justify-between items-start mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`p-3 rounded-xl ${em.status === "Active" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <h3 className="font-bold text-lg">{em.type} Emergency</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("pilgrimIdLabel")}: {em.pilgrimId}
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                {em.timestamp ? format(new Date(em.timestamp), "HH:mm") : ""}
              </span>
            </div>

            <div className={`flex items-center gap-2 text-sm text-muted-foreground mb-6 bg-background p-3 rounded-lg border border-border ${isRTL ? "flex-row-reverse" : ""}`}>
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span dir="ltr" className="font-mono text-xs">
                {em.locationLat?.toFixed(4)}, {em.locationLng?.toFixed(4)}
              </span>
            </div>

            {em.status === "Active" ? (
              <button
                data-testid={`button-resolve-emergency-${em.id}`}
                onClick={() => setConfirmId(em.id)}
                disabled={resolveEmergency.isPending}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {t("markResolved")}
              </button>
            ) : (
              <div className={`w-full py-3 bg-secondary text-secondary-foreground text-center font-bold rounded-xl flex items-center justify-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {t("resolved")}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmId !== null} onOpenChange={(open) => { if (!open) setConfirmId(null); }}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isRTL ? "text-right" : ""}>
              {isRTL ? "تأكيد إنهاء الحالة" : "Confirm Resolve Emergency"}
            </AlertDialogTitle>
            <AlertDialogDescription className={isRTL ? "text-right" : ""}>
              {isRTL
                ? "هل أنت متأكد من إنهاء هذه الحالة؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to mark this emergency as resolved? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <AlertDialogCancel data-testid="button-cancel-resolve">
              {isRTL ? "إلغاء" : "Cancel"}
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
              {isRTL ? "نعم، إنهاء الحالة" : "Yes, Resolve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
