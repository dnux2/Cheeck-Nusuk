import { useState, useEffect } from "react";
import { RealMap } from "@/components/real-map";
import { AlertCircle, Maximize2, Layers, RefreshCw } from "lucide-react";
import { usePilgrims } from "@/hooks/use-pilgrims";
import { useLanguage } from "@/contexts/language-context";

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

  const [sectors, setSectors] = useState<SectorData[]>(BASE_SECTORS);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate live updates every 5 seconds
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
      <div className={`flex justify-between items-center mb-6 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-bold text-foreground">{t("crowdMonitoring")}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            {t("crowdManagementDesc")}
            <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-mono">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {ar ? "تحديث مباشر" : "Live"}
            </span>
          </p>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <span className="text-xs text-muted-foreground font-mono hidden sm:block" dir="ltr">
            {lastUpdated.toLocaleTimeString()}
          </span>
          <button className={`px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-xl flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Layers className="w-4 h-4" />
            {t("layers")}
          </button>
          <button className="p-2 bg-secondary text-secondary-foreground rounded-xl">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Map container */}
        <div className="flex-1 rounded-2xl overflow-hidden border border-border/50 shadow-lg relative min-h-[400px]">
          <RealMap pilgrims={pilgrims} sectorData={sectors} />

          {/* Congestion warning banner — only visible when a zone is at warning level */}
          {warningZones.length > 0 && (
            <div
              className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} max-w-xs bg-card/90 backdrop-blur-xl border border-destructive/40 p-4 rounded-xl shadow-2xl z-[1000]`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <h3 className={`font-bold flex items-center gap-2 mb-2 text-destructive ${isRTL ? "flex-row-reverse" : ""}`}>
                <AlertCircle className="w-5 h-5" />
                {t("congestionWarning")}
              </h3>
              <p className={`text-sm text-muted-foreground mb-1 ${isRTL ? "text-right" : ""}`}>
                {warningZones.map(z => ar ? z.nameAr : z.nameEn).join("، ")}
                {" — "}
                {ar ? "تجاوزت ٨٠٪ من الطاقة الاستيعابية" : "exceeded 80% capacity"}
              </p>
              <p className={`text-xs text-muted-foreground mb-3 ${isRTL ? "text-right" : ""}`}>
                {t("congestionDesc")}
              </p>
              <button className="w-full py-2 bg-destructive text-white text-sm font-bold rounded-lg hover:bg-destructive/90 transition-colors">
                {t("executeRedirection")}
              </button>
            </div>
          )}
        </div>

        {/* Sector status sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">
          <h3 className={`font-display font-bold text-lg flex-shrink-0 ${isRTL ? "text-right" : ""}`}>
            {t("sectorStatus")}
          </h3>
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
                      isWarning ? "bg-destructive" : isBusy ? "bg-accent" : s.load < 5 ? "bg-muted-foreground/40" : "bg-primary"
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
