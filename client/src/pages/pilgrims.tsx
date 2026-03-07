import { usePilgrims, useCreatePilgrim, useDeletePilgrim, useUpdatePilgrimPermitStatus } from "@/hooks/use-pilgrims";
import { useState, useEffect, useMemo } from "react";
import { Search, Plus, MapPin, Eye, ShieldAlert, Navigation, ChevronDown, ChevronRight, Users, Trash2, Clock, AlertCircle, ArrowUpDown, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
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
  const deletePilgrim = useDeletePilgrim();
  const updatePermitStatus = useUpdatePilgrimPermitStatus();
  const { t, isRTL, lang } = useLanguage();
  const ar = lang === "ar";
  const [, navigate] = useLocation();
  const searchStr = useSearch();

  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [genderFilter, setGenderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Auto-open pilgrim details when navigated from map with ?pilgrimId=X
  useEffect(() => {
    if (!pilgrims || !searchStr) return;
    const params = new URLSearchParams(searchStr);
    const idParam = params.get("pilgrimId");
    if (!idParam) return;
    const found = pilgrims.find(p => p.id === Number(idParam));
    if (found) {
      setSelectedPilgrim(found);
      const group = found.nationality || "—";
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
      (statusFilter === "expired" && p.permitStatus === "Expired");
    const matchesGender =
      genderFilter === "all" || p.gender === genderFilter;
    return matchesSearch && matchesStatus && matchesGender;
  }), [pilgrims, search, statusFilter, genderFilter]);

  // Build groups from filtered pilgrims — grouped by nationality within the single campaign
  const groups = useMemo(() => {
    if (!filtered) return [];
    const map = new Map<string, Pilgrim[]>();
    for (const p of filtered) {
      const key = p.nationality || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    const sortMembers = (members: Pilgrim[]) => [...members].sort((a, b) => {
      // Emergency status always first
      const emg = (b.emergencyStatus ? 1 : 0) - (a.emergencyStatus ? 1 : 0);
      if (emg !== 0) return emg;
      if (sortBy === "age-asc") {
        if (a.age == null && b.age == null) return 0;
        if (a.age == null) return 1;
        if (b.age == null) return -1;
        return a.age - b.age;
      }
      if (sortBy === "age-desc") {
        if (a.age == null && b.age == null) return 0;
        if (a.age == null) return 1;
        if (b.age == null) return -1;
        return b.age - a.age;
      }
      if (sortBy === "gender") {
        const ga = a.gender ?? "zzz";
        const gb = b.gender ?? "zzz";
        return ga.localeCompare(gb) || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
    return Array.from(map.entries())
      .map(([name, members]) => ({
        name,
        members: sortMembers(members),
        emergencyCount: members.filter(p => p.emergencyStatus).length,
      }))
      .sort((a, b) => b.emergencyCount - a.emergencyCount || a.name.localeCompare(b.name));
  }, [filtered, sortBy]);

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
    const genders = ["Male", "Female"];
    const g = genders[Math.floor(Math.random() * 2)];
    createPilgrim.mutate(
      {
        name: g === "Male" ? "Ahmed Al-Farsi" : "Fatimah Al-Nouri",
        nationality: "Oman",
        passportNumber: "OM" + Math.floor(Math.random() * 1000000),
        phone: "+968 9123 4567",
        campaignGroup: "Al-Noor Group",
        permitStatus: "Valid",
        locationLat: 21.4225,
        locationLng: 39.8262,
        emergencyStatus: false,
        age: 30 + Math.floor(Math.random() * 40),
        gender: g,
      },
      { onSuccess: () => setModalOpen(false) }
    );
  };

  const permitBadge = (status: string) => {
    if (status === "Valid") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (status === "Expired") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    if (status === "UnderReview") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
  };

  const permitLabel = (status: string) => {
    if (status === "Valid") return t("valid");
    if (status === "Expired") return t("expired");
    if (status === "UnderReview") return ar ? "جاري المراجعة" : "Under Review";
    return t("none");
  };

  const totalFiltered = filtered?.length ?? 0;
  const totalEmergency = filtered?.filter(p => p.emergencyStatus).length ?? 0;
  const totalMale = filtered?.filter(p => p.gender === "Male").length ?? 0;
  const totalFemale = filtered?.filter(p => p.gender === "Female").length ?? 0;
  const avgAge = useMemo(() => {
    const withAge = filtered?.filter(p => p.age != null) ?? [];
    if (!withAge.length) return null;
    return Math.round(withAge.reduce((s, p) => s + p.age!, 0) / withAge.length);
  }, [filtered]);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <PageHeader
        icon={<Users className="w-6 h-6 text-primary" />}
        title={t("pilgrimRegistry")}
        subtitle={t("manageAndTrack")}
        badge={
          <button
            data-testid="button-register-pilgrim"
            onClick={() => setModalOpen(true)}
            className={`px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 text-sm ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <Plus className="w-4 h-4" />
            {t("registerPilgrim")}
          </button>
        }
      />

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
          <div className={`flex items-center gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
            {/* Status filter */}
            <select
              data-testid="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary text-sm ${isRTL ? "text-right" : ""}`}
            >
              <option value="all">{t("allStatus")}</option>
              <option value="valid">{t("validPermit")}</option>
              <option value="expired">{t("expiredPermit")}</option>
            </select>

            {/* Gender filter */}
            <select
              data-testid="select-gender-filter"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary text-sm ${isRTL ? "text-right" : ""}`}
            >
              <option value="all">{ar ? "جميع الجنسين" : "All Genders"}</option>
              <option value="Male">{ar ? "ذكر" : "Male"}</option>
              <option value="Female">{ar ? "أنثى" : "Female"}</option>
            </select>

            {/* Sort */}
            <select
              data-testid="select-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary text-sm ${isRTL ? "text-right" : ""}`}
            >
              <option value="name">{ar ? "فرز: الاسم" : "Sort: Name"}</option>
              <option value="age-asc">{ar ? "فرز: العمر ↑" : "Sort: Age ↑"}</option>
              <option value="age-desc">{ar ? "فرز: العمر ↓" : "Sort: Age ↓"}</option>
              <option value="gender">{ar ? "فرز: الجنس" : "Sort: Gender"}</option>
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
        <div className={`px-4 py-2.5 bg-muted/30 border-b border-border flex items-center gap-4 flex-wrap text-sm text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
          <span className={`flex items-center gap-1.5 font-medium ${isRTL ? "flex-row-reverse" : ""}`}>
            <Users className="w-4 h-4" />
            {totalFiltered} {ar ? "حاج" : "pilgrims"} · {groups.length} {ar ? "جنسية" : "nationalities"}
          </span>
          {totalMale > 0 && (
            <span className={`flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
              <UserCheck className="w-3.5 h-3.5" />
              {totalMale} {ar ? "ذكر" : "male"}
            </span>
          )}
          {totalFemale > 0 && (
            <span className={`flex items-center gap-1 text-pink-600 dark:text-pink-400 font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
              <UserCheck className="w-3.5 h-3.5" />
              {totalFemale} {ar ? "أنثى" : "female"}
            </span>
          )}
          {avgAge !== null && (
            <span className={`flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold ${isRTL ? "flex-row-reverse" : ""}`}>
              <ArrowUpDown className="w-3.5 h-3.5" />
              {ar ? `متوسط العمر: ${avgAge}` : `Avg age: ${avgAge}`}
            </span>
          )}
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
                              <th className="px-4 py-2.5 hidden md:table-cell">{ar ? "العمر" : "Age"}</th>
                              <th className="px-4 py-2.5 hidden md:table-cell">{ar ? "الجنس" : "Gender"}</th>
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
                                <td className="px-4 py-3.5 hidden md:table-cell text-muted-foreground text-sm">
                                  {p.age != null ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                      {p.age} {ar ? "سنة" : "yr"}
                                    </span>
                                  ) : "—"}
                                </td>
                                <td className="px-4 py-3.5 hidden md:table-cell">
                                  {p.gender === "Male" ? (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold">
                                      {ar ? "ذكر" : "Male"}
                                    </span>
                                  ) : p.gender === "Female" ? (
                                    <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-xs font-bold">
                                      {ar ? "أنثى" : "Female"}
                                    </span>
                                  ) : <span className="text-muted-foreground text-sm">—</span>}
                                </td>
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
                                  <div className={`flex items-center gap-1.5 flex-wrap ${isRTL ? "flex-row-reverse justify-start" : "justify-end"}`}>
                                    <button
                                      data-testid={`button-track-pilgrim-${p.id}`}
                                      onClick={(e) => { e.stopPropagation(); navigate(`/crowd-management?highlight=${p.id}`); }}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 font-semibold text-xs transition-colors border border-border ${isRTL ? "flex-row-reverse" : ""}`}
                                    >
                                      <Navigation className="w-3 h-3" />
                                      {ar ? "تتبع" : "Track"}
                                    </button>
                                    <button
                                      data-testid={`button-view-pilgrim-${p.id}`}
                                      onClick={(e) => { e.stopPropagation(); setSelectedPilgrim(p); }}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-xs transition-colors ${isRTL ? "flex-row-reverse" : ""}`}
                                    >
                                      <Eye className="w-3 h-3" />
                                      {t("viewPilgrim")}
                                    </button>
                                    {p.permitStatus !== "UnderReview" && (
                                      <button
                                        data-testid={`button-review-pilgrim-${p.id}`}
                                        onClick={(e) => { e.stopPropagation(); updatePermitStatus.mutate({ id: p.id, status: "UnderReview" }); }}
                                        disabled={updatePermitStatus.isPending}
                                        title={ar ? "وضع قيد المراجعة" : "Mark as Under Review"}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 font-semibold text-xs transition-colors disabled:opacity-50 ${isRTL ? "flex-row-reverse" : ""}`}
                                      >
                                        <Clock className="w-3 h-3" />
                                        {ar ? "مراجعة" : "Review"}
                                      </button>
                                    )}
                                    <button
                                      data-testid={`button-delete-pilgrim-${p.id}`}
                                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                                      title={ar ? "حذف الحاج" : "Delete Pilgrim"}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 font-semibold text-xs transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      {ar ? "حذف" : "Delete"}
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

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {confirmDeleteId !== null && (
          <motion.div
            key="delete-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm ${isRTL ? "text-right" : ""}`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-bold text-base">{ar ? "حذف الحاج" : "Delete Pilgrim"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ar ? "هذا الإجراء لا يمكن التراجع عنه" : "This action cannot be undone"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {ar
                  ? "هل أنت متأكد من حذف هذا الحاج من السجل نهائياً؟"
                  : "Are you sure you want to permanently delete this pilgrim from the registry?"}
              </p>
              <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button
                  data-testid="button-cancel-delete"
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors text-sm"
                >
                  {ar ? "إلغاء" : "Cancel"}
                </button>
                <button
                  data-testid="button-confirm-delete"
                  onClick={() => {
                    deletePilgrim.mutate(confirmDeleteId!, {
                      onSuccess: () => setConfirmDeleteId(null),
                    });
                  }}
                  disabled={deletePilgrim.isPending}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-60 text-sm"
                >
                  {deletePilgrim.isPending
                    ? (ar ? "جاري الحذف..." : "Deleting...")
                    : (ar ? "تأكيد الحذف" : "Confirm Delete")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
