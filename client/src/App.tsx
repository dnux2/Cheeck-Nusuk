import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { LanguageProvider } from "@/contexts/language-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

import { LandingPage } from "@/pages/landing";
import { LoginPage } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { PilgrimsPage } from "@/pages/pilgrims";
import { CrowdManagementPage } from "@/pages/crowd-management";
import { SecurityPage } from "@/pages/security";
import { EmergenciesPage } from "@/pages/emergencies";
import { ServicesPage } from "@/pages/services";
import { TranslatorPage } from "@/pages/translator";
import { ChatPage } from "@/pages/chat";

import { PilgrimHomePage } from "@/pages/pilgrim-home";
import { PilgrimMapPage } from "@/pages/pilgrim-map";
import { PilgrimWalletPage } from "@/pages/pilgrim-wallet";
import { PilgrimChatPage } from "@/pages/pilgrim-chat";
import { PilgrimTranslatorPage } from "@/pages/pilgrim-translator";
import { PilgrimHajjNotesPage } from "@/pages/pilgrim-hajj-notes";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E4D41] via-[#0a3d32] to-[#052a22] flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  );
}

function PilgrimRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!user) {
    window.location.replace("/login?tab=pilgrim");
    return <LoadingScreen />;
  }
  if (user.role !== "pilgrim") {
    window.location.replace("/login?tab=pilgrim");
    return <LoadingScreen />;
  }

  return (
    <Switch>
      <Route path="/pilgrim" component={PilgrimHomePage} />
      <Route path="/pilgrim/map" component={PilgrimMapPage} />
      <Route path="/pilgrim/wallet" component={PilgrimWalletPage} />
      <Route path="/pilgrim/hajj-notes" component={PilgrimHajjNotesPage} />
      <Route path="/pilgrim/chat" component={PilgrimChatPage} />
      <Route path="/pilgrim/translator" component={PilgrimTranslatorPage} />
    </Switch>
  );
}

function AdminRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  const isProtected = location !== "/" && location !== "/login";

  if (isLoading && isProtected) return <LoadingScreen />;
  if (!isLoading && isProtected && (!user || user.role !== "supervisor")) {
    window.location.replace("/login?tab=supervisor");
    return <LoadingScreen />;
  }

  // Landing page and login page render without the admin Layout
  if (location === "/" || location === "/login" || location.startsWith("/login?")) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/pilgrims" component={PilgrimsPage} />
        <Route path="/crowd-management" component={CrowdManagementPage} />
        <Route path="/security" component={SecurityPage} />
        <Route path="/emergencies" component={EmergenciesPage} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/translator" component={TranslatorPage} />
        <Route path="/chat" component={ChatPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  const [location] = useLocation();
  const isPilgrimRoute = location === "/pilgrim" || location.startsWith("/pilgrim/");
  return isPilgrimRoute ? <PilgrimRoutes /> : <AdminRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
