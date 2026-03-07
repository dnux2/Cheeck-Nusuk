import { StatCard } from "@/components/stat-card";
import { RealMap } from "@/components/real-map";
import { Users, AlertTriangle, ShieldAlert, Activity } from "lucide-react";
import { usePilgrims } from "@/hooks/use-pilgrims";
import { useEmergencies } from "@/hooks/use-emergencies";
import { useAlerts } from "@/hooks/use-alerts";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

const mockChartData = [
  { time: "00:00", crowd: 4000 },
  { time: "04:00", crowd: 3000 },
  { time: "08:00", crowd: 8000 },
  { time: "12:00", crowd: 12000 },
  { time: "16:00", crowd: 15000 },
  { time: "20:00", crowd: 9000 },
  { time: "23:59", crowd: 5000 },
];

const DASHBOARD_SECTORS = [
  { id: "S1", load: 76, status: "Busy" },
  { id: "S2", load: 20, status: "Empty" },
  { id: "S3", load: 15, status: "Empty" },
  { id: "S4", load: 88, status: "Warning" },
  { id: "S5", load: 72, status: "Busy" },
];

export function Dashboard() {
  const { data: pilgrims } = usePilgrims();
  const { data: emergencies } = useEmergencies();
  const { data: alerts } = useAlerts();
  const { t, isRTL } = useLanguage();

  const totalPilgrims = pilgrims?.length ?? 0;
  const activeEmergencies = emergencies?.filter(e => e.status === "Active").length ?? 0;
  const activeAlerts = alerts?.filter(a => a.status === "Active").length ?? 0;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isRTL ? "md:flex-row-reverse" : ""}`}>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-display font-bold text-foreground">{t("overviewTitle")}</h1>
          <p className="text-muted-foreground mt-1 text-lg">{t("systemStatus")}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full font-medium border border-emerald-200 dark:border-emerald-800">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          {t("allSystemsNominal")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard delay={0.1} title={t("totalPilgrimsTracked")} value={totalPilgrims.toLocaleString()} icon={<Users className="w-6 h-6" />} trend="+2.4%" trendUp={true} />
        <StatCard delay={0.2} title={t("activeEmergenciesCard")} value={activeEmergencies} icon={<AlertTriangle className="w-6 h-6" />} trend="-1" trendUp={true} />
        <StatCard delay={0.3} title={t("securityAlerts")} value={activeAlerts} icon={<ShieldAlert className="w-6 h-6" />} trend="+4" trendUp={false} />
        <StatCard delay={0.4} title={t("avgCrowdDensity")} value="68%" icon={<Activity className="w-6 h-6" />} trend="-5%" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col"
        >
          <h2 className={`text-xl font-display font-bold mb-4 ${isRTL ? "text-right" : ""}`}>{t("liveSectorMap")}</h2>
          <div className="flex-1 min-h-[420px] rounded-xl overflow-hidden">
            <RealMap pilgrims={pilgrims} sectorData={DASHBOARD_SECTORS} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col"
        >
          <h2 className={`text-xl font-display font-bold mb-6 ${isRTL ? "text-right" : ""}`}>{t("crowdDensityTrend")}</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCrowd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="crowd" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCrowd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <h2 className={`text-xl font-display font-bold mt-8 mb-4 ${isRTL ? "text-right" : ""}`}>{t("recentAlerts")}</h2>
          <div className="space-y-3 flex-1 overflow-auto pr-2">
            {(alerts || Array.from({length: 4})).slice(0, 4).map((alert: any, i) => (
              <div key={alert?.id || i} className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors">
                <div className={`flex justify-between items-start mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className="font-semibold text-sm">{alert?.type || 'Unauthorized Entry'}</span>
                  <span className="text-xs text-muted-foreground">{t("justNow")}</span>
                </div>
                <p className={`text-sm text-muted-foreground truncate ${isRTL ? "text-right" : ""}`}>{alert?.message || 'Camera 4A detected unpermitted access.'}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
