import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import ClientsPage from '@/pages/clients';
import ClientFormPage from '@/pages/client-form';
import ServicesPage from '@/pages/services';
import ServiceFormPage from '@/pages/service-form';
import MaterialsPage from '@/pages/materials';
import MaterialFormPage from '@/pages/material-form';
import OrdersPage from '@/pages/orders';
import OrderDetailPage from '@/pages/order-detail';
import CompanyPage from '@/pages/company';
import ChecklistsPage from '@/pages/checklists';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useAuth } from '@workspace/replit-auth-web';
import { Button } from '@/components/ui/button';
import { Hammer, Loader2, LogIn } from 'lucide-react';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />

      <Route path="/clientes" component={ClientsPage} />
      <Route path="/clientes/novo" component={ClientFormPage} />
      <Route path="/clientes/:id" component={ClientFormPage} />

      <Route path="/servicos" component={ServicesPage} />
      <Route path="/servicos/novo" component={ServiceFormPage} />
      <Route path="/servicos/:id" component={ServiceFormPage} />

      <Route path="/materiais" component={MaterialsPage} />
      <Route path="/materiais/novo" component={MaterialFormPage} />
      <Route path="/materiais/:id" component={MaterialFormPage} />

      <Route path="/ordens" component={OrdersPage} />
      <Route path="/ordens/:id" component={OrderDetailPage} />
      <Route path="/empresa" component={CompanyPage} />
      <Route path="/checklist" component={ChecklistsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center bg-background bg-noise p-4">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary text-primary-foreground grid place-items-center mb-5"><Hammer className="h-6 w-6" /></div>
          <h1 className="font-display text-2xl font-semibold">Gestão de Serviços</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Entre para acessar clientes, ordens de serviço e anexos.</p>
          <Button className="w-full" onClick={login} data-testid="button-login">
            <LogIn className="h-4 w-4" /> Entrar com Replit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
