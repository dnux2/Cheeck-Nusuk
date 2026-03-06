import { Link, useLocation } from "wouter";
import {
  Activity, Users, ShieldAlert, AlertTriangle,
  Map, Languages, Settings, Bell, Menu, X, Box, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";
import logoImg from "@assets/WhatsApp_Image_2026-03-07_at_12.53.20_AM_1772834050515.jpeg";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t, lang, setLang, isRTL } = useLanguage();

  const isDesktop = () => typeof window !== "undefined" && window.innerWidth >= 768;
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop());
  const [isMobile, setIsMobile] = useState(!isDesktop());

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const NAV_ITEMS = [
    { href: "/dashboard", label: t("dashboard"), icon: Activity },
    { href: "/pilgrims", label: t("pilgrims"), icon: Users },
    { href: "/crowd-management", label: t("crowdMonitoring"), icon: Map },
    { href: "/security", label: t("securityAI"), icon: ShieldAlert },
    { href: "/emergencies", label: t("emergency"), icon: AlertTriangle },
    { href: "/services", label: t("services"), icon: Box },
    { href: "/translator", label: t("translator"), icon: Languages },
  ];

  if (location === "/" || location === "/pilgrim") return <>{children}</>;

  const currentPage = NAV_ITEMS.find(i => i.href === location)?.label ?? t("dashboard");

  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: isRTL ? 300 : -300, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  const CollapseIcon = isRTL
    ? (sidebarOpen ? ChevronRight : ChevronLeft)
    : (sidebarOpen ? ChevronLeft : ChevronRight);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        variants={sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        className={`
          fixed z-50 w-72 h-full flex flex-col bg-card shadow-2xl
          ${isRTL ? "border-l border-border right-0" : "border-r border-border left-0"}
        `}
        style={{ willChange: "transform" }}
      >
        {/* Logo area */}
        <div className={`p-5 flex items-center justify-between border-b border-border/50 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Link href="/" className={`flex items-center gap-3 group ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg flex-shrink-0 bg-[#f5e6c8]">
              <img src={logoImg} alt="CheckNusuk Logo" className="w-full h-full object-contain" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <h1 className="font-bold text-lg leading-none tracking-tight">CheckNusuk</h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">{t("controlCenter")}</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            data-testid="button-sidebar-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => isMobile && setSidebarOpen(false)}>
                <div
                  data-testid={`nav-item-${item.href.replace("/", "")}`}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                    ${isRTL ? "flex-row-reverse" : ""}
                    ${isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "opacity-100" : "opacity-70"}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className={`p-3 border-t border-border ${isRTL ? "text-right" : ""}`}>
          <Link href="/pilgrim">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ${isRTL ? "flex-row-reverse" : ""}`}>
              <Users className="w-5 h-5 opacity-70 flex-shrink-0" />
              <span className="font-medium">{lang === "ar" ? "بوابة الحاج" : "Pilgrim Portal"}</span>
            </div>
          </Link>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ${isRTL ? "flex-row-reverse" : ""}`}>
            <Settings className="w-5 h-5 opacity-70 flex-shrink-0" />
            <span className="font-medium">{t("settings")}</span>
          </div>
        </div>
      </motion.aside>

      {/* Main content — shifts right when sidebar is open on desktop */}
      <motion.main
        className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0"
        animate={{ marginInlineStart: !isMobile && sidebarOpen ? "288px" : "0px" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ willChange: "margin" }}
      >
        {/* Header */}
        <header className={`h-20 flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 z-10 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            {/* Sidebar toggle — visible on all screen sizes */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-foreground border border-border"
              data-testid="button-sidebar-toggle"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-xl text-foreground hidden sm:block">
              {currentPage}
            </h2>
          </div>

          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            {/* Language Toggle */}
            <div className="flex items-center bg-secondary rounded-xl overflow-hidden border border-border">
              <button
                data-testid="button-lang-en"
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 text-sm font-bold transition-all ${
                  lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
              <button
                data-testid="button-lang-ar"
                onClick={() => setLang("ar")}
                className={`px-3 py-1.5 text-sm font-bold transition-all ${
                  lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                العربية
              </button>
            </div>

            <button className="relative p-2 rounded-full hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive animate-pulse" />
            </button>

            <div className="h-8 w-px bg-border mx-1" />

            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`hidden sm:block ${isRTL ? "text-left" : "text-right"}`}>
                <p className="text-sm font-bold text-foreground">{t("adminSupervisor")}</p>
                <p className="text-xs text-muted-foreground">{t("sector")}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold shadow-sm flex-shrink-0">
                AS
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-background/50">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
