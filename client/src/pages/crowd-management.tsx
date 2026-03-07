import { useState, useEffect } from "react";
import { RealMap } from "@/components/real-map";
import { AlertCircle, RefreshCw, Radio } from "lucide-react";
import { usePilgrims } from "@/hooks/use-pilgrims";
import { useLanguage } from "@/contexts/language-context";
import { useSearch } from "wouter";

interface SectorData {
  id: string;
  nameEn: string;
  nameAr: string;
  load: number;
  status: string;
}

const BASE_SECTORS: SectorData[] = [
  { id: "S1", nameEn: "Mina Tents",      nameAr: "خيام منى",       load: 45, status: "Normal"  },
  { id: "S2", nameEn: "Arafat",          nameAr: "عرفات",           load: 20, status: "Empty"   },
  { id: "S3", nameEn: "Muzdalifah",      nameAr: "مزدلفة",          load: 15, status: "Empty"   },
  { id: "S4", nameEn: "Jamarat Bridge",  nameAr: "جسر الجمرات",     load: 88, status: "Warning" },
  { id: "S5", nameEn: "Grand Mosque",    nameAr: "المسجد الحرام",   load: 72, status: "Busy"    },
];

function simulateLoad(base: number): number {
  const delta = (Math.random() - 0.5) * 6;
  return Math.min(100, Math.max(0, Math.round(base + delta)));
}

function loadStatus(load: number): string {
  if (load >= 80) return "Warning";
  if (load >= 50) return "Busy";
  if (load >= 5)  return "Normal";
  return "Empty";
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
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setSectors(prev => prev.map(s => {
        const newLoad = simulateLoad(s.load);
        return { ...s, load: newLoad, status: loadStatus(newLoad) };
      }));
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const warningZones = sectors.filter(s => s.load >= 80);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-[calc(100vh-5rem)] flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
          <div className={isRTL ? "text-right" : ""}>
            <h1 className="text-3xl font-bold text-foreground">{t("crowdMonitoring")}</h1>
            <p className="text-muted-foreground mt-1">{t("crowdManagementDesc")}</p>
          </div>
          <div className={`flex items-center gap-2 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span dir="ltr">{lastUpdated.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg border border-border text-xs font-semibold">
              <Radio className="w-3.5 h-3.5" />
              {ar ? "بث مباشر" : "Live"}
            </div>
          </div>
        </div>

        {/* Highlighted pilgrim strip */}
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

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Map + legend below */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="flex-1 rounded-2xl overflow-hidden border border-border/50 shadow-lg relative min-h-[360px]">
            <RealMap pilgrims={pilgrims} sectorData={sectors} highlightedPilgrimId={highlightedPilgrimId} />
          </div>

          {/* Legend strip — outside the map so it never covers content */}
          <div className={`flex-shrink-0 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-2 py-1.5 bg-card border border-border/60 rounded-xl text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
            <span className="font-bold text-foreground/60 text-[10px] uppercase tracking-wider">{ar ? "مفتاح الألوان" : "Legend"}</span>
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

        {/* Sector status sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">
          <h3 className={`font-display font-bold text-lg flex-shrink-0 ${isRTL ? "text-right" : ""}`}>
            {t("sectorStatus")}
          </h3>

          {/* Congestion warning — moved to sidebar so it never covers the map */}
          {warningZones.length > 0 && (
            <div
              className={`bg-destructive/10 border border-destructive/40 rounded-xl p-4 flex-shrink-0`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <h3 className={`font-bold flex items-center gap-2 mb-1.5 text-destructive text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {t("congestionWarning")}
              </h3>
              <p className={`text-xs text-destructive/80 mb-3 leading-relaxed ${isRTL ? "text-right" : ""}`}>
                {warningZones.map(z => ar ? z.nameAr : z.nameEn).join("، ")}
                {" — "}
                {ar ? "تجاوزت ٨٠٪ من الطاقة" : "exceeded 80% capacity"}
              </p>
              <button className="w-full py-2 bg-destructive text-white text-xs font-bold rounded-lg hover:bg-destructive/90 transition-colors">
                {t("executeRedirection")}
              </button>
            </div>
          )}
          {sectors.map(s => {
            const isWarning = s.load >= 80;
            const isBusy = s.load >= 50 && s.load < 80;
            return (
              <div
                key={s.id}
                className={`bg-card p-4 rounded-xl border shadow-sm transition-colors ${
                  isWarning ? "border-destructive/40" : "border-border"
                }`}
              >
                <div className={`flex justify-between items-end mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className={isRTL ? "text-right" : ""}>
                    <div className="text-xs font-bold text-muted-foreground mb-1 font-mono">{s.id}</div>
                    <div className="font-bold">{ar ? s.nameAr : s.nameEn}</div>
                  </div>
                  <div className={`text-right ${isRTL ? "text-left" : ""}`}>
                    <div className={`text-lg font-bold font-mono ${
                      isWarning ? "text-destructive" : isBusy ? "text-accent" : "text-primary"
                    }`}>
                      {s.load}%
                    </div>
                    <div className={`text-xs font-semibold ${
                      isWarning ? "text-destructive/70" : "text-muted-foreground"
                    }`}>
                      {ar
                        ? isWarning ? "تحذير" : isBusy ? "مزدحم" : s.load < 5 ? "فارغ" : "طبيعي"
                        : s.status}
                    </div>
                  </div>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isWarning ? "bg-destructive" : isBusy ? "bg-accent" : "bg-muted-foreground/40"
                    }`}
                    style={{ width: `${s.load}%` }}
                  />
                </div>
                {isWarning && (
                  <p className={`text-xs text-destructive/80 mt-2 font-medium ${isRTL ? "text-right" : ""}`}>
                    {ar ? "⚠ اكتظاظ شديد — يُنصح بتحويل المسار" : "⚠ High congestion — redirect advised"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
