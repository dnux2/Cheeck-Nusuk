import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, Shield, Users, Hash, Clock, Heart, AlertCircle, Navigation, MessageSquare, UserCheck, Calendar } from "lucide-react";
import { type Pilgrim } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";
import { format } from "date-fns";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";

interface PilgrimPopupProps {
  pilgrim: Pilgrim | null;
  onClose: () => void;
}

function InfoRow({ icon: Icon, label, value, mono = false }: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  const { isRTL } = useLanguage();
  return (
    <div className={`flex items-center gap-2.5 py-2 border-b border-border/60 last:border-0 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className={`flex-1 min-w-0 flex items-center justify-between gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        <p className="text-xs text-muted-foreground flex-shrink-0">{label}</p>
        <p className={`text-sm font-semibold text-foreground truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

export function PilgrimPopup({ pilgrim, onClose }: PilgrimPopupProps) {
  const { t, isRTL, lang } = useLanguage();
  const [, navigate] = useLocation();

  if (!pilgrim) return null;

  const portalTarget = document.getElementById("root") || document.body;

  const permitColor =
    pilgrim.permitStatus === "Valid"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : pilgrim.permitStatus === "Expired"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : pilgrim.permitStatus === "Pending"
      ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";

  const permitLabel =
    pilgrim.permitStatus === "Valid" ? t("valid")
    : pilgrim.permitStatus === "Expired" ? t("expired")
    : pilgrim.permitStatus === "Pending" ? (lang === "ar" ? "قيد التحقق" : "Pending")
    : t("none");

  const healthLabel = pilgrim.emergencyStatus ? t("critical") : t("stable");
  const healthColor = pilgrim.emergencyStatus
    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";

  const initials = pilgrim.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className={`bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden ${isRTL ? "text-right" : "text-left"}`}
          style={{ maxHeight: "min(88vh, 580px)" }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Compact Header */}
          <div className="bg-gradient-to-br from-primary to-emerald-600 px-4 pt-4 pb-5 relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
            />
            <button
              onClick={onClose}
              data-testid="button-close-popup"
              className={`absolute top-3 ${isRTL ? "left-3" : "right-3"} w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="w-12 h-12 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-lg">{initials}</span>
              </div>
              <div className={`min-w-0 flex-1 ${isRTL ? "text-right" : ""}`}>
                <h2 className="text-white font-bold text-base leading-tight truncate">{pilgrim.name}</h2>
                <p className="text-white/70 text-xs mt-0.5">{pilgrim.nationality}</p>
                <div className={`flex gap-1.5 mt-1.5 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${permitColor}`}>{permitLabel}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${healthColor}`}>{healthLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Info */}
          <div className="overflow-y-auto flex-1 min-h-0 px-4 py-2">
            <InfoRow icon={Hash}        label={t("passport")}        value={pilgrim.passportNumber} mono />
            <InfoRow icon={Phone}       label={t("phone")}           value={pilgrim.phone} mono />
            {pilgrim.age != null && (
              <InfoRow icon={Calendar}  label={lang === "ar" ? "العمر" : "Age"}    value={`${pilgrim.age} ${lang === "ar" ? "سنة" : "yr"}`} />
            )}
            {pilgrim.gender && (
              <InfoRow icon={UserCheck} label={lang === "ar" ? "الجنس" : "Gender"} value={lang === "ar" ? (pilgrim.gender === "Male" ? "ذكر" : "أنثى") : pilgrim.gender} />
            )}
            <InfoRow icon={Users}       label={t("campaign")}        value={pilgrim.campaignGroup ?? t("unknown")} />
            <InfoRow icon={Shield}      label={t("permitStatus")}    value={permitLabel} />
            <InfoRow icon={Heart}       label={t("healthStatus")}    value={healthLabel} />
            <InfoRow
              icon={MapPin}
              label={t("currentLocation")}
              value={pilgrim.locationLat
                ? `${pilgrim.locationLat.toFixed(4)}°N, ${pilgrim.locationLng?.toFixed(4)}°E`
                : t("unknown")}
              mono
            />
            <InfoRow
              icon={Clock}
              label={t("lastUpdated")}
              value={pilgrim.lastUpdated ? format(new Date(pilgrim.lastUpdated), "MMM d, HH:mm") : t("unknown")}
            />
            <InfoRow icon={AlertCircle} label={t("emergencyContact")} value={"+966 50 999 8888"} mono />
          </div>

          {/* Fixed Action Buttons */}
          <div className={`px-4 py-3 flex gap-2 border-t border-border flex-shrink-0 bg-card ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              data-testid="button-track-route"
              onClick={() => { onClose(); navigate(`/crowd-management?highlight=${pilgrim.id}`); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-md hover:bg-primary/90 transition-all ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <Navigation className="w-3.5 h-3.5" />
              {t("trackRoute")}
            </button>
            <button
              data-testid="button-send-message"
              onClick={() => { onClose(); navigate(`/chat?pilgrimId=${pilgrim.id}`); }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-secondary text-secondary-foreground font-bold rounded-xl text-xs hover:bg-secondary/80 transition-all border border-border ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {t("sendMessage")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    portalTarget
  );
}
