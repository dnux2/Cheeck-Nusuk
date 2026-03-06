import { Switch, Route } from "wouter";
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

function Router() {
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
