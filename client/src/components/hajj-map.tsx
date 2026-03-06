import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, AlertTriangle, MapPin, Info } from "lucide-react";
import { type Pilgrim } from "@shared/schema";
import { PilgrimPopup } from "@/components/pilgrim-popup";
import { useLanguage } from "@/contexts/language-context";

interface HajjZone {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  pilgrimCount: number;
  capacity: number;
  status: "normal" | "busy" | "warning" | "empty";
  color: string;
  hoverColor: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  labelX: number;
  labelY: number;
  ritualAr: string;
  ritualEn: string;
}

const HAJJ_ZONES: HajjZone[] = [
  {
    id: "haram",
    nameAr: "المسجد الحرام",
    nameEn: "Grand Mosque",
    descAr: "المسجد الأعظم في العالم — قلب الإسلام ومقصد الحجاج والمعتمرين من كل أنحاء العالم",
    descEn: "The largest mosque in the world — the heart of Islam and the destination of pilgrims from around the globe",
    pilgrimCount: 42000,
    capacity: 60000,
    status: "busy",
    color: "#064E3B",
    hoverColor: "#065F46",
    cx: 110,
    cy: 250,
    rx: 80,
    ry: 90,
    labelX: 110,
    labelY: 250,
    ritualAr: "الطواف والسعي",
    ritualEn: "Tawaf & Sa'i",
  },
  {
    id: "mina",
    nameAr: "مِنىٰ",
    nameEn: "Mina",
    descAr: "مخيم الحج — يُقيم فيه الحجاج ليلتي التشريق ويُعرف بـ «مدينة الخيام»",
    descEn: "The Hajj campsite — pilgrims spend the nights of Tashreeq here, known as the 'City of Tents'",
    pilgrimCount: 38000,
    capacity: 50000,
    status: "busy",
    color: "#92400E",
    hoverColor: "#B45309",
    cx: 355,
    cy: 255,
    rx: 130,
    ry: 100,
    labelX: 355,
    labelY: 255,
    ritualAr: "المبيت ورمي الجمرات",
    ritualEn: "Staying & Stoning Ritual",
  },
  {
    id: "jamarat",
    nameAr: "الجمرات",
    nameEn: "Jamarat Bridge",
    descAr: "موقع رمي الجمرات — أحد أهم شعائر الحج حيث يرمي الحجاج الجمرات الثلاث",
    descEn: "Stoning of the Devil site — one of the most important Hajj rituals performed over three days",
    pilgrimCount: 18000,
    capacity: 20000,
    status: "warning",
    color: "#7C3AED",
    hoverColor: "#6D28D9",
    cx: 290,
    cy: 270,
    rx: 48,
    ry: 38,
    labelX: 290,
    labelY: 270,
    ritualAr: "رمي الجمرات",
    ritualEn: "Devil's Stoning",
  },
  {
    id: "muzdalifah",
    nameAr: "مُزدلِفة",
    nameEn: "Muzdalifah",
    descAr: "المشعر الحرام — يبيت فيه الحجاج ليلة العاشر من ذي الحجة ويلتقطون حصى الجمرات",
    descEn: "The Sacred Monument — pilgrims spend the night of the 10th of Dhul Hijjah and collect pebbles",
    pilgrimCount: 8000,
    capacity: 45000,
    status: "normal",
    color: "#065C77",
    hoverColor: "#0E7490",
    cx: 560,
    cy: 255,
    rx: 105,
    ry: 85,
    labelX: 560,
    labelY: 255,
    ritualAr: "المبيت وجمع الحصى",
    ritualEn: "Overnight Stay & Pebble Collection",
  },
  {
    id: "arafat",
    nameAr: "عرفات",
    nameEn: "Arafat (Mount of Mercy)",
    descAr: "جبل الرحمة — ذروة الحج وركنه الأعظم، يقف فيه الحجاج يوم التاسع من ذي الحجة",
    descEn: "Mount of Mercy — the pinnacle of Hajj, where pilgrims stand on the 9th of Dhul Hijjah",
    pilgrimCount: 3000,
    capacity: 80000,
    status: "empty",
    color: "#1E3A5F",
    hoverColor: "#1D4ED8",
    cx: 710,
    cy: 255,
    rx: 115,
    ry: 110,
    labelX: 710,
    labelY: 255,
    ritualAr: "الوقوف بعرفات",
    ritualEn: "Standing at Arafat",
  },
];

interface ZoneInfoPanelProps {
  zone: HajjZone;
  onClose: () => void;
  isRTL: boolean;
  lang: string;
}

function ZoneInfoPanel({ zone, onClose, isRTL, lang }: ZoneInfoPanelProps) {
  const name = lang === "ar" ? zone.nameAr : zone.nameEn;
  const desc = lang === "ar" ? zone.descAr : zone.descEn;
  const ritual = lang === "ar" ? zone.ritualAr : zone.ritualEn;
  const loadPct = Math.round((zone.pilgrimCount / zone.capacity) * 100);
  const statusColor =
    zone.status === "warning"
      ? "text-amber-500"
      : zone.status === "busy"
      ? "text-orange-400"
      : zone.status === "normal"
      ? "text-emerald-500"
      : "text-sky-400";
  const statusLabel =
    lang === "ar"
      ? zone.status === "warning"
        ? "تحذير"
        : zone.status === "busy"
        ? "مكتظ"
        : zone.status === "normal"
        ? "طبيعي"
        : "فارغ"
      : zone.status === "warning"
      ? "Warning"
      : zone.status === "busy"
      ? "Busy"
      : zone.status === "normal"
      ? "Normal"
      : "Empty";

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          dir={isRTL ? "rtl" : "ltr"}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-2 w-full" style={{ backgroundColor: zone.color }} />
          <div className="p-6">
            <div className={`flex items-start justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={isRTL ? "text-right" : ""}>
                <h2 className="text-2xl font-bold text-foreground">{name}</h2>
                <span className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-5">{desc}</p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className={`flex items-center gap-2 mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {lang === "ar" ? "الحجاج الحاليون" : "Current Pilgrims"}
                  </span>
                </div>
                <div className="text-xl font-bold">{zone.pilgrimCount.toLocaleString()}</div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3">
                <div className={`flex items-center gap-2 mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <Info className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {lang === "ar" ? "الشعيرة" : "Ritual"}
                  </span>
                </div>
                <div className="text-sm font-bold leading-tight">{ritual}</div>
              </div>
            </div>

            <div className="mb-2">
              <div className={`flex justify-between text-sm mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-muted-foreground">
                  {lang === "ar" ? "نسبة الإشغال" : "Capacity Load"}
                </span>
                <span className="font-bold">{loadPct}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${loadPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-end mt-1">
              {lang === "ar"
                ? `السعة القصوى: ${zone.capacity.toLocaleString()}`
                : `Max capacity: ${zone.capacity.toLocaleString()}`}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.getElementById("root")!
  );
}

interface HajjMapProps {
  pilgrims?: Pilgrim[];
}

const ZONE_PILGRIM_MAP: Record<string, string[]> = {
  haram: ["A12345678"],
  mina: ["B98765432"],
  jamarat: [],
  muzdalifah: [],
  arafat: ["C45678912"],
};

export function HajjMap({ pilgrims }: HajjMapProps) {
  const { lang, isRTL, t } = useLanguage();
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<HajjZone | null>(null);
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);

  const getPilgrimsInZone = (zoneId: string): Pilgrim[] => {
    if (!pilgrims) return [];
    const passports = ZONE_PILGRIM_MAP[zoneId] || [];
    return pilgrims.filter((p) => passports.includes(p.passportNumber));
  };

  const pilgrimMarkers = pilgrims
    ? pilgrims.map((p) => {
        let cx = 110, cy = 250;
        if (p.passportNumber === "A12345678") { cx = 100; cy = 245; }
        else if (p.passportNumber === "B98765432") { cx = 370; cy = 240; }
        else if (p.passportNumber === "C45678912") { cx = 715; cy = 260; }
        else {
          const seed = p.passportNumber.split("").reduce((h, c) => ((h << 5) + h) ^ c.charCodeAt(0), 5381);
          cx = (Math.abs(seed) % 700) + 50;
          cy = (Math.abs(seed >> 4) % 400) + 50;
        }
        return { pilgrim: p, cx, cy };
      })
    : [];

  return (
    <>
      <div className="w-full h-full min-h-[420px] bg-[#060F12] rounded-2xl relative overflow-hidden border border-primary/20 shadow-2xl select-none" dir="ltr">
        <svg
          viewBox="0 0 840 510"
          className="w-full h-full"
          style={{ fontFamily: lang === "ar" ? "'Cairo', sans-serif" : "'Plus Jakarta Sans', sans-serif" }}
        >
          <defs>
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0A1F1A" />
              <stop offset="100%" stopColor="#04090B" />
            </radialGradient>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            </pattern>
          </defs>

          <rect width="840" height="510" fill="url(#bgGrad)" />
          <rect width="840" height="510" fill="url(#grid)" />

          {/* Road between zones */}
          <path
            d="M 190 255 L 220 255 L 485 255 L 665 255"
            fill="none"
            stroke="rgba(255,220,50,0.25)"
            strokeWidth="8"
            strokeDasharray="16,8"
            strokeLinecap="round"
          />
          <text x="420" y="298" textAnchor="middle" fill="rgba(255,220,50,0.5)" fontSize="10" fontWeight="bold" letterSpacing="2">
            {lang === "ar" ? "طريق المشاعر المقدسة" : "SACRED SITES ROAD"}
          </text>

          {/* Render zones */}
          {HAJJ_ZONES.map((zone) => {
            const isHovered = hoveredZone === zone.id;
            const zonePilgrims = getPilgrimsInZone(zone.id);
            const loadPct = zone.pilgrimCount / zone.capacity;
            const pulseOpacity = zone.status === "warning" ? 0.6 : zone.status === "busy" ? 0.45 : 0.3;
            return (
              <g key={zone.id}>
                {/* Outer glow ring for warning/busy */}
                {(zone.status === "warning" || zone.status === "busy") && (
                  <ellipse
                    cx={zone.cx}
                    cy={zone.cy}
                    rx={zone.rx + 14}
                    ry={zone.ry + 14}
                    fill="none"
                    stroke={zone.status === "warning" ? "#F59E0B" : zone.color}
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    opacity={0.5}
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from={`0 ${zone.cx} ${zone.cy}`}
                      to={`360 ${zone.cx} ${zone.cy}`}
                      dur="12s"
                      repeatCount="indefinite"
                    />
                  </ellipse>
                )}

                {/* Zone ellipse */}
                <ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.rx}
                  ry={zone.ry}
                  fill={isHovered ? zone.hoverColor : zone.color}
                  fillOpacity={isHovered ? 0.85 : 0.65}
                  stroke={isHovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"}
                  strokeWidth={isHovered ? 2 : 1}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  onClick={() => setSelectedZone(zone)}
                />

                {/* Zone capacity fill indicator */}
                <ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.rx * Math.sqrt(loadPct)}
                  ry={zone.ry * Math.sqrt(loadPct)}
                  fill="rgba(255,255,255,0.07)"
                  style={{ pointerEvents: "none" }}
                />

                {/* Arabic name */}
                <text
                  x={zone.labelX}
                  y={zone.labelY - 10}
                  textAnchor="middle"
                  fill="white"
                  fontSize={lang === "ar" ? "14" : "12"}
                  fontWeight="bold"
                  style={{ pointerEvents: "none", textShadow: "0 1px 4px #000" }}
                >
                  {lang === "ar" ? zone.nameAr : zone.nameEn}
                </text>
                {/* Ritual label */}
                <text
                  x={zone.labelX}
                  y={zone.labelY + 8}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.65)"
                  fontSize="9"
                  style={{ pointerEvents: "none" }}
                >
                  {lang === "ar" ? zone.ritualAr : zone.ritualEn}
                </text>
                {/* Pilgrim count */}
                <text
                  x={zone.labelX}
                  y={zone.labelY + 26}
                  textAnchor="middle"
                  fill={
                    zone.status === "warning"
                      ? "#FCD34D"
                      : zone.status === "busy"
                      ? "#FCA5A5"
                      : "rgba(255,255,255,0.8)"
                  }
                  fontSize="11"
                  fontWeight="bold"
                  style={{ pointerEvents: "none" }}
                >
                  {zone.pilgrimCount.toLocaleString()} {lang === "ar" ? "حاج" : "pilgrims"}
                </text>

                {/* Info icon on hover */}
                {isHovered && (
                  <g style={{ pointerEvents: "none" }}>
                    <circle cx={zone.cx + zone.rx - 10} cy={zone.cy - zone.ry + 10} r="12" fill="rgba(0,0,0,0.6)" />
                    <text x={zone.cx + zone.rx - 10} y={zone.cy - zone.ry + 15} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">i</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Pilgrim markers */}
          {pilgrimMarkers.map(({ pilgrim, cx, cy }) => (
            <g
              key={pilgrim.id}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedPilgrim(pilgrim)}
              data-testid={`map-marker-pilgrim-${pilgrim.id}`}
            >
              <circle cx={cx} cy={cy} r="14" fill="rgba(0,0,0,0)" />
              {pilgrim.emergencyStatus && (
                <circle cx={cx} cy={cy} r="10" fill="none" stroke="#EF4444" strokeWidth="2" opacity="0.8">
                  <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={cx}
                cy={cy}
                r="7"
                fill={pilgrim.emergencyStatus ? "#EF4444" : "#D97706"}
                stroke="white"
                strokeWidth="2"
              />
              <text x={cx} y={cy - 14} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold"
                style={{ pointerEvents: "none", filter: "drop-shadow(0 1px 2px black)" }}>
                {pilgrim.name.split(" ")[0]}
              </text>
            </g>
          ))}

          {/* North indicator */}
          <g transform="translate(790, 40)">
            <circle cx="0" cy="0" r="20" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <polygon points="0,-14 5,6 0,2 -5,6" fill="white" />
            <polygon points="0,14 5,-6 0,-2 -5,-6" fill="rgba(255,255,255,0.3)" />
            <text x="0" y="-18" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontWeight="bold">N</text>
          </g>

          {/* Title */}
          <text
            x="420"
            y="30"
            textAnchor="middle"
            fill="rgba(255,255,255,0.7)"
            fontSize={lang === "ar" ? "15" : "13"}
            fontWeight="bold"
            letterSpacing="1"
          >
            {lang === "ar" ? "خريطة المشاعر المقدسة — بث مباشر" : "HOLY SITES MAP — LIVE"}
          </text>

          {/* Scale bar */}
          <g transform="translate(30, 475)">
            <line x1="0" y1="0" x2="60" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <line x1="60" y1="-4" x2="60" y2="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <text x="30" y="-7" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">5 km</text>
          </g>
        </svg>

        {/* Legend */}
        <div className={`absolute bottom-4 ${isRTL ? "left-4" : "right-4"} bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl text-xs text-white/80 space-y-2`}
          dir={isRTL ? "rtl" : "ltr"}>
          <div className="font-bold text-white/90 mb-2">
            {lang === "ar" ? "المفتاح" : "Legend"}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
            {lang === "ar" ? "موقع حاج" : "Pilgrim"}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
            {lang === "ar" ? "حالة طوارئ" : "Emergency"}
          </div>
          <div className="border-t border-white/10 pt-2 text-white/50 text-[10px]">
            {lang === "ar" ? "انقر على منطقة للتفاصيل" : "Click zone for details"}
          </div>
        </div>

        {/* Live pulse badge */}
        <div className={`absolute top-4 ${isRTL ? "right-4" : "left-4"} flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-white/80 text-xs font-semibold`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          {lang === "ar" ? "مباشر" : "LIVE"}
        </div>
      </div>

      {selectedZone && (
        <ZoneInfoPanel
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
          isRTL={isRTL}
          lang={lang}
        />
      )}
      <PilgrimPopup pilgrim={selectedPilgrim} onClose={() => setSelectedPilgrim(null)} />
    </>
  );
}
