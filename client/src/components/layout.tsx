import { Link, useLocation } from "wouter";
import {
  Home, Activity, Users, ShieldAlert, AlertTriangle,
  Map, Languages, Settings, Bell, Menu, X, Box
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, lang, setLang, isRTL } = useLanguage();

  const NAV_ITEMS = [
    { href: "/dashboard", label: t("dashboard"), icon: Activity },
    { href: "/pilgrims", label: t("pilgrims"), icon: Users },
    { href: "/crowd-management", label: t("crowdMonitoring"), icon: Map },
    { href: "/security", label: t("securityAI"), icon: ShieldAlert },
    { href: "/emergencies", label: t("emergency"), icon: AlertTriangle },
    { href: "/services", label: t("services"), icon: Box },
    { href: "/translator", label: t("translator"), icon: Languages },
  ];

  if (location === "/") return <>{children}</>;

  const currentPage = NAV_ITEMS.find(i => i.href === location)?.label ?? t("dashboard");

  return (
    <div className={`flex h-screen w-full bg-background overflow-hidden ${isRTL ? "flex-row-reverse" : ""}`}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : isRTL ? 300 : -300 }}
        className={`
          fixed md:relative z-50 w-72 h-full flex flex-col
          bg-card shadow-2xl md:shadow-none
          ${isRTL ? "border-l border-border right-0" : "border-r border-border left-0"}
          transition-transform duration-300 ease-in-out md:translate-x-0
        `}
      >
        <div className={`p-6 flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <Link href="/" className={`flex items-center gap-3 group ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-primary/25 transition-all flex-shrink-0">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <h1 className="font-bold text-lg leading-none tracking-tight">Smart Nusuk</h1>
              <p className="text-xs text-muted-foreground font-medium">{t("controlCenter")}</p>
            </div>
          </Link>
          <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <div
                  data-testid={`nav-item-${item.href.replace("/", "")}`}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer
                    ${isRTL ? "flex-row-reverse" : ""}
                    ${isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground"
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

        <div className={`p-4 border-t border-border ${isRTL ? "text-right" : ""}`}>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
            <Settings className="w-5 h-5 opacity-70 flex-shrink-0" />
            <span className="font-medium">{t("settings")}</span>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        <header className="h-20 flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              className="md:hidden p-2 rounded-lg text-foreground"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-sidebar-toggle"
            >
              <Menu className="w-6 h-6" />
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
                  lang === "en"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                EN
              </button>
              <button
                data-testid="button-lang-ar"
                onClick={() => setLang("ar")}
                className={`px-3 py-1.5 text-sm font-bold transition-all ${
                  lang === "ar"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                العربية
              </button>
            </div>

            <button className="relative p-2 rounded-full transition-colors">
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
      </main>
    </div>
  );
}
