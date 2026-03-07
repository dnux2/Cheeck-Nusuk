import { useState, useCallback, useRef, useEffect } from "react";
import { RealMap, type NavRoute, type FacilityType, type Facility, FACILITIES, TYPE_CFG, SUPERVISOR_POS, haversineM, getFacilityCrowdScore, fetchOSRM } from "@/components/real-map";
import { AlertCircle, RefreshCw, Radio, Navigation, MapPin, Clock, ArrowLeft, ArrowRight, ArrowUp, CornerDownLeft, Footprints, X, ChevronDown, ChevronUp, Sparkles, Users, BrainCircuit, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePilgrims } from "@/hooks/use-pilgrims";
import { useLanguage } from "@/contexts/language-context";
import { useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";

function fmtDist(m: number, ar: boolean) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} ${ar ? "كم" : "km"}` : `${m} ${ar ? "م" : "m"}`;
}
function fmtDur(s: number, ar: boolean) {
  const mins = Math.max(1, Math.round(s / 60));
  return ar ? `${mins} دقيقة مشياً` : `${mins} min walk`;
}
function StepIcon({ type, modifier }: { type: string; modifier: string }) {
  if (type === "arrive") return <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />;
  if (type === "depart") return <Footprints className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
  if (modifier === "left" || modifier === "sharp left") return <ArrowLeft className="w-3.5 h-3.5 text-foreground/70 flex-shrink-0" />;
  if (modifier === "right" || modifier === "sharp right") return <ArrowRight className="w-3.5 h-3.5 text-foreground/70 flex-shrink-0" />;
  if (modifier === "uturn") return <CornerDownLeft className="w-3.5 h-3.5 text-foreground/70 flex-shrink-0" />;
  return <ArrowUp className="w-3.5 h-3.5 text-foreground/70 flex-shrink-0" />;
}

interface SectorData {
  id: string;
  nameEn: string;
  nameAr: string;
  load: number;
  status: string;
  reasoningAr?: string;
  reasoningEn?: string;
  confidence?: "high" | "medium" | "low";
}

const BASE_SECTORS: SectorData[] = [
  { id: "S1", nameEn: "Mina Tents",      nameAr: "خيام منى",       load: 0,  status: "Empty"   },
  { id: "S2", nameEn: "Arafat",          nameAr: "عرفات",           load: 0,  status: "Empty"   },
  { id: "S3", nameEn: "Muzdalifah",      nameAr: "مزدلفة",          load: 0,  status: "Empty"   },
  { id: "S4", nameEn: "Jamarat Bridge",  nameAr: "جسر الجمرات",     load: 0,  status: "Empty"   },
  { id: "S5", nameEn: "Grand Mosque",    nameAr: "المسجد الحرام",   load: 0,  status: "Empty"   },
];

// Zone ID → Sector ID mapping
const ZONE_TO_SECTOR: Record<string, string> = {
  haram: "S5", mina: "S1", jamarat: "S4", muzdalifah: "S3", arafat: "S2",
};

interface CrowdAssessment {
  zones: Array<{
    id: string; load: number; status: string;
    confidence: "high" | "medium" | "low";
    reasoningAr: string; reasoningEn: string;
  }>;
  season: string;
  summaryAr: string;
  summaryEn: string;
  context: {
    hijriDate: string; timeStr: string;
    isRamadan: boolean; isHajjSeason: boolean;
    nextPrayer: string; minutesToNext: number; nearPrayer: boolean;
  };
  assessedAt: string;
  cached?: boolean;
}

export function CrowdManagementPage() {
  const { data: pilgrims } = usePilgrims();
  const { t, isRTL, lang } = useLanguage();
  const ar = lang === "ar";
  const search = useSearch();

  const highlightedPilgrimId = search
    ? (Number(new URLSearchParams(search).get("highlight")) || undefined)
    : undefined;

  const highlightedPilgrim = highlightedPilgrimId
    ? pilgrims?.find(p => p.id === highlightedPilgrimId)
    : undefined;

  const [sectors, setSectors] = useState<SectorData[]>(BASE_SECTORS);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState<string | null>(null);
  const [navRoute, setNavRoute] = useState<NavRoute | null>(null);
  const [stepsExpanded, setStepsExpanded] = useState(false);

  // Smart suggestion state
  type SuggestResult = { facility: Facility; distM: number; crowdScore: number; score: number };
  const [suggestType, setSuggestType] = useState<FacilityType | null>(null);
  const [suggestResults, setSuggestResults] = useState<SuggestResult[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const handleSmartSuggest = useCallback((type: FacilityType) => {
    const hour = new Date().getHours();
    const results: SuggestResult[] = FACILITIES
      .filter(f => f.type === type)
      .map(f => {
        const distM = haversineM(SUPERVISOR_POS.lat, SUPERVISOR_POS.lng, f.lat, f.lng);
        const crowdScore = getFacilityCrowdScore(f.id, f.type, hour);
        const score = distM * 0.6 + crowdScore * 30;
        return { facility: f, distM, crowdScore, score };
      })
      .sort((a, b) => a.score - b.score);
    setSuggestResults(results);
    setSuggestType(type);
  }, []);

  const handleSuggestNavigate = useCallback(async (facility: Facility) => {
    setSuggestType(null);
    setSuggestLoading(true);
    const cfg = TYPE_CFG[facility.type];
    const route = await fetchOSRM(lang === "ar", SUPERVISOR_POS.lat, SUPERVISOR_POS.lng, facility.lat, facility.lng, lang === "ar" ? facility.nameAr : facility.nameEn, cfg.color);
    setSuggestLoading(false);
    if (route) { setNavRoute(route); setStepsExpanded(false); }
  }, [lang]);

  // ── AI crowd assessment (polls every 15 minutes) ─────────────────────────
  const { data: assessment, isLoading: assessLoading, refetch: refetchAssessment } = useQuery<CrowdAssessment>({
    queryKey: ["/api/crowd/assess"],
    queryFn: async () => {
      const res = await fetch("/api/crowd/assess", { method: "POST" });
      if (!res.ok) throw new Error("Assessment failed");
      return res.json();
    },
    refetchInterval: 15 * 60 * 1000,
    staleTime: 14 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    if (!assessment?.zones) return;
    setSectors(prev => prev.map(s => {
      const zone = assessment.zones.find(z => ZONE_TO_SECTOR[z.id] === s.id);
      if (!zone) return s;
      return {
        ...s,
        load: zone.load,
        status: zone.status.charAt(0).toUpperCase() + zone.status.slice(1),
        reasoningAr: zone.reasoningAr,
        reasoningEn: zone.reasoningEn,
        confidence: zone.confidence,
      };
    }));
    setLastUpdated(new Date(assessment.assessedAt));
  }, [assessment]);

  const warningZones = sectors.filter(s => s.load >= 80);

  // ── Auto-scroll to panels when they become active ────────────────────────
  const panelsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (navRoute && panelsRef.current) {
      panelsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [navRoute]);
  useEffect(() => {
    if (suggestType && panelsRef.current) {
      panelsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [suggestType]);

  // ── Shared panel JSX (used above the map) ────────────────────────────────
  const navPanel = navRoute ? (
    <motion.div
      key="nav-panel-outer"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className="rounded-2xl border border-border shadow-lg overflow-hidden bg-card"
      dir={isRTL ? "rtl" : "ltr"}
      data-testid="nav-panel"
    >
      <div className={`flex items-center gap-3 px-4 py-3 bg-card border-b border-border ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: navRoute.targetColor + "20" }}>
          <Navigation className="w-5 h-5" style={{ color: navRoute.targetColor }} />
        </div>
        <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
          <div className="font-bold text-sm text-foreground truncate">
            {ar ? `التوجه إلى: ${navRoute.targetName}` : `Navigate to: ${navRoute.targetName}`}
          </div>
          <div className={`flex items-center gap-4 text-xs text-muted-foreground mt-0.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className={`flex items-center gap-1 font-semibold ${isRTL ? "flex-row-reverse" : ""}`} style={{ color: navRoute.targetColor }}>
              <MapPin className="w-3 h-3" />{fmtDist(navRoute.distanceM, ar)}
            </span>
            <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Clock className="w-3 h-3" />{fmtDur(navRoute.durationS, ar)}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span>{navRoute.steps.filter(s => s.distanceM > 0 || s.type === "arrive").length} {ar ? "خطوة" : "steps"}</span>
          </div>
        </div>
        <button onClick={() => setStepsExpanded(v => !v)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0 text-muted-foreground">
          {stepsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button onClick={() => setNavRoute(null)} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0 text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <AnimatePresence>
        {stepsExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="overflow-hidden">
            <div className="overflow-y-auto max-h-48 px-3 py-2">
              {navRoute.steps.filter(s => s.distanceM > 0 || s.type === "arrive").map((step, i) => (
                <div key={i} className={`flex items-center gap-3 py-2 border-b border-border/40 last:border-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <StepIcon type={step.type} modifier={step.modifier} />
                  </div>
                  <span className={`flex-1 text-xs text-foreground ${isRTL ? "text-right" : ""}`}>{step.instruction}</span>
                  {step.distanceM > 0 && <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{fmtDist(step.distanceM, ar)}</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  ) : null;

  const suggestPanel = (suggestType && suggestResults.length > 0) ? (() => {
    const cfg = TYPE_CFG[suggestType];
    return (
      <motion.div
        key={`suggest-${suggestType}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="rounded-2xl border border-border shadow-xl overflow-hidden bg-card"
        dir={isRTL ? "rtl" : "ltr"}
        data-testid="panel-smart-suggest"
      >
        <div className={`flex items-center gap-3 px-4 py-3 border-b border-border ${isRTL ? "flex-row-reverse" : ""}`} style={{ background: cfg.bg + "bb" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: cfg.bg, border: `2px solid ${cfg.color}` }}>{cfg.emoji}</div>
          <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
            <div className="font-bold text-sm" style={{ color: cfg.color }}>{ar ? `اقتراح ذكي · ${cfg.labelAr}` : `Smart Pick · ${cfg.labelEn}`}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{ar ? `${suggestResults.length} مرافق مرتّبة حسب المسافة والكثافة` : `${suggestResults.length} facilities ranked by distance & crowd`}</div>
          </div>
          <button onClick={() => setSuggestType(null)} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="divide-y divide-border">
          {suggestResults.map((r, i) => {
            const crowdColor = r.crowdScore >= 70 ? "#C0392B" : r.crowdScore >= 45 ? "#B7860B" : "#0E6655";
            const crowdLabel = r.crowdScore >= 70 ? (ar ? "مزدحم" : "Busy") : r.crowdScore >= 45 ? (ar ? "متوسط" : "Moderate") : (ar ? "هادئ" : "Quiet");
            const isBest = i === 0;
            return (
              <div key={r.facility.id} className={`flex items-center gap-3 px-4 py-3 ${isBest ? "bg-primary/5" : "bg-card"} ${isRTL ? "flex-row-reverse" : ""}`} data-testid={`suggest-item-${r.facility.id}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isBest ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{isBest ? "★" : i + 1}</div>
                <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate">{ar ? r.facility.nameAr : r.facility.nameEn}</span>
                    {isBest && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground flex-shrink-0">{ar ? "الأفضل" : "Best"}</span>}
                  </div>
                  <div className={`flex items-center gap-3 mt-0.5 text-xs ${isRTL ? "flex-row-reverse" : ""}`}>
                    <span className="flex items-center gap-1 font-semibold text-muted-foreground"><MapPin className="w-3 h-3" />{fmtDist(r.distM, ar)}</span>
                    <span className="flex items-center gap-1 font-semibold" style={{ color: crowdColor }}><Users className="w-3 h-3" />{crowdLabel} <span className="opacity-60">({r.crowdScore}%)</span></span>
                  </div>
                  {(r.facility.detailAr || r.facility.detailEn) && <div className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">{ar ? r.facility.detailAr : r.facility.detailEn}</div>}
                </div>
                <button onClick={() => handleSuggestNavigate(r.facility)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white hover:opacity-90 active:scale-95 flex-shrink-0" style={{ background: cfg.color }} data-testid={`button-navigate-suggest-${r.facility.id}`}>
                  <Navigation className="w-3.5 h-3.5" />{ar ? "توجّه" : "Go"}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  })() : null;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto pb-16" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-6">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
          <div className={isRTL ? "text-right" : ""}>
            <h1 className="text-3xl font-bold text-foreground">{t("crowdMonitoring")}</h1>
            <p className="text-muted-foreground mt-1">{t("crowdManagementDesc")}</p>
          </div>
          <div className={`flex items-center gap-2 flex-shrink-0 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
            {assessLoading ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 text-xs font-semibold">
                <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
                {ar ? "AI يُقيّم الآن…" : "AI assessing…"}
              </div>
            ) : assessment ? (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary rounded-lg border border-primary/20 text-xs font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>{ar ? assessment.context?.hijriDate ?? "" : "AI Live"}</span>
                <span className="text-muted-foreground">·</span>
                <span dir="ltr">{lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}</span>
                <button onClick={() => refetchAssessment()} title={ar ? "تحديث الآن" : "Refresh now"} className="ml-1 hover:text-primary/70 transition-colors">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg border border-border text-xs font-semibold">
                <RefreshCw className="w-3 h-3" />
                {ar ? "جارٍ التحميل" : "Loading"}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg border border-border text-xs font-semibold">
              <Radio className="w-3.5 h-3.5" />
              {ar ? "بث مباشر" : "Live"}
            </div>
          </div>
        </div>

        {highlightedPilgrim && (
          <div className={`mt-3 flex items-center gap-3 p-3 bg-card border border-border rounded-xl text-sm font-semibold text-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
              {highlightedPilgrim.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
            </div>
            <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
              <span className="text-foreground">{ar ? "جارٍ تتبع الحاج: " : "Tracking pilgrim: "}</span>
              <span>{highlightedPilgrim.name}</span>
              <span className="text-muted-foreground font-normal mx-1">·</span>
              <span className="text-muted-foreground font-normal">{highlightedPilgrim.nationality}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Panels above the map (nav + suggest) ────────────────────────────── */}
      <AnimatePresence>
        {suggestLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 mb-3 rounded-2xl bg-card border border-border shadow text-sm text-muted-foreground"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            {ar ? "جاري حساب المسار…" : "Calculating route…"}
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={panelsRef} className="flex flex-col gap-3 mb-3 scroll-mt-4">
        <AnimatePresence>{navRoute && navPanel}</AnimatePresence>
        <AnimatePresence>{suggestType && suggestPanel}</AnimatePresence>
      </div>

      {/* ── Main content row: map + sidebar ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: map + legend */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="rounded-2xl overflow-hidden border border-border/50 shadow-lg" style={{ height: "clamp(420px, 55vh, 680px)" }}>
            <RealMap
              pilgrims={pilgrims}
              sectorData={sectors}
              highlightedPilgrimId={highlightedPilgrimId}
              navRoute={navRoute}
              onNavRouteChange={(r) => { setNavRoute(r); if (r) setStepsExpanded(false); }}
              onSmartSuggest={handleSmartSuggest}
            />
          </div>

          {/* Legend strip */}
          <div className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 px-3 py-2 bg-card border border-border/60 rounded-xl text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
            <span className="font-bold text-foreground/50 text-[10px] uppercase tracking-wider">{ar ? "مفتاح الألوان" : "Legend"}</span>
            <span className="w-px h-4 bg-border/60 hidden sm:block" />
            {[
              { color: "#EF4444", label: ar ? "اكتظاظ" : "Warning" },
              { color: "#F59E0B", label: ar ? "مزدحم" : "Busy" },
              { color: "#10B981", label: ar ? "طبيعي" : "Normal" },
              { color: "#6B7280", label: ar ? "فارغ" : "Empty" },
            ].map(item => (
              <span key={item.label} className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
            <span className="w-px h-4 bg-border/60 hidden sm:block" />
            {[
              { color: "#10B981", label: ar ? "حاج سارٍ" : "Valid" },
              { color: "#F59E0B", label: ar ? "منتهي" : "Expired" },
              { color: "#EF4444", label: ar ? "طوارئ" : "Emergency" },
              { color: "#2563EB", label: ar ? "المشرف" : "Supervisor", diamond: true },
            ].map(item => (
              <span key={item.label} className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                {item.diamond
                  ? <span className="w-2.5 h-2.5 flex-shrink-0 rounded-sm" style={{ background: item.color, transform: "rotate(45deg)" }} />
                  : <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                }
                {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right: sector sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
            <h3 className={`font-display font-bold text-lg ${isRTL ? "text-right" : ""}`}>{t("sectorStatus")}</h3>
            {assessLoading && (
              <div className="flex items-center gap-1 text-xs text-primary font-medium animate-pulse">
                <BrainCircuit className="w-3.5 h-3.5" />
                {ar ? "جارٍ التقييم…" : "Assessing…"}
              </div>
            )}
          </div>

          {/* AI summary banner */}
          {assessment?.summaryAr && !assessLoading && (
            <div className={`bg-primary/5 border border-primary/20 rounded-xl px-3.5 py-3 text-xs leading-relaxed ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
              <div className={`flex items-center gap-1.5 mb-1 text-primary font-bold text-[11px] uppercase tracking-wide ${isRTL ? "flex-row-reverse" : ""}`}>
                <BrainCircuit className="w-3 h-3" />
                {ar ? `تقييم ذكاء اصطناعي · ${assessment.season}` : `AI Assessment · ${assessment.season}`}
              </div>
              <p className="text-muted-foreground">{ar ? assessment.summaryAr : assessment.summaryEn}</p>
              {assessment.context?.nearPrayer && (
                <p className={`mt-1.5 text-primary/80 font-semibold flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span>🕌</span>
                  {ar
                    ? `اقتراب وقت ${assessment.context.nextPrayer === "Fajr" ? "الفجر" : assessment.context.nextPrayer === "Dhuhr" ? "الظهر" : assessment.context.nextPrayer === "Asr" ? "العصر" : assessment.context.nextPrayer === "Maghrib" ? "المغرب" : "العشاء"} — الحرم في تصاعد`
                    : `${assessment.context.nextPrayer} prayer approaching — Haram crowd rising`}
                </p>
              )}
            </div>
          )}

          {warningZones.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/40 rounded-xl p-4" dir={isRTL ? "rtl" : "ltr"}>
              <h3 className={`font-bold flex items-center gap-2 mb-1.5 text-destructive text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{t("congestionWarning")}
              </h3>
              <p className={`text-xs text-destructive/80 mb-3 leading-relaxed ${isRTL ? "text-right" : ""}`}>
                {warningZones.map(z => ar ? z.nameAr : z.nameEn).join("، ")} — {ar ? "تجاوزت ٨٠٪ من الطاقة" : "exceeded 80% capacity"}
              </p>
              <button className="w-full py-2 bg-destructive text-white text-xs font-bold rounded-lg hover:bg-destructive/90 transition-colors">{t("executeRedirection")}</button>
            </div>
          )}

          {sectors.map(s => {
            const isWarning = s.load >= 80;
            const isBusy = s.load >= 50 && s.load < 80;
            const isOpen = reasoningOpen === s.id;
            const reasoning = ar ? s.reasoningAr : s.reasoningEn;
            return (
              <div key={s.id} className={`bg-card rounded-xl border shadow-sm ${isWarning ? "border-destructive/40" : "border-border"} overflow-hidden`}>
                <div className="p-4">
                  <div className={`flex justify-between items-end mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className={isRTL ? "text-right" : ""}>
                      <div className={`flex items-center gap-1.5 mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <span className="text-xs font-bold text-muted-foreground font-mono">{s.id}</span>
                        {s.confidence && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.confidence === "high" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}`}>
                            {ar ? (s.confidence === "high" ? "ثقة عالية" : "ثقة متوسطة") : s.confidence}
                          </span>
                        )}
                      </div>
                      <div className="font-bold">{ar ? s.nameAr : s.nameEn}</div>
                    </div>
                    <div className={`text-right ${isRTL ? "text-left" : ""}`}>
                      <div className={`text-lg font-bold font-mono ${isWarning ? "text-destructive" : isBusy ? "text-accent" : "text-primary"}`}>{s.load}%</div>
                      <div className={`text-xs font-semibold ${isWarning ? "text-destructive/70" : "text-muted-foreground"}`}>
                        {ar ? (isWarning ? "تحذير" : isBusy ? "مزدحم" : s.load < 5 ? "فارغ" : "طبيعي") : s.status}
                      </div>
                    </div>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full transition-all duration-700 ${isWarning ? "bg-destructive" : isBusy ? "bg-accent" : s.load < 5 ? "bg-muted-foreground/30" : "bg-primary"}`} style={{ width: `${Math.max(s.load, 0.5)}%` }} />
                  </div>
                  {isWarning && <p className={`text-xs text-destructive/80 mb-2 font-medium ${isRTL ? "text-right" : ""}`}>{ar ? "⚠ اكتظاظ شديد — يُنصح بتحويل المسار" : "⚠ High congestion — redirect advised"}</p>}
                  {reasoning && (
                    <button
                      onClick={() => setReasoningOpen(isOpen ? null : s.id)}
                      className={`flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors font-medium ${isRTL ? "flex-row-reverse" : ""}`}
                      data-testid={`button-reasoning-${s.id}`}
                    >
                      <BrainCircuit className="w-3 h-3" />
                      {ar ? "سبب التقييم" : "AI reasoning"}
                      <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    </button>
                  )}
                </div>
                {reasoning && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-muted/30 px-4 py-3"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <p className={`text-xs text-muted-foreground leading-relaxed ${isRTL ? "text-right" : ""}`}>{reasoning}</p>
                  </motion.div>
                )}
              </div>
            );
          })}

          {/* Source note */}
          <p className={`text-[10px] text-muted-foreground/50 px-1 ${isRTL ? "text-right" : ""}`}>
            {ar ? "المصدر: رئاسة شؤون المسجد الحرام · إحصاءات الحج 2024-2026 · Aladhan API" : "Source: General Presidency + Hajj 2024-2026 data · Aladhan API"}
          </p>
        </div>
      </div>
    </div>
  );
}
