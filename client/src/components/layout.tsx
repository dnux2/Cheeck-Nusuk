import { Link, useLocation } from "wouter";
import {
  Activity, Users, ShieldAlert, AlertTriangle,
  Map, Languages, Settings, Bell, Menu, X, Box, ChevronLeft, ChevronRight, MessageSquare, LogOut
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
    { href: "/chat", label: t("chat"), icon: MessageSquare },
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
            className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        variants={sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        className={`
          fixed z-[1000] w-72 h-full flex flex-col bg-card shadow-2xl
          ${isRTL ? "border-l border-border right-0" : "border-r border-border left-0"}
        `}
        style={{ willChange: "transform" }}
      >
        {/* Logo area */}
        <div className="relative py-4 px-4 flex items-center justify-center border-b border-border/50">
          <Link href="/" className="flex flex-row items-center gap-2.5 group" dir="ltr" data-testid="link-home-admin">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#f5e6c8] flex-shrink-0 shadow-sm">
              <img src={logoImg} alt="CheckNusuk" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">CheckNusuk</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"} p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground`}
            data-testid="button-sidebar-close"
          >
            <X className="w-4 h-4" />
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
        <div className="p-3 border-t border-border space-y-1">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors ${isRTL ? "flex-row-reverse" : ""}`}>
            <Settings className="w-5 h-5 opacity-70 flex-shrink-0" />
            <span className="font-medium">{t("settings")}</span>
          </div>
          <a href="/" className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-destructive hover:bg-destructive/10 transition-colors ${isRTL ? "flex-row-reverse" : ""}`}>
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{lang === "ar" ? "تسجيل الخروج" : "Logout"}</span>
          </a>
        </div>
      </motion.aside>

      {/* Main content — shifts right when sidebar is open on desktop */}
      <motion.main
        className="flex-1 flex flex-col h-screen relative min-w-0"
        animate={{ marginInlineStart: !isMobile && sidebarOpen ? "288px" : "0px" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ willChange: "margin" }}
      >
        {/* Header */}
        <header className={`sticky top-0 z-10 h-14 flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-3 gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          {/* Left: hamburger + page title */}
          <div className={`flex items-center gap-2 min-w-0 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
              data-testid="button-sidebar-toggle"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-sm text-foreground hidden sm:block truncate">
              {currentPage}
            </h2>
          </div>

          {/* Center: project name */}
          <Link href="/" className="font-display font-bold text-base tracking-tight text-foreground hover:text-primary transition-colors flex-shrink-0" data-testid="link-home-header">
            CheckNusuk
          </Link>

          {/* Right: lang toggle + bell + avatar */}
          <div className={`flex items-center gap-1.5 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
            {/* Language Toggle */}
            <div className="flex items-center bg-secondary rounded-lg overflow-hidden border border-border">
              <button
                data-testid="button-lang-en"
                onClick={() => setLang("en")}
                className={`px-2 py-1 text-xs font-bold transition-all ${
                  lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
              <button
                data-testid="button-lang-ar"
                onClick={() => setLang("ar")}
                className={`px-2 py-1 text-xs font-bold transition-all ${
                  lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ع
              </button>
            </div>

            {/* Bell */}
            <button className="relative p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse" />
            </button>

            {/* Admin info + avatar */}
            <div className={`hidden sm:flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={isRTL ? "text-right" : "text-right"}>
                <p className="text-xs font-bold text-foreground leading-tight">{t("adminSupervisor")}</p>
                <p className="text-[10px] text-muted-foreground">{t("sector")}</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold shadow-sm flex-shrink-0 text-xs">
              AS
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
