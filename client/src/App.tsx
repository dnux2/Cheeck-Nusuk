import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { LanguageProvider } from "@/contexts/language-context";

import { LandingPage } from "@/pages/landing";
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

function Router() {
  const [location] = useLocation();
  const isPilgrimRoute = location === "/pilgrim" || location.startsWith("/pilgrim/");

  if (location === "/") return <LandingPage />;

  if (isPilgrimRoute) {
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
