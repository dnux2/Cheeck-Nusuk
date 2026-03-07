import { usePilgrims, useCreatePilgrim } from "@/hooks/use-pilgrims";
import { useState, useEffect, useMemo } from "react";
import { Search, Plus, MapPin, Eye, ShieldAlert, Navigation, ChevronDown, ChevronRight, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import { PilgrimPopup } from "@/components/pilgrim-popup";
import { type Pilgrim } from "@shared/schema";
import { useLocation, useSearch } from "wouter";

export function PilgrimsPage() {
  const { data: pilgrims, isLoading } = usePilgrims();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const createPilgrim = useCreatePilgrim();
  const { t, isRTL, lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const searchStr = useSearch();

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Auto-open pilgrim details when navigated from map with ?pilgrimId=X
  useEffect(() => {
    if (!pilgrims || !searchStr) return;
    const params = new URLSearchParams(searchStr);
    const idParam = params.get("pilgrimId");
    if (!idParam) return;
    const found = pilgrims.find(p => p.id === Number(idParam));
    if (found) {
      setSelectedPilgrim(found);
      const group = found.campaignGroup ?? "—";
      setExpandedGroups(prev => new Set([...prev, group]));
    }
  }, [pilgrims, searchStr]);

  const filtered = useMemo(() => pilgrims?.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.passportNumber.toLowerCase().includes(q) ||
      (p.campaignGroup ?? "").toLowerCase().includes(q) ||
      p.nationality.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "valid" && p.permitStatus === "Valid") ||
      (statusFilter === "expired" && p.permitStatus === "Expired") ||
      (statusFilter === "none" && p.permitStatus === "Pending");
    return matchesSearch && matchesStatus;
  }), [pilgrims, search, statusFilter]);

  // Build groups from filtered pilgrims
  const groups = useMemo(() => {
    if (!filtered) return [];
    const map = new Map<string, Pilgrim[]>();
    for (const p of filtered) {
      const key = p.campaignGroup ?? "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries())
      .map(([name, members]) => ({
        name,
        members: [...members].sort((a, b) => (b.emergencyStatus ? 1 : 0) - (a.emergencyStatus ? 1 : 0) || a.name.localeCompare(b.name)),
        emergencyCount: members.filter(p => p.emergencyStatus).length,
      }))
      .sort((a, b) => b.emergencyCount - a.emergencyCount || a.name.localeCompare(b.name));
  }, [filtered]);

  // Auto-expand groups that have matches when searching
  useEffect(() => {
    if (search || statusFilter !== "all") {
      setExpandedGroups(new Set(groups.map(g => g.name)));
    }
  }, [search, statusFilter, groups]);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(groups.map(g => g.name)));
  const collapseAll = () => setExpandedGroups(new Set());

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

  const permitBadge = (status: string) => {
    if (status === "Valid") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (status === "Expired") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
  };

  const permitLabel = (status: string) =>
    status === "Valid" ? t("valid") : status === "Expired" ? t("expired") : t("none");

  const totalFiltered = filtered?.length ?? 0;
  const totalEmergency = filtered?.filter(p => p.emergencyStatus).length ?? 0;

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
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
          <div className={`flex items-center gap-3 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
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
            <button
              data-testid="button-expand-all-groups"
              onClick={expandAll}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors text-muted-foreground"
            >
              {ar ? "فتح الكل" : "Expand All"}
            </button>
            <button
              data-testid="button-collapse-all-groups"
              onClick={collapseAll}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors text-muted-foreground"
            >
              {ar ? "طي الكل" : "Collapse All"}
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className={`px-4 py-2.5 bg-muted/30 border-b border-border flex items-center gap-4 text-sm text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
          <span className={`flex items-center gap-1.5 font-medium ${isRTL ? "flex-row-reverse" : ""}`}>
            <Users className="w-4 h-4" />
            {totalFiltered} {ar ? "حاج" : "pilgrims"} · {groups.length} {ar ? "حملة" : "groups"}
          </span>
          {totalEmergency > 0 && (
            <span className={`flex items-center gap-1.5 text-destructive font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
              <ShieldAlert className="w-4 h-4" />
              {totalEmergency} {ar ? "حالة طوارئ" : "emergencies"}
            </span>
          )}
        </div>

        {/* Grouped list */}
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground">{t("loading")}</div>
          ) : groups.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">{t("noPilgrimsFound")}</div>
          ) : (
            groups.map((group) => {
              const isOpen = expandedGroups.has(group.name);
              return (
                <div key={group.name} data-testid={`group-${group.name}`}>
                  {/* Group header row */}
                  <button
                    data-testid={`button-toggle-group-${group.name}`}
                    onClick={() => toggleGroup(group.name)}
                    className={`w-full px-5 py-3.5 flex items-center gap-3 hover:bg-muted/50 transition-colors ${isRTL ? "flex-row-reverse text-right" : "text-left"}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {isOpen
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />}
                    </div>
                    <div className={`flex-1 flex items-center gap-3 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <span className="font-bold text-foreground truncate">{group.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                        {group.members.length} {ar ? "حاج" : "pilgrims"}
                      </span>
                      {group.emergencyCount > 0 && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-bold flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <ShieldAlert className="w-3 h-3" />
                          {group.emergencyCount}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Pilgrim rows (collapsible) */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <table className={`w-full border-collapse ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>
                          <thead>
                            <tr className="bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                              <th className={`${isRTL ? "pr-14 pl-4" : "pl-14 pr-4"} py-2.5`}>{t("name")}</th>
                              <th className="px-4 py-2.5 hidden md:table-cell">{t("nationality")}</th>
                              <th className="px-4 py-2.5 hidden sm:table-cell">{t("passport")}</th>
                              <th className="px-4 py-2.5">{t("permitStatus")}</th>
                              <th className="px-4 py-2.5 hidden lg:table-cell">{t("location")}</th>
                              <th className={`px-4 py-2.5 ${isRTL ? "text-left" : "text-right"}`}>{t("actions")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.members.map((p, i) => (
                              <motion.tr
                                key={p.id}
                                initial={{ opacity: 0, x: isRTL ? 8 : -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                data-testid={`row-pilgrim-${p.id}`}
                                className={`border-t border-border/60 last:border-b-0 transition-colors cursor-pointer hover:bg-muted/30 ${p.emergencyStatus ? "bg-destructive/3" : ""}`}
                                onClick={() => setSelectedPilgrim(p)}
                              >
                                <td className={`py-3.5 font-semibold text-foreground ${isRTL ? "pr-14 pl-4" : "pl-14 pr-4"}`}>
                                  <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${p.emergencyStatus ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"}`}>
                                      {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                                    </div>
                                    <span>{p.name}</span>
                                    {p.emergencyStatus && <ShieldAlert className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 hidden md:table-cell text-muted-foreground text-sm">{p.nationality}</td>
                                <td className="px-4 py-3.5 hidden sm:table-cell text-muted-foreground font-mono text-xs">{p.passportNumber}</td>
                                <td className="px-4 py-3.5">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${permitBadge(p.permitStatus)}`}>
                                    {permitLabel(p.permitStatus)}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 hidden lg:table-cell">
                                  {p.locationLat ? (
                                    <div className={`flex items-center gap-1.5 text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
                                      <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                      <span className="font-mono text-xs">{p.locationLat?.toFixed(4)}, {p.locationLng?.toFixed(4)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                  )}
                                </td>
                                <td className={`px-4 py-3.5 ${isRTL ? "text-left" : "text-right"}`}>
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
                            ))}
                          </tbody>
                        </table>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
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
