import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Map, Wallet, MessageSquare, Languages, AlertTriangle, X, Menu, LogOut, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
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
      <div className="py-5 px-4 border-b border-border flex items-center justify-center">
        <Link href="/" className="font-display font-bold text-xl tracking-tight text-foreground hover:text-primary transition-colors" data-testid="link-home-pilgrim">
          CheckNusuk
        </Link>
      </div>

      {/* Pilgrim info card */}
      <div className="mx-4 mt-4 p-3 rounded-2xl bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold flex-shrink-0">أ</div>
          <div>
            <div className="font-bold text-sm">{ar ? "أحمد علي" : "Ahmed Ali"}</div>
            <div className="text-xs text-primary-foreground/70">{ar ? "حملة التوحيد · مكة المكرمة" : "Al-Tawheed · Makkah"}</div>
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
                  ? "bg-primary text-primary-foreground shadow-sm"
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
        {/* Language toggle */}
        <div className="flex items-center bg-secondary rounded-lg overflow-hidden border border-border">
          <button
            onClick={() => setLang("ar")}
            className={`flex-1 py-1.5 text-xs font-bold transition-all ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            ع
          </button>
          <button
            onClick={() => setLang("en")}
            className={`flex-1 py-1.5 text-xs font-bold transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            EN
          </button>
        </div>
        {/* SOS */}
        <Link href="/pilgrim">
          <button
            onClick={() => setMobileOpen(false)}
            className="w-full py-2.5 rounded-2xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            data-testid="btn-sos-sidebar"
          >
            <AlertTriangle className="w-4 h-4" />
            {ar ? "🆘 طوارئ SOS" : "🆘 Emergency SOS"}
          </button>
        </Link>
        {/* Logout */}
        <Link href="/">
          <button
            onClick={() => setMobileOpen(false)}
            className="w-full py-2 rounded-2xl text-destructive hover:bg-destructive/10 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            data-testid="btn-logout-pilgrim"
          >
            <LogOut className="w-4 h-4" />
            {ar ? "تسجيل الخروج" : "Logout"}
          </button>
        </Link>
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
          {/* Start: hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition-colors"
            data-testid="btn-open-pilgrim-menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="hidden lg:block w-10" />

          {/* Center: logo only */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2" data-testid="link-logo-pilgrim">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#f5e6c8] shadow-sm hover:opacity-80 transition-opacity">
              <img src={logoImg} alt="CheckNusuk" className="w-full h-full object-contain" />
            </div>
          </Link>

          {/* End: SOS */}
          <Link href="/pilgrim" className="p-2 rounded-xl hover:bg-destructive/10 transition-colors" data-testid="btn-top-sos">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </Link>
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
