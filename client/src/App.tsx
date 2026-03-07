import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { LanguageProvider } from "@/contexts/language-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

import { LandingPage } from "@/pages/landing";
import { Dashboard } from "@/pages/dashboard";
import { PilgrimsPage } from "@/pages/pilgrims";
import { CrowdManagementPage } from "@/pages/crowd-management";
import { SecurityPage } from "@/pages/security";
import { EmergenciesPage } from "@/pages/emergencies";
import { ServicesPage } from "@/pages/services";
import { TranslatorPage } from "@/pages/translator";
import { ChatPage } from "@/pages/chat";
import { LoginPage } from "@/pages/login";

import { PilgrimHomePage } from "@/pages/pilgrim-home";
import { PilgrimMapPage } from "@/pages/pilgrim-map";
import { PilgrimWalletPage } from "@/pages/pilgrim-wallet";
import { PilgrimChatPage } from "@/pages/pilgrim-chat";
import { PilgrimTranslatorPage } from "@/pages/pilgrim-translator";
import { PilgrimHajjNotesPage } from "@/pages/pilgrim-hajj-notes";

function PilgrimRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user || user.role !== "pilgrim") return <Redirect to="/login?tab=pilgrim" />;
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
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const publicPaths = ["/", "/login"];
  const isPublic = publicPaths.includes(location);

  if (!isPublic && (!user || user.role !== "supervisor")) {
    return <Redirect to="/login?tab=supervisor" />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={LandingPage} />
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
  const path = location.split("?")[0];
  if (path === "/login") return <LoginPage />;
  const isPilgrimRoute = path === "/pilgrim" || path.startsWith("/pilgrim/");
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
