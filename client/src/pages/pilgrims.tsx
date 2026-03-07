import { usePilgrims, useCreatePilgrim } from "@/hooks/use-pilgrims";
import { useState } from "react";
import { Search, Plus, MapPin, Eye, ShieldAlert, Navigation } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { PilgrimPopup } from "@/components/pilgrim-popup";
import { type Pilgrim } from "@shared/schema";
import { useLocation } from "wouter";

export function PilgrimsPage() {
  const { data: pilgrims, isLoading } = usePilgrims();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const createPilgrim = useCreatePilgrim();
  const { t, isRTL, lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);

  const filtered = pilgrims?.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.passportNumber.toLowerCase().includes(q) ||
      (p.campaignGroup ?? "").toLowerCase().includes(q) ||
      p.nationality.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "valid" && p.permitStatus === "Valid") ||
      (statusFilter === "expired" && p.permitStatus === "Expired") ||
      (statusFilter === "none" && p.permitStatus === "None");
    return matchesSearch && matchesStatus;
  });

  const handleCreateMock = () => {
    createPilgrim.mutate(
      {
        name: "Ahmed Al-Farsi",
        nationality: "Oman",
        passportNumber: "OM" + Math.floor(Math.random() * 1000000),
        phone: "+968 9123 4567",
        campaignGroup: "Al-Noor Group",
        permitStatus: "Valid",
        locationLat: 21.4225,
        locationLng: 39.8262,
        emergencyStatus: false,
      },
      { onSuccess: () => setModalOpen(false) }
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
        <div className={isRTL ? "text-right" : ""}>
          <h1 className="text-3xl font-bold text-foreground">{t("pilgrimRegistry")}</h1>
          <p className="text-muted-foreground mt-1">{t("manageAndTrack")}</p>
        </div>
        <button
          data-testid="button-register-pilgrim"
          onClick={() => setModalOpen(true)}
          className={`px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <Plus className="w-5 h-5" />
          {t("registerPilgrim")}
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className={`p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/50 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
          <div className="relative w-full max-w-md">
            <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none`} />
            <input
              type="text"
              data-testid="input-search-pilgrims"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full py-2.5 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all ${isRTL ? "pr-10 pl-4 text-right" : "pl-10 pr-4"}`}
              dir={isRTL ? "rtl" : "ltr"}
            />
          </div>
          <select
            data-testid="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2.5 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary w-full sm:w-auto ${isRTL ? "text-right" : ""}`}
          >
            <option value="all">{t("allStatus")}</option>
            <option value="valid">{t("validPermit")}</option>
            <option value="expired">{t("expiredPermit")}</option>
            <option value="none">{t("none")}</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
                <th className="p-4">{t("name")}</th>
                <th className="p-4 hidden md:table-cell">{t("nationality")}</th>
                <th className="p-4 hidden sm:table-cell">{t("passport")}</th>
                <th className="p-4 hidden md:table-cell">{t("campaign")}</th>
                <th className="p-4">{t("permitStatus")}</th>
                <th className="p-4 hidden lg:table-cell">{t("location")}</th>
                <th className={`p-4 ${isRTL ? "text-left" : "text-right"}`}>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {t("loading")}
                  </td>
                </tr>
              ) : filtered?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {t("noPilgrimsFound")}
                  </td>
                </tr>
              ) : (
                filtered?.map((p, i) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={p.id}
                    data-testid={`row-pilgrim-${p.id}`}
                    className="border-b border-border last:border-0 transition-colors cursor-pointer"
                    onClick={() => setSelectedPilgrim(p)}
                  >
                    <td className="p-4 font-semibold text-foreground">
                      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </span>
                        </div>
                        <span>{p.name}</span>
                        {p.emergencyStatus && (
                          <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">{p.nationality}</td>
                    <td className="p-4 hidden sm:table-cell text-muted-foreground font-mono text-sm">{p.passportNumber}</td>
                    <td className="p-4 hidden md:table-cell text-muted-foreground">{p.campaignGroup ?? "—"}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          p.permitStatus === "Valid"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : p.permitStatus === "Expired"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                        }`}
                      >
                        {p.permitStatus === "Valid" ? t("valid") : p.permitStatus === "Expired" ? t("expired") : t("none")}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {p.locationLat ? (
                        <div className={`flex items-center gap-1.5 text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="font-mono text-xs">
                            {p.locationLat?.toFixed(4)}, {p.locationLng?.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t("unknown")}</span>
                      )}
                    </td>
                    <td className={`p-4 ${isRTL ? "text-left" : "text-right"}`}>
                      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse justify-start" : "justify-end"}`}>
                        <button
                          data-testid={`button-track-pilgrim-${p.id}`}
                          onClick={(e) => { e.stopPropagation(); navigate(`/crowd-management?highlight=${p.id}`); }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 font-semibold text-sm transition-colors border border-border ${isRTL ? "flex-row-reverse" : ""}`}
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          {ar ? "تتبع" : "Track"}
                        </button>
                        <button
                          data-testid={`button-view-pilgrim-${p.id}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedPilgrim(p); }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-sm transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
                        >
                          <Eye className="w-4 h-4" />
                          {t("viewPilgrim")}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pilgrim Profile Popup */}
      {selectedPilgrim && (
        <PilgrimPopup
          pilgrim={selectedPilgrim}
          onClose={() => setSelectedPilgrim(null)}
        />
      )}

      {/* Register Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border p-6 ${isRTL ? "text-right" : ""}`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <h2 className="text-2xl font-bold mb-4">{t("registerPilgrim")}</h2>
            <p className="text-muted-foreground mb-6">{t("manageAndTrack")}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">{t("name")}</label>
                <input type="text" className="w-full p-3 rounded-xl bg-background border border-border" placeholder="e.g. Ahmed Al-Farsi" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">{t("passport")}</label>
                  <input type="text" className="w-full p-3 rounded-xl bg-background border border-border" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t("nationality")}</label>
                  <input type="text" className="w-full p-3 rounded-xl bg-background border border-border" />
                </div>
              </div>
            </div>
            <div className={`mt-8 flex gap-3 ${isRTL ? "flex-row-reverse justify-end" : "justify-end"}`}>
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-muted-foreground"
              >
                {t("close")}
              </button>
              <button
                onClick={handleCreateMock}
                disabled={createPilgrim.isPending}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold"
              >
                {createPilgrim.isPending ? t("loading") : t("registerPilgrim")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
