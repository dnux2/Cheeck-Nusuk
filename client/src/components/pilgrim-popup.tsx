import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, Shield, Users, Hash, Clock, Heart, AlertCircle, Navigation, MessageSquare } from "lucide-react";
import { type Pilgrim } from "@shared/schema";
import { useLanguage } from "@/contexts/language-context";
import { format } from "date-fns";
import { createPortal } from "react-dom";

interface PilgrimPopupProps {
  pilgrim: Pilgrim | null;
  onClose: () => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  const { isRTL } = useLanguage();
  return (
    <div className={`flex items-start gap-3 py-2.5 border-b border-border last:border-0 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-semibold text-foreground mt-0.5 truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

export function PilgrimPopup({ pilgrim, onClose }: PilgrimPopupProps) {
  const { t, isRTL } = useLanguage();

  if (!pilgrim) return null;

  const portalTarget = document.getElementById("root") || document.body;

  const permitColor =
    pilgrim.permitStatus === "Valid"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : pilgrim.permitStatus === "Expired"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";

  const permitLabel =
    pilgrim.permitStatus === "Valid"
      ? t("valid")
      : pilgrim.permitStatus === "Expired"
      ? t("expired")
      : t("none");

  const healthLabel = pilgrim.emergencyStatus ? t("critical") : t("stable");
  const healthColor = pilgrim.emergencyStatus
    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";

  const initials = pilgrim.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden ${isRTL ? "text-right" : "text-left"}`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-primary to-emerald-600 px-6 pt-6 pb-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />
            <button
              onClick={onClose}
              data-testid="button-close-popup"
              className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-display font-bold text-2xl">{initials}</span>
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <h2 className="text-white font-display font-bold text-xl leading-tight">{pilgrim.name}</h2>
                <p className="text-white/70 text-sm mt-0.5">{pilgrim.nationality}</p>
                <div className={`flex gap-2 mt-2 ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${permitColor}`}>
                    {permitLabel}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${healthColor}`}>
                    {healthLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="px-6 py-4 space-y-0">
            <InfoRow icon={Hash} label={t("passport")} value={pilgrim.passportNumber} mono />
            <InfoRow icon={Phone} label={t("phone")} value={pilgrim.phone} mono />
            <InfoRow icon={Users} label={t("campaign")} value={pilgrim.campaignGroup ?? t("unknown")} />
            <InfoRow icon={Shield} label={t("permitStatus")} value={permitLabel} />
            <InfoRow icon={Heart} label={t("healthStatus")} value={healthLabel} />
            <InfoRow
              icon={MapPin}
              label={t("currentLocation")}
              value={
                pilgrim.locationLat
                  ? `${pilgrim.locationLat.toFixed(4)}°N, ${pilgrim.locationLng?.toFixed(4)}°E`
                  : t("unknown")
              }
              mono
            />
            <InfoRow
              icon={Clock}
              label={t("lastUpdated")}
              value={pilgrim.lastUpdated ? format(new Date(pilgrim.lastUpdated), "MMM d, yyyy HH:mm") : t("unknown")}
            />
            <InfoRow
              icon={AlertCircle}
              label={t("emergencyContact")}
              value={"+966 50 999 8888"}
              mono
            />
          </div>

          {/* Action Buttons */}
          <div className={`px-6 pb-6 flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              data-testid="button-track-route"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md shadow-primary/25 transition-all"
            >
              <Navigation className="w-4 h-4" />
              {t("trackRoute")}
            </button>
            <button
              data-testid="button-send-message"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground font-bold rounded-xl transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              {t("sendMessage")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    portalTarget
  );
}
