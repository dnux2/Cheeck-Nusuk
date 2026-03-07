import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Map, Wallet, MessageSquare, Languages, AlertTriangle, X, Menu, LogOut, BookOpen, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import logoImg from "@assets/WhatsApp_Image_2026-03-07_at_12.53.20_AM_1772834050515.jpeg";

interface NavItem {
  href: string;
  iconAr: string;
  iconEn: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/pilgrim",             iconAr: "الرئيسية",   iconEn: "Home",        icon: <Home className="w-5 h-5" /> },
  { href: "/pilgrim/map",         iconAr: "خريطتي",     iconEn: "My Map",      icon: <Map className="w-5 h-5" /> },
  { href: "/pilgrim/wallet",      iconAr: "المحفظة",    iconEn: "Wallet",      icon: <Wallet className="w-5 h-5" /> },
  { href: "/pilgrim/hajj-notes",  iconAr: "يومياتي",    iconEn: "My Journal",  icon: <BookOpen className="w-5 h-5" /> },
  { href: "/pilgrim/chat",        iconAr: "الرسائل",    iconEn: "Messages",    icon: <MessageSquare className="w-5 h-5" /> },
  { href: "/pilgrim/translator",  iconAr: "المترجم",    iconEn: "Translator",  icon: <Languages className="w-5 h-5" /> },
];

export function PilgrimLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const ar = lang === "ar";

  const isActive = (href: string) => {
    if (href === "/pilgrim") return location === "/pilgrim";
    return location.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="py-4 px-4 border-b border-border flex items-center justify-center">
        <Link href="/" className="flex flex-row items-center gap-2.5 group" dir="ltr" data-testid="link-home-pilgrim">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#f5e6c8] flex-shrink-0 shadow-sm">
            <img src={logoImg} alt="CheckNusuk" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">CheckNusuk</span>
        </Link>
      </div>

      {/* Pilgrim info card */}
      <div className="mx-4 mt-4 p-3 rounded-2xl bg-gradient-to-b from-[#d4ede6] to-white dark:from-[#0e2e28] dark:to-card border border-[#a8d4cb] dark:border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-sm" style={{ background: "#d4a853", color: "#fff" }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "؟"}
          </div>
          <div>
            <div className="font-bold text-sm text-foreground">{user?.name || (ar ? "الحاج" : "Pilgrim")}</div>
            <div className="text-muted-foreground text-[10px] mt-0.5">{ar ? "مكة المكرمة" : "Makkah Al-Mukarramah"}</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 font-medium text-sm
                ${active
                  ? "bg-[#f5e6c8] text-[#7a5020] border border-[#e8d4a0] shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-primary"
                }
              `}
              data-testid={`nav-pilgrim-${item.href.split("/").pop() || "home"}`}
            >
              <span>{item.icon}</span>
              <span>{ar ? item.iconAr : item.iconEn}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-4 pb-6 space-y-3 border-t border-border pt-4">
        {/* SOS */}
        <Link href="/pilgrim">
          <button
            onClick={() => setMobileOpen(false)}
            className="w-full py-2.5 rounded-2xl text-white font-bold text-sm flex flex-row items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #f07070 0%, #c0392b 100%)" }}
            dir="ltr"
            data-testid="btn-sos-sidebar"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {ar ? "طوارئ SOS" : "Emergency SOS"}
          </button>
        </Link>

        {/* Logout */}
        <div className="mt-1">
          <button
            onClick={() => { setMobileOpen(false); logout(); }}
            className="w-full py-2 rounded-2xl text-destructive hover:bg-destructive/10 font-semibold text-sm flex flex-row items-center justify-center gap-2 transition-colors"
            data-testid="btn-logout-pilgrim"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {ar ? "تسجيل الخروج" : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background" dir={isRTL ? "rtl" : "ltr"}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-border shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-[998] lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: isRTL ? 240 : -240 }} animate={{ x: 0 }} exit={{ x: isRTL ? 240 : -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed top-0 ${isRTL ? "right-0" : "left-0"} h-full w-60 z-[999] shadow-xl lg:hidden`}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} p-1 rounded-full hover:bg-secondary`}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar — mobile & desktop (desktop only when no sidebar) */}
        <header className={`h-14 flex-shrink-0 flex items-center justify-between px-4 bg-card/90 backdrop-blur-md border-b border-border sticky top-0 z-10 shadow-sm ${isRTL ? "flex-row-reverse" : ""}`}>
          {/* Start: hamburger + lang toggle */}
          <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              data-testid="btn-open-pilgrim-menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center bg-secondary rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => setLang("ar")}
                className={`px-2 py-1 text-xs font-bold transition-all ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="pilgrim-lang-ar"
              >ع</button>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-1 text-xs font-bold transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                data-testid="pilgrim-lang-en"
              >EN</button>
            </div>
          </div>

          {/* Center: project name */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 font-display font-bold text-lg tracking-tight text-foreground hover:text-primary transition-colors" data-testid="link-home-pilgrim-header">
            CheckNusuk
          </Link>

          {/* End: bell + SOS */}
          <div className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button className="relative p-1.5 rounded-lg hover:bg-secondary transition-colors" data-testid="btn-pilgrim-bell">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </button>
            <Link href="/pilgrim" className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" data-testid="btn-top-sos">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex border-t border-border bg-card sticky bottom-0 z-10 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors text-[9px] font-bold
                  ${active ? "text-primary" : "text-muted-foreground"}`}
                data-testid={`bottom-nav-${item.href.split("/").pop() || "home"}`}
              >
                <span className={active ? "text-primary" : "text-muted-foreground/60"}>{item.icon}</span>
                <span>{ar ? item.iconAr : item.iconEn}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
