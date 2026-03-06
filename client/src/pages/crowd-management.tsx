import { MockMap } from "@/components/mock-map";
import { AlertCircle, Maximize2, Layers } from "lucide-react";
import { usePilgrims } from "@/hooks/use-pilgrims";
import { useLanguage } from "@/contexts/language-context";

export function CrowdManagementPage() {
  const { data: pilgrims } = usePilgrims();
  const { t, isRTL } = useLanguage();

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-[calc(100vh-5rem)] flex flex-col">
      <div className={`flex justify-between items-center mb-6 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-bold text-foreground">{t("crowdMonitoring")}</h1>
          <p className="text-muted-foreground mt-1">Live density heatmap and predictive routing.</p>
        </div>
        <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <button className={`px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-xl flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <Layers className="w-4 h-4" />
            Layers
          </button>
          <button className="p-2 bg-secondary text-secondary-foreground rounded-xl">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        <div className="flex-1 rounded-2xl overflow-hidden border border-border/50 shadow-lg relative min-h-[400px]">
          <MockMap pilgrims={pilgrims} activePoints={40} />
          
          <div className="absolute top-4 right-4 max-w-sm bg-card/90 backdrop-blur-xl border border-border p-4 rounded-xl shadow-2xl">
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-accent" />
              Congestion Warning
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Sector 4 (Jamarat Bridge) is approaching 85% capacity. Predictive AI suggests redirecting Group A to Sector 5.
            </p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90">
                Execute Redirection
              </button>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto">
          <h3 className="font-display font-bold text-lg">Sector Status</h3>
          {[
            { id: "S1", name: "Mina Tents", load: 45, status: "Normal" },
            { id: "S2", name: "Arafat", load: 20, status: "Empty" },
            { id: "S3", name: "Muzdalifah", load: 15, status: "Empty" },
            { id: "S4", name: "Jamarat", load: 88, status: "Warning" },
            { id: "S5", name: "Grand Mosque", load: 72, status: "Busy" },
          ].map(s => (
            <div key={s.id} className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs font-bold text-muted-foreground mb-1">{s.id}</div>
                  <div className="font-bold">{s.name}</div>
                </div>
                <div className={`text-sm font-bold ${
                  s.load > 80 ? 'text-destructive' : s.load > 60 ? 'text-accent' : 'text-primary'
                }`}>
                  {s.load}%
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    s.load > 80 ? 'bg-destructive' : s.load > 60 ? 'bg-accent' : 'bg-primary'
                  }`} 
                  style={{ width: `${s.load}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
